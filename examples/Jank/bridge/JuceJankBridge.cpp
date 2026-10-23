#include "JuceJankBridge.h"

#include <juce_audio_basics/juce_audio_basics.h>
#include <juce_core/juce_core.h>

namespace jankjuce
{
    const char* version()
    {
        static const auto text = juce::SystemStats::getJUCEVersion().toStdString();
        return text.c_str();
    }

    double midi_note_to_hz (int midiNote)       { return juce::MidiMessage::getMidiNoteInHertz (midiNote); }
    float gain_to_db (float linearGain)         { return juce::Decibels::gainToDecibels (linearGain); }
    float db_to_gain (float decibels)           { return juce::Decibels::decibelsToGain (decibels); }
    int juce_string_length (const char* utf8)   { return juce::String::fromUTF8 (utf8).length(); }
}
