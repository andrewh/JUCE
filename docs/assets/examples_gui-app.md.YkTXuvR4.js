import{_ as a,o as n,c as i,a4 as e}from"./chunks/framework.YC5CMuPM.js";const c=JSON.parse('{"title":"GUI App","description":"","frontmatter":{"title":"GUI App","outline":false},"headers":[],"relativePath":"examples/gui-app.md","filePath":"examples/gui-app.md","lastUpdated":null}'),C={name:"examples/gui-app.md"};function l(p,s,t,h,k,r){return n(),i("div",null,[...s[0]||(s[0]=[e(`<h1 id="gui-app" tabindex="-1">GUI App <a class="header-anchor" href="#gui-app" aria-label="Permalink to &quot;GUI App&quot;">​</a></h1><p><strong>The smallest windowed application: a DocumentWindow hosting one Component.</strong></p><ul><li>JUCEApplication lifecycle</li><li>Component paint and resized</li><li>CMake setup with juce_add_gui_app</li></ul><p>Source: <a href="https://github.com/juce-framework/JUCE/tree/master/examples/CMake/GuiApp" target="_blank" rel="noreferrer">examples/CMake/GuiApp</a> on GitHub.</p><div class="vp-code-group vp-adaptive-theme"><div class="tabs"><input type="radio" name="group-vbtSL" id="tab-09X_FAI" checked><label data-title="MainComponent.h" for="tab-09X_FAI">MainComponent.h</label><input type="radio" name="group-vbtSL" id="tab-aJrIPMU"><label data-title="MainComponent.cpp" for="tab-aJrIPMU">MainComponent.cpp</label><input type="radio" name="group-vbtSL" id="tab-eDChcdw"><label data-title="Main.cpp" for="tab-eDChcdw">Main.cpp</label><input type="radio" name="group-vbtSL" id="tab-eg5roeC"><label data-title="CMakeLists.txt" for="tab-eg5roeC">CMakeLists.txt</label></div><div class="blocks"><div class="language-cpp vp-adaptive-theme active"><button title="Copy Code" class="copy"></button><span class="lang">cpp</span><pre class="shiki shiki-themes flexoki flexoki vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">#pragma once</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">// CMake builds don&#39;t use an AppConfig.h, so it&#39;s safe to include juce module headers</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">// directly. If you need to remain compatible with Projucer-generated builds, and</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">// have called \`juce_generate_juce_header(&lt;thisTarget&gt;)\` in your CMakeLists.txt,</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">// you could \`#include &lt;JuceHeader.h&gt;\` here instead, to make all your module headers visible.</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">#include </span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">&lt;juce_gui_extra/juce_gui_extra.h&gt;</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">//==============================================================================</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">/*</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    This component lives inside our window, and this is where you should put all</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    your controls and content.</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">*/</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">class MainComponent final : public juce::Component</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">{</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">public:</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    //==============================================================================</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    MainComponent();</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    //==============================================================================</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    void paint (juce::Graphics&amp;) override;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    void resized() override;</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">private:</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    //==============================================================================</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    // Your private member variables go here...</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR (MainComponent)</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">};</span></span></code></pre></div><div class="language-cpp vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">cpp</span><pre class="shiki shiki-themes flexoki flexoki vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">#include </span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">&quot;MainComponent.h&quot;</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">//==============================================================================</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">MainComponent::MainComponent()</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">{</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    setSize (600, 400);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">}</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">//==============================================================================</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">void MainComponent::paint (juce::Graphics&amp; g)</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">{</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    // (Our component is opaque, so we must completely fill the background with a solid colour)</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    g.fillAll (getLookAndFeel().findColour (juce::ResizableWindow::backgroundColourId));</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    g.setFont (juce::FontOptions (16.0f));</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    g.setColour (juce::Colours::white);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    g.drawText (</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">&quot;Hello World!&quot;</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">, getLocalBounds(), juce::Justification::centred, true);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">}</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">void MainComponent::resized()</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">{</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    // This is called when the MainComponent is resized.</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    // If you add any child components, this is where you should</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    // update their positions.</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">}</span></span></code></pre></div><div class="language-cpp vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">cpp</span><pre class="shiki shiki-themes flexoki flexoki vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">#include </span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">&quot;MainComponent.h&quot;</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">//==============================================================================</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">class GuiAppApplication final : public juce::JUCEApplication</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">{</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">public:</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    //==============================================================================</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    GuiAppApplication() {}</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    // We inject these as compile definitions from the CMakeLists.txt</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    // If you&#39;ve enabled the juce header with \`juce_generate_juce_header(&lt;thisTarget&gt;)\`</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    // you could \`#include &lt;JuceHeader.h&gt;\` and use \`ProjectInfo::projectName\` etc. instead.</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    const juce::String getApplicationName() override       { return JUCE_APPLICATION_NAME_STRING; }</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    const juce::String getApplicationVersion() override    { return JUCE_APPLICATION_VERSION_STRING; }</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    bool moreThanOneInstanceAllowed() override             { return true; }</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    //==============================================================================</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    void initialise (const juce::String&amp; commandLine) override</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    {</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        // This method is where you should put your application&#39;s initialisation code..</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        juce::ignoreUnused (commandLine);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        mainWindow.reset (new MainWindow (getApplicationName()));</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    }</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    void shutdown() override</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    {</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        // Add your application&#39;s shutdown code here..</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        mainWindow = nullptr;</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"> // (deletes our window)</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    }</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    //==============================================================================</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    void systemRequestedQuit() override</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    {</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        // This is called when the app is being asked to quit: you can ignore this</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        // request and let the app carry on running, or call quit() to allow the app to close.</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        quit();</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    }</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    void anotherInstanceStarted (const juce::String&amp; commandLine) override</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    {</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        // When another instance of the app is launched while this one is running,</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        // this method is invoked, and the commandLine parameter tells you what</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        // the other instance&#39;s command-line arguments were.</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        juce::ignoreUnused (commandLine);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    }</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    //==============================================================================</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    /*</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        This class implements the desktop window that contains an instance of</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        our MainComponent class.</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    */</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    class MainWindow final : public juce::DocumentWindow</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    {</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    public:</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        explicit MainWindow (juce::String name)</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">            : DocumentWindow (name,</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">                              juce::Desktop::getInstance().getDefaultLookAndFeel()</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">                                                          .findColour (backgroundColourId),</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">                              allButtons)</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        {</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">            setUsingNativeTitleBar (true);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">            setContentOwned (new MainComponent(), true);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">           #if JUCE_IOS || JUCE_ANDROID</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">            setFullScreen (true);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">           #else</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">            setResizable (true, true);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">            centreWithSize (getWidth(), getHeight());</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">           #endif</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">            setVisible (true);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        }</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        void closeButtonPressed() override</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        {</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">            // This is called when the user tries to close this window. Here, we&#39;ll just</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">            // ask the app to quit when this happens, but you can change this to do</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">            // whatever you need.</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">            getInstance()-&gt;systemRequestedQuit();</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        }</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        /* Note: Be careful if you override any DocumentWindow methods - the base</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">           class uses a lot of them, so by overriding you might break its functionality.</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">           It&#39;s best to do all your work in your content component instead, but if</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">           you really have to override any DocumentWindow methods, make sure your</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">           subclass also calls the superclass&#39;s method.</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        */</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    private:</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR (MainWindow)</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    };</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">private:</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    std::unique_ptr&lt;MainWindow&gt; mainWindow;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">};</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">//==============================================================================</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">// This macro generates the main() routine that launches the app.</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">START_JUCE_APPLICATION (GuiAppApplication)</span></span></code></pre></div><div class="language-cmake vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">cmake</span><pre class="shiki shiki-themes flexoki flexoki vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"># Example GUI App CMakeLists.txt</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"># To get started on a new GUI app, copy this entire folder (containing this file and C++ sources) to</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"># a convenient location, and then start making modifications. For other examples of CMakeLists for</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"># GUI apps, check \`extras/Projucer\` and \`examples/DemoRunner\` in the JUCE repo.</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"># The first line of any CMake project should be a call to \`cmake_minimum_required\`, which checks</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"># that the installed CMake will be able to understand the following CMakeLists, and ensures that</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"># CMake&#39;s behaviour is compatible with the named version. This is a standard CMake command, so more</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"># information can be found in the CMake docs.</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">cmake_minimum_required(VERSION 3.22)</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"># The top-level CMakeLists.txt file for a project must contain a literal, direct call to the</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"># \`project()\` command. \`project()\` sets up some helpful variables that describe source/binary</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"># directories, and the current project version. This is a standard CMake command.</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">project(GUI_APP_EXAMPLE VERSION 0.0.1)</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"># If you&#39;ve installed JUCE somehow (via a package manager, or directly using the CMake install</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"># target), you&#39;ll need to tell this project that it depends on the installed copy of JUCE. If you&#39;ve</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"># included JUCE directly in your source tree (perhaps as a submodule), you&#39;ll need to tell CMake to</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"># include that subdirectory as part of the build.</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"># find_package(JUCE CONFIG REQUIRED)        # If you&#39;ve installed JUCE to your system</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"># or</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"># add_subdirectory(JUCE)                    # If you&#39;ve put JUCE in a subdirectory called JUCE</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"># If your app depends the VST2 SDK, perhaps to host VST2 plugins, CMake needs to be told where</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"># to find the SDK on your system. This setup should be done before calling \`juce_add_gui_app\`.</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"># juce_set_vst2_sdk_path(...)</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"># \`juce_add_gui_app\` adds an executable target with the name passed as the first argument</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"># (GuiAppExample here). This target is a normal CMake target, but has a lot of extra properties set</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"># up by default. This function accepts many optional arguments. Check the readme at</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"># \`docs/CMake API.md\` in the JUCE repo for the full list.</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">juce_add_gui_app(GuiAppExample</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    # VERSION ...                       # Set this if the app version is different to the project version</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    # ICON_BIG ...                      # ICON_* arguments specify a path to an image file to use as an icon</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    # ICON_SMALL ...</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    # DOCUMENT_EXTENSIONS ...           # Specify file extensions that should be associated with this app</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    # COMPANY_NAME ...                  # Specify the name of the app&#39;s author</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    PRODUCT_NAME </span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">&quot;Gui App Example&quot;</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">      # The name of the final executable, which can differ from the target name</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    NEEDS_WEB_BROWSER FALSE             </span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"># Set to TRUE if you need to use webviews</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    NEEDS_CURL FALSE)                   </span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"># Set to TRUE if you need to use curl</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"># \`juce_generate_juce_header\` will create a JuceHeader.h for a given target, which will be generated</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"># into your build tree. This should be included with \`#include &lt;JuceHeader.h&gt;\`. The include path for</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"># this header will be automatically added to the target. The main function of the JuceHeader is to</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"># include all your JUCE module headers; if you&#39;re happy to include module headers directly, you</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"># probably don&#39;t need to call this.</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"># juce_generate_juce_header(GuiAppExample)</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"># \`target_sources\` adds source files to a target. We pass the target that needs the sources as the</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"># first argument, then a visibility parameter for the sources which should normally be PRIVATE.</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"># Finally, we supply a list of source files that will be built into the target. This is a standard</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"># CMake command.</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">target_sources(GuiAppExample</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    PRIVATE</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        Main.cpp</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        MainComponent.cpp)</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"># \`target_compile_definitions\` adds some preprocessor definitions to our target. In a Projucer</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"># project, these might be passed in the &#39;Preprocessor Definitions&#39; field. JUCE modules also make use</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"># of compile definitions to switch certain features on/off, so if there&#39;s a particular feature you</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"># need that&#39;s not on by default, check the module header for the correct flag to set here. These</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"># definitions will be visible both to your code, and also the JUCE module code, so for new</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"># definitions, pick unique names that are unlikely to collide! This is a standard CMake command.</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">target_compile_definitions(GuiAppExample</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    PRIVATE</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        # JUCE_WEB_BROWSER and JUCE_USE_CURL would be on by default, but you might not need them.</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        JUCE_WEB_BROWSER=0  </span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"># If you remove this, add \`NEEDS_WEB_BROWSER TRUE\` to the \`juce_add_gui_app\` call</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        JUCE_USE_CURL=0     </span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"># If you remove this, add \`NEEDS_CURL TRUE\` to the \`juce_add_gui_app\` call</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        JUCE_APPLICATION_NAME_STRING=</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">&quot;$&lt;TARGET_PROPERTY:GuiAppExample,JUCE_PRODUCT_NAME&gt;&quot;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        JUCE_APPLICATION_VERSION_STRING=</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">&quot;$&lt;TARGET_PROPERTY:GuiAppExample,JUCE_VERSION&gt;&quot;</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">)</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"># If your target needs extra binary assets, you can add them here. The first argument is the name of</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"># a new static library target that will include all the binary resources. There is an optional</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"># \`NAMESPACE\` argument that can specify the namespace of the generated binary data class. Finally,</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"># the SOURCES argument should be followed by a list of source files that should be built into the</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"># static library. These source files can be of any kind (wav data, images, fonts, icons etc.).</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"># Conversion to binary-data will happen when your target is built.</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"># juce_add_binary_data(GuiAppData SOURCES ...)</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"># \`target_link_libraries\` links libraries and JUCE modules to other libraries or executables. Here,</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"># we&#39;re linking our executable target to the \`juce::juce_gui_extra\` module. Inter-module</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"># dependencies are resolved automatically, so \`juce_core\`, \`juce_events\` and so on will also be</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"># linked automatically. If we&#39;d generated a binary data target above, we would need to link to it</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"># here too. This is a standard CMake command.</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">target_link_libraries(GuiAppExample</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    PRIVATE</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        # GuiAppData            # If we&#39;d created a binary data target, we&#39;d link to it here</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        juce::juce_gui_extra</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    PUBLIC</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        juce::juce_recommended_config_flags</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        juce::juce_recommended_lto_flags</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        juce::juce_recommended_warning_flags)</span></span></code></pre></div></div></div>`,5)])])}const o=a(C,[["render",l]]);export{c as __pageData,o as default};
