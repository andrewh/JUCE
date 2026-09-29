# Built-in widgets: labels, sliders, combo boxes, buttons, and tables

The controls you will use in almost every interface, and the patterns they share.

**Level:** Beginner

## The common pattern

Every widget follows the same recipe:

1. Own it as a member of your component.
2. In the constructor, configure it, wire its callback, and call
   `addAndMakeVisible()`.
3. Position it in `resized()`.
4. React to changes with a lambda, or with a listener.

Most widgets expose callback members (`onClick`, `onValueChange`, `onChange`,
`onTextChange`) that take a lambda. Prefer these to inheriting a `Listener`
class: no extra base class, no `if (slider == &a)` chains, and the wiring sits
next to the configuration. Listeners remain the right tool when many objects
observe one source (see [Listeners, ValueTree, and undo](04-listeners-and-state.md)).

When you change a widget from code, decide whether its callback should fire.
`setValue`, `setText`, `setSelectedId`, and `setToggleState` all take a
`juce::NotificationType`: pass `juce::dontSendNotification` to update silently
(the usual choice when mirroring state, and essential to avoid feedback loops)
or `juce::sendNotification` to fire the callback as if the user had acted.

## `Label`

A `Label` shows a single run of text in one font, size, and justification. For
rich text use `AttributedString` or `TextEditor`.

```cpp
title.setText ("Enter some text", juce::dontSendNotification);
title.setFont (juce::FontOptions (16.0f, juce::Font::bold));
title.setColour (juce::Label::textColourId, juce::Colours::lightgreen);
title.setJustificationType (juce::Justification::centred);
addAndMakeVisible (title);

// Attach a caption to another component: it follows the target automatically
caption.setText ("Text input:", juce::dontSendNotification);
caption.attachToComponent (&input, true);        // true = to the left, false = above
caption.setJustificationType (juce::Justification::right);

// Turn a label into a single-click text field
input.setEditable (true);
input.setColour (juce::Label::backgroundColourId, juce::Colours::darkblue);
input.onTextChange = [this]
{
    output.setText (input.getText().toUpperCase(), juce::dontSendNotification);
};
```

- If text does not fit, the label first squeezes it horizontally (down to
  `setMinimumHorizontalScale()`; `1.0f` disables squeezing), then truncates with
  an ellipsis. A tall enough label wraps onto several lines.
- `setEditable (singleClick, doubleClick, lossOfFocusDiscardsChanges)` chooses
  how editing starts. The change commits on Return or when focus leaves.
- Use `onEditorShow` to customise the temporary `TextEditor` (for example to
  set its font) and `outlineWhenEditingColourId` to style its border.
- `attachToComponent()` places the label outside the target's bounds, so you do
  not position it in `resized()`. Leave room for it.

## `Slider`

```cpp
frequency.setRange (50.0, 5000.0);           // optional third argument: interval
frequency.setTextValueSuffix (" Hz");
frequency.setSkewFactorFromMidPoint (500.0); // logarithmic-feeling response
frequency.setTextBoxStyle (juce::Slider::TextBoxLeft, false, 160,
                           frequency.getTextBoxHeight());
frequency.onValueChange = [this]
{
    duration.setValue (1.0 / frequency.getValue(), juce::dontSendNotification);
};
frequency.setValue (500.0);                   // fires the callback; the other slider follows
addAndMakeVisible (frequency);
```

- Set the range before the value, and give both linked sliders
  `dontSendNotification` when they update each other, or they will bounce values
  back and forth indefinitely.
- Pick a style with `setSliderStyle()`: linear horizontal or vertical, rotary,
  two- and three-value ranges, and more. `setNumDecimalPlacesToDisplay()` tidies
  the text box.
- Skew makes perceptual quantities such as frequency and gain comfortable to
  use: the given value sits at the middle of the track.
- For sliders bound to plug-in parameters use `SliderParameterAttachment` or
  `AudioProcessorValueTreeState::SliderAttachment` (see
  [Plug-in parameters](09-plugin-parameters.md)).

## `ComboBox`

A drop-down list of text items, each with a non-zero integer ID. ID `0` means
"nothing selected".

```cpp
enum StyleId { stylePlain = 1, styleBold, styleItalic };

style.addItem ("Plain",  stylePlain);
style.addItem ("Bold",   styleBold);
style.addItem ("Italic", styleItalic);
style.onChange = [this]
{
    auto font = sample.getFont();

    switch (style.getSelectedId())
    {
        case stylePlain:  font.setStyleFlags (juce::Font::plain);  break;
        case styleBold:   font.setStyleFlags (juce::Font::bold);   break;
        case styleItalic: font.setStyleFlags (juce::Font::italic); break;
    }

    sample.setFont (font);
};
style.setSelectedId (stylePlain);
addAndMakeVisible (style);

colours.addSectionHeading ("Reds");         // headings and separators have no ID
colours.addItem ("Dark red", 10);
colours.addSeparator();
colours.setEditableText (true);             // let users type their own value
```

- Give IDs names (an `enum`) rather than bare numbers. Other schemes are ID
  ranges per box (100, 101, ...; 200, 201, ...), IDs as indices into your own
  array (offset by one), or `String::hashCode()` (which can return zero).
- `getSelectedId()` returns the item ID, `getSelectedItemIndex()` the position,
  and `getText()` the visible text, which is what you want for editable boxes.
- `setItemEnabled (id, false)` greys an item out. `clear()` and `addItemList()`
  rebuild the list dynamically.
- When the box is editable, parse `getText()` yourself (for example as an ARGB
  hex colour) and handle bad input.

## Buttons, toggles, and radio groups

`TextButton` is a push button. `ToggleButton` is a checkbox. Any `Button` can
hold on/off state.

```cpp
okay.onClick = [this] { save(); };

male.setRadioGroupId (1001);      // buttons sharing a non-zero ID form a radio group
female.setRadioGroupId (1001);
male.onClick   = [this] { update (male, "Male"); };
female.onClick = [this] { update (female, "Female"); };

sport.onClick = [this] { update (sport, "Sport"); };   // no group: independent checkbox

void update (juce::Button& b, const juce::String& name)
{
    const bool on = b.getToggleState();
    b.setButtonText (name + (on ? " (selected)" : ""));
}
```

- Selecting one radio button deselects the others, and each change fires that
  button's `onClick`, so check `getToggleState()` on the button that fired.
- `setRadioGroupId (0)` removes a button from its group.
- To make any button, including a `TextButton`, toggle when clicked, call
  `setClickingTogglesState (true)`. Style its on and off colours with
  `buttonColourId` and `buttonOnColourId`.

## `TableListBox`

A scrollable table with resizable, sortable columns. You supply the data through
a `TableListBoxModel`; the table only asks for what is visible.

```cpp
class DataTable final : public juce::Component, private juce::TableListBoxModel
{
public:
    DataTable()
    {
        table.setModel (this);
        table.setColour (juce::ListBox::outlineColourId, juce::Colours::grey);
        table.setOutlineThickness (1);
        table.getHeader().addColumn ("Name",  1, 200, 50, 400,
                                     juce::TableHeaderComponent::defaultFlags);
        table.getHeader().addColumn ("Score", 2, 100);
        addAndMakeVisible (table);
    }

    void resized() override { table.setBounds (getLocalBounds()); }

    int getNumRows() override { return (int) rows.size(); }

    void paintRowBackground (juce::Graphics& g, int row, int, int, bool selected) override
    {
        g.fillAll (selected ? juce::Colours::lightblue
                            : (row % 2 ? juce::Colours::white : juce::Colours::whitesmoke));
    }

    void paintCell (juce::Graphics& g, int row, int columnId,
                    int width, int height, bool) override
    {
        g.setColour (juce::Colours::black);
        if (row < (int) rows.size())   // row may exceed the count while resizing
            g.drawText (columnId == 1 ? rows[(size_t) row].name
                                      : juce::String (rows[(size_t) row].score),
                        4, 0, width - 8, height, juce::Justification::centredLeft, true);
    }

    void sortOrderChanged (int columnId, bool forwards) override
    {
        std::stable_sort (rows.begin(), rows.end(), [=] (const Row& a, const Row& b)
        {
            const bool less = columnId == 1 ? a.name < b.name : a.score < b.score;
            return forwards ? less : ! less;
        });
        table.updateContent();
    }

private:
    struct Row { juce::String name; int score; };
    std::vector<Row> rows;
    juce::TableListBox table { "table", nullptr };
};
```

- Column IDs start at 1 and identify columns even after the user reorders them,
  so switch on `columnId`, never on position.
- For an editable or interactive cell, override `refreshComponentForCell()` and
  return a custom component (a `Label`, `ComboBox`, or `ToggleButton`). It is
  reused across rows: update `existingComponentToUpdate` when it is non-null
  instead of allocating again.
- Call `table.updateContent()` after the data changes, and `repaint()` for
  purely visual changes.
- Other useful callbacks: `cellClicked()`, `selectedRowsChanged()`,
  `deleteKeyPressed()`, and `getColumnAutoSizeWidth()`. Data loaded from XML or
  a `ValueTree` maps naturally onto rows.

## Sources

Condensed from the JUCE tutorials *The Label class*, *The Slider class*, *The
ComboBox class*, *Radio buttons and checkboxes*, and *The TableListBox class*,
Copyright (c) Raw Material Software Limited, ISC licence. See
[NOTICE.md](NOTICE.md).
