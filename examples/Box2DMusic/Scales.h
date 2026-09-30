#pragma once

#include <juce_core/juce_core.h>
#include <array>
#include <vector>

namespace physicsmusic
{

/** A scale is a list of semitone offsets within one octave. */
struct Scale
{
    const char* name;
    std::vector<int> steps;
};

inline const std::array<Scale, 5>& getScales()
{
    static const std::array<Scale, 5> scales
    {{
        { "Major pentatonic", { 0, 2, 4, 7, 9 } },
        { "Minor pentatonic", { 0, 3, 5, 7, 10 } },
        { "Major",            { 0, 2, 4, 5, 7, 9, 11 } },
        { "Dorian",           { 0, 2, 3, 5, 7, 9, 10 } },
        { "Whole tone",       { 0, 2, 4, 6, 8, 10 } }
    }};

    return scales;
}

/** Maps a scale degree (which may be negative or larger than the scale) to a MIDI note. */
inline int degreeToMidiNote (const Scale& scale, int rootNote, int degree)
{
    const auto size   = (int) scale.steps.size();
    const auto octave = degree >= 0 ? degree / size : -((-degree + size - 1) / size);
    const auto index  = degree - octave * size;

    return juce::jlimit (0, 127, rootNote + octave * 12 + scale.steps[(size_t) index]);
}

} // namespace physicsmusic
