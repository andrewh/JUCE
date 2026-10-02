import{_ as i,o as a,c as n,a4 as C}from"./chunks/framework.YC5CMuPM.js";const D=JSON.parse('{"title":"FlexBox Layout","description":"","frontmatter":{"title":"FlexBox Layout","outline":false},"headers":[],"relativePath":"examples/flexbox.md","filePath":"examples/flexbox.md","lastUpdated":null}'),l={name:"examples/flexbox.md"};function e(t,s,p,h,k,r){return a(),n("div",null,[...s[0]||(s[0]=[C(`<h1 id="flexbox-layout" tabindex="-1">FlexBox Layout <a class="header-anchor" href="#flexbox-layout" aria-label="Permalink to &quot;FlexBox Layout&quot;">​</a></h1><p><strong>Interactive playground for FlexBox properties.</strong></p><ul><li>FlexBox and FlexItem</li><li>Responsive layout in resized</li><li>Property panels</li></ul><p>Source: <a href="https://github.com/juce-framework/JUCE/tree/master/examples/GUI/FlexBoxDemo.h" target="_blank" rel="noreferrer">examples/GUI/FlexBoxDemo.h</a> on GitHub.</p><div class="vp-code-group vp-adaptive-theme"><div class="tabs"><input type="radio" name="group-5q_7i" id="tab-CC2DlCY" checked><label data-title="FlexBoxDemo.h" for="tab-CC2DlCY">FlexBoxDemo.h</label></div><div class="blocks"><div class="language-cpp vp-adaptive-theme active"><button title="Copy Code" class="copy"></button><span class="lang">cpp</span><pre class="shiki shiki-themes flexoki flexoki vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">/*******************************************************************************</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"> The block below describes the properties of this PIP. A PIP is a short snippet</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"> of code that can be read by the Projucer and used to generate a JUCE project.</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"> BEGIN_JUCE_PIP_METADATA</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"> name:             FlexBoxDemo</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"> version:          1.0.0</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"> vendor:           JUCE</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"> website:          http://juce.com</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"> description:      Responsive layouts using FlexBox.</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"> dependencies:     juce_core, juce_data_structures, juce_events, juce_graphics,</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">                   juce_gui_basics</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"> exporters:        xcode_mac, vs2022, vs2026, linux_make, androidstudio,</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">                   xcode_iphone</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"> moduleFlags:      JUCE_STRICT_REFCOUNTEDPOINTER=1</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"> type:             Component</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"> mainClass:        FlexBoxDemo</span></span>
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
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">//==============================================================================</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">struct DemoFlexPanel final : public Component</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">{</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    DemoFlexPanel (Colour col, FlexItem&amp; item)</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        : flexItem (item), colour (col)</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    {</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        int x = 70;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        int y = 3;</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        setupTextEditor (flexOrderEditor, { x, y, 20, 18 }, </span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">&quot;0&quot;</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">, [this] { flexItem.order = (int) flexOrderEditor.getText().getFloatValue(); });</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        addLabel (</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">&quot;order&quot;</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">, flexOrderEditor);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        y += 20;</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        setupTextEditor (flexGrowEditor, { x, y, 20, 18 }, </span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">&quot;0&quot;</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">, [this] { flexItem.flexGrow = flexGrowEditor.getText().getFloatValue(); });</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        addLabel (</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">&quot;flex-grow&quot;</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">, flexGrowEditor);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        y += 20;</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        setupTextEditor (flexShrinkEditor, { x, y, 20, 18 }, </span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">&quot;1&quot;</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">, [this] { flexItem.flexShrink = flexShrinkEditor.getText().getFloatValue(); });</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        addLabel (</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">&quot;flex-shrink&quot;</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">, flexShrinkEditor);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        y += 20;</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        setupTextEditor (flexBasisEditor, { x, y, 33, 18 }, </span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">&quot;100&quot;</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">, [this] { flexItem.flexBasis = flexBasisEditor.getText().getFloatValue(); });</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        addLabel (</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">&quot;flex-basis&quot;</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">, flexBasisEditor);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        y += 20;</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        alignSelfCombo.addItem (</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">&quot;auto&quot;</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">,       1);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        alignSelfCombo.addItem (</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">&quot;flex-start&quot;</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">, 2);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        alignSelfCombo.addItem (</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">&quot;flex-end&quot;</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">,   3);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        alignSelfCombo.addItem (</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">&quot;center&quot;</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">,     4);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        alignSelfCombo.addItem (</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">&quot;stretch&quot;</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">,    5);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        alignSelfCombo.setBounds (x, y, 90, 18);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        alignSelfCombo.onChange = [this] { updateAssignSelf(); };</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        alignSelfCombo.setSelectedId (5);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        alignSelfCombo.setColour (ComboBox::outlineColourId, Colours::transparentBlack);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        addAndMakeVisible (alignSelfCombo);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        addLabel (</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">&quot;align-self&quot;</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">, alignSelfCombo);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    }</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    void setupTextEditor (TextEditor&amp; te, Rectangle&lt;int&gt; b, StringRef initialText, std::function&lt;void()&gt; updateFn)</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    {</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        te.setBounds (b);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        te.setText (initialText);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        te.onTextChange = [this, updateFn]</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        {</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">            updateFn();</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">            refreshLayout();</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        };</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        addAndMakeVisible (te);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    }</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    void addLabel (const String&amp; name, Component&amp; target)</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    {</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        auto label = new Label (name, name);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        label-&gt;attachToComponent (&amp;target, true);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        labels.add (label);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        addAndMakeVisible (label);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    }</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    void updateAssignSelf()</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    {</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        switch (alignSelfCombo.getSelectedId())</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        {</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">            case 1:  flexItem.alignSelf = FlexItem::AlignSelf::autoAlign; break;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">            case 2:  flexItem.alignSelf = FlexItem::AlignSelf::flexStart; break;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">            case 3:  flexItem.alignSelf = FlexItem::AlignSelf::flexEnd;   break;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">            case 4:  flexItem.alignSelf = FlexItem::AlignSelf::center;    break;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">            case 5:  flexItem.alignSelf = FlexItem::AlignSelf::stretch;   break;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">            default: break;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        }</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        refreshLayout();</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    }</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    void refreshLayout()</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    {</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        if (auto parent = getParentComponent())</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">            parent-&gt;resized();</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    }</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    void paint (Graphics&amp; g) override</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    {</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        auto r = getLocalBounds();</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        g.setColour (colour);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        g.fillRect (r);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        g.setColour (Colours::black);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        g.drawFittedText (</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">&quot;w: &quot;</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"> + String (r.getWidth()) + newLine + </span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">&quot;h: &quot;</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;"> + String (r.getHeight()),</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">                          r.reduced (4), Justification::bottomRight, 2);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    }</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    void lookAndFeelChanged() override</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    {</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        flexOrderEditor .applyFontToAllText (flexOrderEditor .getFont());</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        flexGrowEditor  .applyFontToAllText (flexGrowEditor  .getFont());</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        flexShrinkEditor.applyFontToAllText (flexShrinkEditor.getFont());</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        flexBasisEditor .applyFontToAllText (flexBasisEditor .getFont());</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    }</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    FlexItem&amp; flexItem;</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    TextEditor flexOrderEditor, flexGrowEditor, flexShrinkEditor, flexBasisEditor;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    ComboBox alignSelfCombo;</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    Colour colour;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    OwnedArray&lt;Label&gt; labels;</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR (DemoFlexPanel)</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">};</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">//==============================================================================</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">struct FlexBoxDemo final : public juce::Component</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">{</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    FlexBoxDemo()</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    {</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        setupPropertiesPanel();</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        setupFlexBoxItems();</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        setSize (1000, 500);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    }</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    void resized() override</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    {</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        flexBox.performLayout (getFlexBoxBounds());</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    }</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    Rectangle&lt;float&gt; getFlexBoxBounds() const</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    {</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        return getLocalBounds().withTrimmedLeft (300)</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">                               .reduced (10)</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">                               .toFloat();</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    }</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    void paint (Graphics&amp; g) override</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    {</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        g.fillAll (getUIColourIfAvailable (LookAndFeel_V4::ColourScheme::UIColour::windowBackground,</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">                                           Colours::lightgrey));</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        g.setColour (Colours::white);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        g.fillRect (getFlexBoxBounds());</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    }</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    void setupPropertiesPanel()</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    {</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        auto directionGroup = addControl (new GroupComponent (</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">&quot;direction&quot;</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">, </span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">&quot;flex-direction&quot;</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">));</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        directionGroup-&gt;setBounds (10, 30, 140, 110);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        int i = 0;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        int groupID    = 1234;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        int leftMargin = 15;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        int topMargin  = 45;</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        createToggleButton (</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">&quot;row&quot;</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">,            groupID, leftMargin, topMargin + i++ * 22, true,  [this] { flexBox.flexDirection = FlexBox::Direction::row; }).setToggleState (true, dontSendNotification);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        createToggleButton (</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">&quot;row-reverse&quot;</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">,    groupID, leftMargin, topMargin + i++ * 22, false, [this] { flexBox.flexDirection = FlexBox::Direction::rowReverse; });</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        createToggleButton (</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">&quot;column&quot;</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">,         groupID, leftMargin, topMargin + i++ * 22, false, [this] { flexBox.flexDirection = FlexBox::Direction::column; });</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        createToggleButton (</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">&quot;column-reverse&quot;</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">, groupID, leftMargin, topMargin + i++ * 22, false, [this] { flexBox.flexDirection = FlexBox::Direction::columnReverse; });</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        auto wrapGroup = addControl (new GroupComponent (</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">&quot;wrap&quot;</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">, </span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">&quot;flex-wrap&quot;</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">));</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        wrapGroup-&gt;setBounds (160, 30, 140, 110);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        i = 0;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        ++groupID;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        leftMargin = 165;</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        createToggleButton (</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">&quot;nowrap&quot;</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">,       groupID, leftMargin, topMargin + i++ * 22, false, [this] { flexBox.flexWrap = FlexBox::Wrap::noWrap; });</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        createToggleButton (</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">&quot;wrap&quot;</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">,         groupID, leftMargin, topMargin + i++ * 22, true,  [this] { flexBox.flexWrap = FlexBox::Wrap::wrap; });</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        createToggleButton (</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">&quot;wrap-reverse&quot;</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">, groupID, leftMargin, topMargin + i++ * 22, false, [this] { flexBox.flexWrap = FlexBox::Wrap::wrapReverse; });</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        auto justifyGroup = addControl (new GroupComponent (</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">&quot;justify&quot;</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">, </span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">&quot;justify-content&quot;</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">));</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        justifyGroup-&gt;setBounds (10, 150, 140, 140);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        i = 0;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        ++groupID;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        leftMargin = 15;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        topMargin  = 165;</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        createToggleButton (</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">&quot;flex-start&quot;</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">,    groupID, leftMargin, topMargin + i++ * 22, true,  [this] { flexBox.justifyContent = FlexBox::JustifyContent::flexStart; });</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        createToggleButton (</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">&quot;flex-end&quot;</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">,      groupID, leftMargin, topMargin + i++ * 22, false, [this] { flexBox.justifyContent = FlexBox::JustifyContent::flexEnd; });</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        createToggleButton (</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">&quot;center&quot;</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">,        groupID, leftMargin, topMargin + i++ * 22, false, [this] { flexBox.justifyContent = FlexBox::JustifyContent::center; });</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        createToggleButton (</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">&quot;space-between&quot;</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">, groupID, leftMargin, topMargin + i++ * 22, false, [this] { flexBox.justifyContent = FlexBox::JustifyContent::spaceBetween; });</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        createToggleButton (</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">&quot;space-around&quot;</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">,  groupID, leftMargin, topMargin + i++ * 22, false, [this] { flexBox.justifyContent = FlexBox::JustifyContent::spaceAround; });</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        auto alignGroup = addControl (new GroupComponent (</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">&quot;align&quot;</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">, </span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">&quot;align-items&quot;</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">));</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        alignGroup-&gt;setBounds (160, 150, 140, 140);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        i = 0;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        ++groupID;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        leftMargin = 165;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        topMargin  = 165;</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        createToggleButton (</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">&quot;stretch&quot;</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">,    groupID, leftMargin, topMargin + i++ * 22, true,  [this] { flexBox.alignItems = FlexBox::AlignItems::stretch; });</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        createToggleButton (</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">&quot;flex-start&quot;</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">, groupID, leftMargin, topMargin + i++ * 22, false, [this] { flexBox.alignItems = FlexBox::AlignItems::flexStart; });</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        createToggleButton (</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">&quot;flex-end&quot;</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">,   groupID, leftMargin, topMargin + i++ * 22, false, [this] { flexBox.alignItems = FlexBox::AlignItems::flexEnd; });</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        createToggleButton (</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">&quot;center&quot;</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">,     groupID, leftMargin, topMargin + i++ * 22, false, [this] { flexBox.alignItems = FlexBox::AlignItems::center; });</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        auto alignContentGroup = addControl (new GroupComponent (</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">&quot;content&quot;</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">, </span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">&quot;align-content&quot;</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">));</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        alignContentGroup-&gt;setBounds (10, 300, 140, 160);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        i = 0;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        ++groupID;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        leftMargin = 15;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        topMargin  = 315;</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        createToggleButton (</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">&quot;stretch&quot;</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">,       groupID, leftMargin, topMargin + i++ * 22, true,  [this] { flexBox.alignContent = FlexBox::AlignContent::stretch; });</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        createToggleButton (</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">&quot;flex-start&quot;</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">,    groupID, leftMargin, topMargin + i++ * 22, false, [this] { flexBox.alignContent = FlexBox::AlignContent::flexStart; });</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        createToggleButton (</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">&quot;flex-end&quot;</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">,      groupID, leftMargin, topMargin + i++ * 22, false, [this] { flexBox.alignContent = FlexBox::AlignContent::flexEnd; });</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        createToggleButton (</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">&quot;center&quot;</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">,        groupID, leftMargin, topMargin + i++ * 22, false, [this] { flexBox.alignContent = FlexBox::AlignContent::center; });</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        createToggleButton (</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">&quot;space-between&quot;</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">, groupID, leftMargin, topMargin + i++ * 22, false, [this] { flexBox.alignContent = FlexBox::AlignContent::spaceBetween; });</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        createToggleButton (</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">&quot;space-around&quot;</span><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">,  groupID, leftMargin, topMargin + i++ * 22, false, [this] { flexBox.alignContent = FlexBox::AlignContent::spaceAround; });</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    }</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    void setupFlexBoxItems()</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    {</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        addItem (Colours::orange);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        addItem (Colours::aqua);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        addItem (Colours::lightcoral);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        addItem (Colours::aquamarine);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        addItem (Colours::forestgreen);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    }</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    void addItem (Colour colour)</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    {</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        flexBox.items.add (FlexItem (100, 150)</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">                             .withMargin (10)</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">                             .withWidth (200));</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        auto&amp; flexItem = flexBox.items.getReference (flexBox.items.size() - 1);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        auto panel = panels.add (new DemoFlexPanel (colour, flexItem));</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        flexItem.associatedComponent = panel;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        addAndMakeVisible (panel);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    }</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    ToggleButton&amp; createToggleButton (StringRef text, int groupID, int x, int y, bool toggleOn, std::function&lt;void()&gt; fn)</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    {</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        auto* tb = buttons.add (new ToggleButton());</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        tb-&gt;setButtonText (text);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        tb-&gt;setRadioGroupId (groupID);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        tb-&gt;setToggleState (toggleOn, dontSendNotification);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        tb-&gt;onClick = [this, fn]</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        {</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">            fn();</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">            resized();</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        };</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        tb-&gt;setBounds (x, y, 130, 22);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        addAndMakeVisible (tb);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        return *tb;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    }</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    template &lt;typename ComponentType&gt;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    ComponentType* addControl (ComponentType* newControlComp)</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    {</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        controls.add (newControlComp);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        addAndMakeVisible (newControlComp);</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">        return newControlComp;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    }</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    FlexBox flexBox;</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    OwnedArray&lt;DemoFlexPanel&gt; panels;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    OwnedArray&lt;Component&gt; controls;</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    OwnedArray&lt;ToggleButton&gt; buttons;</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR (FlexBoxDemo)</span></span>
<span class="line"><span style="--shiki-light:#CECDC3;--shiki-dark:#CECDC3;">};</span></span></code></pre></div></div></div>`,5)])])}const E=i(l,[["render",e]]);export{D as __pageData,E as default};
