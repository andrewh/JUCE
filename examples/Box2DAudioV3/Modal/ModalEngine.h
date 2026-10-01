#pragma once

#include <juce_audio_basics/juce_audio_basics.h>
#include "ModalTypes.h"
#include <array>
#include <cmath>

namespace modal
{

//==============================================================================
/** A bank of two-pole resonators, one per vibration mode of an object.

    Each resonator is y[n] = a1 * y[n-1] + a2 * y[n-2] + in * x[n], with the poles at
    radius r = exp (-1 / (fs * tau)) and angle 2 pi f / fs. Its impulse response is a
    decaying sinusoid, so feeding the bank an impulse (or a short pulse) rings the
    object, and feeding it noise gives filtered noise: rolling and scraping.

    It costs two multiplies and an add per mode per sample, and needs no sin() call
    and no allocation.
*/
struct ModalBank
{
    static constexpr int maxModes = 8;

    void configure (const Material& m, float f0, float sampleRate, float decayScale)
    {
        numModes = 0;
        float totalWeight = 0.0f;
        std::array<float, maxModes> weights {};

        for (int k = 0; k < m.numModes; ++k)
        {
            const auto frequency = f0 * m.ratios[(size_t) k];

            if (frequency > sampleRate * 0.45f)
                break;

            weights[(size_t) k] = 1.0f / std::sqrt (m.ratios[(size_t) k]);   // gentle spectral tilt
            totalWeight += weights[(size_t) k];
            ++numModes;
        }

        slowestR = 0.0f;

        for (int k = 0; k < numModes; ++k)
        {
            const auto ratio = m.ratios[(size_t) k];
            const auto tau = juce::jmax (0.002f, decayScale * m.decaySeconds / (1.0f + m.decayTilt * (ratio - 1.0f)));
            const auto r = std::exp (-1.0f / (sampleRate * tau));
            const auto theta = juce::MathConstants<float>::twoPi * f0 * ratio / sampleRate;

            a1[(size_t) k] = 2.0f * r * std::cos (theta);
            a2[(size_t) k] = -r * r;
            in[(size_t) k] = std::sin (theta) * weights[(size_t) k] / totalWeight;   // unit-amplitude impulse response
            slowestR = juce::jmax (slowestR, r);
        }
    }

    void reset()  { y1.fill (0.0f); y2.fill (0.0f); }

    float process (float x) noexcept
    {
        float out = 0.0f;

        for (int k = 0; k < numModes; ++k)
        {
            const auto i = (size_t) k;
            const auto y = a1[i] * y1[i] + a2[i] * y2[i] + in[i] * x;
            y2[i] = y1[i];
            y1[i] = y;
            out += y;
        }

        return out;
    }

    int numModes = 0;
    float slowestR = 0.0f;
    std::array<float, maxModes> a1 {}, a2 {}, in {}, y1 {}, y2 {};
};

//==============================================================================
/** The audio side of the physics engine. All methods run on the audio thread. */
class ModalEngine
{
public:
    void prepare (double newSampleRate)
    {
        sampleRate = (float) newSampleRate;
        rollSmoothing = 1.0f - std::exp (-1.0f / (0.015f * sampleRate));

        for (auto& v : strikes)  v.active = false;
        for (auto& v : rolls)    { v.bank.reset(); v.level = 0.0f; v.material = -1; }

        reverb.setSampleRate (newSampleRate);
        setReverbMix (reverbMix);
    }

    void setReverbMix (float mix)
    {
        reverbMix = mix;
        juce::Reverb::Parameters p;
        p.roomSize = 0.55f;
        p.damping = 0.5f;
        p.wetLevel = mix;
        p.dryLevel = 1.0f - 0.5f * mix;
        p.width = 1.0f;
        reverb.setParameters (p);
    }

    void strike (const StrikeEvent& e)
    {
        auto& v = findStrikeVoice();
        const auto& material = getMaterial (e.material);

        v.bank.configure (material, e.f0, sampleRate, 1.0f);
        v.bank.reset();

        // The contact is a short half-sine pulse of force. Its length is the physics:
        // a long contact filters out high modes, a short one excites all of them.
        v.pulseLength = juce::jmax (2, (int) (e.contactMs * 0.001f * sampleRate));
        v.pulsePosition = 0;
        v.pulseGain = 1.2f * e.amplitude * juce::MathConstants<float>::pi / (2.0f * (float) v.pulseLength);
        v.envelope = e.amplitude;
        v.gainLeft  = std::cos (e.pan * juce::MathConstants<float>::halfPi);
        v.gainRight = std::sin (e.pan * juce::MathConstants<float>::halfPi);
        v.active = true;
    }

    void render (juce::AudioBuffer<float>& buffer, int start, int numSamples,
                 const std::array<RollSlot, numRollSlots>& rollSlots)
    {
        auto* left  = buffer.getWritePointer (0, start);
        auto* right = buffer.getNumChannels() > 1 ? buffer.getWritePointer (1, start) : left;

        for (auto& v : strikes)
        {
            if (! v.active)
                continue;

            for (int i = 0; i < numSamples; ++i)
            {
                float x = 0.0f;

                if (v.pulsePosition < v.pulseLength)
                {
                    x = v.pulseGain * std::sin (juce::MathConstants<float>::pi
                                                  * ((float) v.pulsePosition + 0.5f) / (float) v.pulseLength);
                    ++v.pulsePosition;
                }

                const auto s = v.bank.process (x);
                left[i]  += s * v.gainLeft;
                right[i] += s * v.gainRight;
                v.envelope *= v.bank.slowestR;
            }

            if (v.pulsePosition >= v.pulseLength && v.envelope < 1.0e-4f)
                v.active = false;
        }

        for (size_t slotIndex = 0; slotIndex < rollSlots.size(); ++slotIndex)
        {
            auto& slot = rollSlots[slotIndex];
            auto& v = rolls[slotIndex];
            const auto target = slot.level.load (std::memory_order_relaxed);

            if (target < 1.0e-4f && v.level < 1.0e-4f)
                continue;   // idle: costs almost nothing

            const auto materialId = slot.material.load (std::memory_order_relaxed);
            const auto f0 = slot.f0.load (std::memory_order_relaxed);

            if (materialId != v.material || std::abs (f0 - v.f0) > 0.02f * v.f0)
            {
                // Re-tune the resonators but keep their state, so there is no click.
                // A low decayScale makes the modes broad, so rolling sounds like a
                // rumble on the object rather than like a whistle.
                v.bank.configure (getMaterial (materialId), f0, sampleRate, 0.06f);
                v.material = materialId;
                v.f0 = f0;
            }

            const auto pan = slot.pan.load (std::memory_order_relaxed);
            const auto gl = std::cos (pan * juce::MathConstants<float>::halfPi);
            const auto gr = std::sin (pan * juce::MathConstants<float>::halfPi);

            for (int i = 0; i < numSamples; ++i)
            {
                v.level += (target - v.level) * rollSmoothing;

                const auto s = v.bank.process (v.nextNoise() * v.level * rollGain);
                left[i]  += s * gl;
                right[i] += s * gr;
            }
        }
    }

    /** Reverb, master gain and a soft limiter, applied after everything is summed. */
    void finish (juce::AudioBuffer<float>& buffer, int start, int numSamples, float gain)
    {
        if (buffer.getNumChannels() > 1)
            reverb.processStereo (buffer.getWritePointer (0, start), buffer.getWritePointer (1, start), numSamples);

        for (int c = 0; c < buffer.getNumChannels(); ++c)
        {
            auto* data = buffer.getWritePointer (c, start);

            for (int i = 0; i < numSamples; ++i)
                data[i] = std::tanh (data[i] * gain);
        }
    }

private:
    struct StrikeVoice
    {
        ModalBank bank;
        bool active = false;
        int pulseLength = 1, pulsePosition = 0;
        float pulseGain = 0.0f, envelope = 0.0f, gainLeft = 0.7f, gainRight = 0.7f;
    };

    struct RollVoice
    {
        float nextNoise() noexcept
        {
            seed = seed * 1664525u + 1013904223u;   // a cheap linear congruential generator
            return (float) (int) seed * (1.0f / 2147483648.0f);
        }

        ModalBank bank;
        int material = -1;
        float f0 = 0.0f, level = 0.0f;
        juce::uint32 seed = 12345u;
    };

    StrikeVoice& findStrikeVoice()
    {
        StrikeVoice* quietest = &strikes[0];

        for (auto& v : strikes)
        {
            if (! v.active)
                return v;

            if (v.envelope < quietest->envelope)
                quietest = &v;
        }

        return *quietest;   // all busy: steal the voice that is closest to silent
    }

    std::array<StrikeVoice, 48> strikes;
    std::array<RollVoice, numRollSlots> rolls;
    juce::Reverb reverb;
    float sampleRate = 44100.0f, rollSmoothing = 0.01f, reverbMix = 0.25f;

    static constexpr float rollGain = 0.035f;
};

} // namespace modal
