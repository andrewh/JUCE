# Plug-in parameters and state

Expose controls to the host for automation, save and restore the plug-in's state,
and connect the GUI, using `AudioProcessorValueTreeState`.

**Level:** Intermediate  
**Prerequisite:** [Audio plug-in basics](08-plugin-basics.md)

## Parameters

A *parameter* is a value the host knows about: it can automate it, display it,
save it, and map it to a hardware control. Add one by constructing an
`AudioProcessorParameter` subclass and handing it to the processor in its
constructor with `addParameter()`. JUCE provides:

| Class                  | Holds                                     |
| ---------------------- | ----------------------------------------- |
| `AudioParameterFloat`  | A continuous value over a range           |
| `AudioParameterInt`    | An integer over a range                   |
| `AudioParameterBool`   | On or off                                 |
| `AudioParameterChoice` | An index into a list of strings           |

```cpp
addParameter (gain = new juce::AudioParameterFloat (
    { "gain", 1 },                                       // ID and version hint
    "Gain",                                              // name shown by the host
    juce::NormalisableRange<float> (0.0f, 1.0f),         // range (see below)
    0.5f));                                              // default

addParameter (invert = new juce::AudioParameterBool ({ "invert", 1 }, "Invert Phase", false));
```

- The **parameter ID** is a permanent, unique key, like a variable name that is
  written into saved sessions and automation. Never change it after release. Keep
  it to letters, digits, and underscores.
- The second half of the `ParameterID` is a **version hint** (start at `1`; increase
  it for parameters added in later releases). It controls ordering in Audio Unit
  plug-ins so that old sessions in Logic and GarageBand keep working.
- `NormalisableRange<float> (min, max, interval, skew)` sets the range and
  step, and optionally a skew so that, for instance, a frequency parameter is
  logarithmic. Pass `AudioParameterFloatAttributes().withLabel ("Hz")` as an extra
  argument for units, or custom text conversion functions for display.
- Read a value by dereferencing (`*gain`) or with `gain->get()`. It is atomic and
  safe on the audio thread. Write one from code with `*gain = 0.7f`.
- To change a parameter from the GUI so hosts record it, wrap the change in
  `beginChangeGesture()`, `setValueNotifyingHost (normalisedValue)`, and
  `endChangeGesture()`. Attachments (below) do this for you.

```cpp
void processBlock (juce::AudioBuffer<float>& buffer, juce::MidiBuffer&) override
{
    auto target = *gain * (*invert ? -1.0f : 1.0f);

    if (juce::approximatelyEqual (target, previousGain))
        buffer.applyGain (target);
    else
    {
        buffer.applyGainRamp (0, buffer.getNumSamples(), previousGain, target);  // no clicks
        previousGain = target;
    }
}

void prepareToPlay (double, int) override
{
    previousGain = *gain * (*invert ? -1.0f : 1.0f);   // avoid a ramp from zero on the first block
}
```

Changing a gain abruptly between blocks produces audible clicks, so ramp across
the block as above, or use a `SmoothedValue` for anything more elaborate.

## Saving and restoring state

The host asks the processor for a blob to store in the session, and hands it back
later. Store *everything* that defines the sound.

Hand-written XML is a good format, because it is human-readable and tolerant of
change:

```cpp
void getStateInformation (juce::MemoryBlock& dest) override
{
    juce::XmlElement xml ("MyPluginState");
    xml.setAttribute ("version", 1);
    xml.setAttribute ("gain", (double) *gain);
    xml.setAttribute ("invert", (bool) *invert);
    copyXmlToBinary (xml, dest);
}

void setStateInformation (const void* data, int size) override
{
    if (auto xml = getXmlFromBinary (data, size))            // null if the blob is not our XML
        if (xml->hasTagName ("MyPluginState"))
        {
            *gain   = (float) xml->getDoubleAttribute ("gain", 0.5);      // defaults for missing values
            *invert = xml->getBoolAttribute ("invert", false);
        }
}
```

Always validate what you read, supply defaults for anything missing so older or
newer sessions still load, and include a version number for future migration.

## `AudioProcessorValueTreeState`

Managing parameters, state, and GUI by hand repeats a lot of code.
`AudioProcessorValueTreeState` (APVTS) wraps the parameters of a processor in a
[`ValueTree`](04-listeners-and-state.md), giving you thread-safe access, automatic
serialisation, undo support, and attachments for GUI controls.

Declare it in the processor and build its parameters in a `ParameterLayout`:

```cpp
class MyProcessor final : public juce::AudioProcessor
{
public:
    MyProcessor()
        : AudioProcessor (BusesProperties()
                            .withInput  ("Input",  juce::AudioChannelSet::stereo(), true)
                            .withOutput ("Output", juce::AudioChannelSet::stereo(), true)),
          apvts (*this, nullptr, "Parameters", createLayout())      // nullptr: no undo manager
    {
        gainParam   = apvts.getRawParameterValue ("gain");
        invertParam = apvts.getRawParameterValue ("invert");
    }

    static juce::AudioProcessorValueTreeState::ParameterLayout createLayout()
    {
        juce::AudioProcessorValueTreeState::ParameterLayout layout;

        layout.add (std::make_unique<juce::AudioParameterFloat> (
            juce::ParameterID { "gain", 1 }, "Gain",
            juce::NormalisableRange<float> (0.0f, 1.0f), 0.5f));

        layout.add (std::make_unique<juce::AudioParameterBool> (
            juce::ParameterID { "invert", 1 }, "Invert Phase", false));

        layout.add (std::make_unique<juce::AudioParameterChoice> (
            juce::ParameterID { "mode", 1 }, "Mode",
            juce::StringArray { "Clean", "Warm", "Hot" }, 0));

        return layout;
    }

    void processBlock (juce::AudioBuffer<float>& buffer, juce::MidiBuffer&) override
    {
        auto target = gainParam->load() * (invertParam->load() < 0.5f ? 1.0f : -1.0f);
        // ...ramp as before...
    }

    void getStateInformation (juce::MemoryBlock& dest) override
    {
        auto state = apvts.copyState();
        if (auto xml = state.createXml())
            copyXmlToBinary (*xml, dest);
    }

    void setStateInformation (const void* data, int size) override
    {
        if (auto xml = getXmlFromBinary (data, size))
            if (xml->hasTagName (apvts.state.getType()))
                apvts.replaceState (juce::ValueTree::fromXml (*xml));
    }

    juce::AudioProcessorEditor* createEditor() override;      // defined after MyEditor, below

    juce::AudioProcessorValueTreeState apvts;

private:
    std::atomic<float>* gainParam   = nullptr;
    std::atomic<float>* invertParam = nullptr;
    float previousGain = 0.0f;
};
```

- Parameters added to the layout are added to the processor for you. Do not also
  call `addParameter()`.
- `getRawParameterValue (id)` returns a `std::atomic<float>*` holding the
  *denormalised* value (bools are 0 or 1, choices are the index). Look the pointer
  up once, in the constructor, and read it with `load()` in `processBlock()`.
- The APVTS must be attached to one processor, and live exactly as long as it. The
  simplest way is to make it a member of the processor. Declare it *before* any
  member that uses it.
- A `ParameterLayout` can also be built in a loop (`layout.add (...)` for
  N similar parameters), and grouped with `AudioProcessorParameterGroup` for
  hosts that show hierarchy.
- Pass a `juce::UndoManager*` in place of `nullptr` to make parameter edits
  undoable. Non-parameter state can live in `apvts.state` as extra child nodes or
  properties; it is saved and restored along with the parameters.
- To react to a parameter changing on the message thread, call
  `apvts.addParameterListener ("mode", this)` (and remove it in the destructor).

## Connecting the GUI: attachments

An *attachment* keeps a control and a parameter in sync in both directions,
sets the control's range from the parameter, and handles gestures and thread
safety. No listeners are needed.

```cpp
class MyEditor final : public juce::AudioProcessorEditor
{
public:
    explicit MyEditor (MyProcessor& p) : AudioProcessorEditor (&p)
    {
        gainLabel.setText ("Gain", juce::dontSendNotification);
        gainLabel.attachToComponent (&gainSlider, true);
        invertButton.setButtonText ("Invert Phase");

        modeBox.addItemList (juce::StringArray { "Clean", "Warm", "Hot" }, 1);   // items first, IDs from 1

        for (auto* c : std::initializer_list<juce::Component*> { &gainSlider, &invertButton, &modeBox, &gainLabel })
            addAndMakeVisible (c);

        gainAttachment   = std::make_unique<SliderAttachment>   (p.apvts, "gain",   gainSlider);
        invertAttachment = std::make_unique<ButtonAttachment>   (p.apvts, "invert", invertButton);
        modeAttachment   = std::make_unique<ComboBoxAttachment> (p.apvts, "mode",   modeBox);

        setSize (400, 140);
    }

    void resized() override
    {
        auto area = getLocalBounds().reduced (10);
        gainSlider.setBounds   (area.removeFromTop (40).withTrimmedLeft (60));
        invertButton.setBounds (area.removeFromTop (30));
        modeBox.setBounds      (area.removeFromTop (30));
    }

private:
    juce::Slider gainSlider;
    juce::Label gainLabel;
    juce::ToggleButton invertButton;
    juce::ComboBox modeBox;

    using SliderAttachment   = juce::AudioProcessorValueTreeState::SliderAttachment;
    using ButtonAttachment   = juce::AudioProcessorValueTreeState::ButtonAttachment;
    using ComboBoxAttachment = juce::AudioProcessorValueTreeState::ComboBoxAttachment;

    // Declared after the controls, so they are destroyed (and detach) first
    std::unique_ptr<SliderAttachment>   gainAttachment;
    std::unique_ptr<ButtonAttachment>   invertAttachment;
    std::unique_ptr<ComboBoxAttachment> modeAttachment;
};

juce::AudioProcessorEditor* MyProcessor::createEditor() { return new MyEditor (*this); }
```

- Declare attachments **after** the components they attach to, so they are
  destroyed (and detach) first.
- `SliderAttachment` sets the slider's range, interval, skew, and text from the
  parameter, so do not configure those yourself. Use your own `setTextValueSuffix()` etc.
  only for appearance.
- Add a combo box's items *before* creating its `ComboBoxAttachment`. The items
  are spread evenly across the parameter's range, so item ID `n` maps to choice
  index `n - 1`.
- If you need only a generic editor, `juce::GenericAudioProcessorEditor (*this)`
  builds one automatically from the parameters.

## Sources

Condensed from the JUCE tutorials *Adding plug-in parameters* and *Saving and
loading your plug-in state*, Copyright (c) Raw Material Software Limited, ISC
licence. See [NOTICE.md](NOTICE.md).
