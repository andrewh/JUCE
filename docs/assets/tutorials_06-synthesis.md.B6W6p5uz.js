import{_ as a,o as i,c as n,a4 as e}from"./chunks/framework.YC5CMuPM.js";const c=JSON.parse('{"title":"Synthesis: noise, sine waves, levels, MIDI voices, and wavetables","description":"","frontmatter":{},"headers":[],"relativePath":"tutorials/06-synthesis.md","filePath":"tutorials/06-synthesis.md","lastUpdated":null}'),l={name:"tutorials/06-synthesis.md"};function C(t,s,p,h,o,r){return i(),n("div",null,[...s[0]||(s[0]=[e(`<h1 id="synthesis-noise-sine-waves-levels-midi-voices-and-wavetables" tabindex="-1">Synthesis: noise, sine waves, levels, MIDI voices, and wavetables <a class="header-anchor" href="#synthesis-noise-sine-waves-levels-midi-voices-and-wavetables" aria-label="Permalink to &quot;Synthesis: noise, sine waves, levels, MIDI voices, and wavetables&quot;">​</a></h1><p><strong>Generate audio from scratch, control its level, and turn it into a playable instrument.</strong></p><p><strong>Level:</strong> Intermediate<br><strong>Prerequisite:</strong> <a href="./05-audio-io-and-playback.html">Audio input, output, files, and waveforms</a></p><p>All examples live inside an <code>AudioAppComponent</code> and write into <code>info.buffer</code> between <code>info.startSample</code> and <code>info.startSample + info.numSamples</code>. Audio is <code>float</code> data where <code>1.0</code> and <code>-1.0</code> are full scale, so keep test signals well below that: the output is <strong>very</strong> loud at full scale.</p><h2 id="white-noise" tabindex="-1">White noise <a class="header-anchor" href="#white-noise" aria-label="Permalink to &quot;White noise&quot;">​</a></h2><p>Fill the block with random values. <code>Random::nextFloat()</code> returns <code>0..1</code>, so scale and centre it:</p><div class="language-cpp vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">cpp</span><pre class="shiki shiki-themes flexoki flexoki vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">void getNextAudioBlock (const juce::AudioSourceChannelInfo&amp; info) override</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">{</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    for (int ch = 0; ch &lt; info.buffer-&gt;getNumChannels(); ++ch)</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    {</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        auto* out = info.buffer-&gt;getWritePointer (ch, info.startSample);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        for (int i = 0; i &lt; info.numSamples; ++i)</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">            out[i] = random.nextFloat() * 0.25f - 0.125f;</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">   // range -0.125 .. +0.125</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    }</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">}</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">juce::Random random;</span></span></code></pre></div><p>Use <code>getWritePointer (channel, startSample)</code> once per channel and index samples from zero, rather than calling it per sample.</p><h2 id="sine-wave" tabindex="-1">Sine wave <a class="header-anchor" href="#sine-wave" aria-label="Permalink to &quot;Sine wave&quot;">​</a></h2><p>A digital oscillator tracks its <em>phase</em> (an angle) and advances it by a fixed step per sample. The step depends on the sample rate, so compute it in <code>prepareToPlay()</code>:</p><div class="language-cpp vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">cpp</span><pre class="shiki shiki-themes flexoki flexoki vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">void prepareToPlay (int, double sampleRate) override</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">{</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    currentSampleRate = sampleRate;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    updateAngleDelta();</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">}</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">void updateAngleDelta()</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">{</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    auto cyclesPerSample = frequency.load() / currentSampleRate;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    angleDelta = cyclesPerSample * juce::MathConstants&lt;double&gt;::twoPi;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">}</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">void getNextAudioBlock (const juce::AudioSourceChannelInfo&amp; info) override</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">{</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    auto* left  = info.buffer-&gt;getWritePointer (0, info.startSample);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    auto* right = info.buffer-&gt;getWritePointer (1, info.startSample);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    for (int i = 0; i &lt; info.numSamples; ++i)</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    {</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        auto s = (float) std::sin (currentAngle) * 0.125f;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        currentAngle += angleDelta;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        left[i] = right[i] = s;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    }</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">}</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">double currentSampleRate = 0.0, currentAngle = 0.0, angleDelta = 0.0;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">std::atomic&lt;double&gt; frequency { 500.0 };</span></span></code></pre></div><ul><li>Keep the angle in a <code>double</code> and, for long-running or <code>float</code> oscillators, wrap it into <code>[0, 2π)</code> to avoid precision loss.</li><li>Give the frequency slider a skew (<code>setSkewFactorFromMidPoint (500.0)</code>) so the travel feels musical.</li><li><strong>Smooth parameter changes.</strong> Jumping straight to a new frequency (or level) between blocks creates clicks. Either ramp within the block (compute a per-sample increment from the current to the target value and recompute <code>angleDelta</code> as you go), or let <code>juce::SmoothedValue</code> do it:</li></ul><div class="language-cpp vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">cpp</span><pre class="shiki shiki-themes flexoki flexoki vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">juce::SmoothedValue&lt;float&gt; freq;</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">void prepareToPlay (int, double sampleRate) override</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">{</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    currentSampleRate = sampleRate;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    freq.reset (sampleRate, 0.05);</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">           // 50 ms ramp</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    freq.setCurrentAndTargetValue (500.0f);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">}</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">// GUI thread:  targetFrequency = (float) slider.getValue();</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">// Audio thread, once per block:  freq.setTargetValue (targetFrequency.load());</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">// per sample:  angleDelta = freq.getNextValue() / currentSampleRate * twoPi;</span></span></code></pre></div><h2 id="controlling-level" tabindex="-1">Controlling level <a class="header-anchor" href="#controlling-level" aria-label="Permalink to &quot;Controlling level&quot;">​</a></h2><p>Level is multiplication: <code>out = in * gain</code>. For the noise generator, <code>nextFloat() * 2 - 1</code> gives <code>-1..1</code>, and multiplying by <code>level</code> scales it. The cheaper form, with one fewer operation per sample, is <code>nextFloat() * (2 * level) - level</code>.</p><p>Sliders show <em>gain</em> awkwardly. Listeners hear loudness logarithmically, so present levels in decibels and convert at the boundary:</p><div class="language-cpp vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">cpp</span><pre class="shiki shiki-themes flexoki flexoki vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">juce::Decibels::gainToDecibels (0.5f);</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        // -6.02 dB</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">juce::Decibels::decibelsToGain (-6.0f);</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">       //  0.501</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">juce::Decibels::toString (-12.0);</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">             // &quot;-12.00 dB&quot;</span></span></code></pre></div><div class="language-cpp vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">cpp</span><pre class="shiki shiki-themes flexoki flexoki vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">class DecibelSlider final : public juce::Slider</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">{</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">public:</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    double getValueFromText (const juce::String&amp; text) override</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    {</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        auto t = text.upToFirstOccurrenceOf (</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">&quot;dB&quot;</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">, false, false).trim();</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        return t.equalsIgnoreCase (</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">&quot;-INF&quot;</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">) ? -100.0 : t.getDoubleValue();</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    }</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    juce::String getTextFromValue (double value) override</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    {</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        return juce::Decibels::toString (value);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    }</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">};</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">// setup</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">dbSlider.setRange (-100.0, -12.0);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">dbSlider.onValueChange = [this]</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">{</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    level = juce::Decibels::decibelsToGain ((float) dbSlider.getValue());</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">};</span></span></code></pre></div><ul><li>Treat the bottom of the range as minus infinity: <code>gainToDecibels (gain, -96.0f)</code> takes an explicit floor. Use the same floor everywhere.</li><li><code>level</code> is written by the GUI thread and read by the audio thread, so make it a <code>std::atomic&lt;float&gt;</code>, and smooth it (<code>SmoothedValue</code> with <code>Multiplicative</code> smoothing suits gain) to avoid zipper noise. Copy it to a local at the start of the block so it is constant for the whole block.</li></ul><h2 id="a-midi-playable-synthesiser" tabindex="-1">A MIDI-playable synthesiser <a class="header-anchor" href="#a-midi-playable-synthesiser" aria-label="Permalink to &quot;A MIDI-playable synthesiser&quot;">​</a></h2><p><code>juce::Synthesiser</code> manages polyphony: it turns MIDI events into notes and allocates them to voices. You provide the sound and the voice.</p><div class="language-cpp vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">cpp</span><pre class="shiki shiki-themes flexoki flexoki vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">struct SineSound final : public juce::SynthesiserSound</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">{</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    bool appliesToNote (int) override    { return true; }</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    bool appliesToChannel (int) override { return true; }</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">};</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">class SineVoice final : public juce::SynthesiserVoice</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">{</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">public:</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    bool canPlaySound (juce::SynthesiserSound* s) override</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    {</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        return dynamic_cast&lt;SineSound*&gt; (s) != nullptr;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    }</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    void startNote (int midiNote, float velocity, juce::SynthesiserSound*, int) override</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    {</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        currentAngle = 0.0;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        level = velocity * 0.15f;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        tailOff = 0.0;</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        auto hz = juce::MidiMessage::getMidiNoteInHertz (midiNote);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        angleDelta = hz / getSampleRate() * juce::MathConstants&lt;double&gt;::twoPi;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    }</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    void stopNote (float, bool allowTailOff) override</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    {</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        if (allowTailOff)</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        {</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">            if (juce::approximatelyEqual (tailOff, 0.0))</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">                tailOff = 1.0;</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">                       // begin a release fade</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        }</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        else</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        {</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">            clearCurrentNote();</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">                      // silence this voice immediately</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">            angleDelta = 0.0;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        }</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    }</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    void renderNextBlock (juce::AudioBuffer&lt;float&gt;&amp; out, int start, int num) override</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    {</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        if (juce::approximatelyEqual (angleDelta, 0.0)) return;</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">   // voice is idle</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        while (--num &gt;= 0)</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        {</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">            auto s = (float) std::sin (currentAngle) * level</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">                     * (tailOff &gt; 0.0 ? (float) tailOff : 1.0f);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">            for (int ch = 0; ch &lt; out.getNumChannels(); ++ch)</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">                out.addSample (ch, start, s);</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">      // add: several voices mix into the buffer</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">            currentAngle += angleDelta;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">            ++start;</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">            if (tailOff &gt; 0.0)</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">            {</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">                tailOff *= 0.99;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">                if (tailOff &lt;= 0.005) { clearCurrentNote(); angleDelta = 0.0; break; }</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">            }</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        }</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    }</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    void pitchWheelMoved (int) override {}</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    void controllerMoved (int, int) override {}</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">private:</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    double currentAngle = 0.0, angleDelta = 0.0, tailOff = 0.0;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    float level = 0.0f;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">};</span></span></code></pre></div><p>Wire it into the component with a keyboard for input, and a <code>MidiMessageCollector</code> to hand MIDI from the message thread to the audio thread:</p><div class="language-cpp vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">cpp</span><pre class="shiki shiki-themes flexoki flexoki vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">class SynthComponent final : public juce::AudioAppComponent</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">{</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">public:</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    SynthComponent() : keyboard (keyboardState, juce::MidiKeyboardComponent::horizontalKeyboard)</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    {</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        addAndMakeVisible (keyboard);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        keyboardState.addListener (&amp;midiCollector);</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        // on-screen keys -&gt; collector</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        deviceManager.addMidiInputDeviceCallback ({}, &amp;midiCollector);</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">  // hardware, if any</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        for (int i = 0; i &lt; 8; ++i) synth.addVoice (new SineVoice());</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        synth.addSound (new SineSound());</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        setSize (600, 160);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        setAudioChannels (0, 2);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    }</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    ~SynthComponent() override { shutdownAudio(); }</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    void prepareToPlay (int, double rate) override</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    {</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        synth.setCurrentPlaybackSampleRate (rate);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        midiCollector.reset (rate);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    }</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    void getNextAudioBlock (const juce::AudioSourceChannelInfo&amp; info) override</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    {</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        info.clearActiveBufferRegion();</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        juce::MidiBuffer incoming;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        midiCollector.removeNextBlockOfMessages (incoming, info.numSamples);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        synth.renderNextBlock (*info.buffer, incoming, info.startSample, info.numSamples);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    }</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    void releaseResources() override {}</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    void resized() override { keyboard.setBounds (getLocalBounds().reduced (8)); }</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">private:</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    juce::MidiKeyboardState keyboardState;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    juce::MidiMessageCollector midiCollector;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    juce::MidiKeyboardComponent keyboard;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    juce::Synthesiser synth;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">};</span></span></code></pre></div><ul><li>Clear the buffer before rendering: <code>Synthesiser</code> <em>adds</em> to it.</li><li><code>renderNextBlock()</code> splits the block at each MIDI event&#39;s timestamp, so notes start sample-accurately.</li><li>Enable hardware MIDI inputs with <code>deviceManager.setMidiInputDeviceEnabled (info.identifier, true)</code>, for example from an <code>AudioDeviceSelectorComponent</code> with MIDI inputs shown.</li><li>Voices must be real-time safe: no allocation in <code>startNote()</code> or <code>renderNextBlock()</code>. Allocate wavetables, envelopes, and so on beforehand.</li><li>For a proper amplitude envelope use <code>juce::ADSR</code> instead of the exponential tail above: call <code>setSampleRate()</code> and <code>setParameters()</code>, <code>noteOn()</code> in <code>startNote()</code>, <code>noteOff()</code> in <code>stopNote()</code>, multiply by <code>getNextSample()</code>, and call <code>clearCurrentNote()</code> when <code>isActive()</code> turns false.</li><li>In a plug-in, the host supplies MIDI in <code>processBlock()</code> and the collector is unnecessary: pass the <code>MidiBuffer</code> straight to <code>synth.renderNextBlock()</code>.</li></ul><h2 id="wavetable-oscillators" tabindex="-1">Wavetable oscillators <a class="header-anchor" href="#wavetable-oscillators" aria-label="Permalink to &quot;Wavetable oscillators&quot;">​</a></h2><p>Instead of calling <code>std::sin()</code> per sample, precompute one cycle into a table and read it back at a variable speed. This is cheaper, and the table can hold any waveform (sawtooth, harmonics, a sampled cycle).</p><div class="language-cpp vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">cpp</span><pre class="shiki shiki-themes flexoki flexoki vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">juce::AudioSampleBuffer sineTable;</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">            // one channel, tableSize + 1 samples</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">void createWavetable (int tableSize = 128)</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">{</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    sineTable.setSize (1, tableSize + 1);</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">     // one guard sample simplifies interpolation</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    auto* s = sineTable.getWritePointer (0);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    auto step = juce::MathConstants&lt;double&gt;::twoPi / (double) tableSize;</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">   // one full cycle</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    for (int i = 0; i &lt; tableSize; ++i)</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        s[i] = (float) std::sin (i * step);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    s[tableSize] = s[0];</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">                      // guard = first sample</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">}</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">class WavetableOscillator</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">{</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">public:</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    explicit WavetableOscillator (const juce::AudioSampleBuffer&amp; t)</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        : table (t), tableSize (t.getNumSamples() - 1) {}</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    void setFrequency (float hz, float sampleRate)</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    {</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        tableDelta = hz * (float) tableSize / sampleRate;</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">   // table steps per output sample</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    }</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    float getNextSample() noexcept</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    {</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        auto index0 = (unsigned int) currentIndex;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        auto index1 = index0 + 1;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        auto frac   = currentIndex - (float) index0;</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        auto* data = table.getReadPointer (0);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        auto v = data[index0] + frac * (data[index1] - data[index0]);</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">   // linear interpolation</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        if ((currentIndex += tableDelta) &gt; (float) tableSize)</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">            currentIndex -= (float) tableSize;</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">                          // wrap</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        return v;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    }</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">private:</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    const juce::AudioSampleBuffer&amp; table;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    const int tableSize;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    float currentIndex = 0.0f, tableDelta = 0.0f;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">};</span></span></code></pre></div><ul><li>Interpolate between neighbouring table entries. Without it, low-resolution tables sound noisy and stepped.</li><li>One oscillator per note (or per voice) shares one immutable table. Mix several oscillators for chords, and scale the total down to avoid clipping.</li><li>For very high harmonic content, use band-limited tables per octave to avoid aliasing.</li></ul><h2 id="sources" tabindex="-1">Sources <a class="header-anchor" href="#sources" aria-label="Permalink to &quot;Sources&quot;">​</a></h2><p>Condensed from the JUCE tutorials <em>Build a white noise generator</em>, <em>Build a sine wave synthesiser</em>, <em>Control audio levels</em>, <em>Control audio levels using decibels</em>, <em>Build a MIDI synthesiser</em>, and <em>Wavetable synthesis</em>, Copyright (c) Raw Material Software Limited, ISC licence. See <a href="./notice.html">the attribution notice</a>.</p>`,31)])])}const d=a(l,[["render",C]]);export{c as __pageData,d as default};
