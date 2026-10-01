#pragma once

#include <juce_core/juce_core.h>
#include <array>
#include <atomic>

namespace modal
{

//==============================================================================
/** Everything the sound of a material depends on. The numbers are approximations
    chosen to sound plausible, not measurements. */
struct Material
{
    const char* name;
    int numModes;
    std::array<float, 8> ratios;   // mode frequencies as multiples of the fundamental
    float decaySeconds;            // decay time (60 dB is not implied, this is the time constant)
    float decayTilt;               // higher modes die faster: tau_k = tau / (1 + tilt * (ratio_k - 1))
    float contactMs;               // reference duration of a contact: soft materials are longer
    float baseFrequency;           // fundamental in Hz for an object of the reference size
    float density, friction, restitution;
    juce::uint32 colour;
};

enum MaterialId { wood = 0, glass, metal, stone, numMaterials };

inline const Material& getMaterial (int id)
{
    static const std::array<Material, numMaterials> materials
    {{
        // Ratios of a free-free bar: 1, 2.76, 5.40, 8.93, ...
        { "Wood",  6, { 1.0f, 2.76f, 5.40f, 8.93f, 13.34f, 18.64f, 0, 0 },
          0.18f, 0.35f, 3.0f, 330.0f, 0.7f, 0.5f, 0.35f, 0xffc98b4a },

        // A wine-glass-like set of ring-mode ratios
        { "Glass", 5, { 1.0f, 2.32f, 4.25f, 6.63f, 9.38f, 0, 0, 0 },
          0.9f, 0.25f, 0.8f, 700.0f, 2.5f, 0.3f, 0.6f, 0xff8fdcf0 },

        // Bell-like partials: hum, prime, tierce, quint, nominal, ...
        { "Metal", 6, { 0.5f, 1.0f, 1.19f, 1.56f, 2.0f, 2.51f, 0, 0 },
          2.2f, 0.3f, 0.5f, 500.0f, 5.0f, 0.25f, 0.5f, 0xffc4cad6 },

        // Dull and short
        { "Stone", 4, { 1.0f, 1.83f, 3.07f, 4.6f, 0, 0, 0, 0 },
          0.05f, 0.5f, 4.0f, 180.0f, 2.5f, 0.7f, 0.15f, 0xff7c7f88 },
    }};

    return materials[(size_t) juce::jlimit (0, (int) numMaterials - 1, id)];
}

//==============================================================================
/** A discrete event: one object was struck. Physics thread -> audio thread, via a FIFO. */
struct StrikeEvent
{
    int material = 0;
    float f0 = 300.0f;         // fundamental, Hz
    float amplitude = 0.5f;    // 0 to 1
    float contactMs = 2.0f;    // how long the contact lasted: sets the brightness
    float pan = 0.5f;          // 0 (left) to 1 (right)
};

/** A continuous signal: how hard is this object being rolled or scraped right now?
    Physics thread writes, audio thread reads. Plain atomics are enough because each
    field is independent and a slightly stale value is harmless. */
struct RollSlot
{
    std::atomic<float> level { 0.0f };   // 0 = silent
    std::atomic<float> f0 { 300.0f };
    std::atomic<float> pan { 0.5f };
    std::atomic<int> material { 0 };
};

constexpr int numRollSlots = 64;

} // namespace modal
