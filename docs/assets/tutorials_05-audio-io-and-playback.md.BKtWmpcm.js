import{_ as a,o as i,c as n,a4 as e}from"./chunks/framework.YC5CMuPM.js";const c=JSON.parse('{"title":"Audio input, output, files, and waveforms","description":"","frontmatter":{},"headers":[],"relativePath":"tutorials/05-audio-io-and-playback.md","filePath":"tutorials/05-audio-io-and-playback.md","lastUpdated":null}'),l={name:"tutorials/05-audio-io-and-playback.md"};function t(C,s,p,h,o,r){return i(),n("div",null,[...s[0]||(s[0]=[e(`<h1 id="audio-input-output-files-and-waveforms" tabindex="-1">Audio input, output, files, and waveforms <a class="header-anchor" href="#audio-input-output-files-and-waveforms" aria-label="Permalink to &quot;Audio input, output, files, and waveforms&quot;">​</a></h1><p><strong>Get audio in and out of an application, play and read sound files, loop buffers, and draw waveforms.</strong></p><p><strong>Level:</strong> Intermediate<br><strong>Platforms:</strong> Windows, macOS, Linux (and mobile with the appropriate permissions)</p><p>Link <code>juce::juce_audio_utils</code> (which brings in devices, formats, and basics).</p><h2 id="audioappcomponent-the-audio-callback" tabindex="-1"><code>AudioAppComponent</code>: the audio callback <a class="header-anchor" href="#audioappcomponent-the-audio-callback" aria-label="Permalink to &quot;\`AudioAppComponent\`: the audio callback&quot;">​</a></h2><p><code>AudioAppComponent</code> is a <code>Component</code> that is also an <code>AudioSource</code> and owns an <code>AudioDeviceManager</code> named <code>deviceManager</code>. It is the quickest route to a working audio application (the Projucer&#39;s &quot;Audio Application&quot; template is this class).</p><div class="language-cpp vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">cpp</span><pre class="shiki shiki-themes flexoki flexoki vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">class MainComponent final : public juce::AudioAppComponent</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">{</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">public:</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    MainComponent()</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    {</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        setSize (400, 200);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        setAudioChannels (2, 2);</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">              // inputs, outputs: opens the default device</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    }</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    ~MainComponent() override { shutdownAudio(); }</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">   // mandatory: stops the audio thread first</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    void prepareToPlay (int samplesPerBlockExpected, double sampleRate) override</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    {</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        // Allocate and initialise anything that depends on the sample rate or block size</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    }</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    void getNextAudioBlock (const juce::AudioSourceChannelInfo&amp; info) override</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    {</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        // Called on the audio thread. Fill info.buffer from info.startSample,</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        // for info.numSamples samples.</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        info.clearActiveBufferRegion();</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    }</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    void releaseResources() override {}</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">};</span></span></code></pre></div><p>Rules for <code>getNextAudioBlock()</code>, which runs on a real-time thread:</p><ul><li>Do not allocate, lock, block, do file or network I/O, or touch GUI objects.</li><li>Read GUI values through a <code>std::atomic</code>, <code>SmoothedValue</code>, or another real-time-safe channel, not by calling slider methods directly. (The tutorial code reads <code>slider.getValue()</code> for brevity; treat that as demo-only.)</li><li>The buffer may contain stale data: overwrite or clear every sample you are responsible for.</li><li><code>prepareToPlay()</code> may be called again whenever the device changes, so re-derive every sample-rate-dependent value there.</li></ul><h2 id="choosing-devices-audiodevicemanager" tabindex="-1">Choosing devices: <code>AudioDeviceManager</code> <a class="header-anchor" href="#choosing-devices-audiodevicemanager" aria-label="Permalink to &quot;Choosing devices: \`AudioDeviceManager\`&quot;">​</a></h2><p><code>deviceManager</code> opens the default device unless told otherwise, and is also the hub for incoming MIDI. Give users a settings panel with <code>AudioDeviceSelectorComponent</code>:</p><div class="language-cpp vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">cpp</span><pre class="shiki shiki-themes flexoki flexoki vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">juce::AudioDeviceSelectorComponent selector { deviceManager,</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">                                              0, 256,</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">      // min/max input channels</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">                                              0, 256,</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">      // min/max output channels</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">                                              false,</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">       // show MIDI inputs</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">                                              false,</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">       // show MIDI outputs</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">                                              false,</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">       // channels as stereo pairs</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">                                              false };</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">     // hide advanced options</span></span></code></pre></div><p>It offers device, channel, sample rate, and buffer size choices, plus a &quot;Test&quot; button that plays a tone. <code>AudioDeviceManager</code> is a <code>ChangeBroadcaster</code>, so listen to be told when settings change, then inspect the device:</p><div class="language-cpp vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">cpp</span><pre class="shiki shiki-themes flexoki flexoki vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">void changeListenerCallback (juce::ChangeBroadcaster*) override</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">{</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    if (auto* device = deviceManager.getCurrentAudioDevice())</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        DBG (device-&gt;getName() &lt;&lt; </span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">&quot;: &quot;</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"> &lt;&lt; device-&gt;getCurrentSampleRate() &lt;&lt; </span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">&quot; Hz, &quot;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">             &lt;&lt; device-&gt;getCurrentBufferSizeSamples() &lt;&lt; </span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">&quot; samples, &quot;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">             &lt;&lt; device-&gt;getActiveInputChannels().countNumberOfSetBits() &lt;&lt; </span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">&quot; in / &quot;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">             &lt;&lt; device-&gt;getActiveOutputChannels().countNumberOfSetBits() &lt;&lt; </span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">&quot; out&quot;</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">}</span></span></code></pre></div><p><code>deviceManager.getCpuUsage()</code> returns the fraction of the audio time budget used (poll it from a <code>Timer</code>). Save and restore user choices with <code>deviceManager.createStateXml()</code> and the <code>initialise()</code> overload that accepts that XML.</p><h2 id="processing-audio-input" tabindex="-1">Processing audio input <a class="header-anchor" href="#processing-audio-input" aria-label="Permalink to &quot;Processing audio input&quot;">​</a></h2><p>Input and output share <strong>one buffer</strong>: the input arrives in the channels of <code>info.buffer</code> and you overwrite it with the output. Read first, then write. Work out which channels are live:</p><div class="language-cpp vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">cpp</span><pre class="shiki shiki-themes flexoki flexoki vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">void getNextAudioBlock (const juce::AudioSourceChannelInfo&amp; info) override</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">{</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    auto* device = deviceManager.getCurrentAudioDevice();</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    auto activeIn  = device-&gt;getActiveInputChannels();</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    auto activeOut = device-&gt;getActiveOutputChannels();</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    auto maxIn  = activeIn.getHighestBit() + 1;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    auto maxOut = activeOut.getHighestBit() + 1;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    auto level  = noiseLevel.load();</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">                       // atomic&lt;float&gt; set from the GUI</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    for (int ch = 0; ch &lt; maxOut; ++ch)</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    {</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        if (! activeOut[ch] || maxIn == 0 || ! activeIn[ch % maxIn])</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        {</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">            info.buffer-&gt;clear (ch, info.startSample, info.numSamples);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">            continue;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        }</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        auto* in  = info.buffer-&gt;getReadPointer  (ch % maxIn, info.startSample);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        auto* out = info.buffer-&gt;getWritePointer (ch,         info.startSample);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        for (int i = 0; i &lt; info.numSamples; ++i)</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">            out[i] = in[i] + in[i] * (random.nextFloat() * 2.0f - 1.0f) * level;</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">  // ring-modulate</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    }</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">}</span></span></code></pre></div><p>When there are more outputs than inputs, map them with <code>ch % maxIn</code> (or output silence). On macOS and iOS, and on Android, the app needs microphone permission declared in its project settings before input works. Wear headphones when experimenting: feedback is loud.</p><h2 id="playing-sound-files" tabindex="-1">Playing sound files <a class="header-anchor" href="#playing-sound-files" aria-label="Permalink to &quot;Playing sound files&quot;">​</a></h2><p>Compose the pipeline from <code>AudioSource</code>s and let <code>AudioTransportSource</code> handle start, stop, and position:</p><table tabindex="0"><thead><tr><th>Class</th><th>Role</th></tr></thead><tbody><tr><td><code>AudioFormatManager</code></td><td>Knows the file formats; <code>registerBasicFormats()</code> adds WAV, AIFF, FLAC, Ogg, MP3 (where enabled), and the platform&#39;s codecs</td></tr><tr><td><code>AudioFormatReader</code></td><td>Low-level decoding of one file</td></tr><tr><td><code>AudioFormatReaderSource</code></td><td>Wraps a reader as an <code>AudioSource</code></td></tr><tr><td><code>AudioTransportSource</code></td><td>Play, stop, seek, and (optionally) resample and read ahead</td></tr></tbody></table><div class="language-cpp vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">cpp</span><pre class="shiki shiki-themes flexoki flexoki vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">class PlayerComponent final : public juce::AudioAppComponent,</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">                              private juce::ChangeListener</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">{</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">public:</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    PlayerComponent()</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    {</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        formatManager.registerBasicFormats();</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        transport.addChangeListener (this);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        setAudioChannels (0, 2);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        // ... buttons as in Widgets ...</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    }</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    ~PlayerComponent() override</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    {</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        shutdownAudio();</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        transport.setSource (nullptr);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    }</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    void prepareToPlay (int block, double rate) override { transport.prepareToPlay (block, rate); }</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    void releaseResources() override                     { transport.releaseResources(); }</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    void getNextAudioBlock (const juce::AudioSourceChannelInfo&amp; info) override</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    {</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        if (readerSource == nullptr) { info.clearActiveBufferRegion(); return; }</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        transport.getNextAudioBlock (info);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    }</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">private:</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    void openFile()</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    {</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        chooser = std::make_unique&lt;juce::FileChooser&gt; (</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">&quot;Select an audio file...&quot;</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">,</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">                                                       juce::File {}, </span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">&quot;*.wav;*.aiff;*.flac&quot;</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        chooser-&gt;launchAsync (juce::FileBrowserComponent::openMode</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">                              | juce::FileBrowserComponent::canSelectFiles,</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">                              [this] (const juce::FileChooser&amp; fc)</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        {</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">            if (auto file = fc.getResult(); file != juce::File {})</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">                if (auto* reader = formatManager.createReaderFor (file))</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">   // may be null</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">                {</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">                    auto source = std::make_unique&lt;juce::AudioFormatReaderSource&gt; (reader, true);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">                    transport.setSource (source.get(), 0, nullptr, reader-&gt;sampleRate);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">                    readerSource = std::move (source);</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">   // keep it alive; deletes the reader</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">                }</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        });</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    }</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    void changeListenerCallback (juce::ChangeBroadcaster*) override</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    {</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        if (transport.isPlaying())        setState (Playing);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        else if (state == Stopping || state == Playing) setState (Stopped);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        else if (state == Pausing)        setState (Paused);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    }</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    enum State { Stopped, Starting, Playing, Pausing, Paused, Stopping };</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    void setState (State newState)</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    {</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        if (state == newState) return;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        state = newState;</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        switch (state)</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        {</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">            case Stopped:  transport.setPosition (0.0); break;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">            case Starting: transport.start();           break;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">            case Pausing:</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">            case Stopping: transport.stop();            break;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">            case Playing:</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">            case Paused:   break;</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">                       // update buttons here</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        }</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    }</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    juce::AudioFormatManager formatManager;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    std::unique_ptr&lt;juce::AudioFormatReaderSource&gt; readerSource;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    juce::AudioTransportSource transport;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    std::unique_ptr&lt;juce::FileChooser&gt; chooser;</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">          // must outlive the async dialog</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    State state = Stopped;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">};</span></span></code></pre></div><p>Key points:</p><ul><li>Model playback as a small state machine, changed in one function. The transport confirms <code>start()</code> and <code>stop()</code> <em>asynchronously</em>, via a change message. Use the intermediate states (Starting, Stopping, Pausing) so the UI reacts to what the audio actually did.</li><li>Pausing is <code>stop()</code> without rewinding. Stopping also <code>setPosition (0.0)</code>.</li><li>Keep the <code>FileChooser</code> in a member: <code>launchAsync()</code> returns immediately.</li><li><code>AudioFormatReaderSource (reader, true)</code> takes ownership of the reader. Detach it from the transport (<code>setSource (nullptr)</code>) before deleting it.</li><li>The second and third arguments of <code>AudioTransportSource::setSource()</code> set optional read-ahead buffering on a background thread, which keeps disk hiccups out of the audio callback for large files.</li></ul><h2 id="reading-a-file-into-memory-and-looping-it" tabindex="-1">Reading a file into memory and looping it <a class="header-anchor" href="#reading-a-file-into-memory-and-looping-it" aria-label="Permalink to &quot;Reading a file into memory and looping it&quot;">​</a></h2><p>For short samples and loops, read the whole file into an <code>AudioBuffer</code> and play it from a position that wraps:</p><div class="language-cpp vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">cpp</span><pre class="shiki shiki-themes flexoki flexoki vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">juce::AudioBuffer&lt;float&gt; fileBuffer;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">int position = 0;</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">void loadFile (const juce::File&amp; file)</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">{</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    if (auto* reader = formatManager.createReaderFor (file))</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    {</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        std::unique_ptr&lt;juce::AudioFormatReader&gt; owned (reader);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        fileBuffer.setSize ((int) owned-&gt;numChannels, (int) owned-&gt;lengthInSamples);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        owned-&gt;read (&amp;fileBuffer, 0, (int) owned-&gt;lengthInSamples, 0, true, true);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        position = 0;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    }</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">}</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">void getNextAudioBlock (const juce::AudioSourceChannelInfo&amp; info) override</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">{</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    auto numIn = fileBuffer.getNumChannels();</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    if (numIn == 0) { info.clearActiveBufferRegion(); return; }</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    auto outCh = info.buffer-&gt;getNumChannels();</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    auto remaining = info.numSamples;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    auto outPos = info.startSample;</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    while (remaining &gt; 0)</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    {</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        auto chunk = juce::jmin (remaining, fileBuffer.getNumSamples() - position);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        for (int ch = 0; ch &lt; outCh; ++ch)</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">            info.buffer-&gt;copyFrom (ch, outPos, fileBuffer, ch % numIn, position, chunk);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        position = (position + chunk) % fileBuffer.getNumSamples();</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">   // wrap</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        outPos += chunk;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        remaining -= chunk;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    }</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">}</span></span></code></pre></div><ul><li>Do the loading off the audio thread, then swap the buffer in safely (for example behind a <code>SpinLock</code> with <code>try_lock</code>, or by handing a <code>std::shared_ptr</code> across with an atomic exchange).</li><li>The copy is split in two whenever a block straddles the loop end; the <code>while</code> loop handles any number of wraps.</li><li>If the file&#39;s sample rate differs from the device, resample: wrap the reader in an <code>AudioTransportSource</code>, or use <code>ResamplingAudioSource</code>.</li><li>Do the reverse to <em>record</em>: keep a circular <code>AudioBuffer</code> and a write position, and copy from <code>info.buffer</code> into it with the same wrap logic.</li><li><code>reader-&gt;read()</code> reads a range into float channels. <code>readMaxLevels()</code> is the cheap way to find peaks without decoding into a buffer.</li></ul><h2 id="drawing-a-waveform-audiothumbnail" tabindex="-1">Drawing a waveform: <code>AudioThumbnail</code> <a class="header-anchor" href="#drawing-a-waveform-audiothumbnail" aria-label="Permalink to &quot;Drawing a waveform: \`AudioThumbnail\`&quot;">​</a></h2><p><code>AudioThumbnail</code> builds a compact, cached overview of a file and draws it, loading in the background.</p><div class="language-cpp vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">cpp</span><pre class="shiki shiki-themes flexoki flexoki vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">class WaveformDisplay final : public juce::Component, private juce::ChangeListener</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">{</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">public:</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    WaveformDisplay (juce::AudioFormatManager&amp; fm)</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        : thumbnail (512, fm, cache)</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">            // 512 source samples per thumbnail sample</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    {</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        thumbnail.addChangeListener (this);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    }</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    void setFile (const juce::File&amp; file)</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    {</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        thumbnail.setSource (new juce::FileInputSource (file));</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">   // takes ownership</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    }</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    void paint (juce::Graphics&amp; g) override</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    {</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        g.fillAll (juce::Colours::darkgrey);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        g.setColour (juce::Colours::lightgreen);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        if (thumbnail.getNumChannels() == 0)</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">            g.drawFittedText (</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">&quot;No file loaded&quot;</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">, getLocalBounds(), juce::Justification::centred, 1);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        else</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">            thumbnail.drawChannels (g, getLocalBounds().reduced (4),</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">                                    0.0, thumbnail.getTotalLength(), 1.0f);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    }</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">private:</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    void changeListenerCallback (juce::ChangeBroadcaster*) override { repaint(); }</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    juce::AudioThumbnailCache cache { 5 };</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">      // caches up to five thumbnails</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    juce::AudioThumbnail thumbnail;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">};</span></span></code></pre></div><ul><li>Repaint from the change callback; the thumbnail loads incrementally, so the display fills in as data arrives.</li><li>Draw a playhead by converting the transport&#39;s <code>getCurrentPosition()</code> to an x coordinate over the visible range, and update it from a <code>Timer</code>. Pair with mouse handling to seek by clicking.</li><li>The first constructor argument trades resolution against memory. Larger values give a smaller, coarser thumbnail.</li></ul><h2 id="sources" tabindex="-1">Sources <a class="header-anchor" href="#sources" aria-label="Permalink to &quot;Sources&quot;">​</a></h2><p>Condensed from the JUCE tutorials <em>The AudioDeviceManager class</em>, <em>Processing audio input</em>, <em>Build an audio player</em>, <em>Looping audio using the AudioSampleBuffer class</em> (and its advanced part), and <em>Draw audio waveforms</em>, Copyright (c) Raw Material Software Limited, ISC licence. See <a href="./notice.html">the attribution notice</a>.</p>`,35)])])}const k=a(l,[["render",t]]);export{c as __pageData,k as default};
