import{_ as a,o as i,c as n,a4 as C}from"./chunks/framework.YC5CMuPM.js";const c=JSON.parse('{"title":"Arpeggiator","description":"","frontmatter":{"title":"Arpeggiator","outline":false},"headers":[],"relativePath":"examples/arpeggiator.md","filePath":"examples/arpeggiator.md","lastUpdated":null}'),e={name:"examples/arpeggiator.md"};function l(p,s,t,h,r,k){return i(),n("div",null,[...s[0]||(s[0]=[C(`<h1 id="arpeggiator" tabindex="-1">Arpeggiator <a class="header-anchor" href="#arpeggiator" aria-label="Permalink to &quot;Arpeggiator&quot;">​</a></h1><p><strong>A MIDI effect that turns held chords into rhythmic note sequences.</strong></p><ul><li>Rewriting a MidiBuffer in processBlock</li><li>Timing notes from the sample rate</li><li>One AudioParameterFloat for speed</li></ul><p>Source: <a href="https://github.com/juce-framework/JUCE/tree/master/examples/Plugins/ArpeggiatorPluginDemo.h" target="_blank" rel="noreferrer">examples/Plugins/ArpeggiatorPluginDemo.h</a> on GitHub.</p><div class="vp-code-group vp-adaptive-theme"><div class="tabs"><input type="radio" name="group-IcqVe" id="tab-X60p4O7" checked><label data-title="ArpeggiatorPluginDemo.h" for="tab-X60p4O7">ArpeggiatorPluginDemo.h</label></div><div class="blocks"><div class="language-cpp vp-adaptive-theme active"><button title="Copy Code" class="copy"></button><span class="lang">cpp</span><pre class="shiki shiki-themes flexoki flexoki vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">/*******************************************************************************</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"> The block below describes the properties of this PIP. A PIP is a short snippet</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"> of code that can be read by the Projucer and used to generate a JUCE project.</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"> BEGIN_JUCE_PIP_METADATA</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"> name:                  ArpeggiatorPlugin</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"> version:               1.0.0</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"> vendor:                JUCE</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"> website:               http://juce.com</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"> description:           Arpeggiator audio plugin.</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"> dependencies:          juce_audio_basics, juce_audio_devices, juce_audio_formats,</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">                        juce_audio_plugin_client, juce_audio_processors,</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">                        juce_audio_utils, juce_core, juce_data_structures,</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">                        juce_events, juce_graphics, juce_gui_basics, juce_gui_extra,</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">                        juce_audio_processors_headless</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"> exporters:             xcode_mac, vs2022, vs2026</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"> moduleFlags:           JUCE_STRICT_REFCOUNTEDPOINTER=1</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"> type:                  AudioProcessor</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"> mainClass:             Arpeggiator</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"> useLocalCopy:          1</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"> pluginCharacteristics: pluginWantsMidiIn, pluginProducesMidiOut, pluginIsMidiEffectPlugin</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"> END_JUCE_PIP_METADATA</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">*******************************************************************************/</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">#pragma once</span></span>
<span class="line"></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">//==============================================================================</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">class Arpeggiator final : public AudioProcessor</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">{</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">public:</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    //==============================================================================</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    Arpeggiator()</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        : AudioProcessor (BusesProperties())</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"> // add no audio buses at all</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    {</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        addParameter (speed = new AudioParameterFloat ({ </span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">&quot;speed&quot;</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">, 1 }, </span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">&quot;Arpeggiator Speed&quot;</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">, 0.0, 1.0, 0.5));</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    }</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    //==============================================================================</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    void prepareToPlay (double sampleRate, int samplesPerBlock) override</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    {</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        ignoreUnused (samplesPerBlock);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        notes.clear();</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        currentNote = 0;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        lastNoteValue = -1;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        time = 0;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        rate = static_cast&lt;float&gt; (sampleRate);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    }</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    void releaseResources() override {}</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    void processBlock (AudioBuffer&lt;float&gt;&amp; buffer, MidiBuffer&amp; midi) override</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    {</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        // A pure MIDI plugin shouldn&#39;t be provided any audio data</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        jassert (buffer.getNumChannels() == 0);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        // however we use the buffer to get timing information</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        auto numSamples = buffer.getNumSamples();</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        // get note duration</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        auto noteDuration = static_cast&lt;int&gt; (std::ceil (rate * 0.25f * (0.1f + (1.0f - (*speed)))));</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        for (const auto metadata : midi)</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        {</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">            const auto msg = metadata.getMessage();</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">            if      (msg.isNoteOn())  notes.add (msg.getNoteNumber());</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">            else if (msg.isNoteOff()) notes.removeValue (msg.getNoteNumber());</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        }</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        midi.clear();</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        if ((time + numSamples) &gt;= noteDuration)</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        {</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">            auto offset = jmax (0, jmin ((int) (noteDuration - time), numSamples - 1));</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">            if (lastNoteValue &gt; 0)</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">            {</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">                midi.addEvent (MidiMessage::noteOff (1, lastNoteValue), offset);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">                lastNoteValue = -1;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">            }</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">            if (notes.size() &gt; 0)</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">            {</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">                currentNote = (currentNote + 1) % notes.size();</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">                lastNoteValue = notes[currentNote];</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">                midi.addEvent (MidiMessage::noteOn  (1, lastNoteValue, (uint8) 127), offset);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">            }</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        }</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        time = (time + numSamples) % noteDuration;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    }</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    using AudioProcessor::processBlock;</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    //==============================================================================</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    bool isMidiEffect() const override                     { return true; }</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    //==============================================================================</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    AudioProcessorEditor* createEditor() override          { return new GenericAudioProcessorEditor (*this); }</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    bool hasEditor() const override                        { return true; }</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    //==============================================================================</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    const String getName() const override                  { return </span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">&quot;Arpeggiator&quot;</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">; }</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    bool acceptsMidi() const override                      { return true; }</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    bool producesMidi() const override                     { return true; }</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    double getTailLengthSeconds() const override           { return 0; }</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    //==============================================================================</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    int getNumPrograms() override                          { return 1; }</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    int getCurrentProgram() override                       { return 0; }</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    void setCurrentProgram (int) override                  {}</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    const String getProgramName (int) override             { return </span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">&quot;None&quot;</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">; }</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    void changeProgramName (int, const String&amp;) override   {}</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    //==============================================================================</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    void getStateInformation (MemoryBlock&amp; destData) override</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    {</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        MemoryOutputStream (destData, true).writeFloat (*speed);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    }</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    void setStateInformation (const void* data, int sizeInBytes) override</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    {</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        speed-&gt;setValueNotifyingHost (MemoryInputStream (data, static_cast&lt;size_t&gt; (sizeInBytes), false).readFloat());</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    }</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">private:</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    //==============================================================================</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    AudioParameterFloat* speed;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    int currentNote, lastNoteValue;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    int time;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    float rate;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    SortedSet&lt;int&gt; notes;</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    //==============================================================================</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR (Arpeggiator)</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">};</span></span></code></pre></div></div></div>`,5)])])}const d=a(e,[["render",l]]);export{c as __pageData,d as default};
