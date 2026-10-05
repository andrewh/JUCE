# Built-in widgets: labels, sliders, combo boxes, buttons, and tables

The controls you will use in almost every interface, and the patterns they share.

**Level:** Beginner

## Set up the project

The project below already shows a label, a slider, a combo box, and a button wired with lambdas. The snippets that follow show each widget in more depth.

How to use the snippets below: widget snippets refer to members such as
`title`, `input`, and `output`. Declare those members in `MainComponent.h`, configure
them in the `MainComponent` constructor, and position them in `resized()`, as the
project below does for its own widgets.

This guide builds on [Getting started](01-getting-started.md), which explains
the CMake setup and `Main.cpp` in detail. To skip the typing, download the
starter project, **[WidgetsDemo.zip](downloads/WidgetsDemo.zip)**, and unzip it. It
contains exactly the four files below:

```text
WidgetsDemo/
├── CMakeLists.txt
├── Main.cpp
├── MainComponent.h
└── MainComponent.cpp
```

If you prefer, create the `WidgetsDemo` folder yourself and copy each file from this
page. Either way, `CMakeLists.txt` expects JUCE to be cloned to `~/JUCE`. If yours is elsewhere, change the path on the `file (REAL_PATH ...)` line. This
`CMakeLists.txt` names the target `WidgetsDemo` and links the modules this guide needs.

<!-- starter-zip: WidgetsDemo -->

**`CMakeLists.txt`**

```cmake
cmake_minimum_required(VERSION 3.22)
set(CMAKE_OSX_ARCHITECTURES "arm64" CACHE STRING "macOS architectures")  # must come before project()
project(WIDGETSDEMO VERSION 0.0.1)

file(REAL_PATH "~/JUCE" JUCE_DIR EXPAND_TILDE)   # JUCE cloned to ~/JUCE; or use find_package (JUCE CONFIG REQUIRED)
add_subdirectory(${JUCE_DIR} JUCE)

juce_add_gui_app(WidgetsDemo PRODUCT_NAME "Widgets Demo")

target_sources(WidgetsDemo PRIVATE Main.cpp MainComponent.cpp)

target_compile_definitions(WidgetsDemo PRIVATE
    JUCE_WEB_BROWSER=0
    JUCE_USE_CURL=0
    JUCE_APPLICATION_NAME_STRING="$<TARGET_PROPERTY:WidgetsDemo,JUCE_PRODUCT_NAME>"
    JUCE_APPLICATION_VERSION_STRING="$<TARGET_PROPERTY:WidgetsDemo,JUCE_VERSION>")

target_link_libraries(WidgetsDemo
    PRIVATE juce::juce_gui_extra
    PUBLIC  juce::juce_recommended_config_flags
            juce::juce_recommended_warning_flags)
```

**`Main.cpp`**

```cpp
#include "MainComponent.h"

class HelloJuceApplication final : public juce::JUCEApplication
{
public:
    const juce::String getApplicationName() override    { return JUCE_APPLICATION_NAME_STRING; }
    const juce::String getApplicationVersion() override { return JUCE_APPLICATION_VERSION_STRING; }

    void initialise (const juce::String&) override
    {
        mainWindow.reset (new MainWindow (getApplicationName()));
    }

    void shutdown() override { mainWindow = nullptr; }  // deletes the window

    void systemRequestedQuit() override { quit(); }

    class MainWindow final : public juce::DocumentWindow
    {
    public:
        explicit MainWindow (juce::String name)
            : DocumentWindow (name, juce::Colours::lightgrey, allButtons)
        {
            setUsingNativeTitleBar (true);
            setContentOwned (new MainComponent(), true);
            setResizable (true, true);
            centreWithSize (getWidth(), getHeight());
            setVisible (true);   // required, or the window never appears
        }

        void closeButtonPressed() override
        {
            juce::JUCEApplication::getInstance()->systemRequestedQuit();
        }
    };

private:
    std::unique_ptr<MainWindow> mainWindow;
};

START_JUCE_APPLICATION (HelloJuceApplication)
```

This is the `Main.cpp` from tutorial 1, unchanged, and it stays unchanged for the rest of this guide.

**`MainComponent.h`**

```cpp
#pragma once

#include <juce_gui_extra/juce_gui_extra.h>

class MainComponent final : public juce::Component
{
public:
    MainComponent();

    void resized() override;

private:
    juce::Label title, caption, input, output;
    juce::Slider slider;
    juce::ComboBox choice;
    juce::TextButton button { "Click me" };

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR (MainComponent)
};
```

**`MainComponent.cpp`**

```cpp
#include "MainComponent.h"

MainComponent::MainComponent()
{
    title.setText ("Widgets", juce::dontSendNotification);
    title.setFont (juce::FontOptions (16.0f, juce::Font::bold));
    title.setJustificationType (juce::Justification::centred);
    addAndMakeVisible (title);

    caption.setText ("Text input:", juce::dontSendNotification);
    caption.attachToComponent (&input, true);   // sits to the left of `input`
    caption.setJustificationType (juce::Justification::right);

    input.setEditable (true);
    input.setText ("click to edit", juce::dontSendNotification);
    input.setColour (juce::Label::backgroundColourId, juce::Colours::darkblue);
    input.onTextChange = [this]
    {
        output.setText (input.getText().toUpperCase(), juce::dontSendNotification);
    };
    addAndMakeVisible (input);
    addAndMakeVisible (output);

    slider.setRange (0.0, 100.0);
    slider.setValue (50.0);
    slider.onValueChange = [this]
    {
        output.setText ("Slider: " + juce::String (slider.getValue()), juce::dontSendNotification);
    };
    addAndMakeVisible (slider);

    choice.addItem ("First", 1);
    choice.addItem ("Second", 2);
    choice.setSelectedId (1);
    choice.onChange = [this]
    {
        output.setText ("Chose: " + choice.getText(), juce::dontSendNotification);
    };
    addAndMakeVisible (choice);

    button.onClick = [this]
    {
        output.setText ("Clicked", juce::dontSendNotification);
    };
    addAndMakeVisible (button);

    setSize (400, 300);
}

void MainComponent::resized()
{
    auto area = getLocalBounds().reduced (10);
    title.setBounds   (area.removeFromTop (30));
    input.setBounds   (area.removeFromTop (30).withTrimmedLeft (100));
    output.setBounds  (area.removeFromTop (30).withTrimmedLeft (100));
    slider.setBounds  (area.removeFromTop (40));
    choice.setBounds  (area.removeFromTop (30));
    button.setBounds  (area.removeFromTop (40).reduced (60, 5));
}
```

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

## Build and run

With all the files in place, configure and build from the project folder:

```sh
cmake -B build
cmake --build build
```

The build puts the finished app in `build/WidgetsDemo_artefacts/`. With CMake's default generator (Makefiles on macOS and Linux):

| Platform | Run it with |
| -------- | ----------- |
| macOS    | `open "build/WidgetsDemo_artefacts/Widgets Demo.app"` |
| Linux    | `./build/WidgetsDemo_artefacts/Widgets\ Demo` |

The Xcode generator is multi-config and adds a configuration folder,
for example `build/WidgetsDemo_artefacts/Debug/Widgets Demo.app`; build with
`cmake --build build --config Debug`.

> **"The application cannot be opened because its executable is missing"?**
> CMake creates the empty `.app` bundle at the start of the build and only fills
> in the executable when compiling and linking succeed. If `cmake --build build`
> reported errors, fix them and build again, then re-run `open`. Check that the
> last lines of the build output say `Built target WidgetsDemo`.

> **"use of undeclared identifier 'juce'"?** CMake projects have no
> `JuceHeader.h`, so every source file must include the module headers it uses.
> `MainComponent.h` includes them and `Main.cpp` includes `MainComponent.h`.
> Without those includes the compiler does not know what `juce::`, `std::`, or
> `START_JUCE_APPLICATION` mean.

## Sources

Condensed from the JUCE tutorials *The Label class*, *The Slider class*, *The
ComboBox class*, *Radio buttons and checkboxes*, and *The TableListBox class*,
Copyright (c) Raw Material Software Limited, ISC licence. See
[NOTICE.md](NOTICE.md).
