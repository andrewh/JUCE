#pragma once

// A deliberately small, JUCE-free header. jank JIT-compiles every header it includes with
// Clang/LLVM, so keeping JUCE's own headers out of this interface avoids parsing the module
// headers at JIT time. Only plain C++ types appear here; the implementation links against JUCE.

namespace jankjuce
{
    const char* version();
    double midi_note_to_hz (int midiNote);
    float gain_to_db (float linearGain);
    float db_to_gain (float decibels);

    // Round-trips a value through juce::String, to prove the library is really running JUCE code.
    int juce_string_length (const char* utf8);
}
