# Synthesis: noise, sine waves, levels, MIDI voices, and wavetables

Generate audio from scratch, control its level, and turn it into a playable
instrument.

**Level:** Intermediate  
**Prerequisite:** [Audio input, output, files, and waveforms](05-audio-io-and-playback.md)

All examples live inside an `AudioAppComponent` and write into
`info.buffer` between `info.startSample` and `info.startSample + info.numSamples`.
Audio is `float` data where `1.0` and `-1.0` are full scale, so keep test signals
well below that: the output is **very** loud at full scale.

## Set up the project

The project below plays quiet white noise, the first example in the guide. Turn your volume down first. Every later example is a replacement for `getNextAudioBlock()` and `prepareToPlay()` in this project, plus any members it declares in `MainComponent.h`.

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

## White noise

Fill the block with random values. `Random::nextFloat()` returns `0..1`, so scale
and centre it:

```cpp
void getNextAudioBlock (const juce::AudioSourceChannelInfo& info) override
{
    for (int ch = 0; ch < info.buffer->getNumChannels(); ++ch)
    {
        auto* out = info.buffer->getWritePointer (ch, info.startSample);

        for (int i = 0; i < info.numSamples; ++i)
            out[i] = random.nextFloat() * 0.25f - 0.125f;   // range -0.125 .. +0.125
    }
}

juce::Random random;
```

Use `getWritePointer (channel, startSample)` once per channel and index samples
from zero, rather than calling it per sample.

## Sine wave

A digital oscillator tracks its *phase* (an angle) and advances it by a fixed step
per sample. The step depends on the sample rate, so compute it in
`prepareToPlay()`:

```cpp
void prepareToPlay (int, double sampleRate) override
{
    currentSampleRate = sampleRate;
    updateAngleDelta();
}

void updateAngleDelta()
{
    auto cyclesPerSample = frequency.load() / currentSampleRate;
    angleDelta = cyclesPerSample * juce::MathConstants<double>::twoPi;
}

void getNextAudioBlock (const juce::AudioSourceChannelInfo& info) override
{
    auto* left  = info.buffer->getWritePointer (0, info.startSample);
    auto* right = info.buffer->getWritePointer (1, info.startSample);

    for (int i = 0; i < info.numSamples; ++i)
    {
        auto s = (float) std::sin (currentAngle) * 0.125f;
        currentAngle += angleDelta;
        left[i] = right[i] = s;
    }
}

double currentSampleRate = 0.0, currentAngle = 0.0, angleDelta = 0.0;
std::atomic<double> frequency { 500.0 };
```

- Keep the angle in a `double` and, for long-running or `float` oscillators,
  wrap it into `[0, 2π)` to avoid precision loss.
- Give the frequency slider a skew (`setSkewFactorFromMidPoint (500.0)`) so the
  travel feels musical.
- **Smooth parameter changes.** Jumping straight to a new frequency (or level)
  between blocks creates clicks. Either ramp within the block (compute a
  per-sample increment from the current to the target value and recompute
  `angleDelta` as you go), or let `juce::SmoothedValue` do it:

```cpp
juce::SmoothedValue<float> freq;

void prepareToPlay (int, double sampleRate) override
{
    currentSampleRate = sampleRate;
    freq.reset (sampleRate, 0.05);           // 50 ms ramp
    freq.setCurrentAndTargetValue (500.0f);
}

// GUI thread:  targetFrequency = (float) slider.getValue();
// Audio thread, once per block:  freq.setTargetValue (targetFrequency.load());
// per sample:  angleDelta = freq.getNextValue() / currentSampleRate * twoPi;
```

## Controlling level

Level is multiplication: `out = in * gain`. For the noise generator,
`nextFloat() * 2 - 1` gives `-1..1`, and multiplying by `level` scales it. The
cheaper form, with one fewer operation per sample, is
`nextFloat() * (2 * level) - level`.

Sliders show *gain* awkwardly. Listeners hear loudness logarithmically, so
present levels in decibels and convert at the boundary:

```cpp
juce::Decibels::gainToDecibels (0.5f);        // -6.02 dB
juce::Decibels::decibelsToGain (-6.0f);       //  0.501
juce::Decibels::toString (-12.0);             // "-12.00 dB"
```

```cpp
class DecibelSlider final : public juce::Slider
{
public:
    double getValueFromText (const juce::String& text) override
    {
        auto t = text.upToFirstOccurrenceOf ("dB", false, false).trim();
        return t.equalsIgnoreCase ("-INF") ? -100.0 : t.getDoubleValue();
    }

    juce::String getTextFromValue (double value) override
    {
        return juce::Decibels::toString (value);
    }
};

// setup
dbSlider.setRange (-100.0, -12.0);
dbSlider.onValueChange = [this]
{
    level = juce::Decibels::decibelsToGain ((float) dbSlider.getValue());
};
```

- Treat the bottom of the range as minus infinity: `gainToDecibels (gain, -96.0f)`
  takes an explicit floor. Use the same floor everywhere.
- `level` is written by the GUI thread and read by the audio thread, so make it a
  `std::atomic<float>`, and smooth it (`SmoothedValue` with
  `Multiplicative` smoothing suits gain) to avoid zipper noise. Copy it to a local
  at the start of the block so it is constant for the whole block.

## A MIDI-playable synthesiser

`juce::Synthesiser` manages polyphony: it turns MIDI events into notes and
allocates them to voices. You provide the sound and the voice.

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
        level = velocity * 0.15f;
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

    void renderNextBlock (juce::AudioBuffer<float>& out, int start, int num) override
    {
        if (juce::approximatelyEqual (angleDelta, 0.0)) return;   // voice is idle

        while (--num >= 0)
        {
            auto s = (float) std::sin (currentAngle) * level
                     * (tailOff > 0.0 ? (float) tailOff : 1.0f);

            for (int ch = 0; ch < out.getNumChannels(); ++ch)
                out.addSample (ch, start, s);      // add: several voices mix into the buffer

            currentAngle += angleDelta;
            ++start;

            if (tailOff > 0.0)
            {
                tailOff *= 0.99;
                if (tailOff <= 0.005) { clearCurrentNote(); angleDelta = 0.0; break; }
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

Wire it into the component with a keyboard for input, and a `MidiMessageCollector`
to hand MIDI from the message thread to the audio thread:

```cpp
class SynthComponent final : public juce::AudioAppComponent
{
public:
    SynthComponent() : keyboard (keyboardState, juce::MidiKeyboardComponent::horizontalKeyboard)
    {
        addAndMakeVisible (keyboard);
        keyboardState.addListener (&midiCollector);        // on-screen keys -> collector
        deviceManager.addMidiInputDeviceCallback ({}, &midiCollector);  // hardware, if any

        for (int i = 0; i < 8; ++i) synth.addVoice (new SineVoice());
        synth.addSound (new SineSound());

        setSize (600, 160);
        setAudioChannels (0, 2);
    }

    ~SynthComponent() override { shutdownAudio(); }

    void prepareToPlay (int, double rate) override
    {
        synth.setCurrentPlaybackSampleRate (rate);
        midiCollector.reset (rate);
    }

    void getNextAudioBlock (const juce::AudioSourceChannelInfo& info) override
    {
        info.clearActiveBufferRegion();

        juce::MidiBuffer incoming;
        midiCollector.removeNextBlockOfMessages (incoming, info.numSamples);
        synth.renderNextBlock (*info.buffer, incoming, info.startSample, info.numSamples);
    }

    void releaseResources() override {}
    void resized() override { keyboard.setBounds (getLocalBounds().reduced (8)); }

private:
    juce::MidiKeyboardState keyboardState;
    juce::MidiMessageCollector midiCollector;
    juce::MidiKeyboardComponent keyboard;
    juce::Synthesiser synth;
};
```

- Clear the buffer before rendering: `Synthesiser` *adds* to it.
- `renderNextBlock()` splits the block at each MIDI event's timestamp, so notes
  start sample-accurately.
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

## Wavetable oscillators

Instead of calling `std::sin()` per sample, precompute one cycle into a table and
read it back at a variable speed. This is cheaper, and the table can hold any
waveform (sawtooth, harmonics, a sampled cycle).

```cpp
juce::AudioSampleBuffer sineTable;            // one channel, tableSize + 1 samples

void createWavetable (int tableSize = 128)
{
    sineTable.setSize (1, tableSize + 1);     // one guard sample simplifies interpolation
    auto* s = sineTable.getWritePointer (0);
    auto step = juce::MathConstants<double>::twoPi / (double) tableSize;   // one full cycle

    for (int i = 0; i < tableSize; ++i)
        s[i] = (float) std::sin (i * step);

    s[tableSize] = s[0];                      // guard = first sample
}

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

        if ((currentIndex += tableDelta) > (float) tableSize)
            currentIndex -= (float) tableSize;                          // wrap

        return v;
    }

private:
    const juce::AudioSampleBuffer& table;
    const int tableSize;
    float currentIndex = 0.0f, tableDelta = 0.0f;
};
```

- Interpolate between neighbouring table entries. Without it, low-resolution
  tables sound noisy and stepped.
- One oscillator per note (or per voice) shares one immutable table. Mix several
  oscillators for chords, and scale the total down to avoid clipping.
- For very high harmonic content, use band-limited tables per octave to avoid
  aliasing.

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
