#pragma once

#include <juce_audio_basics/juce_audio_basics.h>
#include <array>
#include <cmath>

namespace physicsmusic
{

/** A small polyphonic marimba-ish synthesiser: two decaying sine partials per voice.

    noteOn() and render() must be called from the same thread (the audio thread).
    Nothing here allocates after prepare().
*/
class PluckSynth
{
public:
    void prepare (double newSampleRate)
    {
        sampleRate = newSampleRate;
        for (auto& v : voices)
            v.active = false;
    }

    void noteOn (int midiNote, float velocity, float pan)
    {
        auto& v = findVoice();

        const auto frequency = juce::MidiMessage::getMidiNoteInHertz (midiNote);
        const auto tau       = 0.25 + 0.6 * (1.0 - juce::jlimit (0.0, 1.0, midiNote / 100.0));

        v.active     = true;
        v.phase      = 0.0;
        v.increment  = juce::MathConstants<double>::twoPi * frequency / sampleRate;
        v.envelope   = 1.0f;
        v.decay      = (float) std::exp (-1.0 / (sampleRate * tau));
        v.attack     = 0.0f;
        v.attackStep = (float) (1.0 / (0.002 * sampleRate));   // 2 ms fade-in avoids clicks
        v.gain       = 0.3f * velocity;
        v.gainLeft   = std::cos (pan * juce::MathConstants<float>::halfPi);
        v.gainRight  = std::sin (pan * juce::MathConstants<float>::halfPi);
    }

    /** Adds the output of all voices into the (already cleared) buffer region. */
    void render (juce::AudioBuffer<float>& buffer, int startSample, int numSamples)
    {
        auto* left  = buffer.getWritePointer (0, startSample);
        auto* right = buffer.getNumChannels() > 1 ? buffer.getWritePointer (1, startSample) : nullptr;

        for (auto& v : voices)
        {
            if (! v.active)
                continue;

            for (int i = 0; i < numSamples; ++i)
            {
                v.attack = juce::jmin (1.0f, v.attack + v.attackStep);

                const auto fundamental = (float) std::sin (v.phase);
                const auto overtone    = (float) std::sin (v.phase * 4.0);   // the bar's fast-decaying "tock"
                const auto sample = v.gain * v.attack * v.envelope
                                  * (fundamental + 0.4f * v.envelope * v.envelope * overtone);

                left[i] += sample * v.gainLeft;

                if (right != nullptr)
                    right[i] += sample * v.gainRight;

                v.phase += v.increment;
                if (v.phase > juce::MathConstants<double>::twoPi * 64.0)
                    v.phase -= juce::MathConstants<double>::twoPi * 64.0;

                v.envelope *= v.decay;
            }

            if (v.envelope < 0.0005f)
                v.active = false;
        }
    }

private:
    struct Voice
    {
        bool active = false;
        double phase = 0.0, increment = 0.0;
        float envelope = 0.0f, decay = 0.0f, attack = 0.0f, attackStep = 0.0f;
        float gain = 0.0f, gainLeft = 0.0f, gainRight = 0.0f;
    };

    Voice& findVoice()
    {
        Voice* quietest = &voices[0];

        for (auto& v : voices)
        {
            if (! v.active)
                return v;

            if (v.envelope < quietest->envelope)
                quietest = &v;
        }

        return *quietest;   // all busy: steal the quietest voice
    }

    std::array<Voice, 32> voices;
    double sampleRate = 44100.0;
};

} // namespace physicsmusic
