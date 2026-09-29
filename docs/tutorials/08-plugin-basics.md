# Audio plug-in basics: structure, MIDI, buses, and distribution

Create an audio or MIDI plug-in, understand its two halves, process MIDI and
audio, describe its channel layout, and package it for users.

**Level:** Beginner to intermediate  
**Formats:** VST3, AU, AUv3, AAX, LV2, Unity, and Standalone (JUCE also builds
legacy VST2 if you already hold the SDK)

## Create the project

Start from [`examples/CMake/AudioPlugin`](../../examples/CMake/AudioPlugin), which
contains a complete `CMakeLists.txt`, processor, and editor. The core of the build
file is:

```cmake
juce_add_plugin(MyPlugin
    PLUGIN_MANUFACTURER_CODE Manu     # 4 characters, at least one upper-case
    PLUGIN_CODE Test                  # unique, 4 characters, exactly one upper-case
    FORMATS VST3 AU Standalone
    PRODUCT_NAME "My Plugin"
    IS_SYNTH FALSE                    # TRUE for instruments
    NEEDS_MIDI_INPUT FALSE            # TRUE if it must receive MIDI
    IS_MIDI_EFFECT FALSE              # TRUE for MIDI-only processors
    COPY_PLUGIN_AFTER_BUILD TRUE)     # install into the user plug-in folders after building

target_sources(MyPlugin PRIVATE PluginProcessor.cpp PluginEditor.cpp)
target_link_libraries(MyPlugin PRIVATE juce::juce_audio_utils
                               PUBLIC  juce::juce_recommended_config_flags)
```

Build, then test in a host. JUCE ships an **Audio Plug-In Host**
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
    explicit MyEditor (MyProcessor& p) : AudioProcessorEditor (&p), processor (p)
    {
        setSize (300, 200);
    }

    void paint (juce::Graphics& g) override { g.fillAll (juce::Colours::black); }
    void resized() override {}

private:
    MyProcessor& processor;
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

## Sources

Condensed from the JUCE tutorials *Create a basic Audio/MIDI plugin* (Parts 1 and
2), *Plugin examples*, *Configuring the right bus layouts for your plugins*, and
*Package your app or plugin for distribution*, Copyright (c) Raw Material Software
Limited, ISC licence. See [NOTICE.md](NOTICE.md).
