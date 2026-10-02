import{_ as a,o as i,c as n,a4 as C}from"./chunks/framework.YC5CMuPM.js";const D=JSON.parse('{"title":"State Variable Filter","description":"","frontmatter":{"title":"State Variable Filter","outline":false},"headers":[],"relativePath":"examples/svf.md","filePath":"examples/svf.md","lastUpdated":null}'),e={name:"examples/svf.md"};function l(p,s,t,h,k,r){return i(),n("div",null,[...s[0]||(s[0]=[C(`<h1 id="state-variable-filter" tabindex="-1">State Variable Filter <a class="header-anchor" href="#state-variable-filter" aria-label="Permalink to &quot;State Variable Filter&quot;">​</a></h1><p><strong>A low, band, and high pass filter with cutoff and resonance controls.</strong></p><ul><li>dsp::StateVariableTPTFilter</li><li>Switching filter type from the UI</li><li>AudioBlock processing</li></ul><p>Source: <a href="https://github.com/juce-framework/JUCE/tree/master/examples/DSP/StateVariableFilterDemo.h" target="_blank" rel="noreferrer">examples/DSP/StateVariableFilterDemo.h</a> on GitHub.</p><div class="vp-code-group vp-adaptive-theme"><div class="tabs"><input type="radio" name="group-S3Hjb" id="tab-Hau4gvV" checked><label data-title="StateVariableFilterDemo.h" for="tab-Hau4gvV">StateVariableFilterDemo.h</label></div><div class="blocks"><div class="language-cpp vp-adaptive-theme active"><button title="Copy Code" class="copy"></button><span class="lang">cpp</span><pre class="shiki shiki-themes flexoki flexoki vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">/*******************************************************************************</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"> The block below describes the properties of this PIP. A PIP is a short snippet</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"> of code that can be read by the Projucer and used to generate a JUCE project.</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"> BEGIN_JUCE_PIP_METADATA</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"> name:             StateVariableFilterDemo</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"> version:          1.0.0</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"> vendor:           JUCE</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"> website:          http://juce.com</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"> description:      State variable filter demo using the DSP module.</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"> dependencies:     juce_audio_basics, juce_audio_devices, juce_audio_formats,</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">                   juce_audio_processors, juce_audio_utils, juce_core,</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">                   juce_data_structures, juce_dsp, juce_events, juce_graphics,</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">                   juce_gui_basics, juce_gui_extra, juce_audio_processors_headless</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"> exporters:        xcode_mac, vs2022, vs2026, linux_make</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"> moduleFlags:      JUCE_STRICT_REFCOUNTEDPOINTER=1</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"> type:             Component</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"> mainClass:        StateVariableFilterDemo</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"> useLocalCopy:     1</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"> END_JUCE_PIP_METADATA</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">*******************************************************************************/</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">#pragma once</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">#include </span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">&quot;../Assets/DemoUtilities.h&quot;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">#include </span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">&quot;../Assets/DSPDemos_Common.h&quot;</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">using namespace dsp;</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">//==============================================================================</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">struct StateVariableFilterDemoDSP</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">{</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    void prepare (const ProcessSpec&amp; spec)</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    {</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        sampleRate = spec.sampleRate;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        filter.prepare (spec);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    }</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    void process (const ProcessContextReplacing&lt;float&gt;&amp; context)</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    {</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        filter.process (context);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    }</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    void reset()</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    {</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        filter.reset();</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    }</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    void updateParameters()</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    {</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        if (! approximatelyEqual (sampleRate, 0.0))</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        {</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">            filter.setCutoffFrequency (static_cast&lt;float&gt; (cutoffParam.getCurrentValue()));</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">            filter.setResonance       (static_cast&lt;float&gt; (qParam.getCurrentValue()));</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">            switch (typeParam.getCurrentSelectedID() - 1)</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">            {</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">                case 0:   filter.setType (StateVariableTPTFilterType::lowpass);  break;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">                case 1:   filter.setType (StateVariableTPTFilterType::bandpass); break;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">                case 2:   filter.setType (StateVariableTPTFilterType::highpass); break;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">                default:  jassertfalse;                                                   break;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">            };</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        }</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    }</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    //==============================================================================</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    StateVariableTPTFilter&lt;float&gt; filter;</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    ChoiceParameter typeParam {{ </span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">&quot;Low-pass&quot;</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">, </span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">&quot;Band-pass&quot;</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">, </span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">&quot;High-pass&quot;</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"> }, 1, </span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">&quot;Type&quot;</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"> };</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    SliderParameter cutoffParam {{ 20.0, 20000.0 }, 0.5, 440.0f, </span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">&quot;Cutoff&quot;</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">, </span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">&quot;Hz&quot;</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"> };</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    SliderParameter qParam {{ 0.3, 20.0 }, 0.5, 1.0 / MathConstants&lt;double&gt;::sqrt2, </span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">&quot;Resonance&quot;</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"> };</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    std::vector&lt;DSPDemoParameterBase*&gt; parameters { &amp;typeParam, &amp;cutoffParam, &amp;qParam };</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    double sampleRate = 0.0;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">};</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">struct StateVariableFilterDemo final : public Component</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">{</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    StateVariableFilterDemo()</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    {</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        addAndMakeVisible (fileReaderComponent);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        setSize (750, 500);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    }</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    void resized() override</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    {</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        fileReaderComponent.setBounds (getLocalBounds());</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    }</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    AudioFileReaderComponent&lt;StateVariableFilterDemoDSP&gt; fileReaderComponent;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">};</span></span></code></pre></div></div></div>`,5)])])}const E=a(e,[["render",l]]);export{D as __pageData,E as default};
