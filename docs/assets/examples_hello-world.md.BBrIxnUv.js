import{_ as a,o as n,c as i,a4 as l}from"./chunks/framework.YC5CMuPM.js";const d=JSON.parse('{"title":"Hello World","description":"","frontmatter":{"title":"Hello World","outline":false},"headers":[],"relativePath":"examples/hello-world.md","filePath":"examples/hello-world.md","lastUpdated":null}'),C={name:"examples/hello-world.md"};function e(p,s,t,h,k,r){return n(),i("div",null,[...s[0]||(s[0]=[l(`<h1 id="hello-world" tabindex="-1">Hello World <a class="header-anchor" href="#hello-world" aria-label="Permalink to &quot;Hello World&quot;">​</a></h1><p><strong>The classic first window.</strong></p><ul><li>Component basics</li><li>Graphics drawing calls</li><li>A first paint and resized pair</li></ul><p>Source: <a href="https://github.com/juce-framework/JUCE/tree/master/examples/GUI/HelloWorldDemo.h" target="_blank" rel="noreferrer">examples/GUI/HelloWorldDemo.h</a> on GitHub.</p><div class="vp-code-group vp-adaptive-theme"><div class="tabs"><input type="radio" name="group-_cc6f" id="tab-ITVQduM" checked><label data-title="HelloWorldDemo.h" for="tab-ITVQduM">HelloWorldDemo.h</label></div><div class="blocks"><div class="language-cpp vp-adaptive-theme active"><button title="Copy Code" class="copy"></button><span class="lang">cpp</span><pre class="shiki shiki-themes flexoki flexoki vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">/*******************************************************************************</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"> The block below describes the properties of this PIP. A PIP is a short snippet</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"> of code that can be read by the Projucer and used to generate a JUCE project.</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"> BEGIN_JUCE_PIP_METADATA</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"> name:             HelloWorldDemo</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"> version:          1.0.0</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"> vendor:           JUCE</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"> website:          http://juce.com</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"> description:      Simple HelloWorld application.</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"> dependencies:     juce_core, juce_data_structures, juce_events, juce_graphics,</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">                   juce_gui_basics</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"> exporters:        xcode_mac, vs2022, vs2026, linux_make, xcode_iphone</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"> moduleFlags:      JUCE_STRICT_REFCOUNTEDPOINTER=1</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"> type:             Component</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"> mainClass:        HelloWorldDemo</span></span>
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
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">class HelloWorldDemo final : public Component</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">{</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">public:</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    //==============================================================================</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    HelloWorldDemo()</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    {</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        addAndMakeVisible (helloWorldLabel);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        helloWorldLabel.setFont (FontOptions (40.00f, Font::bold));</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        helloWorldLabel.setJustificationType (Justification::centred);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        helloWorldLabel.setEditable (false, false, false);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        helloWorldLabel.setColour (Label::textColourId, Colours::black);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        helloWorldLabel.setColour (TextEditor::textColourId, Colours::black);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        helloWorldLabel.setColour (TextEditor::backgroundColourId, Colour (0x00000000));</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        addAndMakeVisible (quitButton);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        quitButton.onClick = [] { JUCEApplication::quit(); };</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        setSize (600, 300);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    }</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    //==============================================================================</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    void paint (Graphics&amp; g) override</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    {</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        g.fillAll (Colour (0xffc1d0ff));</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        g.setColour (Colours::white);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        g.fillPath (internalPath);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        g.setColour (Colour (0xff6f6f6f));</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        g.strokePath (internalPath, PathStrokeType (5.200f));</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    }</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    void resized() override</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    {</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        helloWorldLabel.setBounds (152, 80, 296, 48);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        quitButton.setBounds (getWidth() - 176, getHeight() - 60, 120, 32);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        internalPath.clear();</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        internalPath.startNewSubPath (136.0f, 80.0f);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        internalPath.quadraticTo (176.0f, 24.0f, 328.0f, 32.0f);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        internalPath.quadraticTo (472.0f, 40.0f, 472.0f, 104.0f);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        internalPath.quadraticTo (472.0f, 192.0f, 232.0f, 176.0f);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        internalPath.lineTo (184.0f, 216.0f);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        internalPath.lineTo (200.0f, 168.0f);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        internalPath.quadraticTo (96.0f, 136.0f, 136.0f, 80.0f);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        internalPath.closeSubPath();</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    }</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">private:</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    //==============================================================================</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    Label helloWorldLabel { {}, TRANS (</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">&quot;Hello World!&quot;</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">) };</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    TextButton quitButton { TRANS (</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">&quot;Quit&quot;</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">) };</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    Path internalPath;</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    //==============================================================================</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR (HelloWorldDemo)</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">};</span></span></code></pre></div></div></div>`,5)])])}const c=a(C,[["render",e]]);export{d as __pageData,c as default};
