# Cascading effects with `AudioProcessorGraph`

Chain several processors, built-in or third-party, into a channel strip or any
routing you like.

**Level:** Advanced  
**Prerequisites:** [Audio plug-in basics](08-plugin-basics.md) and
[Plug-in parameters and state](09-plugin-parameters.md)

Link `juce::juce_audio_utils` and `juce::juce_dsp`.

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
                           private juce::AsyncUpdater
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
    }

    ~ChannelStrip() override { cancelPendingUpdate(); }

    bool isBusesLayoutSupported (const BusesLayout& l) const override
    {
        auto in = l.getMainInputChannelSet(), out = l.getMainOutputChannelSet();
        return ! in.isDisabled() && in == out
               && (out == juce::AudioChannelSet::mono() || out == juce::AudioChannelSet::stereo());
    }

    void prepareToPlay (double sampleRate, int blockSize) override
    {
        graph->setPlayConfigDetails (getMainBusNumInputChannels(),
                                     getMainBusNumOutputChannels(),
                                     sampleRate, blockSize);
        graph->prepareToPlay (sampleRate, blockSize);
        buildGraph();
    }

    void releaseResources() override { graph->releaseResources(); }

    void processBlock (juce::AudioBuffer<float>& buffer, juce::MidiBuffer& midi) override
    {
        for (int i = getTotalNumInputChannels(); i < getTotalNumOutputChannels(); ++i)
            buffer.clear (i, 0, buffer.getNumSamples());

        if (parametersChanged())           // a slot or bypass changed: update off the audio thread
            triggerAsyncUpdate();

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
    graph->clear();

    audioIn  = graph->addNode (std::make_unique<IOProcessor> (IOProcessor::audioInputNode));
    audioOut = graph->addNode (std::make_unique<IOProcessor> (IOProcessor::audioOutputNode));
    midiIn   = graph->addNode (std::make_unique<IOProcessor> (IOProcessor::midiInputNode));
    midiOut  = graph->addNode (std::make_unique<IOProcessor> (IOProcessor::midiOutputNode));

    // MIDI passes straight through
    graph->addConnection ({ { midiIn->nodeID,  juce::AudioProcessorGraph::midiChannelIndex },
                            { midiOut->nodeID, juce::AudioProcessorGraph::midiChannelIndex } });

    // Create a node for each chosen slot; empty slots have no node
    for (int i = 0; i < 3; ++i)
    {
        builtChoices[i] = slotParams[i]->getIndex();
        slotNodes[i]    = builtChoices[i] == 0 ? nullptr
                                               : graph->addNode (createProcessor (builtChoices[i]));

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
}

void connectStereo (Node& source, Node& destination)
{
    for (int channel = 0; channel < 2; ++channel)
        graph->addConnection ({ { source.nodeID, channel }, { destination.nodeID, channel } });
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

bool parametersChanged() const           // audio thread: reads only atomics
{
    for (int i = 0; i < 3; ++i)
        if (slotParams[i]->getIndex() != builtChoices[i]
            || (bool) *bypassParams[i] != builtBypass[i])
            return true;

    return false;
}

void handleAsyncUpdate() override { buildGraph(); }   // message thread
```

Notes on this design:

- Changing the graph (`addNode`, `addConnection`, `removeNode`, `clear`) is allowed
  while audio is running; the graph rebuilds its render sequence and swaps it in
  safely. Do it on the message thread, never inside `processBlock()`. That is why
  the code above only *requests* an update from the audio callback with
  `AsyncUpdater`. (Update several parts of the graph together with
  `UpdateKind::async`, or `UpdateKind::none` followed by `rebuild()`.)
- `Node::setBypassed()` skips the processor and passes its input through. Use it
  for bypass switches rather than removing nodes. Here it is applied inside the
  same message-thread rebuild, so the audio thread never touches the node
  pointers. (The audio callback only *compares* parameters with atomics, then
  triggers the update.)
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
    GainProcessor() { gain.setGainDecibels (-6.0f); }

    void prepareToPlay (double sampleRate, int blockSize) override
    {
        gain.prepare ({ sampleRate, (juce::uint32) blockSize, 2 });
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
    OscillatorProcessor()
    {
        osc.setFrequency (440.0f);
        osc.initialise ([] (float x) { return std::sin (x); });
    }

    void prepareToPlay (double sampleRate, int blockSize) override
    {
        osc.prepare ({ sampleRate, (juce::uint32) blockSize, 2 });
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
    void prepareToPlay (double sampleRate, int blockSize) override
    {
        *filter.state = *juce::dsp::IIR::Coefficients<float>::makeHighPass (sampleRate, 1000.0f);
        filter.prepare ({ sampleRate, (juce::uint32) blockSize, 2 });
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

## Sources

Condensed from the JUCE tutorial *Cascading plug-in effects*, Copyright (c) Raw
Material Software Limited, ISC licence. See [NOTICE.md](NOTICE.md).
