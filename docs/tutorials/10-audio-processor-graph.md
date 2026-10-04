# Cascading effects with `AudioProcessorGraph`

Chain several processors, built-in or third-party, into a channel strip or any
routing you like.

**Level:** Advanced  
**Prerequisites:** [Audio plug-in basics](08-plugin-basics.md) and
[Plug-in parameters and state](09-plugin-parameters.md)

Link `juce::juce_audio_utils` and `juce::juce_dsp`.

## Set up the project

The project below is a complete three-slot channel strip. The listings in the sections that follow are its parts, so you can read them in context or type them in as you go.

This guide builds on [Audio plug-in basics](08-plugin-basics.md). Make a copy of the
`MyPlugin` folder from that tutorial, **without** its `build` folder, and name the
copy `ChannelStrip`. Then replace its contents so that it holds these files (delete
any file from tutorial 8 that is not listed):

```text
ChannelStrip/
├── CMakeLists.txt        # the build configuration
├── PluginProcessor.h     # the processor: audio, MIDI, state
└── PluginProcessor.cpp   # the processor implementation and plug-in entry point
```

Replace `/path/to/JUCE` in `CMakeLists.txt` with the folder you cloned JUCE into.

**`CMakeLists.txt`**

```cmake
cmake_minimum_required(VERSION 3.22)
project(CHANNELSTRIP VERSION 0.0.1)

add_subdirectory(/path/to/JUCE JUCE)   # or find_package (JUCE CONFIG REQUIRED)

juce_add_plugin(ChannelStrip
    PLUGIN_MANUFACTURER_CODE Manu     # 4 characters, at least one upper-case
    PLUGIN_CODE Chst                  # unique, 4 characters, exactly one upper-case
    FORMATS VST3 AU Standalone        # formats not available on your platform are skipped
    PRODUCT_NAME "Channel Strip"
    IS_SYNTH FALSE                    # TRUE for instruments
    NEEDS_MIDI_INPUT TRUE             # TRUE if it must receive MIDI
    NEEDS_MIDI_OUTPUT TRUE            # TRUE because it forwards MIDI to the host
    IS_MIDI_EFFECT FALSE              # TRUE for MIDI-only processors
    MICROPHONE_PERMISSION_ENABLED TRUE  # the Standalone app opens the audio input
    COPY_PLUGIN_AFTER_BUILD FALSE)

target_sources(ChannelStrip PRIVATE PluginProcessor.cpp)

target_compile_definitions(ChannelStrip PUBLIC
    JUCE_WEB_BROWSER=0
    JUCE_USE_CURL=0
    JUCE_VST3_CAN_REPLACE_VST2=0)

target_link_libraries(ChannelStrip
    PRIVATE juce::juce_audio_utils
            juce::juce_dsp
    PUBLIC  juce::juce_recommended_config_flags
            juce::juce_recommended_warning_flags)
```

**`PluginProcessor.h`**

```cpp
#pragma once

#include <juce_audio_utils/juce_audio_utils.h>
#include <juce_dsp/juce_dsp.h>

//==============================================================================
// Small utility processors share a base class that fills in the boilerplate
class ProcessorBase : public juce::AudioProcessor
{
public:
    using AudioProcessor::processBlock;   // keep the double-precision overload visible
    ProcessorBase()
        : AudioProcessor (BusesProperties()
                            .withInput  ("Input",  juce::AudioChannelSet::stereo())
                            .withOutput ("Output", juce::AudioChannelSet::stereo())) {}

    void prepareToPlay (double, int) override {}
    void releaseResources() override {}
    void processBlock (juce::AudioBuffer<float>&, juce::MidiBuffer&) override {}

    juce::AudioProcessorEditor* createEditor() override { return nullptr; }
    bool hasEditor() const override                     { return false; }

    const juce::String getName() const override         { return {}; }
    bool acceptsMidi() const override                   { return false; }
    bool producesMidi() const override                  { return false; }
    double getTailLengthSeconds() const override        { return 0; }

    int getNumPrograms() override                       { return 0; }
    int getCurrentProgram() override                    { return 0; }
    void setCurrentProgram (int) override               {}
    const juce::String getProgramName (int) override    { return {}; }
    void changeProgramName (int, const juce::String&) override {}

    void getStateInformation (juce::MemoryBlock&) override {}
    void setStateInformation (const void*, int) override {}
};

class GainProcessor final : public ProcessorBase
{
public:
    using AudioProcessor::processBlock;   // keep the double-precision overload visible
    GainProcessor() { gain.setGainDecibels (-6.0f); }

    void prepareToPlay (double sampleRate, int samplesPerBlock) override
    {
        gain.prepare ({ sampleRate, (juce::uint32) samplesPerBlock, 2 });
    }

    void processBlock (juce::AudioBuffer<float>& buffer, juce::MidiBuffer&) override
    {
        juce::dsp::AudioBlock<float> block (buffer);
        gain.process (juce::dsp::ProcessContextReplacing<float> (block));
    }

    void reset() override { gain.reset(); }
    const juce::String getName() const override { return "Gain"; }

private:
    juce::dsp::Gain<float> gain;
};

class OscillatorProcessor final : public ProcessorBase
{
public:
    using AudioProcessor::processBlock;   // keep the double-precision overload visible
    OscillatorProcessor()
    {
        osc.setFrequency (440.0f);
        osc.initialise ([] (float x) { return std::sin (x); });
    }

    void prepareToPlay (double sampleRate, int samplesPerBlock) override
    {
        osc.prepare ({ sampleRate, (juce::uint32) samplesPerBlock, 2 });
    }

    void processBlock (juce::AudioBuffer<float>& buffer, juce::MidiBuffer&) override
    {
        juce::dsp::AudioBlock<float> block (buffer);
        osc.process (juce::dsp::ProcessContextReplacing<float> (block));
    }

    void reset() override { osc.reset(); }
    const juce::String getName() const override { return "Oscillator"; }

private:
    juce::dsp::Oscillator<float> osc;
};

class FilterProcessor final : public ProcessorBase
{
public:
    using AudioProcessor::processBlock;   // keep the double-precision overload visible
    void prepareToPlay (double sampleRate, int samplesPerBlock) override
    {
        *filter.state = *juce::dsp::IIR::Coefficients<float>::makeHighPass (sampleRate, 1000.0f);
        filter.prepare ({ sampleRate, (juce::uint32) samplesPerBlock, 2 });
    }

    void processBlock (juce::AudioBuffer<float>& buffer, juce::MidiBuffer&) override
    {
        juce::dsp::AudioBlock<float> block (buffer);
        filter.process (juce::dsp::ProcessContextReplacing<float> (block));
    }

    void reset() override { filter.reset(); }
    const juce::String getName() const override { return "Filter"; }

private:
    juce::dsp::ProcessorDuplicator<juce::dsp::IIR::Filter<float>,
                                   juce::dsp::IIR::Coefficients<float>> filter;
};

//==============================================================================
// The hosting plug-in: owns the graph and rebuilds it when the slots change
class ChannelStrip final : public juce::AudioProcessor,
                           private juce::Timer
{
public:
    using IOProcessor = juce::AudioProcessorGraph::AudioGraphIOProcessor;
    using Node        = juce::AudioProcessorGraph::Node;

    ChannelStrip();
    ~ChannelStrip() override;

    bool isBusesLayoutSupported (const BusesLayout&) const override;

    void prepareToPlay (double sampleRate, int samplesPerBlock) override;
    void releaseResources() override;
    void processBlock (juce::AudioBuffer<float>&, juce::MidiBuffer&) override;
    using AudioProcessor::processBlock;

    juce::AudioProcessorEditor* createEditor() override;
    bool hasEditor() const override                     { return true; }

    const juce::String getName() const override         { return "Channel Strip"; }
    bool acceptsMidi() const override                   { return true; }
    bool producesMidi() const override                  { return true; }
    double getTailLengthSeconds() const override        { return 0.0; }

    int getNumPrograms() override                       { return 1; }
    int getCurrentProgram() override                    { return 0; }
    void setCurrentProgram (int) override               {}
    const juce::String getProgramName (int) override    { return {}; }
    void changeProgramName (int, const juce::String&) override {}

    void getStateInformation (juce::MemoryBlock&) override;
    void setStateInformation (const void*, int) override;

private:
    void buildGraph();
    void connectStereo (Node& source, Node& destination);
    std::unique_ptr<juce::AudioProcessor> createProcessor (int choiceIndex);
    bool parametersChanged() const;
    void timerCallback() override;   // message thread

    static inline const juce::StringArray choices { "Empty", "Oscillator", "Gain", "Filter" };

    std::unique_ptr<juce::AudioProcessorGraph> graph;
    juce::AudioParameterChoice* slotParams[3];
    juce::AudioParameterBool*   bypassParams[3];
    Node::Ptr slotNodes[3];                             // touched on the message thread only
    std::atomic<int>  builtChoices[3] { -1, -1, -1 };   // read by the audio thread, so atomic
    std::atomic<bool> builtBypass[3]  { false, false, false };
    Node::Ptr audioIn, audioOut, midiIn, midiOut;

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR (ChannelStrip)
};
```

**`PluginProcessor.cpp`**

```cpp
#include "PluginProcessor.h"

ChannelStrip::ChannelStrip()
    : AudioProcessor (BusesProperties()
                        .withInput  ("Input",  juce::AudioChannelSet::stereo(), true)
                        .withOutput ("Output", juce::AudioChannelSet::stereo(), true)),
      graph (new juce::AudioProcessorGraph()),
      slotParams { new juce::AudioParameterChoice ({ "slot1", 1 }, "Slot 1", choices, 0),
                   new juce::AudioParameterChoice ({ "slot2", 1 }, "Slot 2", choices, 0),
                   new juce::AudioParameterChoice ({ "slot3", 1 }, "Slot 3", choices, 0) },
      bypassParams { new juce::AudioParameterBool ({ "bypass1", 1 }, "Bypass 1", false),
                     new juce::AudioParameterBool ({ "bypass2", 1 }, "Bypass 2", false),
                     new juce::AudioParameterBool ({ "bypass3", 1 }, "Bypass 3", false) }
{
    for (auto* p : slotParams)   addParameter (p);
    for (auto* p : bypassParams) addParameter (p);

    startTimerHz (20);   // polls for slot changes on the message thread
}

ChannelStrip::~ChannelStrip() { stopTimer(); }

bool ChannelStrip::isBusesLayoutSupported (const BusesLayout& l) const
{
    auto in = l.getMainInputChannelSet(), out = l.getMainOutputChannelSet();
    return ! in.isDisabled() && in == out
           && (out == juce::AudioChannelSet::mono() || out == juce::AudioChannelSet::stereo());
}

void ChannelStrip::prepareToPlay (double sampleRate, int samplesPerBlock)
{
    graph->setPlayConfigDetails (getMainBusNumInputChannels(),
                                 getMainBusNumOutputChannels(),
                                 sampleRate, samplesPerBlock);
    graph->prepareToPlay (sampleRate, samplesPerBlock);
    buildGraph();
}

void ChannelStrip::releaseResources() { graph->releaseResources(); }

void ChannelStrip::processBlock (juce::AudioBuffer<float>& buffer, juce::MidiBuffer& midi)
{
    for (int i = getTotalNumInputChannels(); i < getTotalNumOutputChannels(); ++i)
        buffer.clear (i, 0, buffer.getNumSamples());


    graph->processBlock (buffer, midi);
}

void ChannelStrip::buildGraph()
{
    using Update = juce::AudioProcessorGraph::UpdateKind;

    graph->clear (Update::none);   // batch every change below, then publish once with rebuild()

    audioIn  = graph->addNode (std::make_unique<IOProcessor> (IOProcessor::audioInputNode), std::nullopt, Update::none);
    audioOut = graph->addNode (std::make_unique<IOProcessor> (IOProcessor::audioOutputNode), std::nullopt, Update::none);
    midiIn   = graph->addNode (std::make_unique<IOProcessor> (IOProcessor::midiInputNode), std::nullopt, Update::none);
    midiOut  = graph->addNode (std::make_unique<IOProcessor> (IOProcessor::midiOutputNode), std::nullopt, Update::none);

    // MIDI passes straight through
    graph->addConnection ({ { midiIn->nodeID,  juce::AudioProcessorGraph::midiChannelIndex },
                            { midiOut->nodeID, juce::AudioProcessorGraph::midiChannelIndex } },
                           Update::none);

    // Create a node for each chosen slot; empty slots have no node
    for (int i = 0; i < 3; ++i)
    {
        builtChoices[i] = slotParams[i]->getIndex();
        slotNodes[i]    = builtChoices[i] == 0 ? nullptr
                                               : graph->addNode (createProcessor (builtChoices[i]), std::nullopt, Update::none);

        builtBypass[i] = *bypassParams[i];
        if (slotNodes[i] != nullptr)
            slotNodes[i]->setBypassed (builtBypass[i]);   // skips the processor, passes audio through
    }

    // Wire audio input -> each present slot in order -> audio output
    auto* previous = audioIn.get();
    for (auto& slot : slotNodes)
    {
        if (slot == nullptr) continue;
        connectStereo (*previous, *slot);
        previous = slot.get();
    }
    connectStereo (*previous, *audioOut);

    graph->rebuild();   // publish the finished graph in one go
}

void ChannelStrip::connectStereo (Node& source, Node& destination)
{
    for (int channel = 0; channel < 2; ++channel)
        graph->addConnection ({ { source.nodeID, channel }, { destination.nodeID, channel } },
                              juce::AudioProcessorGraph::UpdateKind::none);
}

std::unique_ptr<juce::AudioProcessor> ChannelStrip::createProcessor (int choiceIndex)
{
    switch (choiceIndex)
    {
        case 1: return std::make_unique<OscillatorProcessor>();
        case 2: return std::make_unique<GainProcessor>();
        case 3: return std::make_unique<FilterProcessor>();
        default: return nullptr;
    }
}

bool ChannelStrip::parametersChanged() const           // message thread: compares the parameters with what was built
{
    for (int i = 0; i < 3; ++i)
        if (slotParams[i]->getIndex() != builtChoices[i]
            || (bool) *bypassParams[i] != builtBypass[i])
            return true;

    return false;
}

void ChannelStrip::timerCallback()   // message thread
{
    if (parametersChanged())         // a slot or bypass changed: rebuild
        buildGraph();
}

// A generic editor lists the slot and bypass parameters automatically
juce::AudioProcessorEditor* ChannelStrip::createEditor()
{
    return new juce::GenericAudioProcessorEditor (*this);
}

void ChannelStrip::getStateInformation (juce::MemoryBlock& dest)
{
    juce::XmlElement xml ("ChannelStrip");
    for (int i = 0; i < 3; ++i)
    {
        xml.setAttribute ("slot" + juce::String (i + 1), slotParams[i]->getIndex());
        xml.setAttribute ("bypass" + juce::String (i + 1), (bool) *bypassParams[i]);
    }
    copyXmlToBinary (xml, dest);
}

void ChannelStrip::setStateInformation (const void* data, int size)
{
    if (auto xml = getXmlFromBinary (data, size))
        if (xml->hasTagName ("ChannelStrip"))
            for (int i = 0; i < 3; ++i)
            {
                *slotParams[i]   = xml->getIntAttribute ("slot" + juce::String (i + 1), 0);
                *bypassParams[i] = xml->getBoolAttribute ("bypass" + juce::String (i + 1), false);
            }
}

juce::AudioProcessor* JUCE_CALLTYPE createPluginFilter()
{
    return new ChannelStrip();
}
```

The editor is JUCE's `GenericAudioProcessorEditor`, which builds a slider or
combo box for each parameter, so the three slots and three bypass switches
appear without any GUI code.

## The idea

`AudioProcessorGraph` is itself an `AudioProcessor` that owns a set of *nodes*,
each wrapping another `AudioProcessor`, plus *connections* between their channels.
It works out a processing order and runs the whole network for you. Use it when
the signal path changes at run time (user-selectable effect slots, a modular host)
or when you want to host other plug-ins.

The graph provides four special nodes through `AudioGraphIOProcessor`:

| Type                                   | Represents                                        |
| -------------------------------------- | ------------------------------------------------- |
| `AudioGraphIOProcessor::audioInputNode`  | Audio arriving in the graph's `processBlock()`  |
| `AudioGraphIOProcessor::audioOutputNode` | Audio leaving the graph                         |
| `AudioGraphIOProcessor::midiInputNode`   | MIDI arriving                                   |
| `AudioGraphIOProcessor::midiOutputNode`  | MIDI leaving                                    |

MIDI travels on a connection whose channel index is
`AudioProcessorGraph::midiChannelIndex`. Audio connections use channel numbers.

## A hosting plug-in

The outer processor owns the graph, forwards its lifecycle calls, and calls the
graph's `processBlock()`:

```cpp
class ChannelStrip final : public juce::AudioProcessor,
                           private juce::Timer
{
public:
    using IOProcessor = juce::AudioProcessorGraph::AudioGraphIOProcessor;
    using Node        = juce::AudioProcessorGraph::Node;

    ChannelStrip()
        : AudioProcessor (BusesProperties()
                            .withInput  ("Input",  juce::AudioChannelSet::stereo(), true)
                            .withOutput ("Output", juce::AudioChannelSet::stereo(), true)),
          graph (new juce::AudioProcessorGraph()),
          slotParams { new juce::AudioParameterChoice ({ "slot1", 1 }, "Slot 1", choices, 0),
                       new juce::AudioParameterChoice ({ "slot2", 1 }, "Slot 2", choices, 0),
                       new juce::AudioParameterChoice ({ "slot3", 1 }, "Slot 3", choices, 0) },
          bypassParams { new juce::AudioParameterBool ({ "bypass1", 1 }, "Bypass 1", false),
                         new juce::AudioParameterBool ({ "bypass2", 1 }, "Bypass 2", false),
                         new juce::AudioParameterBool ({ "bypass3", 1 }, "Bypass 3", false) }
    {
        for (auto* p : slotParams)   addParameter (p);
        for (auto* p : bypassParams) addParameter (p);

        startTimerHz (20);   // polls for slot changes on the message thread
    }

    ~ChannelStrip() override { stopTimer(); }

    bool isBusesLayoutSupported (const BusesLayout& l) const override
    {
        auto in = l.getMainInputChannelSet(), out = l.getMainOutputChannelSet();
        return ! in.isDisabled() && in == out
               && (out == juce::AudioChannelSet::mono() || out == juce::AudioChannelSet::stereo());
    }

    void prepareToPlay (double sampleRate, int samplesPerBlock) override
    {
        graph->setPlayConfigDetails (getMainBusNumInputChannels(),
                                     getMainBusNumOutputChannels(),
                                     sampleRate, samplesPerBlock);
        graph->prepareToPlay (sampleRate, samplesPerBlock);
        buildGraph();
    }

    void releaseResources() override { graph->releaseResources(); }

    void processBlock (juce::AudioBuffer<float>& buffer, juce::MidiBuffer& midi) override
    {
        for (int i = getTotalNumInputChannels(); i < getTotalNumOutputChannels(); ++i)
            buffer.clear (i, 0, buffer.getNumSamples());


        graph->processBlock (buffer, midi);
    }

    // ... editor, state, and the remaining AudioProcessor pure virtuals ...

private:
    static inline const juce::StringArray choices { "Empty", "Oscillator", "Gain", "Filter" };

    std::unique_ptr<juce::AudioProcessorGraph> graph;
    juce::AudioParameterChoice* slotParams[3];
    juce::AudioParameterBool*   bypassParams[3];
    Node::Ptr slotNodes[3];                        // touched on the message thread only
    std::atomic<int>  builtChoices[3] { -1, -1, -1 };   // read by the audio thread, so atomic
    std::atomic<bool> builtBypass[3]  { false, false, false };
    Node::Ptr audioIn, audioOut, midiIn, midiOut;
};
```

## Building and rebuilding the graph

Create the I/O nodes, put the selected processors in slots, and connect everything
in series. Rebuilding wholesale on the message thread is simple and safe:

```cpp
void buildGraph()
{
    using Update = juce::AudioProcessorGraph::UpdateKind;

    graph->clear (Update::none);   // batch every change below, then publish once with rebuild()

    audioIn  = graph->addNode (std::make_unique<IOProcessor> (IOProcessor::audioInputNode), std::nullopt, Update::none);
    audioOut = graph->addNode (std::make_unique<IOProcessor> (IOProcessor::audioOutputNode), std::nullopt, Update::none);
    midiIn   = graph->addNode (std::make_unique<IOProcessor> (IOProcessor::midiInputNode), std::nullopt, Update::none);
    midiOut  = graph->addNode (std::make_unique<IOProcessor> (IOProcessor::midiOutputNode), std::nullopt, Update::none);

    // MIDI passes straight through
    graph->addConnection ({ { midiIn->nodeID,  juce::AudioProcessorGraph::midiChannelIndex },
                            { midiOut->nodeID, juce::AudioProcessorGraph::midiChannelIndex } },
                           Update::none);

    // Create a node for each chosen slot; empty slots have no node
    for (int i = 0; i < 3; ++i)
    {
        builtChoices[i] = slotParams[i]->getIndex();
        slotNodes[i]    = builtChoices[i] == 0 ? nullptr
                                               : graph->addNode (createProcessor (builtChoices[i]), std::nullopt, Update::none);

        builtBypass[i] = *bypassParams[i];
        if (slotNodes[i] != nullptr)
            slotNodes[i]->setBypassed (builtBypass[i]);   // skips the processor, passes audio through
    }

    // Wire audio input -> each present slot in order -> audio output
    auto* previous = audioIn.get();
    for (auto& slot : slotNodes)
    {
        if (slot == nullptr) continue;
        connectStereo (*previous, *slot);
        previous = slot.get();
    }
    connectStereo (*previous, *audioOut);

    graph->rebuild();   // publish the finished graph in one go
}

void connectStereo (Node& source, Node& destination)
{
    for (int channel = 0; channel < 2; ++channel)
        graph->addConnection ({ { source.nodeID, channel }, { destination.nodeID, channel } },
                              juce::AudioProcessorGraph::UpdateKind::none);
}

std::unique_ptr<juce::AudioProcessor> createProcessor (int choiceIndex)
{
    switch (choiceIndex)
    {
        case 1: return std::make_unique<OscillatorProcessor>();
        case 2: return std::make_unique<GainProcessor>();
        case 3: return std::make_unique<FilterProcessor>();
        default: return nullptr;
    }
}

bool parametersChanged() const           // message thread: compares the parameters with what was built
{
    for (int i = 0; i < 3; ++i)
        if (slotParams[i]->getIndex() != builtChoices[i]
            || (bool) *bypassParams[i] != builtBypass[i])
            return true;

    return false;
}

void timerCallback() override           // message thread
{
    if (parametersChanged())            // a slot or bypass changed: rebuild
        buildGraph();
}
```

Notes on this design:

- Changing the graph (`addNode`, `addConnection`, `removeNode`, `clear`) is allowed
  while audio is running; the graph rebuilds its render sequence and swaps it in
  safely. Do it on the message thread, never inside `processBlock()`. That is why
  a message-thread `Timer` polls for changes in the code above, rather than the
  audio callback requesting an update: `AsyncUpdater::triggerAsyncUpdate()` posts to
  the system message queue, which can block on some platforms and cause dropouts.
- Every mutation passes `UpdateKind::none`, and `buildGraph()` ends with one
  `rebuild()`. With the default (`UpdateKind::sync`), `clear()`, each `addNode()`,
  and each connection would publish a new render sequence, so the audio thread
  could run an empty or half-connected graph. (`UpdateKind::async` batches changes
  made in one call stack too.)
- `Node::setBypassed()` skips the processor and passes its input through. Use it
  for bypass switches rather than removing nodes. Here it is applied inside the
  same message-thread rebuild, so the audio thread never touches the node
  pointers. (Only the timer, on the message thread, compares parameters with the
  atomics and triggers the rebuild.)
- Any `AudioProcessor` can be a node, including instances of other plug-ins
  created through `AudioPluginFormatManager` (see `extras/AudioPluginHost`, a
  complete node-graph plug-in host).
- The graph is an `AudioProcessor`, so it also supports `getStateInformation()`
  and multiple buses. `setPlayConfigDetails()` must match your bus layout *before*
  `prepareToPlay()`.
- Each `Node` has a stable `nodeID`, which you keep in your saved state if the user
  can arrange nodes freely.

## Writing the node processors

Small utility processors share a base class that fills in the boilerplate, so each
node only implements what it uses:

```cpp
class ProcessorBase : public juce::AudioProcessor
{
public:
    using AudioProcessor::processBlock;   // keep the double-precision overload visible
    ProcessorBase()
        : AudioProcessor (BusesProperties()
                            .withInput  ("Input",  juce::AudioChannelSet::stereo())
                            .withOutput ("Output", juce::AudioChannelSet::stereo())) {}

    void prepareToPlay (double, int) override {}
    void releaseResources() override {}
    void processBlock (juce::AudioBuffer<float>&, juce::MidiBuffer&) override {}

    juce::AudioProcessorEditor* createEditor() override { return nullptr; }
    bool hasEditor() const override                     { return false; }

    const juce::String getName() const override         { return {}; }
    bool acceptsMidi() const override                   { return false; }
    bool producesMidi() const override                  { return false; }
    double getTailLengthSeconds() const override        { return 0; }

    int getNumPrograms() override                       { return 0; }
    int getCurrentProgram() override                    { return 0; }
    void setCurrentProgram (int) override               {}
    const juce::String getProgramName (int) override    { return {}; }
    void changeProgramName (int, const juce::String&) override {}

    void getStateInformation (juce::MemoryBlock&) override {}
    void setStateInformation (const void*, int) override {}
};
```

Each derived node wraps a `juce::dsp` processor (see
[DSP: filters, delays, convolution, and FFT](11-dsp.md)):

```cpp
class GainProcessor final : public ProcessorBase
{
public:
    using AudioProcessor::processBlock;   // keep the double-precision overload visible
    GainProcessor() { gain.setGainDecibels (-6.0f); }

    void prepareToPlay (double sampleRate, int samplesPerBlock) override
    {
        gain.prepare ({ sampleRate, (juce::uint32) samplesPerBlock, 2 });
    }

    void processBlock (juce::AudioBuffer<float>& buffer, juce::MidiBuffer&) override
    {
        juce::dsp::AudioBlock<float> block (buffer);
        gain.process (juce::dsp::ProcessContextReplacing<float> (block));
    }

    void reset() override { gain.reset(); }
    const juce::String getName() const override { return "Gain"; }

private:
    juce::dsp::Gain<float> gain;
};

class OscillatorProcessor final : public ProcessorBase
{
public:
    using AudioProcessor::processBlock;   // keep the double-precision overload visible
    OscillatorProcessor()
    {
        osc.setFrequency (440.0f);
        osc.initialise ([] (float x) { return std::sin (x); });
    }

    void prepareToPlay (double sampleRate, int samplesPerBlock) override
    {
        osc.prepare ({ sampleRate, (juce::uint32) samplesPerBlock, 2 });
    }

    void processBlock (juce::AudioBuffer<float>& buffer, juce::MidiBuffer&) override
    {
        juce::dsp::AudioBlock<float> block (buffer);
        osc.process (juce::dsp::ProcessContextReplacing<float> (block));
    }

    void reset() override { osc.reset(); }
    const juce::String getName() const override { return "Oscillator"; }

private:
    juce::dsp::Oscillator<float> osc;
};

class FilterProcessor final : public ProcessorBase
{
public:
    using AudioProcessor::processBlock;   // keep the double-precision overload visible
    void prepareToPlay (double sampleRate, int samplesPerBlock) override
    {
        *filter.state = *juce::dsp::IIR::Coefficients<float>::makeHighPass (sampleRate, 1000.0f);
        filter.prepare ({ sampleRate, (juce::uint32) samplesPerBlock, 2 });
    }

    void processBlock (juce::AudioBuffer<float>& buffer, juce::MidiBuffer&) override
    {
        juce::dsp::AudioBlock<float> block (buffer);
        filter.process (juce::dsp::ProcessContextReplacing<float> (block));
    }

    void reset() override { filter.reset(); }
    const juce::String getName() const override { return "Filter"; }

private:
    juce::dsp::ProcessorDuplicator<juce::dsp::IIR::Filter<float>,
                                   juce::dsp::IIR::Coefficients<float>> filter;
};
```

The oscillator node ignores its input and writes a tone (it generates rather than
processes), so an oscillator in slot 1 *replaces* the incoming signal. To mix a
generator with the input you would give the graph a parallel branch and a summing
node.

## Build and run

With all the files in place, configure and build from the project folder:

```sh
cmake -B build
cmake --build build
```

The build puts each format in `build/ChannelStrip_artefacts/`. The quickest way to
try the plug-in is the `Standalone` format, which runs it as an ordinary app:

| Platform | Run it with |
| -------- | ----------- |
| macOS    | `open "build/ChannelStrip_artefacts/Standalone/Channel Strip.app"` |
| Linux    | `./build/ChannelStrip_artefacts/Standalone/Channel\ Strip` |
| Windows  | `build\ChannelStrip_artefacts\Debug\Standalone\Channel Strip.exe` |

On Windows, the default Visual Studio generator adds the `Debug` folder (build with
`cmake --build build --config Debug`). Makefile and Ninja builds have no such folder.

The `VST3` (and, on macOS, `AU`) bundles are in the sibling folders `VST3/` and
`AU/`. To test them in a host, either set `COPY_PLUGIN_AFTER_BUILD TRUE` so that
they are installed into the user plug-in folders, or point a host such as JUCE's
`AudioPluginHost` (`extras/AudioPluginHost`) at the build folder.

> **Hearing feedback?** The standalone app routes the audio input to the output,
> which on laptop speakers can howl. Use headphones, or mute the input in the
> window's **Options > Audio/MIDI Settings** dialogue.

> **"The application cannot be opened because its executable is missing"?**
> CMake creates the empty `.app` bundle at the start of the build and only fills
> in the executable when compiling and linking succeed. If `cmake --build build`
> reported errors, fix them and build again, then re-run `open`. Check that the
> last lines of the build output say `Built target ChannelStrip_Standalone`.

> **"use of undeclared identifier 'juce'"?** CMake projects have no
> `JuceHeader.h`, so every source file must include the module headers it uses.
> `PluginProcessor.h` includes them, and the other files include that header.

## Sources

Condensed from the JUCE tutorial *Cascading plug-in effects*, Copyright (c) Raw
Material Software Limited, ISC licence. See [NOTICE.md](NOTICE.md).
