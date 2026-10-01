import{_ as a,o as i,c as n,a4 as e}from"./chunks/framework.YC5CMuPM.js";const d=JSON.parse('{"title":"Cascading effects with AudioProcessorGraph","description":"","frontmatter":{},"headers":[],"relativePath":"tutorials/10-audio-processor-graph.md","filePath":"tutorials/10-audio-processor-graph.md","lastUpdated":null}'),C={name:"tutorials/10-audio-processor-graph.md"};function l(p,s,t,h,r,o){return i(),n("div",null,[...s[0]||(s[0]=[e(`<h1 id="cascading-effects-with-audioprocessorgraph" tabindex="-1">Cascading effects with <code>AudioProcessorGraph</code> <a class="header-anchor" href="#cascading-effects-with-audioprocessorgraph" aria-label="Permalink to &quot;Cascading effects with \`AudioProcessorGraph\`&quot;">​</a></h1><p><strong>Chain several processors, built-in or third-party, into a channel strip or any routing you like.</strong></p><p><strong>Level:</strong> Advanced<br><strong>Prerequisites:</strong> <a href="./08-plugin-basics.html">Audio plug-in basics</a> and <a href="./09-plugin-parameters.html">Plug-in parameters and state</a></p><p>Link <code>juce::juce_audio_utils</code> and <code>juce::juce_dsp</code>.</p><h2 id="the-idea" tabindex="-1">The idea <a class="header-anchor" href="#the-idea" aria-label="Permalink to &quot;The idea&quot;">​</a></h2><p><code>AudioProcessorGraph</code> is itself an <code>AudioProcessor</code> that owns a set of <em>nodes</em>, each wrapping another <code>AudioProcessor</code>, plus <em>connections</em> between their channels. It works out a processing order and runs the whole network for you. Use it when the signal path changes at run time (user-selectable effect slots, a modular host) or when you want to host other plug-ins.</p><p>The graph provides four special nodes through <code>AudioGraphIOProcessor</code>:</p><table tabindex="0"><thead><tr><th>Type</th><th>Represents</th></tr></thead><tbody><tr><td><code>AudioGraphIOProcessor::audioInputNode</code></td><td>Audio arriving in the graph&#39;s <code>processBlock()</code></td></tr><tr><td><code>AudioGraphIOProcessor::audioOutputNode</code></td><td>Audio leaving the graph</td></tr><tr><td><code>AudioGraphIOProcessor::midiInputNode</code></td><td>MIDI arriving</td></tr><tr><td><code>AudioGraphIOProcessor::midiOutputNode</code></td><td>MIDI leaving</td></tr></tbody></table><p>MIDI travels on a connection whose channel index is <code>AudioProcessorGraph::midiChannelIndex</code>. Audio connections use channel numbers.</p><h2 id="a-hosting-plug-in" tabindex="-1">A hosting plug-in <a class="header-anchor" href="#a-hosting-plug-in" aria-label="Permalink to &quot;A hosting plug-in&quot;">​</a></h2><p>The outer processor owns the graph, forwards its lifecycle calls, and calls the graph&#39;s <code>processBlock()</code>:</p><div class="language-cpp vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">cpp</span><pre class="shiki shiki-themes flexoki flexoki vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">class ChannelStrip final : public juce::AudioProcessor,</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">                           private juce::AsyncUpdater</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">{</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">public:</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    using IOProcessor = juce::AudioProcessorGraph::AudioGraphIOProcessor;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    using Node        = juce::AudioProcessorGraph::Node;</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    ChannelStrip()</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        : AudioProcessor (BusesProperties()</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">                            .withInput  (&quot;Input&quot;,  juce::AudioChannelSet::stereo(), true)</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">                            .withOutput (&quot;Output&quot;, juce::AudioChannelSet::stereo(), true)),</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">          graph (new juce::AudioProcessorGraph()),</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">          slotParams { new juce::AudioParameterChoice ({ </span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">&quot;slot1&quot;</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">, 1 }, </span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">&quot;Slot 1&quot;</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">, choices, 0),</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">                       new juce::AudioParameterChoice ({ </span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">&quot;slot2&quot;</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">, 1 }, </span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">&quot;Slot 2&quot;</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">, choices, 0),</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">                       new juce::AudioParameterChoice ({ </span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">&quot;slot3&quot;</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">, 1 }, </span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">&quot;Slot 3&quot;</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">, choices, 0) },</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">          bypassParams { new juce::AudioParameterBool ({ </span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">&quot;bypass1&quot;</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">, 1 }, </span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">&quot;Bypass 1&quot;</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">, false),</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">                         new juce::AudioParameterBool ({ </span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">&quot;bypass2&quot;</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">, 1 }, </span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">&quot;Bypass 2&quot;</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">, false),</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">                         new juce::AudioParameterBool ({ </span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">&quot;bypass3&quot;</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">, 1 }, </span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">&quot;Bypass 3&quot;</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">, false) }</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    {</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        for (auto* p : slotParams)   addParameter (p);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        for (auto* p : bypassParams) addParameter (p);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    }</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    ~ChannelStrip() override { cancelPendingUpdate(); }</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    bool isBusesLayoutSupported (const BusesLayout&amp; l) const override</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    {</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        auto in = l.getMainInputChannelSet(), out = l.getMainOutputChannelSet();</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        return ! in.isDisabled() &amp;&amp; in == out</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">               &amp;&amp; (out == juce::AudioChannelSet::mono() || out == juce::AudioChannelSet::stereo());</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    }</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    void prepareToPlay (double sampleRate, int blockSize) override</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    {</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        graph-&gt;setPlayConfigDetails (getMainBusNumInputChannels(),</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">                                     getMainBusNumOutputChannels(),</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">                                     sampleRate, blockSize);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        graph-&gt;prepareToPlay (sampleRate, blockSize);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        buildGraph();</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    }</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    void releaseResources() override { graph-&gt;releaseResources(); }</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    void processBlock (juce::AudioBuffer&lt;float&gt;&amp; buffer, juce::MidiBuffer&amp; midi) override</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    {</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        for (int i = getTotalNumInputChannels(); i &lt; getTotalNumOutputChannels(); ++i)</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">            buffer.clear (i, 0, buffer.getNumSamples());</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        if (parametersChanged())</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">           // a slot or bypass changed: update off the audio thread</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">            triggerAsyncUpdate();</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        graph-&gt;processBlock (buffer, midi);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    }</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    // ... editor, state, and the remaining AudioProcessor pure virtuals ...</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">private:</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    static inline const juce::StringArray choices { </span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">&quot;Empty&quot;</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">, </span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">&quot;Oscillator&quot;</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">, </span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">&quot;Gain&quot;</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">, </span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">&quot;Filter&quot;</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"> };</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    std::unique_ptr&lt;juce::AudioProcessorGraph&gt; graph;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    juce::AudioParameterChoice* slotParams[3];</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    juce::AudioParameterBool*   bypassParams[3];</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    Node::Ptr slotNodes[3];</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">                        // touched on the message thread only</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    std::atomic&lt;int&gt;  builtChoices[3] { -1, -1, -1 };</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">   // read by the audio thread, so atomic</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    std::atomic&lt;bool&gt; builtBypass[3]  { false, false, false };</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    Node::Ptr audioIn, audioOut, midiIn, midiOut;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">};</span></span></code></pre></div><h2 id="building-and-rebuilding-the-graph" tabindex="-1">Building and rebuilding the graph <a class="header-anchor" href="#building-and-rebuilding-the-graph" aria-label="Permalink to &quot;Building and rebuilding the graph&quot;">​</a></h2><p>Create the I/O nodes, put the selected processors in slots, and connect everything in series. Rebuilding wholesale on the message thread is simple and safe:</p><div class="language-cpp vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">cpp</span><pre class="shiki shiki-themes flexoki flexoki vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">void buildGraph()</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">{</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    graph-&gt;clear();</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    audioIn  = graph-&gt;addNode (std::make_unique&lt;IOProcessor&gt; (IOProcessor::audioInputNode));</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    audioOut = graph-&gt;addNode (std::make_unique&lt;IOProcessor&gt; (IOProcessor::audioOutputNode));</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    midiIn   = graph-&gt;addNode (std::make_unique&lt;IOProcessor&gt; (IOProcessor::midiInputNode));</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    midiOut  = graph-&gt;addNode (std::make_unique&lt;IOProcessor&gt; (IOProcessor::midiOutputNode));</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    // MIDI passes straight through</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    graph-&gt;addConnection ({ { midiIn-&gt;nodeID,  juce::AudioProcessorGraph::midiChannelIndex },</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">                            { midiOut-&gt;nodeID, juce::AudioProcessorGraph::midiChannelIndex } });</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    // Create a node for each chosen slot; empty slots have no node</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    for (int i = 0; i &lt; 3; ++i)</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    {</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        builtChoices[i] = slotParams[i]-&gt;getIndex();</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        slotNodes[i]    = builtChoices[i] == 0 ? nullptr</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">                                               : graph-&gt;addNode (createProcessor (builtChoices[i]));</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        builtBypass[i] = *bypassParams[i];</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        if (slotNodes[i] != nullptr)</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">            slotNodes[i]-&gt;setBypassed (builtBypass[i]);</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">   // skips the processor, passes audio through</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    }</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    // Wire audio input -&gt; each present slot in order -&gt; audio output</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    auto* previous = audioIn.get();</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    for (auto&amp; slot : slotNodes)</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    {</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        if (slot == nullptr) continue;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        connectStereo (*previous, *slot);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        previous = slot.get();</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    }</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    connectStereo (*previous, *audioOut);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">}</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">void connectStereo (Node&amp; source, Node&amp; destination)</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">{</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    for (int channel = 0; channel &lt; 2; ++channel)</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        graph-&gt;addConnection ({ { source.nodeID, channel }, { destination.nodeID, channel } });</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">}</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">std::unique_ptr&lt;juce::AudioProcessor&gt; createProcessor (int choiceIndex)</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">{</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    switch (choiceIndex)</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    {</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        case 1: return std::make_unique&lt;OscillatorProcessor&gt;();</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        case 2: return std::make_unique&lt;GainProcessor&gt;();</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        case 3: return std::make_unique&lt;FilterProcessor&gt;();</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        default: return nullptr;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    }</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">}</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">bool parametersChanged() const</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">           // audio thread: reads only atomics</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">{</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    for (int i = 0; i &lt; 3; ++i)</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        if (slotParams[i]-&gt;getIndex() != builtChoices[i]</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">            || (bool) *bypassParams[i] != builtBypass[i])</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">            return true;</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    return false;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">}</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">void handleAsyncUpdate() override { buildGraph(); }</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">   // message thread</span></span></code></pre></div><p>Notes on this design:</p><ul><li>Changing the graph (<code>addNode</code>, <code>addConnection</code>, <code>removeNode</code>, <code>clear</code>) is allowed while audio is running; the graph rebuilds its render sequence and swaps it in safely. Do it on the message thread, never inside <code>processBlock()</code>. That is why the code above only <em>requests</em> an update from the audio callback with <code>AsyncUpdater</code>. (Update several parts of the graph together with <code>UpdateKind::async</code>, or <code>UpdateKind::none</code> followed by <code>rebuild()</code>.)</li><li><code>Node::setBypassed()</code> skips the processor and passes its input through. Use it for bypass switches rather than removing nodes. Here it is applied inside the same message-thread rebuild, so the audio thread never touches the node pointers. (The audio callback only <em>compares</em> parameters with atomics, then triggers the update.)</li><li>Any <code>AudioProcessor</code> can be a node, including instances of other plug-ins created through <code>AudioPluginFormatManager</code> (see <code>extras/AudioPluginHost</code>, a complete node-graph plug-in host).</li><li>The graph is an <code>AudioProcessor</code>, so it also supports <code>getStateInformation()</code> and multiple buses. <code>setPlayConfigDetails()</code> must match your bus layout <em>before</em><code>prepareToPlay()</code>.</li><li>Each <code>Node</code> has a stable <code>nodeID</code>, which you keep in your saved state if the user can arrange nodes freely.</li></ul><h2 id="writing-the-node-processors" tabindex="-1">Writing the node processors <a class="header-anchor" href="#writing-the-node-processors" aria-label="Permalink to &quot;Writing the node processors&quot;">​</a></h2><p>Small utility processors share a base class that fills in the boilerplate, so each node only implements what it uses:</p><div class="language-cpp vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">cpp</span><pre class="shiki shiki-themes flexoki flexoki vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">class ProcessorBase : public juce::AudioProcessor</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">{</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">public:</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    ProcessorBase()</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        : AudioProcessor (BusesProperties()</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">                            .withInput  (&quot;Input&quot;,  juce::AudioChannelSet::stereo())</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">                            .withOutput (&quot;Output&quot;, juce::AudioChannelSet::stereo())) {}</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    void prepareToPlay (double, int) override {}</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    void releaseResources() override {}</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    void processBlock (juce::AudioBuffer&lt;float&gt;&amp;, juce::MidiBuffer&amp;) override {}</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    juce::AudioProcessorEditor* createEditor() override { return nullptr; }</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    bool hasEditor() const override                     { return false; }</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    const juce::String getName() const override         { return {}; }</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    bool acceptsMidi() const override                   { return false; }</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    bool producesMidi() const override                  { return false; }</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    double getTailLengthSeconds() const override        { return 0; }</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    int getNumPrograms() override                       { return 0; }</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    int getCurrentProgram() override                    { return 0; }</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    void setCurrentProgram (int) override               {}</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    const juce::String getProgramName (int) override    { return {}; }</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    void changeProgramName (int, const juce::String&amp;) override {}</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    void getStateInformation (juce::MemoryBlock&amp;) override {}</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    void setStateInformation (const void*, int) override {}</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">};</span></span></code></pre></div><p>Each derived node wraps a <code>juce::dsp</code> processor (see <a href="./11-dsp.html">DSP: filters, delays, convolution, and FFT</a>):</p><div class="language-cpp vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">cpp</span><pre class="shiki shiki-themes flexoki flexoki vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">class GainProcessor final : public ProcessorBase</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">{</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">public:</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    GainProcessor() { gain.setGainDecibels (-6.0f); }</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    void prepareToPlay (double sampleRate, int blockSize) override</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    {</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        gain.prepare ({ sampleRate, (juce::uint32) blockSize, 2 });</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    }</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    void processBlock (juce::AudioBuffer&lt;float&gt;&amp; buffer, juce::MidiBuffer&amp;) override</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    {</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        juce::dsp::AudioBlock&lt;float&gt; block (buffer);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        gain.process (juce::dsp::ProcessContextReplacing&lt;float&gt; (block));</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    }</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    void reset() override { gain.reset(); }</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    const juce::String getName() const override { return </span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">&quot;Gain&quot;</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">; }</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">private:</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    juce::dsp::Gain&lt;float&gt; gain;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">};</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">class OscillatorProcessor final : public ProcessorBase</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">{</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">public:</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    OscillatorProcessor()</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    {</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        osc.setFrequency (440.0f);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        osc.initialise ([] (float x) { return std::sin (x); });</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    }</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    void prepareToPlay (double sampleRate, int blockSize) override</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    {</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        osc.prepare ({ sampleRate, (juce::uint32) blockSize, 2 });</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    }</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    void processBlock (juce::AudioBuffer&lt;float&gt;&amp; buffer, juce::MidiBuffer&amp;) override</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    {</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        juce::dsp::AudioBlock&lt;float&gt; block (buffer);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        osc.process (juce::dsp::ProcessContextReplacing&lt;float&gt; (block));</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    }</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    void reset() override { osc.reset(); }</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    const juce::String getName() const override { return </span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">&quot;Oscillator&quot;</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">; }</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">private:</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    juce::dsp::Oscillator&lt;float&gt; osc;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">};</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">class FilterProcessor final : public ProcessorBase</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">{</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">public:</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    void prepareToPlay (double sampleRate, int blockSize) override</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    {</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        *filter.state = *juce::dsp::IIR::Coefficients&lt;float&gt;::makeHighPass (sampleRate, 1000.0f);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        filter.prepare ({ sampleRate, (juce::uint32) blockSize, 2 });</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    }</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    void processBlock (juce::AudioBuffer&lt;float&gt;&amp; buffer, juce::MidiBuffer&amp;) override</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    {</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        juce::dsp::AudioBlock&lt;float&gt; block (buffer);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        filter.process (juce::dsp::ProcessContextReplacing&lt;float&gt; (block));</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    }</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    void reset() override { filter.reset(); }</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    const juce::String getName() const override { return </span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">&quot;Filter&quot;</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">; }</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">private:</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    juce::dsp::ProcessorDuplicator&lt;juce::dsp::IIR::Filter&lt;float&gt;,</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">                                   juce::dsp::IIR::Coefficients&lt;float&gt;&gt; filter;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">};</span></span></code></pre></div><p>The oscillator node ignores its input and writes a tone (it generates rather than processes), so an oscillator in slot 1 <em>replaces</em> the incoming signal. To mix a generator with the input you would give the graph a parallel branch and a summing node.</p><h2 id="sources" tabindex="-1">Sources <a class="header-anchor" href="#sources" aria-label="Permalink to &quot;Sources&quot;">​</a></h2><p>Condensed from the JUCE tutorial <em>Cascading plug-in effects</em>, Copyright (c) Raw Material Software Limited, ISC licence. See <a href="./notice.html">the attribution notice</a>.</p>`,25)])])}const c=a(C,[["render",l]]);export{d as __pageData,c as default};
