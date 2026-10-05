# Synthesis: noise, sine waves, levels, MIDI voices, and wavetables

Generate audio from scratch, control its level, and turn it into a playable
instrument.

**Level:** Intermediate  
**Prerequisite:** [Audio input, output, files, and waveforms](05-audio-io-and-playback.md)

All the sound in this guide is written into `info.buffer` between
`info.startSample` and `info.startSample + info.numSamples`. Audio is `float`
data where `1.0` and `-1.0` are full scale, so the output is **very** loud at full
scale. Keep your system volume low while you work through the steps, and read the
[level control](#step-4-control-the-level-in-decibels) step before you raise
anything.

## Step 1: set up the project

You will build one app, `SynthDemo`, in six steps. Each step adds a feature and
leaves you with something you can build and run. The same **mode** menu at the top
of the window gains a new entry in most steps:

| Step | You add                                                  | Classes and techniques                                   |
| ---- | -------------------------------------------------------- | -------------------------------------------------------- |
| 1    | A window that plays quiet white noise                    | `AudioAppComponent`, `Random`, writing into the buffer   |
| 2    | A **mode** menu, a sine wave, and a frequency slider     | Phase accumulators, `std::atomic`, `ComboBox`, `Slider`  |
| 3    | Click-free frequency changes                             | `SmoothedValue`                                          |
| 4    | A **level** slider in decibels                           | `Decibels`, a `Slider` subclass, smoothed gain           |
| 5    | A **MIDI synth** mode with an on-screen keyboard         | `Synthesiser`, `SynthesiserVoice`, `MidiKeyboardComponent`, `MidiMessageCollector` |
| 6    | A **wavetable** mode                                     | Wavetable lookup with linear interpolation               |

Step 1 is the project below. Every later step lists the exact edits to make to
`MainComponent.h` and `MainComponent.cpp`, in the order they appear in the files,
and ends with what to try. Build and run after each step (see
[Build and run](#build-and-run)). The [complete source](#complete-source) at the end
shows both files as they look after step 6, for checking your work.

This guide builds on [Getting started](01-getting-started.md). Make a copy of the
`HelloJuce` folder from that tutorial, **without** its `build` folder, and name
the copy `SynthDemo`. Keep `Main.cpp` exactly as it is, then replace the other three files so the folder looks like this:

```text
SynthDemo/
├── CMakeLists.txt      # new: renamed target, modules for this guide
├── Main.cpp            # copied unchanged from tutorial 1
├── MainComponent.h     # new: replaces the one from tutorial 1
└── MainComponent.cpp   # new: replaces the one from tutorial 1
```

In `CMakeLists.txt`, `/path/to/JUCE` stands for the JUCE path you already set in tutorial 1, so keep that path as it is unless JUCE has moved. This `CMakeLists.txt` renames the target to `SynthDemo` and links the modules this guide needs.

**`CMakeLists.txt`**

```cmake
cmake_minimum_required(VERSION 3.22)
set(CMAKE_OSX_ARCHITECTURES "arm64" CACHE STRING "macOS architectures")  # must come before project()
project(SYNTHDEMO VERSION 0.0.1)

add_subdirectory(/path/to/JUCE JUCE)   # or find_package (JUCE CONFIG REQUIRED)

juce_add_gui_app(SynthDemo PRODUCT_NAME "Synth Demo")

target_sources(SynthDemo PRIVATE Main.cpp MainComponent.cpp)

target_compile_definitions(SynthDemo PRIVATE
    JUCE_WEB_BROWSER=0
    JUCE_USE_CURL=0
    JUCE_APPLICATION_NAME_STRING="$<TARGET_PROPERTY:SynthDemo,JUCE_PRODUCT_NAME>"
    JUCE_APPLICATION_VERSION_STRING="$<TARGET_PROPERTY:SynthDemo,JUCE_VERSION>")

target_link_libraries(SynthDemo
    PRIVATE juce::juce_audio_utils
    PUBLIC  juce::juce_recommended_config_flags
            juce::juce_recommended_warning_flags)
```

**`MainComponent.h`**

```cpp
#pragma once

#include <juce_audio_utils/juce_audio_utils.h>

class MainComponent final : public juce::AudioAppComponent
{
public:
    MainComponent();
    ~MainComponent() override;

    void prepareToPlay (int samplesPerBlockExpected, double sampleRate) override;
    void getNextAudioBlock (const juce::AudioSourceChannelInfo& info) override;
    void releaseResources() override;

private:
    juce::Random random;

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR (MainComponent)
};
```

**`MainComponent.cpp`**

```cpp
#include "MainComponent.h"

MainComponent::MainComponent()
{
    setSize (400, 200);
    setAudioChannels (0, 2);   // no inputs, two outputs
}

MainComponent::~MainComponent()
{
    shutdownAudio();
}

void MainComponent::prepareToPlay (int, double) {}

void MainComponent::getNextAudioBlock (const juce::AudioSourceChannelInfo& info)
{
    // White noise at a safe level: -0.125 .. +0.125
    for (int ch = 0; ch < info.buffer->getNumChannels(); ++ch)
    {
        auto* out = info.buffer->getWritePointer (ch, info.startSample);

        for (int i = 0; i < info.numSamples; ++i)
            out[i] = random.nextFloat() * 0.25f - 0.125f;
    }
}

void MainComponent::releaseResources() {}
```

### White noise

Build and run it (turn your volume down first). You should hear quiet hiss.

`getNextAudioBlock()` fills the block with random values. `Random::nextFloat()`
returns `0..1`, so the code scales and centres it to `-0.125 .. +0.125`, which is
a safe level. Two habits to keep from the start:

- Call `getWritePointer (channel, startSample)` once per channel and index
  samples from zero, rather than calling it for every sample.
- Write to *every* channel in `info.buffer`, not just the first two. Devices can
  open with one channel or with many.

## Step 2: add a sine wave and a frequency slider

A digital oscillator tracks its *phase* (an angle) and advances it by a fixed step
per sample. That step depends on the sample rate, which you only learn in
`prepareToPlay()`:

```text
cyclesPerSample = frequency / sampleRate
angleDelta      = cyclesPerSample * 2π
```

This step also adds the **mode** menu, so you can switch between noise and the
new sine wave, and a **Frequency** slider. The slider lives on the message
thread and the audio callback runs on another thread, so the slider's value
travels through a `std::atomic`.

**In `MainComponent.h`**, add `resized()` after `releaseResources()`:

```cpp
    void releaseResources() override;

    void resized() override;
```

Replace the `private:` section with the following. The enum values double as the
menu's item IDs (a `ComboBox` ID must be greater than zero), and the two
`render` functions split the audio work by mode:

```cpp
private:
    enum Mode { noise = 1, sine };   // ComboBox item IDs must be non-zero

    void renderNoise (const juce::AudioSourceChannelInfo& info);
    void renderSine (const juce::AudioSourceChannelInfo& info);

    juce::Random random;

    juce::ComboBox modeBox;
    juce::Slider frequencySlider;
    juce::Label frequencyLabel { {}, "Frequency" };

    std::atomic<int> mode { noise };               // written by the GUI, read by the audio thread
    std::atomic<double> frequency { 500.0 };

    double currentSampleRate = 0.0, currentAngle = 0.0;

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR (MainComponent)
};
```

**In `MainComponent.cpp`**, replace the constructor so that it creates the two
widgets. `setSkewFactorFromMidPoint()` makes the middle of the slider's travel
500 Hz, which gives low notes more room. The last line of the slider setup uses
`sendNotificationSync` so that the `frequency` atomic matches the slider straight
away:

```cpp
MainComponent::MainComponent()
{
    addAndMakeVisible (modeBox);
    modeBox.addItem ("White noise", noise);
    modeBox.addItem ("Sine wave", sine);
    modeBox.setSelectedId (noise, juce::dontSendNotification);
    modeBox.onChange = [this] { mode = modeBox.getSelectedId(); };

    addAndMakeVisible (frequencySlider);
    addAndMakeVisible (frequencyLabel);
    frequencySlider.setRange (50.0, 5000.0);
    frequencySlider.setSkewFactorFromMidPoint (500.0);   // low frequencies get more travel
    frequencySlider.setTextValueSuffix (" Hz");
    frequencySlider.onValueChange = [this] { frequency = frequencySlider.getValue(); };
    frequencySlider.setValue (500.0, juce::sendNotificationSync);

    setSize (600, 160);
    setAudioChannels (0, 2);   // no inputs, two outputs
}
```

Replace `prepareToPlay()` so that it remembers the sample rate:

```cpp
void MainComponent::prepareToPlay (int, double sampleRate)
{
    currentSampleRate = sampleRate;
}
```

Rename the body of the old `getNextAudioBlock()` to `renderNoise()` and make
`getNextAudioBlock()` pick a renderer. Then add `renderSine()` and `resized()`
at the end of the file:

```cpp
void MainComponent::getNextAudioBlock (const juce::AudioSourceChannelInfo& info)
{
    if (mode == sine)
        renderSine (info);
    else
        renderNoise (info);
}

void MainComponent::renderNoise (const juce::AudioSourceChannelInfo& info)
{
    // White noise at a safe level: -0.125 .. +0.125
    for (int ch = 0; ch < info.buffer->getNumChannels(); ++ch)
    {
        auto* out = info.buffer->getWritePointer (ch, info.startSample);

        for (int i = 0; i < info.numSamples; ++i)
            out[i] = random.nextFloat() * 0.25f - 0.125f;
    }
}

void MainComponent::renderSine (const juce::AudioSourceChannelInfo& info)
{
    auto cyclesPerSample = frequency.load() / currentSampleRate;
    auto angleDelta = cyclesPerSample * juce::MathConstants<double>::twoPi;

    auto channels = info.buffer->getArrayOfWritePointers();
    auto numChannels = info.buffer->getNumChannels();

    for (int i = 0; i < info.numSamples; ++i)
    {
        auto s = (float) std::sin (currentAngle) * 0.125f;
        currentAngle += angleDelta;

        if (currentAngle >= juce::MathConstants<double>::twoPi)
            currentAngle -= juce::MathConstants<double>::twoPi;

        for (int ch = 0; ch < numChannels; ++ch)
            channels[ch][info.startSample + i] = s;
    }
}

void MainComponent::resized()
{
    auto area = getLocalBounds().reduced (10);

    modeBox.setBounds (area.removeFromTop (28).removeFromLeft (200));
    area.removeFromTop (8);

    auto row = area.removeFromTop (28);
    frequencyLabel.setBounds (row.removeFromLeft (80));
    frequencySlider.setBounds (row);
}
```

Build and run. Choose **Sine wave** and drag the **Frequency** slider. Notes on
what the code does:

- The angle is a `double` and is wrapped into `[0, 2π)` every sample. Left
  unwrapped, it grows without limit and a `float` oscillator would gradually
  lose precision.
- The frequency is read once per block with `frequency.load()`. Both threads
  can touch a `std::atomic` safely, so the callback never waits for the GUI.
- Listen carefully as you drag the slider quickly. You may hear faint clicks or
  a zipper-like roughness. The next step removes them.

## Step 3: smooth the frequency changes

The frequency jumps to a new value at the start of a block. The wave's slope
changes abruptly there, which you hear as a click. The fix is to glide to the
new value over a few milliseconds, and `juce::SmoothedValue` does exactly that:
you set a *target* and ask for the next value once per sample.

**In `MainComponent.h`**, add the smoother above `currentSampleRate`:

```cpp
    juce::SmoothedValue<double> smoothedFrequency;   // audio thread only

    double currentSampleRate = 0.0, currentAngle = 0.0;
```

**In `MainComponent.cpp`**, extend `prepareToPlay()`. `reset()` sets the ramp
length, and `setCurrentAndTargetValue()` starts the smoother at the slider's
value instead of at zero:

```cpp
void MainComponent::prepareToPlay (int, double sampleRate)
{
    currentSampleRate = sampleRate;

    smoothedFrequency.reset (sampleRate, 0.05);                       // 50 ms ramp
    smoothedFrequency.setCurrentAndTargetValue (frequency.load());
}
```

In `renderSine()`, delete the two `cyclesPerSample` and `angleDelta` lines at
the top and set the smoother's target instead:

```cpp
void MainComponent::renderSine (const juce::AudioSourceChannelInfo& info)
{
    smoothedFrequency.setTargetValue (frequency.load());

    auto channels = info.buffer->getArrayOfWritePointers();
    auto numChannels = info.buffer->getNumChannels();
```

Inside the loop, work out the angle step for each sample from the smoothed
frequency:

```cpp
        auto s = (float) std::sin (currentAngle) * 0.125f;

        auto cyclesPerSample = smoothedFrequency.getNextValue() / currentSampleRate;
        currentAngle += cyclesPerSample * juce::MathConstants<double>::twoPi;

        if (currentAngle >= juce::MathConstants<double>::twoPi)
            currentAngle -= juce::MathConstants<double>::twoPi;
```

Build and run, and sweep the slider again. The roughness is gone and the pitch
glides.

- `SmoothedValue` ramps linearly by default. Change the 0.05 seconds to
  `0.5` to hear the glide clearly, then set it back.
- The same technique removes clicks from any parameter the user can change while
  sound plays. Step 4 applies it to the level.

## Step 4: control the level in decibels

Level is multiplication: `out = in * gain`. Ears judge loudness logarithmically,
so sliders feel right when they work in decibels and convert to gain at the
boundary:

```cpp
juce::Decibels::gainToDecibels (0.5f);        // -6.02 dB
juce::Decibels::decibelsToGain (-6.0f);       //  0.501
juce::Decibels::toString (-12.0);             // "-12.00 dB"
```

Up to now each source has scaled itself to a fixed, safe size. In this step the
sources produce full-scale signals and one **Level** control scales whatever the
current mode produces. That also means that the synth and wavetable modes in the
next two steps get the control for free.

**In `MainComponent.h`**, add a `Slider` subclass above `MainComponent`. It
shows values in decibels and treats the bottom of the range as minus infinity:

```cpp
// A slider that shows its value as decibels, and shows the bottom of its range as "-inf dB"
class DecibelSlider final : public juce::Slider
{
public:
    double getValueFromText (const juce::String& text) override
    {
        auto t = text.upToFirstOccurrenceOf ("dB", false, false).trim();
        return t.equalsIgnoreCase ("-INF") ? getMinimum() : t.getDoubleValue();
    }

    juce::String getTextFromValue (double value) override
    {
        return juce::Decibels::toString (value, 1, getMinimum());
    }
};

class MainComponent final : public juce::AudioAppComponent
```

Then declare the new function and members. Add `applyLevel()` below `renderSine()`:

```cpp
    void renderSine (const juce::AudioSourceChannelInfo& info);
    void applyLevel (const juce::AudioSourceChannelInfo& info);
```

Add the slider and label below `frequencyLabel`, the atomic gain below
`frequency`, and a second smoother below `smoothedFrequency`:

```cpp
    juce::Label frequencyLabel { {}, "Frequency" };
    DecibelSlider levelSlider;
    juce::Label levelLabel { {}, "Level" };

    std::atomic<int> mode { noise };               // written by the GUI, read by the audio thread
    std::atomic<double> frequency { 500.0 };
    std::atomic<float> level { 0.0f };             // linear gain, set from the level slider

    juce::SmoothedValue<double> smoothedFrequency;   // audio thread only
    juce::SmoothedValue<float> smoothedGain;
```

**In `MainComponent.cpp`**, set up the slider in the constructor, just before
`setSize (600, 160);`. The conversion passes the slider's minimum as the
"minus infinity" floor, so dragging to the bottom gives true silence:

```cpp
    addAndMakeVisible (levelSlider);
    addAndMakeVisible (levelLabel);
    levelSlider.setRange (-100.0, -6.0);
    levelSlider.setSkewFactorFromMidPoint (-30.0);
    levelSlider.onValueChange = [this]
    {
        level = juce::Decibels::decibelsToGain ((float) levelSlider.getValue(),
                                                (float) levelSlider.getMinimum());
    };
    levelSlider.setValue (-24.0, juce::sendNotificationSync);

    setSize (600, 160);
```

In `prepareToPlay()`, start the gain smoother where the slider is:

```cpp
    smoothedFrequency.setCurrentAndTargetValue (frequency.load());

    smoothedGain.reset (sampleRate, 0.05);
    smoothedGain.setCurrentAndTargetValue (level.load());
```

Change `getNextAudioBlock()` to call `applyLevel()` once the active source has
written its samples:

```cpp
void MainComponent::getNextAudioBlock (const juce::AudioSourceChannelInfo& info)
{
    if (mode == sine)
        renderSine (info);
    else
        renderNoise (info);

    applyLevel (info);
}
```

Add `applyLevel()` after `getNextAudioBlock()`. It multiplies every sample on
every channel by the smoothed gain:

```cpp
void MainComponent::applyLevel (const juce::AudioSourceChannelInfo& info)
{
    smoothedGain.setTargetValue (level.load());

    auto channels = info.buffer->getArrayOfWritePointers();
    auto numChannels = info.buffer->getNumChannels();

    for (int i = 0; i < info.numSamples; ++i)
    {
        auto gain = smoothedGain.getNextValue();

        for (int ch = 0; ch < numChannels; ++ch)
            channels[ch][info.startSample + i] *= gain;
    }
}
```

Now remove the fixed safety scaling from the two sources, since the slider
does that job. In `renderNoise()`:

```cpp
    // White noise at full scale: -1 .. +1 (the level slider turns it down)
    for (int ch = 0; ch < info.buffer->getNumChannels(); ++ch)
    {
        auto* out = info.buffer->getWritePointer (ch, info.startSample);

        for (int i = 0; i < info.numSamples; ++i)
            out[i] = random.nextFloat() * 2.0f - 1.0f;
    }
```

In `renderSine()`, drop the `* 0.125f`:

```cpp
        auto s = (float) std::sin (currentAngle);
```

Finally, give the slider a row in `resized()`, after the frequency row:

```cpp
    frequencySlider.setBounds (row);
    area.removeFromTop (8);

    row = area.removeFromTop (28);
    levelLabel.setBounds (row.removeFromLeft (80));
    levelSlider.setBounds (row);
```

Build and run. **Level** starts at -24 dB, which is slightly quieter than the
earlier steps. Drag it to the bottom for silence and watch the read-out change to
"-inf dB". Type a value such as `-12` into the text box to set it exactly.

- The slider stops at -6 dB, so a full-scale source can never reach full-scale
  output by accident. Raise the top of the range if you need more volume.
- Use one "minus infinity" floor everywhere. `gainToDecibels (gain, -100.0f)`
  and `decibelsToGain (db, -100.0f)` take it as an explicit argument.
- `level` is written by the GUI thread and read by the audio thread, so it is a
  `std::atomic<float>`. The smoother turns each change into a short ramp, which
  avoids "zipper" noise.

## Step 5: add a MIDI-playable synthesiser

`juce::Synthesiser` manages polyphony: it turns MIDI events into notes and
allocates them to voices. You provide the sound and the voice. This step adds
those two classes, an on-screen keyboard, and a **MIDI synth** mode. Because the
level control from step 4 applies after every mode, the new mode needs no
level code of its own.

**In `MainComponent.h`**, add the sound and voice classes above `DecibelSlider`.
A `SynthesiserSound` says which notes and channels a sound applies to. A
`SynthesiserVoice` renders one note, using the same phase-accumulator idea as
the sine wave in step 2:

```cpp
struct SineSound final : public juce::SynthesiserSound
{
    bool appliesToNote (int) override    { return true; }
    bool appliesToChannel (int) override { return true; }
};

class SineVoice final : public juce::SynthesiserVoice
{
public:
    bool canPlaySound (juce::SynthesiserSound* s) override
    {
        return dynamic_cast<SineSound*> (s) != nullptr;
    }

    void startNote (int midiNote, float velocity, juce::SynthesiserSound*, int) override
    {
        currentAngle = 0.0;
        level = velocity * 0.25f;
        tailOff = 0.0;

        auto hz = juce::MidiMessage::getMidiNoteInHertz (midiNote);
        angleDelta = hz / getSampleRate() * juce::MathConstants<double>::twoPi;
    }

    void stopNote (float, bool allowTailOff) override
    {
        if (allowTailOff)
        {
            if (juce::approximatelyEqual (tailOff, 0.0))
                tailOff = 1.0;                       // begin a release fade
        }
        else
        {
            clearCurrentNote();                      // silence this voice immediately
            angleDelta = 0.0;
        }
    }

    using juce::SynthesiserVoice::renderNextBlock;   // keep the double overload visible too

    void renderNextBlock (juce::AudioBuffer<float>& out, int start, int num) override
    {
        if (juce::approximatelyEqual (angleDelta, 0.0))
            return;                                  // voice is idle

        while (--num >= 0)
        {
            auto s = (float) std::sin (currentAngle) * level
                     * (tailOff > 0.0 ? (float) tailOff : 1.0f);

            for (int ch = 0; ch < out.getNumChannels(); ++ch)
                out.addSample (ch, start, s);        // add: several voices mix into the buffer

            currentAngle += angleDelta;
            ++start;

            if (tailOff > 0.0)
            {
                tailOff *= 0.99;

                if (tailOff <= 0.005)
                {
                    clearCurrentNote();
                    angleDelta = 0.0;
                    break;
                }
            }
        }
    }

    void pitchWheelMoved (int) override {}
    void controllerMoved (int, int) override {}

private:
    double currentAngle = 0.0, angleDelta = 0.0, tailOff = 0.0;
    float level = 0.0f;
};
```

Next, in `MainComponent`, add the new mode and its render function:

```cpp
    enum Mode { noise = 1, sine, midiSynth };   // ComboBox item IDs must be non-zero

    void renderNoise (const juce::AudioSourceChannelInfo& info);
    void renderSine (const juce::AudioSourceChannelInfo& info);
    void renderSynth (const juce::AudioSourceChannelInfo& info);
    void applyLevel (const juce::AudioSourceChannelInfo& info);
```

Add the MIDI plumbing and the synthesiser below `levelLabel`. The
`MidiKeyboardState` records which keys are down, and the `MidiMessageCollector`
hands MIDI from the message thread to the audio thread:

```cpp
    juce::Label levelLabel { {}, "Level" };

    juce::MidiKeyboardState keyboardState;
    juce::MidiMessageCollector midiCollector;
    juce::MidiKeyboardComponent keyboard { keyboardState, juce::MidiKeyboardComponent::horizontalKeyboard };
    juce::Synthesiser synth;
```

Add the audio-thread counter below `smoothedGain`:

```cpp
    juce::SmoothedValue<float> smoothedGain;
    int lastMode = noise;                            // audio thread only
```

**In `MainComponent.cpp`**, add the menu entry and make the frequency slider
inactive in the new mode, since the pitch comes from the keys. Replace the
`modeBox` lines in the constructor:

```cpp
    addAndMakeVisible (modeBox);
    modeBox.addItem ("White noise", noise);
    modeBox.addItem ("Sine wave", sine);
    modeBox.addItem ("MIDI synth", midiSynth);
    modeBox.setSelectedId (noise, juce::dontSendNotification);
    modeBox.onChange = [this]
    {
        mode = modeBox.getSelectedId();
        frequencySlider.setEnabled (mode != midiSynth);   // the synth takes its pitch from the keys
    };
```

Then wire up the keyboard, MIDI, and voices before `setSize`, and make the
window taller to fit the keyboard:

```cpp
    addAndMakeVisible (keyboard);
    keyboardState.addListener (&midiCollector);                      // on-screen keys -> collector
    deviceManager.addMidiInputDeviceCallback ({}, &midiCollector);   // hardware keys, if any

    for (int i = 0; i < 8; ++i)
        synth.addVoice (new SineVoice());

    synth.addSound (new SineSound());

    setSize (600, 300);
```

Undo the wiring in the destructor, before `shutdownAudio()`:

```cpp
MainComponent::~MainComponent()
{
    deviceManager.removeMidiInputDeviceCallback ({}, &midiCollector);
    keyboardState.removeListener (&midiCollector);
    shutdownAudio();
}
```

Tell the synthesiser and the collector the sample rate in `prepareToPlay()`:

```cpp
    currentSampleRate = sampleRate;

    synth.setCurrentPlaybackSampleRate (sampleRate);
    midiCollector.reset (sampleRate);
```

Replace `getNextAudioBlock()`. When the mode changes, `allNotesOff()` stops
notes that were still sounding, so they do not return later:

```cpp
void MainComponent::getNextAudioBlock (const juce::AudioSourceChannelInfo& info)
{
    auto currentMode = mode.load();

    if (currentMode != lastMode)
    {
        synth.allNotesOff (0, false);   // do not leave notes hanging when the mode changes
        lastMode = currentMode;
    }

    if (currentMode == midiSynth)
        renderSynth (info);
    else if (currentMode == sine)
        renderSine (info);
    else
        renderNoise (info);

    applyLevel (info);
}
```

Add `renderSynth()` before `applyLevel()`:

```cpp
void MainComponent::renderSynth (const juce::AudioSourceChannelInfo& info)
{
    info.clearActiveBufferRegion();   // Synthesiser adds to the buffer, so start from silence

    juce::MidiBuffer incoming;
    midiCollector.removeNextBlockOfMessages (incoming, info.numSamples);
    synth.renderNextBlock (*info.buffer, incoming, info.startSample, info.numSamples);
}
```

Finally, give the keyboard the rest of the window at the end of `resized()`:

```cpp
    levelSlider.setBounds (row);
    area.removeFromTop (8);

    keyboard.setBounds (area);
```

Build and run, choose **MIDI synth**, and play the on-screen keys with the mouse or
the computer keyboard (the keys `a`, `w`, `s`, `e`, and so on, after clicking the
keyboard). Hold several keys to hear polyphony. If you have a hardware MIDI
keyboard, it works too once the system has enabled it.

- Clear the buffer before rendering: `Synthesiser` *adds* to it.
- `renderNextBlock()` splits the block at each MIDI event's timestamp, so notes
  start sample-accurately.
- The collector is drained in every mode, so notes pressed while another mode is
  active are not stored up and played in a burst later.
- Enable hardware MIDI inputs with
  `deviceManager.setMidiInputDeviceEnabled (info.identifier, true)`, for example
  from an `AudioDeviceSelectorComponent` with MIDI inputs shown.
- Voices must be real-time safe: no allocation in `startNote()` or
  `renderNextBlock()`. Allocate wavetables, envelopes, and so on beforehand.
- For a proper amplitude envelope use `juce::ADSR` instead of the exponential tail
  above: call `setSampleRate()` and `setParameters()`, `noteOn()` in `startNote()`,
  `noteOff()` in `stopNote()`, multiply by `getNextSample()`, and call
  `clearCurrentNote()` when `isActive()` turns false.
- In a plug-in, the host supplies MIDI in `processBlock()` and the collector is
  unnecessary: pass the `MidiBuffer` straight to `synth.renderNextBlock()`.

## Step 6: add a wavetable oscillator

Instead of calling `std::sin()` for every sample, precompute one cycle into a
table and read it back at a variable speed. This is cheaper, and the table can
hold any waveform (sawtooth, harmonics, a sampled cycle). This step adds a
**Wavetable** mode that is played by the same **Frequency** slider as the sine
wave.

**In `MainComponent.h`**, add the oscillator class above `DecibelSlider`. It
reads from a table it does not own, and it interpolates between neighbouring
entries:

```cpp
// Reads one cycle of a waveform from a shared table at a variable speed
class WavetableOscillator
{
public:
    explicit WavetableOscillator (const juce::AudioSampleBuffer& t)
        : table (t), tableSize (t.getNumSamples() - 1) {}

    void setFrequency (float hz, float sampleRate)
    {
        tableDelta = hz * (float) tableSize / sampleRate;   // table steps per output sample
    }

    float getNextSample() noexcept
    {
        auto index0 = (unsigned int) currentIndex;
        auto index1 = index0 + 1;
        auto frac   = currentIndex - (float) index0;

        auto* data = table.getReadPointer (0);
        auto v = data[index0] + frac * (data[index1] - data[index0]);   // linear interpolation

        if ((currentIndex += tableDelta) >= (float) tableSize)
            currentIndex -= (float) tableSize;                          // wrap

        return v;
    }

private:
    const juce::AudioSampleBuffer& table;
    const int tableSize;
    float currentIndex = 0.0f, tableDelta = 0.0f;
};
```

Then, in `MainComponent`, add the mode and the render and table-building functions:

```cpp
    enum Mode { noise = 1, sine, midiSynth, wavetable };   // ComboBox item IDs must be non-zero

    void renderNoise (const juce::AudioSourceChannelInfo& info);
    void renderSine (const juce::AudioSourceChannelInfo& info);
    void renderSynth (const juce::AudioSourceChannelInfo& info);
    void renderWavetable (const juce::AudioSourceChannelInfo& info);
    void applyLevel (const juce::AudioSourceChannelInfo& info);

    static juce::AudioSampleBuffer createWavetable (int tableSize = 128);
```

Add the table and its oscillator after `synth`. The **order matters**: members are
constructed in the order they are declared, so the table must come before the
oscillator that refers to it:

```cpp
    juce::Synthesiser synth;

    juce::AudioSampleBuffer sineTable { createWavetable() };   // declared before the oscillator that reads it
    WavetableOscillator oscillator { sineTable };
```

**In `MainComponent.cpp`**, add the menu entry after "MIDI synth":

```cpp
    modeBox.addItem ("MIDI synth", midiSynth);
    modeBox.addItem ("Wavetable", wavetable);
```

Add the new case to `getNextAudioBlock()`:

```cpp
    if (currentMode == midiSynth)
        renderSynth (info);
    else if (currentMode == wavetable)
        renderWavetable (info);
    else if (currentMode == sine)
        renderSine (info);
    else
        renderNoise (info);
```

Add the two new functions before `applyLevel()`. `createWavetable()` writes one
sine cycle and a *guard* sample, a copy of the first sample at the end, which lets the
interpolation read `index + 1` without a bounds check. `renderWavetable()` asks
the smoother for a frequency each sample, exactly as `renderSine()` does:

```cpp
void MainComponent::renderWavetable (const juce::AudioSourceChannelInfo& info)
{
    smoothedFrequency.setTargetValue (frequency.load());

    auto channels = info.buffer->getArrayOfWritePointers();
    auto numChannels = info.buffer->getNumChannels();

    for (int i = 0; i < info.numSamples; ++i)
    {
        oscillator.setFrequency ((float) smoothedFrequency.getNextValue(), (float) currentSampleRate);
        auto s = oscillator.getNextSample();

        for (int ch = 0; ch < numChannels; ++ch)
            channels[ch][info.startSample + i] = s;
    }
}

juce::AudioSampleBuffer MainComponent::createWavetable (int tableSize)
{
    juce::AudioSampleBuffer table (1, tableSize + 1);   // one guard sample simplifies interpolation
    auto* s = table.getWritePointer (0);
    auto step = juce::MathConstants<double>::twoPi / (double) tableSize;   // one full cycle

    for (int i = 0; i < tableSize; ++i)
        s[i] = (float) std::sin (i * step);

    s[tableSize] = s[0];                                // guard = first sample
    return table;
}
```

Build and run, choose **Wavetable**, and compare it with **Sine wave**. They sound
the same, because the table holds a sine, but the wavetable does a lookup and a
multiply-add per sample instead of a `std::sin()` call.

Try changing the waveform. Replace the body of `createWavetable()` with this
version, which adds the first 20 harmonics at amplitude `1/n` to build an
approximate sawtooth. Build and run, and the same mode now sounds buzzy:

```cpp
juce::AudioSampleBuffer MainComponent::createWavetable (int tableSize)
{
    juce::AudioSampleBuffer table (1, tableSize + 1);
    table.clear();

    auto* s = table.getWritePointer (0);
    auto step = juce::MathConstants<double>::twoPi / (double) tableSize;

    for (int harmonic = 1; harmonic <= 20; ++harmonic)
        for (int i = 0; i < tableSize; ++i)
            s[i] += (float) (std::sin (i * step * harmonic) / harmonic) * 0.5f;   // 0.5 leaves headroom

    s[tableSize] = s[0];
    return table;
}
```

- Interpolate between neighbouring table entries. Without it, low-resolution
  tables sound noisy and stepped. Try `tableSize = 16` to hear the effect.
- One oscillator per note (or per voice) shares one immutable table. Mix several
  oscillators for chords, and scale the total down to avoid clipping.
- For very high harmonic content, use band-limited tables per octave to avoid
  aliasing. The sawtooth above stops at 20 harmonics, so it stays clean for low
  notes and starts to alias on high ones.
- To play the wavetable from MIDI, give each `SynthesiserVoice` its own
  `WavetableOscillator` that points at the shared table, and set its frequency
  in `startNote()`.

## Complete source

After step 6 with the sine table, the two files look like this. `CMakeLists.txt` and
`Main.cpp` are unchanged from step 1.

<details>
<summary><code>MainComponent.h</code></summary>

```cpp
#pragma once

#include <juce_audio_utils/juce_audio_utils.h>

struct SineSound final : public juce::SynthesiserSound
{
    bool appliesToNote (int) override    { return true; }
    bool appliesToChannel (int) override { return true; }
};

class SineVoice final : public juce::SynthesiserVoice
{
public:
    bool canPlaySound (juce::SynthesiserSound* s) override
    {
        return dynamic_cast<SineSound*> (s) != nullptr;
    }

    void startNote (int midiNote, float velocity, juce::SynthesiserSound*, int) override
    {
        currentAngle = 0.0;
        level = velocity * 0.25f;
        tailOff = 0.0;

        auto hz = juce::MidiMessage::getMidiNoteInHertz (midiNote);
        angleDelta = hz / getSampleRate() * juce::MathConstants<double>::twoPi;
    }

    void stopNote (float, bool allowTailOff) override
    {
        if (allowTailOff)
        {
            if (juce::approximatelyEqual (tailOff, 0.0))
                tailOff = 1.0;                       // begin a release fade
        }
        else
        {
            clearCurrentNote();                      // silence this voice immediately
            angleDelta = 0.0;
        }
    }

    using juce::SynthesiserVoice::renderNextBlock;   // keep the double overload visible too

    void renderNextBlock (juce::AudioBuffer<float>& out, int start, int num) override
    {
        if (juce::approximatelyEqual (angleDelta, 0.0))
            return;                                  // voice is idle

        while (--num >= 0)
        {
            auto s = (float) std::sin (currentAngle) * level
                     * (tailOff > 0.0 ? (float) tailOff : 1.0f);

            for (int ch = 0; ch < out.getNumChannels(); ++ch)
                out.addSample (ch, start, s);        // add: several voices mix into the buffer

            currentAngle += angleDelta;
            ++start;

            if (tailOff > 0.0)
            {
                tailOff *= 0.99;

                if (tailOff <= 0.005)
                {
                    clearCurrentNote();
                    angleDelta = 0.0;
                    break;
                }
            }
        }
    }

    void pitchWheelMoved (int) override {}
    void controllerMoved (int, int) override {}

private:
    double currentAngle = 0.0, angleDelta = 0.0, tailOff = 0.0;
    float level = 0.0f;
};

// Reads one cycle of a waveform from a shared table at a variable speed
class WavetableOscillator
{
public:
    explicit WavetableOscillator (const juce::AudioSampleBuffer& t)
        : table (t), tableSize (t.getNumSamples() - 1) {}

    void setFrequency (float hz, float sampleRate)
    {
        tableDelta = hz * (float) tableSize / sampleRate;   // table steps per output sample
    }

    float getNextSample() noexcept
    {
        auto index0 = (unsigned int) currentIndex;
        auto index1 = index0 + 1;
        auto frac   = currentIndex - (float) index0;

        auto* data = table.getReadPointer (0);
        auto v = data[index0] + frac * (data[index1] - data[index0]);   // linear interpolation

        if ((currentIndex += tableDelta) >= (float) tableSize)
            currentIndex -= (float) tableSize;                          // wrap

        return v;
    }

private:
    const juce::AudioSampleBuffer& table;
    const int tableSize;
    float currentIndex = 0.0f, tableDelta = 0.0f;
};

// A slider that shows its value as decibels, and shows the bottom of its range as "-inf dB"
class DecibelSlider final : public juce::Slider
{
public:
    double getValueFromText (const juce::String& text) override
    {
        auto t = text.upToFirstOccurrenceOf ("dB", false, false).trim();
        return t.equalsIgnoreCase ("-INF") ? getMinimum() : t.getDoubleValue();
    }

    juce::String getTextFromValue (double value) override
    {
        return juce::Decibels::toString (value, 1, getMinimum());
    }
};

class MainComponent final : public juce::AudioAppComponent
{
public:
    MainComponent();
    ~MainComponent() override;

    void prepareToPlay (int samplesPerBlockExpected, double sampleRate) override;
    void getNextAudioBlock (const juce::AudioSourceChannelInfo& info) override;
    void releaseResources() override;

    void resized() override;

private:
    enum Mode { noise = 1, sine, midiSynth, wavetable };   // ComboBox item IDs must be non-zero

    void renderNoise (const juce::AudioSourceChannelInfo& info);
    void renderSine (const juce::AudioSourceChannelInfo& info);
    void renderSynth (const juce::AudioSourceChannelInfo& info);
    void renderWavetable (const juce::AudioSourceChannelInfo& info);

    static juce::AudioSampleBuffer createWavetable (int tableSize = 128);
    void applyLevel (const juce::AudioSourceChannelInfo& info);

    juce::Random random;

    juce::ComboBox modeBox;
    juce::Slider frequencySlider;
    juce::Label frequencyLabel { {}, "Frequency" };
    DecibelSlider levelSlider;
    juce::Label levelLabel { {}, "Level" };

    juce::MidiKeyboardState keyboardState;
    juce::MidiMessageCollector midiCollector;
    juce::MidiKeyboardComponent keyboard { keyboardState, juce::MidiKeyboardComponent::horizontalKeyboard };
    juce::Synthesiser synth;

    juce::AudioSampleBuffer sineTable { createWavetable() };   // declared before the oscillator that reads it
    WavetableOscillator oscillator { sineTable };

    std::atomic<int> mode { noise };               // written by the GUI, read by the audio thread
    std::atomic<double> frequency { 500.0 };
    std::atomic<float> level { 0.0f };             // linear gain, set from the level slider

    juce::SmoothedValue<double> smoothedFrequency;   // audio thread only
    juce::SmoothedValue<float> smoothedGain;
    int lastMode = noise;                            // audio thread only

    double currentSampleRate = 0.0, currentAngle = 0.0;

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR (MainComponent)
};
```

</details>

<details>
<summary><code>MainComponent.cpp</code></summary>

```cpp
#include "MainComponent.h"

MainComponent::MainComponent()
{
    addAndMakeVisible (modeBox);
    modeBox.addItem ("White noise", noise);
    modeBox.addItem ("Sine wave", sine);
    modeBox.addItem ("MIDI synth", midiSynth);
    modeBox.addItem ("Wavetable", wavetable);
    modeBox.setSelectedId (noise, juce::dontSendNotification);
    modeBox.onChange = [this]
    {
        mode = modeBox.getSelectedId();
        frequencySlider.setEnabled (mode != midiSynth);   // the synth takes its pitch from the keys
    };

    addAndMakeVisible (frequencySlider);
    addAndMakeVisible (frequencyLabel);
    frequencySlider.setRange (50.0, 5000.0);
    frequencySlider.setSkewFactorFromMidPoint (500.0);   // low frequencies get more travel
    frequencySlider.setTextValueSuffix (" Hz");
    frequencySlider.onValueChange = [this] { frequency = frequencySlider.getValue(); };
    frequencySlider.setValue (500.0, juce::sendNotificationSync);

    addAndMakeVisible (levelSlider);
    addAndMakeVisible (levelLabel);
    levelSlider.setRange (-100.0, -6.0);
    levelSlider.setSkewFactorFromMidPoint (-30.0);
    levelSlider.onValueChange = [this]
    {
        level = juce::Decibels::decibelsToGain ((float) levelSlider.getValue(),
                                                (float) levelSlider.getMinimum());
    };
    levelSlider.setValue (-24.0, juce::sendNotificationSync);

    addAndMakeVisible (keyboard);
    keyboardState.addListener (&midiCollector);                      // on-screen keys -> collector
    deviceManager.addMidiInputDeviceCallback ({}, &midiCollector);   // hardware keys, if any

    for (int i = 0; i < 8; ++i)
        synth.addVoice (new SineVoice());

    synth.addSound (new SineSound());

    setSize (600, 300);
    setAudioChannels (0, 2);   // no inputs, two outputs
}

MainComponent::~MainComponent()
{
    deviceManager.removeMidiInputDeviceCallback ({}, &midiCollector);
    keyboardState.removeListener (&midiCollector);
    shutdownAudio();
}

void MainComponent::prepareToPlay (int, double sampleRate)
{
    currentSampleRate = sampleRate;

    synth.setCurrentPlaybackSampleRate (sampleRate);
    midiCollector.reset (sampleRate);

    smoothedFrequency.reset (sampleRate, 0.05);                       // 50 ms ramp
    smoothedFrequency.setCurrentAndTargetValue (frequency.load());

    smoothedGain.reset (sampleRate, 0.05);
    smoothedGain.setCurrentAndTargetValue (level.load());
}

void MainComponent::getNextAudioBlock (const juce::AudioSourceChannelInfo& info)
{
    auto currentMode = mode.load();

    if (currentMode != lastMode)
    {
        synth.allNotesOff (0, false);   // do not leave notes hanging when the mode changes
        lastMode = currentMode;
    }

    if (currentMode == midiSynth)
        renderSynth (info);
    else if (currentMode == wavetable)
        renderWavetable (info);
    else if (currentMode == sine)
        renderSine (info);
    else
        renderNoise (info);

    applyLevel (info);
}

void MainComponent::renderSynth (const juce::AudioSourceChannelInfo& info)
{
    info.clearActiveBufferRegion();   // Synthesiser adds to the buffer, so start from silence

    juce::MidiBuffer incoming;
    midiCollector.removeNextBlockOfMessages (incoming, info.numSamples);
    synth.renderNextBlock (*info.buffer, incoming, info.startSample, info.numSamples);
}

void MainComponent::renderWavetable (const juce::AudioSourceChannelInfo& info)
{
    smoothedFrequency.setTargetValue (frequency.load());

    auto channels = info.buffer->getArrayOfWritePointers();
    auto numChannels = info.buffer->getNumChannels();

    for (int i = 0; i < info.numSamples; ++i)
    {
        oscillator.setFrequency ((float) smoothedFrequency.getNextValue(), (float) currentSampleRate);
        auto s = oscillator.getNextSample();

        for (int ch = 0; ch < numChannels; ++ch)
            channels[ch][info.startSample + i] = s;
    }
}

juce::AudioSampleBuffer MainComponent::createWavetable (int tableSize)
{
    juce::AudioSampleBuffer table (1, tableSize + 1);   // one guard sample simplifies interpolation
    auto* s = table.getWritePointer (0);
    auto step = juce::MathConstants<double>::twoPi / (double) tableSize;   // one full cycle

    for (int i = 0; i < tableSize; ++i)
        s[i] = (float) std::sin (i * step);

    s[tableSize] = s[0];                                // guard = first sample
    return table;
}

void MainComponent::applyLevel (const juce::AudioSourceChannelInfo& info)
{
    smoothedGain.setTargetValue (level.load());

    auto channels = info.buffer->getArrayOfWritePointers();
    auto numChannels = info.buffer->getNumChannels();

    for (int i = 0; i < info.numSamples; ++i)
    {
        auto gain = smoothedGain.getNextValue();

        for (int ch = 0; ch < numChannels; ++ch)
            channels[ch][info.startSample + i] *= gain;
    }
}

void MainComponent::renderNoise (const juce::AudioSourceChannelInfo& info)
{
    // White noise at full scale: -1 .. +1 (the level slider turns it down)
    for (int ch = 0; ch < info.buffer->getNumChannels(); ++ch)
    {
        auto* out = info.buffer->getWritePointer (ch, info.startSample);

        for (int i = 0; i < info.numSamples; ++i)
            out[i] = random.nextFloat() * 2.0f - 1.0f;
    }
}

void MainComponent::renderSine (const juce::AudioSourceChannelInfo& info)
{
    smoothedFrequency.setTargetValue (frequency.load());

    auto channels = info.buffer->getArrayOfWritePointers();
    auto numChannels = info.buffer->getNumChannels();

    for (int i = 0; i < info.numSamples; ++i)
    {
        auto s = (float) std::sin (currentAngle);

        auto cyclesPerSample = smoothedFrequency.getNextValue() / currentSampleRate;
        currentAngle += cyclesPerSample * juce::MathConstants<double>::twoPi;

        if (currentAngle >= juce::MathConstants<double>::twoPi)
            currentAngle -= juce::MathConstants<double>::twoPi;

        for (int ch = 0; ch < numChannels; ++ch)
            channels[ch][info.startSample + i] = s;
    }
}

void MainComponent::releaseResources() {}

void MainComponent::resized()
{
    auto area = getLocalBounds().reduced (10);

    modeBox.setBounds (area.removeFromTop (28).removeFromLeft (200));
    area.removeFromTop (8);

    auto row = area.removeFromTop (28);
    frequencyLabel.setBounds (row.removeFromLeft (80));
    frequencySlider.setBounds (row);
    area.removeFromTop (8);

    row = area.removeFromTop (28);
    levelLabel.setBounds (row.removeFromLeft (80));
    levelSlider.setBounds (row);
    area.removeFromTop (8);

    keyboard.setBounds (area);
}
```

</details>

## Build and run

With all the files in place, configure and build from the project folder:

```sh
cmake -B build
cmake --build build
```

The build puts the finished app in `build/SynthDemo_artefacts/`. With CMake's default generator on each platform (Makefiles on macOS and Linux, and
Visual Studio on Windows, which adds the `Debug` folder):

| Platform | Run it with |
| -------- | ----------- |
| macOS    | `open "build/SynthDemo_artefacts/Synth Demo.app"` |
| Linux    | `./build/SynthDemo_artefacts/Synth\ Demo` |
| Windows  | `"build\SynthDemo_artefacts\Debug\Synth Demo.exe"` |

In PowerShell, put `&` before the quoted path.

Xcode and Visual Studio are multi-config generators and add a configuration folder,
for example `build/SynthDemo_artefacts/Debug/Synth Demo.app`; build with
`cmake --build build --config Debug`. With Ninja there is no configuration folder, so
drop `Debug` from the Windows path.

> **"The application cannot be opened because its executable is missing"?**
> CMake creates the empty `.app` bundle at the start of the build and only fills
> in the executable when compiling and linking succeed. If `cmake --build build`
> reported errors, fix them and build again, then re-run `open`. Check that the
> last lines of the build output say `Built target SynthDemo`.

> **"use of undeclared identifier 'juce'"?** CMake projects have no
> `JuceHeader.h`, so every source file must include the module headers it uses.
> `MainComponent.h` includes them and `Main.cpp` includes `MainComponent.h`.
> Without those includes the compiler does not know what `juce::`, `std::`, or
> `START_JUCE_APPLICATION` mean.

## Sources

Condensed from the JUCE tutorials *Build a white noise generator*, *Build a sine
wave synthesiser*, *Control audio levels*, *Control audio levels using decibels*,
*Build a MIDI synthesiser*, and *Wavetable synthesis*, Copyright (c) Raw
Material Software Limited, ISC licence. See [NOTICE.md](NOTICE.md).
