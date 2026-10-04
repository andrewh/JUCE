# MIDI and MPE

Create, parse, buffer, receive, and synthesise MIDI, including MPE (MIDI
Polyphonic Expression).

**Level:** Intermediate  
**Prerequisite:** [Synthesis](06-synthesis.md) for the voice and audio-callback
context.

## Set up the project

The project below builds several `MidiMessage`s and shows what each one is. The sections that make sound (the synthesiser and MPE) need an audio callback: change `MainComponent` to derive from `juce::AudioAppComponent` and add `setAudioChannels (0, 2)` and `shutdownAudio()`, exactly as in [Synthesis](06-synthesis.md).

This guide builds on [Getting started](01-getting-started.md). Make a copy of the
`HelloJuce` folder from that tutorial, **without** its `build` folder, and name
the copy `MidiDemo`. Keep `Main.cpp` exactly as it is, then replace the other three files so the folder looks like this:

```text
MidiDemo/
├── CMakeLists.txt      # new: renamed target, modules for this guide
├── Main.cpp            # copied unchanged from tutorial 1
├── MainComponent.h     # new: replaces the one from tutorial 1
└── MainComponent.cpp   # new: replaces the one from tutorial 1
```

Replace `/path/to/JUCE` in `CMakeLists.txt` with the folder you cloned JUCE into, as in tutorial 1. This `CMakeLists.txt` renames the target to `MidiDemo` and links the modules this guide needs.

**`CMakeLists.txt`**

```cmake
cmake_minimum_required(VERSION 3.22)
project(MIDIDEMO VERSION 0.0.1)

add_subdirectory(/path/to/JUCE JUCE)   # or find_package (JUCE CONFIG REQUIRED)

juce_add_gui_app(MidiDemo PRODUCT_NAME "Midi Demo")

target_sources(MidiDemo PRIVATE Main.cpp MainComponent.cpp)

target_compile_definitions(MidiDemo PRIVATE
    JUCE_WEB_BROWSER=0
    JUCE_USE_CURL=0
    JUCE_APPLICATION_NAME_STRING="$<TARGET_PROPERTY:MidiDemo,JUCE_PRODUCT_NAME>"
    JUCE_APPLICATION_VERSION_STRING="$<TARGET_PROPERTY:MidiDemo,JUCE_VERSION>")

target_link_libraries(MidiDemo
    PRIVATE juce::juce_audio_utils
    PUBLIC  juce::juce_recommended_config_flags
            juce::juce_recommended_warning_flags)
```

**`MainComponent.h`**

```cpp
#pragma once

#include <juce_audio_utils/juce_audio_utils.h>

class MainComponent final : public juce::Component
{
public:
    MainComponent();

    void resized() override;

private:
    static juce::String describe (const juce::MidiMessage& m);

    juce::TextEditor log;

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR (MainComponent)
};
```

**`MainComponent.cpp`**

```cpp
#include "MainComponent.h"

MainComponent::MainComponent()
{
    log.setMultiLine (true);
    log.setReadOnly (true);
    log.setFont (juce::FontOptions (juce::Font::getDefaultMonospacedFontName(), 14.0f, juce::Font::plain));
    addAndMakeVisible (log);

    const juce::MidiMessage messages[] =
    {
        juce::MidiMessage::noteOn (1, 60, (juce::uint8) 100),
        juce::MidiMessage::noteOff (1, 60),
        juce::MidiMessage::controllerEvent (10, 7, 90),
        juce::MidiMessage::programChange (1, 5),
        juce::MidiMessage::pitchWheel (1, 9000),
    };

    for (auto& m : messages)
        log.moveCaretToEnd(), log.insertTextAtCaret (describe (m) + "\n");

    setSize (400, 250);
}

void MainComponent::resized()
{
    log.setBounds (getLocalBounds().reduced (10));
}

juce::String MainComponent::describe (const juce::MidiMessage& m)
{
    if (m.isNoteOn())          return "Note on "  + juce::MidiMessage::getMidiNoteName (m.getNoteNumber(), true, true, 3);
    if (m.isNoteOff())         return "Note off " + juce::MidiMessage::getMidiNoteName (m.getNoteNumber(), true, true, 3);
    if (m.isProgramChange())   return "Program change " + juce::String (m.getProgramChangeNumber());
    if (m.isPitchWheel())      return "Pitch wheel " + juce::String (m.getPitchWheelValue());
    if (m.isChannelPressure()) return "Channel pressure " + juce::String (m.getChannelPressureValue());
    if (m.isAllNotesOff())     return "All notes off";

    if (m.isController())
    {
        juce::String name (juce::MidiMessage::getControllerName (m.getControllerNumber()));
        return "Controller " + (name.isEmpty() ? "[" + juce::String (m.getControllerNumber()) + "]" : name)
               + ": " + juce::String (m.getControllerValue());
    }

    return juce::String::toHexString (m.getRawData(), m.getRawDataSize());
}
```

## `MidiMessage`: creating and parsing

A `MidiMessage` is a small value type. Build one with a static factory, read it
back with an `is...()` test followed by the matching accessor.

```cpp
auto on   = juce::MidiMessage::noteOn (1, 60, (juce::uint8) 100);   // channel 1-16, note, velocity
auto off  = juce::MidiMessage::noteOff (1, 60);
auto vol  = juce::MidiMessage::controllerEvent (10, 7, 90);          // channel 10, CC7, value
on.setTimeStamp (juce::Time::getMillisecondCounterHiRes() * 0.001);   // units are yours to define

static juce::String describe (const juce::MidiMessage& m)
{
    if (m.isNoteOn())        return "Note on "  + juce::MidiMessage::getMidiNoteName (m.getNoteNumber(), true, true, 3);
    if (m.isNoteOff())       return "Note off " + juce::MidiMessage::getMidiNoteName (m.getNoteNumber(), true, true, 3);
    if (m.isProgramChange()) return "Program change " + juce::String (m.getProgramChangeNumber());
    if (m.isPitchWheel())    return "Pitch wheel " + juce::String (m.getPitchWheelValue());
    if (m.isChannelPressure()) return "Channel pressure " + juce::String (m.getChannelPressureValue());
    if (m.isAllNotesOff())   return "All notes off";

    if (m.isController())
    {
        juce::String name (juce::MidiMessage::getControllerName (m.getControllerNumber()));
        return "Controller " + (name.isEmpty() ? "[" + juce::String (m.getControllerNumber()) + "]" : name)
               + ": " + juce::String (m.getControllerValue());
    }

    return juce::String::toHexString (m.getRawData(), m.getRawDataSize());   // sysex and the rest
}
```

- Channels are numbered 1 to 16 in the API, notes and values 0 to 127.
- Prefer the `float` velocity overload (`noteOn (ch, note, 0.8f)`) when you have a
  normalised value.
- A note-on with velocity 0 is treated by many devices as a note-off, so always
  send a real note-off when a note ends.
- `getMidiNoteInHertz (note)` gives the frequency of a note number.

## `MidiBuffer`: messages with sample positions

A `MidiBuffer` is a time-ordered collection whose timestamps are *sample
positions relative to the start of a block*. It is the currency of plug-in
`processBlock()` and `Synthesiser::renderNextBlock()`.

```cpp
juce::MidiBuffer buffer;

buffer.addEvent (on,  0);      // at the first sample of the block
buffer.addEvent (off, 22050);  // half a second later at 44.1 kHz

for (const auto metadata : buffer)                     // iterates in time order
{
    auto message = metadata.getMessage();
    auto when    = metadata.samplePosition;
    // ...
}

buffer.clear (start, numSamples);   // remove events within a range
```

Convert between seconds and samples with the sample rate:
`(int) (seconds * sampleRate)`. For a scheduler driven by a `Timer`, keep the
last position you have read up to, iterate events up to "now", then clear the
consumed range.

## Receiving MIDI from hardware

`AudioDeviceManager` opens MIDI input devices and delivers messages on a
background thread to any registered `MidiInputCallback`.

```cpp
// describe() is the helper function shown earlier in this guide
class MidiMonitor final : public juce::Component,
                          private juce::MidiInputCallback,
                          private juce::MidiKeyboardState::Listener
{
public:
    MidiMonitor (juce::AudioDeviceManager& dm)
        : deviceManager (dm),
          keyboard (keyboardState, juce::MidiKeyboardComponent::horizontalKeyboard)
    {
        addAndMakeVisible (keyboard);
        keyboardState.addListener (this);

        for (auto& input : juce::MidiInput::getAvailableDevices())
        {
            deviceManager.setMidiInputDeviceEnabled (input.identifier, true);
            deviceManager.addMidiInputDeviceCallback (input.identifier, this);
            registered.add (input.identifier);
        }
    }

    ~MidiMonitor() override
    {
        keyboardState.removeListener (this);

        for (auto& id : registered)
            deviceManager.removeMidiInputDeviceCallback (id, this);
    }

    void resized() override { keyboard.setBounds (getLocalBounds()); }

private:
    // Background MIDI thread
    void handleIncomingMidiMessage (juce::MidiInput* source, const juce::MidiMessage& m) override
    {
        const juce::ScopedValueSetter<bool> guard (fromHardware, true);
        keyboardState.processNextMidiEvent (m);              // lights the on-screen keys
        postToMessageThread (m, source->getName());
    }

    // On-screen keys (message thread)
    void handleNoteOn (juce::MidiKeyboardState*, int ch, int note, float vel) override
    {
        if (! fromHardware)                                  // ignore echoes of hardware events
            postToMessageThread (juce::MidiMessage::noteOn (ch, note, vel), "On-screen keyboard");
    }

    void handleNoteOff (juce::MidiKeyboardState*, int ch, int note, float) override
    {
        if (! fromHardware)
            postToMessageThread (juce::MidiMessage::noteOff (ch, note), "On-screen keyboard");
    }

    void postToMessageThread (const juce::MidiMessage& m, const juce::String& source)
    {
        juce::MessageManager::callAsync ([safe = juce::Component::SafePointer<MidiMonitor> (this), m, source]
        {
            if (safe != nullptr)
                DBG (source << ": " << describe (m));
        });
    }

    juce::AudioDeviceManager& deviceManager;
    juce::MidiKeyboardState keyboardState;
    juce::MidiKeyboardComponent keyboard;
    juce::StringArray registered;
    bool fromHardware = false;
};
```

- MIDI input callbacks arrive on a **different thread** from the GUI. Do not touch
  components from them: marshal to the message thread with
  `MessageManager::callAsync()` (or a `CallbackMessage`), as above.
- `MidiKeyboardState` tracks which keys are held. Feed it hardware events with
  `processNextMidiEvent()` and it updates the on-screen keyboard; conversely, it
  broadcasts key presses made with the mouse. Use a flag (here via
  `ScopedValueSetter`) to tell the two sources apart.
- `MidiInput::getAvailableDevices()` lists devices by `name` and stable
  `identifier`. Pass the identifier to `addMidiInputDeviceCallback()`, or an empty
  string to receive from every enabled input. Remove the callback before the
  callback object is destroyed.
- `AudioDeviceSelectorComponent` with `showMidiInputOptions = true` provides a
  ready-made device chooser.
- To send MIDI, open a device with `MidiOutput::openDevice (identifier)` and call
  `sendMessageNow()` or `startBackgroundThread()` and `sendBlockOfMessages()`.

## MPE: per-note expression

Standard MIDI shares pitch bend and controllers across a whole channel. **MPE**
gives each sounding note its own channel, so every note can bend, press, and slide
independently. The state of one note is described by:

- its channel and initial note number;
- **strike** (note-on velocity) and **lift** (note-off velocity);
- **pitch bend** (from pitch-wheel messages on the note's channel);
- **pressure** (channel pressure on the note's channel);
- **timbre** or "slide" (controller 74 on the note's channel).

An MPE setup is a *zone layout*: a **lower zone** with its master channel on
channel 1 and member (note) channels 2 upwards, and an **upper zone** with its
master on channel 16 and members descending. Each zone has a number of member
channels, a per-note pitch bend range (48 semitones by default), and a master
pitch bend range (2 semitones by default). A channel belongs to at most one zone,
and the most recent configuration wins. A controller announces its layout by
sending MPE Configuration Messages (MCMs) on a zone's master channel, and JUCE builds
or parses them for you. An MCM with zero member channels switches that zone off, and
MPE mode is off when both zones are empty. A single lower zone is the recommended
default, for example channels 2 to 10 in the lower zone and 11 to 15 in the upper.

```cpp
juce::MPEZoneLayout layout;
layout.setLowerZone (15, 48, 2);                    // member channels, per-note bend, master bend
auto lower = layout.getLowerZone();                  // read back the configuration

auto messages = juce::MPEMessages::setLowerZone (15, 48, 2);   // send to a device to configure it
```

**Zone-level and note-level messages.** Messages on the *master* channel apply to
the whole zone, and messages on a *member* channel apply to that note only.
Modulation (CC 1), volume (CC 7), the damper pedal (CC 64), all-sound-off (CC 120), and
reset-all-controllers (CC 121/127 family) are honoured only at zone level. Pitch
bend, channel pressure, timbre (CC 74), and pitch-bend sensitivity may be sent at
either level, with note level refining zone level. Note-on and note-off belong on
member channels. MPE works in MIDI Mode 3 (poly), the normal case, and can be used
with Mode 4 (mono).

**Nothing plays until a zone exists.** Unless the synthesiser is in legacy mode
(below), an `MPESynthesiser` makes no sound until at least one zone has been set,
either by an incoming MCM or by your own call to `setLowerZone()`. To configure a
connected device, send it the matching messages:

```cpp
if (auto* out = deviceManager.getDefaultMidiOutput())
    out->sendBlockOfMessagesNow (juce::MPEMessages::setLowerZone (15, 48, 2));

layout.clearAllZones();                             // or leave MPE mode entirely
```

### The classes

| Class                 | Role                                                              |
| --------------------- | ----------------------------------------------------------------- |
| `MPEZoneLayout`       | Current zones, updated from incoming configuration messages       |
| `MPEInstrument`       | Tracks playing notes from MIDI; notifies `MPEInstrument::Listener` |
| `MPENote`             | State of one note, including `getFrequencyInHertz()` with bend applied |
| `MPEValue`            | A 7- or 14-bit value with `asSignedFloat()` and `asUnsignedFloat()` |
| `MPESynthesiser`      | An `MPEInstrument` with voices, rendering audio                   |
| `MPESynthesiserVoice` | One note's sound: you implement it                                |

`MPEInstrument` is enough to *visualise* MPE input. Use `enableLegacyMode (24)` to
make it accept ordinary (non-MPE) MIDI, treating every channel as a normal
channel with a given pitch bend range.

```cpp
class Visualiser final : public juce::Component, private juce::MPEInstrument::Listener
{
public:
    explicit Visualiser (juce::MPEInstrument& i) : instrument (i) { instrument.addListener (this); }
    ~Visualiser() override { instrument.removeListener (this); }

private:
    void noteAdded (juce::MPENote) override            { repaint(); }
    void notePressureChanged (juce::MPENote) override  { repaint(); }
    void notePitchbendChanged (juce::MPENote) override { repaint(); }
    void noteTimbreChanged (juce::MPENote) override    { repaint(); }
    void noteReleased (juce::MPENote) override         { repaint(); }

    juce::MPEInstrument& instrument;
};
```

### An MPE synthesiser

Implement a voice that reads the note's *current* pitch, pressure, and timbre each
block, then feed the synthesiser MIDI just as with `Synthesiser`:

```cpp
class MPEVoice final : public juce::MPESynthesiserVoice
{
public:
    void noteStarted() override
    {
        level = getCurrentlyPlayingNote().noteOnVelocity.asUnsignedFloat() * 0.3f;
        updateFrequency();
    }

    void noteStopped (bool allowTailOff) override
    {
        if (! allowTailOff)
            clearCurrentNote();
        else
            releasing = true;
    }

    void notePressureChanged() override  { level = getCurrentlyPlayingNote().pressure.asUnsignedFloat() * 0.3f; }
    void notePitchbendChanged() override { updateFrequency(); }
    void noteTimbreChanged() override    { brightness = getCurrentlyPlayingNote().timbre.asUnsignedFloat(); }
    void noteKeyStateChanged() override  {}

    void setCurrentSampleRate (double newRate) override { rate = newRate; }

    void renderNextBlock (juce::AudioBuffer<float>& out, int start, int num) override
    {
        for (int i = 0; i < num; ++i)
        {
            auto s = level * ((float) std::sin (phase) + brightness * (float) std::sin (2.0 * phase) * 0.5f);
            phase += delta;

            for (int ch = 0; ch < out.getNumChannels(); ++ch)
                out.addSample (ch, start + i, s);

            if (releasing && (level *= 0.999f) < 0.001f)
            {
                clearCurrentNote(); releasing = false; break;
            }
        }
    }

private:
    void updateFrequency()
    {
        delta = getCurrentlyPlayingNote().getFrequencyInHertz() / rate * juce::MathConstants<double>::twoPi;
    }

    double phase = 0.0, delta = 0.0, rate = 44100.0;
    float level = 0.0f, brightness = 0.0f;
    bool releasing = false;
};
```

```cpp
// Setup (message thread)
synth.enableLegacyMode (24);              // or leave the zone layout to MIDI configuration messages
synth.setVoiceStealingEnabled (false);    // MPE hardware normally limits its own polyphony
for (int i = 0; i < 15; ++i) synth.addVoice (new MPEVoice());

// Audio: identical to a normal Synthesiser
synth.setCurrentPlaybackSampleRate (rate);
synth.renderNextBlock (buffer, incomingMidi, 0, numSamples);

// MIDI thread: forward every message to the collector for the audio thread,
// and to the visualiser's instrument on the message thread
```

- One voice per member channel is the natural limit (15 for a full lower zone).
- Because each note's pitch bend is *per note* and can span many semitones, always
  derive frequency from `MPENote::getFrequencyInHertz()` instead of the note
  number.
- Pitch, pressure, and timbre change continuously: apply them with smoothing
  (`SmoothedValue`) to avoid zipper noise, as in [Synthesis](06-synthesis.md).

## Build and run

With all the files in place, configure and build from the project folder:

```sh
cmake -B build
cmake --build build
```

The build puts the finished app in `build/MidiDemo_artefacts/`. With the default
Makefile or Ninja generators:

| Platform | Run it with |
| -------- | ----------- |
| macOS    | `open "build/MidiDemo_artefacts/Midi Demo.app"` |
| Linux    | `./build/MidiDemo_artefacts/Midi\ Demo` |
| Windows  | `build\MidiDemo_artefacts\Debug\Midi Demo.exe` |

Multi-config generators (Xcode, Visual Studio) add a configuration folder, for
example `build/MidiDemo_artefacts/Debug/Midi Demo.app`; build with
`cmake --build build --config Debug`.

> **"The application cannot be opened because its executable is missing"?**
> CMake creates the empty `.app` bundle at the start of the build and only fills
> in the executable when compiling and linking succeed. If `cmake --build build`
> reported errors, fix them and build again, then re-run `open`. Check that the
> last lines of the build output say `Built target MidiDemo`.

> **"use of undeclared identifier 'juce'"?** CMake projects have no
> `JuceHeader.h`, so every source file must include the module headers it uses.
> `MainComponent.h` includes them and `Main.cpp` includes `MainComponent.h`.
> Without those includes the compiler does not know what `juce::`, `std::`, or
> `START_JUCE_APPLICATION` mean.

## Sources

Condensed from the JUCE tutorials *Create MIDI data*, *Handling MIDI events*,
*Build a multi-polyphonic synthesiser*, and *Understanding MPE zones*, Copyright
(c) Raw Material Software Limited, ISC licence. See [NOTICE.md](NOTICE.md).
