# Audio plug-in basics: structure, MIDI, buses, and distribution

Create an audio or MIDI plug-in, understand its two halves, process MIDI and
audio, describe its channel layout, and package it for users.

**Level:** Beginner to intermediate  
**Formats:** VST3, AU, AUv3, AAX, LV2, Unity, and Standalone (JUCE also builds
legacy VST2 if you already hold the SDK)

## Set up the project

The project below is a complete stereo pass-through plug-in with an editor, which builds as a VST3, an Audio Unit (on macOS), and a standalone app. The snippets that follow extend it.

To skip the typing, download the starter project, **[MyPlugin.zip](downloads/MyPlugin.zip)**,
and unzip it. It contains exactly the five files below. If you prefer, create a
new, empty folder named `MyPlugin` yourself and copy each file from this page:

```text
MyPlugin/
├── CMakeLists.txt        # the build configuration
├── PluginProcessor.h     # the processor: audio, MIDI, state
├── PluginProcessor.cpp   # the processor implementation and plug-in entry point
├── PluginEditor.h        # the editor: the GUI
└── PluginEditor.cpp      # the editor implementation
```

Either way, `CMakeLists.txt` expects JUCE to be cloned to `~/JUCE`. If yours is elsewhere, change the path on the `file (REAL_PATH ...)` line.

<!-- starter-zip: MyPlugin -->

**`CMakeLists.txt`**

```cmake
cmake_minimum_required(VERSION 3.22)
set(CMAKE_OSX_ARCHITECTURES "arm64" CACHE STRING "macOS architectures")  # must come before project()
project(MYPLUGIN VERSION 0.0.1)

file(REAL_PATH "~/JUCE" JUCE_DIR EXPAND_TILDE)   # JUCE cloned to ~/JUCE; or use find_package (JUCE CONFIG REQUIRED)
add_subdirectory(${JUCE_DIR} JUCE)

juce_add_plugin(MyPlugin
    PLUGIN_MANUFACTURER_CODE Manu     # 4 characters, at least one upper-case
    PLUGIN_CODE Mypl                  # unique, 4 characters, exactly one upper-case
    FORMATS VST3 AU Standalone        # formats not available on your platform are skipped
    PRODUCT_NAME "My Plugin"
    IS_SYNTH FALSE                    # TRUE for instruments
    NEEDS_MIDI_INPUT FALSE            # TRUE if it must receive MIDI
    IS_MIDI_EFFECT FALSE              # TRUE for MIDI-only processors
    MICROPHONE_PERMISSION_ENABLED TRUE  # the Standalone app opens the audio input
    COPY_PLUGIN_AFTER_BUILD FALSE)

target_sources(MyPlugin PRIVATE PluginProcessor.cpp PluginEditor.cpp)

target_compile_definitions(MyPlugin PUBLIC
    JUCE_WEB_BROWSER=0
    JUCE_USE_CURL=0
    JUCE_VST3_CAN_REPLACE_VST2=0)

target_link_libraries(MyPlugin
    PRIVATE juce::juce_audio_utils
    PUBLIC  juce::juce_recommended_config_flags
            juce::juce_recommended_warning_flags)
```

**`PluginProcessor.h`**

```cpp
#pragma once

#include <juce_audio_utils/juce_audio_utils.h>

class MyProcessor final : public juce::AudioProcessor
{
public:
    MyProcessor();

    void prepareToPlay (double sampleRate, int maxBlockSize) override;
    void releaseResources() override;

    void processBlock (juce::AudioBuffer<float>&, juce::MidiBuffer&) override;
    using AudioProcessor::processBlock;               // keep the double-precision overload visible

    bool isBusesLayoutSupported (const BusesLayout&) const override;

    juce::AudioProcessorEditor* createEditor() override;
    bool hasEditor() const override                     { return true; }

    const juce::String getName() const override         { return "My Plugin"; }
    bool acceptsMidi() const override                   { return false; }
    bool producesMidi() const override                  { return false; }
    bool isMidiEffect() const override                  { return false; }
    double getTailLengthSeconds() const override        { return 0.0; }

    int getNumPrograms() override                       { return 1; }
    int getCurrentProgram() override                    { return 0; }
    void setCurrentProgram (int) override               {}
    const juce::String getProgramName (int) override    { return {}; }
    void changeProgramName (int, const juce::String&) override {}

    void getStateInformation (juce::MemoryBlock&) override;
    void setStateInformation (const void*, int) override;

private:
    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR (MyProcessor)
};
```

**`PluginProcessor.cpp`**

```cpp
#include "PluginProcessor.h"
#include "PluginEditor.h"

MyProcessor::MyProcessor()
    : AudioProcessor (BusesProperties()
                        .withInput  ("Input",  juce::AudioChannelSet::stereo(), true)
                        .withOutput ("Output", juce::AudioChannelSet::stereo(), true))
{
}

void MyProcessor::prepareToPlay (double, int) {}
void MyProcessor::releaseResources() {}

bool MyProcessor::isBusesLayoutSupported (const BusesLayout& layouts) const
{
    // Only stereo in and stereo out
    return layouts.getMainOutputChannelSet() == juce::AudioChannelSet::stereo()
        && layouts.getMainInputChannelSet() == layouts.getMainOutputChannelSet();
}

void MyProcessor::processBlock (juce::AudioBuffer<float>& buffer, juce::MidiBuffer&)
{
    juce::ScopedNoDenormals noDenormals;

    // Clear any output channels that have no matching input, then pass audio through
    for (int i = getTotalNumInputChannels(); i < getTotalNumOutputChannels(); ++i)
        buffer.clear (i, 0, buffer.getNumSamples());
}

juce::AudioProcessorEditor* MyProcessor::createEditor() { return new MyEditor (*this); }

void MyProcessor::getStateInformation (juce::MemoryBlock&) {}
void MyProcessor::setStateInformation (const void*, int) {}

// This creates new instances of the plug-in. It is called by the format wrappers.
juce::AudioProcessor* JUCE_CALLTYPE createPluginFilter()
{
    return new MyProcessor();
}
```

**`PluginEditor.h`**

```cpp
#pragma once

#include "PluginProcessor.h"

class MyEditor final : public juce::AudioProcessorEditor
{
public:
    explicit MyEditor (MyProcessor&);

    void paint (juce::Graphics&) override;
    void resized() override;

private:
    [[maybe_unused]] MyProcessor& processorRef;   // not `processor`: the base class already has one

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR (MyEditor)
};
```

**`PluginEditor.cpp`**

```cpp
#include "PluginEditor.h"

MyEditor::MyEditor (MyProcessor& p)
    : AudioProcessorEditor (&p), processorRef (p)
{
    setSize (300, 200);
}

void MyEditor::paint (juce::Graphics& g)
{
    g.fillAll (juce::Colours::black);
    g.setColour (juce::Colours::white);
    g.drawText ("My Plugin", getLocalBounds(), juce::Justification::centred);
}

void MyEditor::resized() {}
```

The `PLUGIN_MANUFACTURER_CODE` and `PLUGIN_CODE` identify your plug-in to hosts. Change
them to your own values before you share it. See the [CMake API](../CMake%20API.md)
for every option, including `AAX` (which needs Avid's SDK and signing).

The snippets in the rest of this guide show the processor and editor as one
listing for brevity. In the project above, the same code is split across the
`.h` and `.cpp` files. Put declarations in the headers, and function bodies in
the `.cpp` files.

## Test in a host

Once it builds (see [Build and run](#build-and-run)), test it in a host. JUCE ships an **Audio Plug-In Host**
(`extras/AudioPluginHost`, target `AudioPluginHost`) that scans plug-ins, wires them
into a node graph, and can be set as your IDE's launch executable so that
debugging your plug-in opens it automatically. The `Standalone` format runs your
plug-in as an ordinary app, which is the quickest way to iterate. AAX plug-ins
need an SDK and a licence from Avid, and must be signed with PACE tools before
they load in retail Pro Tools. See the [CMake API](../CMake%20API.md) for every
option.

## The two classes

Every plug-in has:

| Class                  | Responsibilities                                                     |
| ---------------------- | -------------------------------------------------------------------- |
| `AudioProcessor`       | Audio and MIDI processing, parameters, state, bus layout             |
| `AudioProcessorEditor` | The GUI, created and destroyed by the host as windows open and close |

Treat the processor as the parent: it always exists, the editor may not, and there
can be zero or several editors over its lifetime. The editor holds a reference to
the processor and pulls or pushes state through it. The processor must never
reference the editor.

```cpp
class MyProcessor final : public juce::AudioProcessor
{
public:
    MyProcessor()
        : AudioProcessor (BusesProperties()
                            .withInput  ("Input",  juce::AudioChannelSet::stereo(), true)
                            .withOutput ("Output", juce::AudioChannelSet::stereo(), true))
    {}

    void prepareToPlay (double sampleRate, int maxBlockSize) override {}
    void releaseResources() override {}

    void processBlock (juce::AudioBuffer<float>&, juce::MidiBuffer&) override;
    using AudioProcessor::processBlock;               // keep the double-precision overload visible

    bool isBusesLayoutSupported (const BusesLayout&) const override;

    juce::AudioProcessorEditor* createEditor() override;   // defined after MyEditor, below
    bool hasEditor() const override                     { return true; }

    const juce::String getName() const override         { return "My Plugin"; }
    bool acceptsMidi() const override                   { return false; }
    bool producesMidi() const override                  { return false; }
    bool isMidiEffect() const override                  { return false; }
    double getTailLengthSeconds() const override        { return 0.0; }

    int getNumPrograms() override                       { return 1; }
    int getCurrentProgram() override                    { return 0; }
    void setCurrentProgram (int) override               {}
    const juce::String getProgramName (int) override    { return {}; }
    void changeProgramName (int, const juce::String&) override {}

    void getStateInformation (juce::MemoryBlock&) override;
    void setStateInformation (const void*, int) override;
};

class MyEditor final : public juce::AudioProcessorEditor
{
public:
    explicit MyEditor (MyProcessor& p) : AudioProcessorEditor (&p), processorRef (p)
    {
        setSize (300, 200);
    }

    void paint (juce::Graphics& g) override { g.fillAll (juce::Colours::black); }
    void resized() override {}

private:
    [[maybe_unused]] MyProcessor& processorRef;   // not `processor`: the base class already has one
};

juce::AudioProcessorEditor* MyProcessor::createEditor() { return new MyEditor (*this); }
```

- `processBlock()` runs on the real-time audio thread. The rules from
  [Audio input, output, files, and waveforms](05-audio-io-and-playback.md) apply
  in full: no allocation, locking, or I/O.
- `prepareToPlay()` is where you learn the sample rate and the *maximum* block
  size. The actual block can be smaller and can vary. Allocate here.
- Declare `acceptsMidi()`, `producesMidi()`, and `isMidiEffect()` truthfully, or
  hosts will not route MIDI to the plug-in.
- Report a tail with `getTailLengthSeconds()` for reverbs and delays so hosts do
  not cut off the ring-out.
- Use `juce::ScopedNoDenormals` at the top of `processBlock()`.
- To pass a value from the editor to the processor, prefer plug-in parameters (see
  [Plug-in parameters and state](09-plugin-parameters.md)). A bare public member
  written by the editor and read by the audio thread is only acceptable as a
  quick experiment, and should be a `std::atomic`.

## Processing MIDI

`processBlock()` receives the block's MIDI in `midiMessages`, with timestamps as
sample positions. To change it, build a new buffer, then swap:

```cpp
void MyProcessor::processBlock (juce::AudioBuffer<float>& buffer, juce::MidiBuffer& midi)
{
    juce::ScopedNoDenormals noDenormals;
    buffer.clear();                                     // this plug-in produces no audio

    juce::MidiBuffer processed;

    for (const auto metadata : midi)
    {
        auto message = metadata.getMessage();

        if (message.isNoteOn())                         // rewrite every velocity
            message = juce::MidiMessage::noteOn (message.getChannel(),
                                                   message.getNoteNumber(),
                                                   noteOnVelocity.load());

        processed.addEvent (message, metadata.samplePosition);
    }

    midi.swapWith (processed);
}
```

A **MIDI effect** (`IS_MIDI_EFFECT TRUE`, `BusesProperties()` with no buses) works
the same way, and can *generate* events too. An arpeggiator, for example, counts
samples across blocks, and when a step falls inside the block, emits a
`noteOff` for the previous note and a `noteOn` for the next at the right offset:

```cpp
// Sketch: time and noteDuration are counted in samples; notes is a SortedSet<int>
for (const auto metadata : midi)
{
    auto m = metadata.getMessage();
    if (m.isNoteOn())       notes.add (m.getNoteNumber());
    else if (m.isNoteOff()) notes.removeValue (m.getNoteNumber());
}
midi.clear();

if (time + numSamples >= noteDuration)
{
    auto offset = juce::jlimit (0, numSamples - 1, noteDuration - time);

    if (lastNote > 0)
    {
        midi.addEvent (juce::MidiMessage::noteOff (1, lastNote), offset);
        lastNote = -1;
    }

    if (! notes.isEmpty())
    {
        current = (current + 1) % notes.size();
        lastNote = notes[current];
        midi.addEvent (juce::MidiMessage::noteOn (1, lastNote, (juce::uint8) 127), offset);
    }
}
time = (time + numSamples) % noteDuration;
```

Instruments (`IS_SYNTH TRUE`) render audio from `Synthesiser::renderNextBlock()`
with the block's `MidiBuffer`, as in [Synthesis](06-synthesis.md).

## Buses and channel layouts

Audio in a plug-in is organised into **buses**: named groups of channels (main
input, main output, sidechain, aux outputs) each with an `AudioChannelSet`
(`mono()`, `stereo()`, `create5point1()`, `disabled()`, ...). The layout can
change while the plug-in is loaded, and host and plug-in negotiate it. You
describe the *initial* layout in the constructor, then accept or reject the host's
proposals in `isBusesLayoutSupported()`.

```cpp
// Effect: stereo in and out
AudioProcessor (BusesProperties().withInput  ("Input",  juce::AudioChannelSet::stereo(), true)
                                 .withOutput ("Output", juce::AudioChannelSet::stereo(), true));

// Instrument: output only
AudioProcessor (BusesProperties().withOutput ("Output", juce::AudioChannelSet::stereo(), true));

// Effect with sidechain (the trailing bool says whether the bus starts enabled)
AudioProcessor (BusesProperties().withInput  ("Input",     juce::AudioChannelSet::stereo(), true)
                                 .withOutput ("Output",    juce::AudioChannelSet::stereo(), true)
                                 .withInput  ("Sidechain", juce::AudioChannelSet::stereo(), false));

// MIDI effect: no audio buses at all
AudioProcessor (BusesProperties());
```

```cpp
bool MyProcessor::isBusesLayoutSupported (const BusesLayout& layouts) const
{
    auto in  = layouts.getMainInputChannelSet();
    auto out = layouts.getMainOutputChannelSet();

    if (in.isDisabled() || out.isDisabled())              // require both buses to exist
        return false;

    if (out != juce::AudioChannelSet::mono() && out != juce::AudioChannelSet::stereo())
        return false;                                     // mono or stereo only

    return in == out;                                     // input must match output
}
```

- Accepting everything with `return true;` is rarely correct. State what you
  can actually process.
- Inside `processBlock()`, the single `AudioBuffer` holds the channels of *all*
  buses. Use `getBusBuffer (buffer, isInput, busIndex)` to get a view of just one,
  for example the sidechain:

```cpp
auto main      = getBusBuffer (buffer, true, 0);
auto sidechain = getBusBuffer (buffer, true, 1);
```

- A noise gate follows this pattern: rectify and smooth the sidechain
  (`y[i] = alpha * y[i-1] + (1 - alpha) * x[i]`), and while the result exceeds the
  threshold, pass the main channels through, otherwise write zeros.
- A multi-output instrument declares many output buses (only the first enabled by
  default) and overrides `canAddBus()` and `canRemoveBus()` so hosts cannot add
  input buses or exceed the maximum. It then renders each voice group into its own
  bus with `getBusBuffer (buffer, false, n)`.
- Test layouts in the Audio Plug-In Host (right-click a node to add, remove, and
  reconfigure buses) and, for AU on macOS, with `auval -v aufx <Code> <Manu>`,
  which reports the channel configurations your plug-in accepts.

See `examples/Plugins` for complete, buildable versions: `GainPluginDemo.h`,
`ArpeggiatorPluginDemo.h`, `NoiseGatePluginDemo.h`, `MultiOutSynthPluginDemo.h`,
`SurroundPluginDemo.h`, and `AudioPluginDemo.h`.

## Distributing your plug-in

Installing a plug-in is a copy into the right folder, so an installer's main job is
choosing the destination. Prefer the *system-wide* location where hosts look first:

| Format | macOS                                                     | Windows                                       | Linux                                  |
| ------ | --------------------------------------------------------- | --------------------------------------------- | -------------------------------------- |
| VST3   | `/Library/Audio/Plug-Ins/VST3` (or `~/Library/...`)        | `C:\Program Files\Common Files\VST3`          | `~/.vst3`, `/usr/lib/vst3`             |
| AU     | `/Library/Audio/Plug-Ins/Components` (or `~/Library/...`)  | not applicable                                | not applicable                         |
| AAX    | `/Library/Application Support/Avid/Audio/Plug-Ins`         | `C:\Program Files\Common Files\Avid\Audio\Plug-Ins` | not applicable                   |
| LV2    | `/Library/Audio/Plug-Ins/LV2`                              | `C:\Program Files\Common Files\LV2`           | `~/.lv2`, `/usr/lib/lv2`               |

Append ` (x86)` to `Program Files` for 32-bit builds on 64-bit Windows. Paths can
vary by host and version, so check the current format documentation.

- **macOS:** create a `.pkg` with one package per format (for example with Packages
  or `pkgbuild`), give each a unique identifier (`com.yourcompany.pkg.vst3`) and a
  payload destination, and wrap it in a `.dmg` with your licence and readme. A
  drag-and-drop disk image with aliases to the destination folders is a lighter
  alternative. Code-sign and notarise everything, or Gatekeeper will block it.
  AUv3 and AAX require additional signing and certificates.
- **Windows:** build an installer (Inno Setup and similar tools work well) that
  copies each format to its folder. Link the C runtime **statically** for
  distributed builds so users do not need the Visual C++ redistributable
  (`CMAKE_MSVC_RUNTIME_LIBRARY "MultiThreaded$<$<CONFIG:Debug>:Debug>"`, or the
  matching Projucer setting).
- **Marketplaces and stores:** each has its own signing and packaging rules
  (Avid for AAX, Apple for App Store and AUv3). Check their current requirements
  before your first submission.

## Build and run

With all the files in place, configure and build from the project folder:

```sh
cmake -B build
cmake --build build
```

The build puts each format in `build/MyPlugin_artefacts/`. The quickest way to
try the plug-in is the `Standalone` format, which runs it as an ordinary app:

| Platform | Run it with |
| -------- | ----------- |
| macOS    | `open "build/MyPlugin_artefacts/Standalone/My Plugin.app"` |
| Linux    | `./build/MyPlugin_artefacts/Standalone/My\ Plugin` |
| Windows  | `"build\MyPlugin_artefacts\Debug\Standalone\My Plugin.exe"` |

In PowerShell, put `&` before the quoted path.

On Windows, the default Visual Studio generator adds the `Debug` folder (build with
`cmake --build build --config Debug`). Makefile and Ninja builds have no such folder.

The `VST3` (and, on macOS, `AU`) bundles are in the sibling folders `VST3/` and
`AU/`. To test them in a host, either set `COPY_PLUGIN_AFTER_BUILD TRUE` so that
they are installed into the user plug-in folders, or point a host such as JUCE's
`AudioPluginHost` (`extras/AudioPluginHost`) at the build folder.

> **No sound?** To avoid a feedback loop, the standalone app mutes the audio input at
> first. Click **Settings** on the banner, or open **Options > Audio/MIDI Settings**,
> and untick **Mute audio input**. Wear headphones first, because laptop speakers can
> howl.

> **"The application cannot be opened because its executable is missing"?**
> CMake creates the empty `.app` bundle at the start of the build and only fills
> in the executable when compiling and linking succeed. If `cmake --build build`
> reported errors, fix them and build again, then re-run `open`. Check that the
> last lines of the build output say `Built target MyPlugin_Standalone`.

> **"use of undeclared identifier 'juce'"?** CMake projects have no
> `JuceHeader.h`, so every source file must include the module headers it uses.
> `PluginProcessor.h` includes them, and the other files include that header.

## Sources

Condensed from the JUCE tutorials *Create a basic Audio/MIDI plugin* (Parts 1 and
2), *Plugin examples*, *Configuring the right bus layouts for your plugins*, and
*Package your app or plugin for distribution*, Copyright (c) Raw Material Software
Limited, ISC licence. See [NOTICE.md](NOTICE.md).
