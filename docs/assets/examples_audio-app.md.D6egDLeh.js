import{_ as a,o as n,c as i,a4 as C}from"./chunks/framework.YC5CMuPM.js";const o=JSON.parse('{"title":"Audio App","description":"","frontmatter":{"title":"Audio App","outline":false},"headers":[],"relativePath":"examples/audio-app.md","filePath":"examples/audio-app.md","lastUpdated":null}'),l={name:"examples/audio-app.md"};function p(e,s,t,h,k,d){return n(),i("div",null,[...s[0]||(s[0]=[C(`<h1 id="audio-app" tabindex="-1">Audio App <a class="header-anchor" href="#audio-app" aria-label="Permalink to &quot;Audio App&quot;">​</a></h1><p><strong>A simple audio application built on AudioAppComponent.</strong></p><ul><li>AudioAppComponent</li><li>Shared AudioDeviceManager</li><li>prepareToPlay and getNextAudioBlock</li></ul><p>Source: <a href="https://github.com/juce-framework/JUCE/tree/master/examples/Audio/AudioAppDemo.h" target="_blank" rel="noreferrer">examples/Audio/AudioAppDemo.h</a> on GitHub.</p><div class="vp-code-group vp-adaptive-theme"><div class="tabs"><input type="radio" name="group-H-EKA" id="tab-ZYKmuQ5" checked><label data-title="AudioAppDemo.h" for="tab-ZYKmuQ5">AudioAppDemo.h</label></div><div class="blocks"><div class="language-cpp vp-adaptive-theme active"><button title="Copy Code" class="copy"></button><span class="lang">cpp</span><pre class="shiki shiki-themes flexoki flexoki vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">/*******************************************************************************</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"> The block below describes the properties of this PIP. A PIP is a short snippet</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"> of code that can be read by the Projucer and used to generate a JUCE project.</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"> BEGIN_JUCE_PIP_METADATA</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"> name:             AudioAppDemo</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"> version:          1.0.0</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"> vendor:           JUCE</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"> website:          http://juce.com</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"> description:      Simple audio application.</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"> dependencies:     juce_audio_basics, juce_audio_devices, juce_audio_formats,</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">                   juce_audio_processors, juce_audio_utils, juce_core,</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">                   juce_data_structures, juce_events, juce_graphics,</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">                   juce_gui_basics, juce_gui_extra, juce_audio_processors_headless</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"> exporters:        xcode_mac, vs2022, vs2026, linux_make, androidstudio,</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">                   xcode_iphone</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"> moduleFlags:      JUCE_STRICT_REFCOUNTEDPOINTER=1</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"> type:             Component</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"> mainClass:        AudioAppDemo</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"> useLocalCopy:     1</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"> END_JUCE_PIP_METADATA</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">*******************************************************************************/</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">#pragma once</span></span>
<span class="line"></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">//==============================================================================</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">class AudioAppDemo final : public AudioAppComponent</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">{</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">public:</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    //==============================================================================</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    AudioAppDemo()</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">       #ifdef JUCE_DEMO_RUNNER</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        : AudioAppComponent (getSharedAudioDeviceManager (0, 2))</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">       #endif</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    {</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        setAudioChannels (0, 2);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        setSize (800, 600);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    }</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    ~AudioAppDemo() override</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    {</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        shutdownAudio();</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    }</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    //==============================================================================</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    void prepareToPlay (int samplesPerBlockExpected, double newSampleRate) override</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    {</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        sampleRate = newSampleRate;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        expectedSamplesPerBlock = samplesPerBlockExpected;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    }</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    /*  This method generates the actual audio samples.</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        In this example the buffer is filled with a sine wave whose frequency and</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        amplitude are controlled by the mouse position.</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">     */</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    void getNextAudioBlock (const AudioSourceChannelInfo&amp; bufferToFill) override</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    {</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        bufferToFill.clearActiveBufferRegion();</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        auto originalPhase = phase;</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        for (auto chan = 0; chan &lt; bufferToFill.buffer-&gt;getNumChannels(); ++chan)</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        {</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">            phase = originalPhase;</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">            auto* channelData = bufferToFill.buffer-&gt;getWritePointer (chan, bufferToFill.startSample);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">            for (auto i = 0; i &lt; bufferToFill.numSamples ; ++i)</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">            {</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">                channelData[i] = amplitude * std::sin (phase);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">                // increment the phase step for the next sample</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">                phase = std::fmod (phase + phaseDelta, MathConstants&lt;float&gt;::twoPi);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">            }</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        }</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    }</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    void releaseResources() override</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    {</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        // This gets automatically called when audio device parameters change</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        // or device is restarted.</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    }</span></span>
<span class="line"></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    //==============================================================================</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    void paint (Graphics&amp; g) override</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    {</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        // (Our component is opaque, so we must completely fill the background with a solid colour)</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        g.fillAll (getLookAndFeel().findColour (ResizableWindow::backgroundColourId));</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        auto centreY = (float) getHeight() / 2.0f;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        auto radius = amplitude * 200.0f;</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        if (radius &gt;= 0.0f)</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        {</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">            // Draw an ellipse based on the mouse position and audio volume</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">            g.setColour (Colours::lightgreen);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">            g.fillEllipse (jmax (0.0f, lastMousePosition.x) - radius / 2.0f,</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">                           jmax (0.0f, lastMousePosition.y) - radius / 2.0f,</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">                           radius, radius);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        }</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        // Draw a representative sine wave.</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        Path wavePath;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        wavePath.startNewSubPath (0, centreY);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        for (auto x = 1.0f; x &lt; (float) getWidth(); ++x)</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">            wavePath.lineTo (x, centreY + amplitude * (float) getHeight() * 2.0f</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">                                            * std::sin (x * frequency * 0.0001f));</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        g.setColour (getLookAndFeel().findColour (Slider::thumbColourId));</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        g.strokePath (wavePath, PathStrokeType (2.0f));</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    }</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    // Mouse handling..</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    void mouseDown (const MouseEvent&amp; e) override</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    {</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        mouseDrag (e);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    }</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    void mouseDrag (const MouseEvent&amp; e) override</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    {</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        lastMousePosition = e.position;</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        frequency = (float) (getHeight() - e.y) * 10.0f;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        amplitude = jmin (0.9f, 0.2f * e.position.x / (float) getWidth());</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        phaseDelta = (float) (MathConstants&lt;double&gt;::twoPi * frequency / sampleRate);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        repaint();</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    }</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    void mouseUp (const MouseEvent&amp;) override</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    {</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        amplitude = 0.0f;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        repaint();</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    }</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    void resized() override</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    {</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        // This is called when the component is resized.</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        // If you add any child components, this is where you should</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        // update their positions.</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    }</span></span>
<span class="line"></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">private:</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    //==============================================================================</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    float phase       = 0.0f;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    float phaseDelta  = 0.0f;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    float frequency   = 5000.0f;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    float amplitude   = 0.2f;</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    double sampleRate = 0.0;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    int expectedSamplesPerBlock = 0;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    Point&lt;float&gt; lastMousePosition;</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR (AudioAppDemo)</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">};</span></span></code></pre></div></div></div>`,5)])])}const c=a(l,[["render",p]]);export{o as __pageData,c as default};
