# Listeners, `ValueTree`, and undo

How JUCE objects tell each other about changes, and how to build an application
data model that notifies, serialises, and undoes for free.

**Level:** Beginner to intermediate

## Set up the project

This example app walks you through every technique in this guide.
It has a clock button, a `ValueTree` that models a pet and its accessories,
buttons that edit the tree with undo, save and load, and a log pane that
prints every change the tree broadcasts.

This guide builds on [Getting started](01-getting-started.md), which explains
the CMake setup and `Main.cpp` in detail. To skip the typing, download the
starter project, **[ListenersDemo.zip](downloads/ListenersDemo.zip)**, and unzip it. It
contains exactly the four files below:

```text
ListenersDemo/
├── CMakeLists.txt
├── Main.cpp
├── MainComponent.h
└── MainComponent.cpp
```

If you prefer, create the `ListenersDemo` folder yourself and copy each file from this
page. Either way, `/path/to/JUCE` in `CMakeLists.txt` stands for the JUCE path
you used in tutorial 1, so change it to point at your copy of JUCE. This
`CMakeLists.txt` names the target `ListenersDemo` and links the modules this guide needs.

<!-- starter-zip: ListenersDemo -->

**`CMakeLists.txt`**

```cmake
cmake_minimum_required(VERSION 3.22)
set(CMAKE_OSX_ARCHITECTURES "arm64" CACHE STRING "macOS architectures")  # must come before project()
project(LISTENERSDEMO VERSION 0.0.1)

add_subdirectory(/path/to/JUCE JUCE)   # or find_package (JUCE CONFIG REQUIRED)

juce_add_gui_app(ListenersDemo PRODUCT_NAME "Listeners Demo")

target_sources(ListenersDemo PRIVATE Main.cpp MainComponent.cpp)

target_compile_definitions(ListenersDemo PRIVATE
    JUCE_WEB_BROWSER=0
    JUCE_USE_CURL=0
    JUCE_APPLICATION_NAME_STRING="$<TARGET_PROPERTY:ListenersDemo,JUCE_PRODUCT_NAME>"
    JUCE_APPLICATION_VERSION_STRING="$<TARGET_PROPERTY:ListenersDemo,JUCE_VERSION>")

target_link_libraries(ListenersDemo
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

namespace IDs
{
    #define DECLARE_ID(name) const juce::Identifier name (#name);
    DECLARE_ID (Pet)        DECLARE_ID (name)     DECLARE_ID (animal)
    DECLARE_ID (Accessories) DECLARE_ID (Collar)  DECLARE_ID (Camera)
    DECLARE_ID (colour)     DECLARE_ID (hasFlash) DECLARE_ID (capacity)
    #undef DECLARE_ID
}

class MainComponent final : public juce::Component,
                            private juce::Button::Listener,
                            private juce::ValueTree::Listener,
                            private juce::ChangeListener
{
public:
    MainComponent();
    ~MainComponent() override;

    void resized() override;

private:
    // juce::Button::Listener
    void buttonClicked (juce::Button* button) override;

    // juce::ValueTree::Listener (every callback has an empty default)
    void valueTreePropertyChanged (juce::ValueTree& tree, const juce::Identifier& property) override;
    void valueTreeChildAdded (juce::ValueTree& parent, juce::ValueTree& child) override;
    void valueTreeChildRemoved (juce::ValueTree& parent, juce::ValueTree& child, int index) override;

    // juce::ChangeListener: the UndoManager is a ChangeBroadcaster
    void changeListenerCallback (juce::ChangeBroadcaster* source) override;

    void log (const juce::String& message);
    juce::File getSaveFile() const;

    juce::UndoManager undoManager;      // declared first, so it outlives the tree
    juce::ValueTree pet { IDs::Pet };

    juce::TextButton checkTime { "Check the time..." };
    juce::Label timeLabel;
    juce::TextButton rename { "Rename" }, addCamera { "Add camera" };
    juce::TextButton undo { "Undo" }, redo { "Redo" }, save { "Save" }, load { "Load" };
    juce::TextEditor logView;

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR (MainComponent)
};
```

**`MainComponent.cpp`**

```cpp
#include "MainComponent.h"

MainComponent::MainComponent()
{
    // Build the data model. nullptr means "no undo" for this initial set-up.
    pet.setProperty (IDs::name, "Fluffmuff", nullptr);
    pet.setProperty (IDs::animal, "Cat", nullptr);

    juce::ValueTree accessories (IDs::Accessories);
    pet.addChild (accessories, -1, nullptr);

    juce::ValueTree collar (IDs::Collar);
    collar.setProperty (IDs::colour, "Pink", nullptr);
    accessories.addChild (collar, -1, nullptr);

    // Listen only after set-up, so the log starts empty.
    pet.addListener (this);
    undoManager.addChangeListener (this);

    // Option 2: a listener class (this component) for the clock button.
    addAndMakeVisible (checkTime);
    checkTime.addListener (this);

    addAndMakeVisible (timeLabel);
    timeLabel.setJustificationType (juce::Justification::centred);

    // Option 1: lambda callbacks for everything else.
    for (auto* b : { &rename, &addCamera, &undo, &redo, &save, &load })
        addAndMakeVisible (*b);

    rename.onClick = [this]
    {
        undoManager.beginNewTransaction ("Rename pet");   // one step per click
        pet.setProperty (IDs::name,
                         pet[IDs::name].toString() == "Fluffmuff" ? "Whiskers" : "Fluffmuff",
                         &undoManager);
    };

    addCamera.onClick = [this]
    {
        undoManager.beginNewTransaction ("Add camera");

        juce::ValueTree camera (IDs::Camera);
        camera.setProperty (IDs::hasFlash, false, nullptr);   // not yet in the tree, so no undo
        camera.setProperty (IDs::capacity, 32, nullptr);
        pet.getChildWithName (IDs::Accessories).addChild (camera, -1, &undoManager);
    };

    undo.onClick = [this] { undoManager.undo(); };
    redo.onClick = [this] { undoManager.redo(); };

    save.onClick = [this]
    {
        if (auto xml = pet.createXml())
        {
            if (xml->writeTo (getSaveFile()))
                log ("Saved to " + getSaveFile().getFullPathName());
            else
                log ("Could not save to " + getSaveFile().getFullPathName());
        }
    };

    load.onClick = [this]
    {
        if (auto parsed = juce::XmlDocument::parse (getSaveFile()))
        {
            auto loaded = juce::ValueTree::fromXml (*parsed);

            if (loaded.hasType (IDs::Pet))
            {
                // Copy into the existing node so our listener stays attached.
                undoManager.beginNewTransaction ("Load pet");
                pet.copyPropertiesAndChildrenFrom (loaded, &undoManager);
            }
        }
        else
        {
            log ("Nothing saved yet: press Save first");
        }
    };

    logView.setMultiLine (true);
    logView.setReadOnly (true);
    addAndMakeVisible (logView);

    changeListenerCallback (&undoManager);   // set the initial button states
    log (pet.toXmlString());

    setSize (460, 420);
}

MainComponent::~MainComponent()
{
    checkTime.removeListener (this);
    pet.removeListener (this);
    undoManager.removeChangeListener (this);
}

void MainComponent::resized()
{
    auto area = getLocalBounds().reduced (10);

    auto placeRow = [&area] (std::initializer_list<juce::Component*> items)
    {
        auto row = area.removeFromTop (32);
        const auto width = row.getWidth() / (int) items.size();

        for (auto* item : items)
            item->setBounds (row.removeFromLeft (width).reduced (2, 0));

        area.removeFromTop (6);
    };

    checkTime.setBounds (area.removeFromTop (40));
    timeLabel.setBounds (area.removeFromTop (30));
    area.removeFromTop (6);

    placeRow ({ &rename, &addCamera });
    placeRow ({ &undo, &redo, &save, &load });

    logView.setBounds (area);
}

void MainComponent::buttonClicked (juce::Button* button)
{
    if (button == &checkTime)          // one listener often serves several broadcasters
        timeLabel.setText (juce::Time::getCurrentTime().toString (true, true),
                           juce::dontSendNotification);
}

void MainComponent::valueTreePropertyChanged (juce::ValueTree& tree, const juce::Identifier& property)
{
    log (tree.getType().toString() + "." + property.toString()
         + " is now " + tree[property].toString());
}

void MainComponent::valueTreeChildAdded (juce::ValueTree& parent, juce::ValueTree& child)
{
    log (child.getType().toString() + " added to " + parent.getType().toString());
}

void MainComponent::valueTreeChildRemoved (juce::ValueTree& parent, juce::ValueTree& child, int)
{
    log (child.getType().toString() + " removed from " + parent.getType().toString());
}

void MainComponent::changeListenerCallback (juce::ChangeBroadcaster*)
{
    undo.setEnabled (undoManager.canUndo());
    redo.setEnabled (undoManager.canRedo());
}

void MainComponent::log (const juce::String& message)
{
    DBG (message);
    logView.moveCaretToEnd();
    logView.insertTextAtCaret (message + "\n");
}

juce::File MainComponent::getSaveFile() const
{
    return juce::File::getSpecialLocation (juce::File::tempDirectory).getChildFile ("ListenersDemoPet.xml");
}
```

Build and run it (see [Build and run](#build-and-run)) to see the app working, then read on. Most
snippets below are excerpts of these two files, so you can find them in context and
change them. The exceptions are labelled: the clock-button lambda in
[Option 1](#option-1-lambda-callbacks) is an alternative to code in the demo, and the
read-back lines in [The three types you use with it](#the-three-types-you-use-with-it)
are an exercise to add yourself.

What each part of the window demonstrates:

| Control                                                            | Technique                              | Section                                         |
| ------------------------------------------------------------------ | -------------------------------------- | ----------------------------------------------- |
| **Check the time...**                                              | listener class (`Button::Listener`)    | [Option 2](#option-2-listener-classes)          |
| **Rename**, **Add camera**, **Undo**, **Redo**, **Save**, **Load** | lambda callbacks (`onClick`)           | [Option 1](#option-1-lambda-callbacks)          |
| Log pane                                                           | `ValueTree::Listener`                  | [Listening for changes](#listening-for-changes) |
| Undo and Redo enabled state                                        | `UndoManager` as a `ChangeBroadcaster` | [Undo and redo](#undo-and-redo)                 |

`DBG (...)` also prints each log line to your IDE's debug console in a debug build.

## Listeners and broadcasters

Buttons, sliders, combo boxes, `ValueTree`, `ChangeBroadcaster`, `Timer` and many
others broadcast changes. Anything interested registers as a listener. The demo
uses both styles side by side.

### Option 1: lambda callbacks

For widgets that offer them (`onClick`, `onValueChange`, `onChange`,
`onTextChange`), assign a lambda. There is nothing to register or remove. The
demo's **Undo** and **Redo** buttons are two of these, in the
`MainComponent` constructor:

```cpp
undo.onClick = [this] { undoManager.undo(); };
redo.onClick = [this] { undoManager.redo(); };
```

You could drive the clock button the same way. To try it, delete the
`checkTime.addListener (this)` and `checkTime.removeListener (this)` lines, delete
`buttonClicked()`, and assign this in the constructor instead:

```cpp
checkTime.onClick = [this]
{
    timeLabel.setText (juce::Time::getCurrentTime().toString (true, true),
                       juce::dontSendNotification);
};
```

`dontSendNotification` stops the label broadcasting its own change to _its_
listeners. Use `sendNotification` when others should hear about it.

### Option 2: listener classes

Derive from the broadcaster's listener class, implement its callback, and
register. `MainComponent` does this for the clock button: it inherits
`juce::Button::Listener`, registers in the constructor, deregisters in the
destructor, and implements `buttonClicked()`:

```cpp
checkTime.addListener (this);                // constructor
checkTime.removeListener (this);             // destructor

void MainComponent::buttonClicked (juce::Button* button)
{
    if (button == &checkTime)          // one listener often serves several broadcasters
        timeLabel.setText (juce::Time::getCurrentTime().toString (true, true),
                           juce::dontSendNotification);
}
```

- Listener classes have one required (pure virtual) callback and optional extras.
  The callback receives a pointer or reference to the broadcaster, so compare it
  with your members when you listen to more than one.
- Always deregister in the destructor if the broadcaster can outlive you.
  Broadcasters that you own as members are destroyed with you, but listeners
  attached to longer-lived objects must be removed or they will call into freed
  memory. The demo removes all three of its registrations in `~MainComponent()`.
- `ChangeBroadcaster` uses `addChangeListener()` and `changeListenerCallback()`.
  It sends asynchronously on the message thread, so it is safe to trigger from
  any thread and coalesces bursts of changes. `UndoManager` is one, and the demo
  uses it to enable and disable the Undo and Redo buttons.

## `ValueTree`: an application data model

A `ValueTree` is a reference-counted tree of nodes. Each node has a type, any
number of named properties, and any number of child nodes, like an XML element.
It gives you serialisation, change notification, and undo with one interface. The
demo's `pet` member holds this tree, built in the constructor:

```
Pet   name="Fluffmuff"  animal="Cat"
 └─ Accessories
     └─ Collar   colour="Pink"
```

Pressing **Add camera** appends a `Camera` node (`hasFlash=false capacity=32`) under
`Accessories`.

### The three types you use with it

- **`ValueTree`**: the node. Copying it copies a _reference_, not the data, so it
  is cheap to pass by value and returned nodes stay alive as long as anything
  refers to them. Use `createCopy()` for a deep copy. A default-constructed tree
  is invalid (like a null pointer, but safe to call): check with `isValid()`.
  Reassigning a `ValueTree` may free data, so avoid it on the audio thread.
- **`juce::var`**: the value of every property. It holds `int`, `double`, `bool`,
  `String`, arrays, and objects, so one interface serves any data.
- **`juce::Identifier`**: the type of node names and the key of properties. It is
  a string interned in a global pool, which makes comparison a pointer check but
  makes creation from a string comparatively costly. Create identifiers once
  (static or a namespace of constants) and reuse them, rather than building them
  from string literals in hot code.

The `IDs` namespace at the top of `MainComponent.h` is the "create once" pattern,
and the constructor builds the tree with it:

```cpp
pet.setProperty (IDs::name, "Fluffmuff", nullptr);   // nullptr: no undo
pet.setProperty (IDs::animal, "Cat", nullptr);

juce::ValueTree accessories (IDs::Accessories);
pet.addChild (accessories, -1, nullptr);             // -1 appends

juce::ValueTree collar (IDs::Collar);
collar.setProperty (IDs::colour, "Pink", nullptr);
accessories.addChild (collar, -1, nullptr);
```

Reading back works the same way. Try adding these lines at the end of the
constructor, and read the output in the debug console:

```cpp
juce::String name = pet[IDs::name];                    // var converts implicitly
int capacity = pet.getChildWithName (IDs::Accessories)
                  .getChildWithName (IDs::Camera)
                  .getProperty (IDs::capacity, -1);    // second argument: default
DBG (name << ", camera capacity " << capacity);        // -1 until a camera is added

for (int i = 0; i < pet.getNumProperties(); ++i)       // reflection over the data
    DBG (pet.getPropertyName (i).toString() << " = "
         << pet.getProperty (pet.getPropertyName (i)).toString());
```

Other lookups: `getChild (index)`, `getChildWithProperty()`, `hasProperty()`,
`removeProperty()`, `removeChild()`, `getParent()`, and range-for over the
children. Anything that finds nothing returns an invalid tree. A node's type
cannot change after creation.

### Serialisation

The **Save** and **Load** buttons write the tree to `ListenersDemoPet.xml` in your
temporary folder and read it back:

```cpp
save.onClick = [this]
{
    if (auto xml = pet.createXml())
    {
        if (xml->writeTo (getSaveFile()))
            log ("Saved to " + getSaveFile().getFullPathName());
        else
            log ("Could not save to " + getSaveFile().getFullPathName());
    }
};

load.onClick = [this]
{
    if (auto parsed = juce::XmlDocument::parse (getSaveFile()))
    {
        auto loaded = juce::ValueTree::fromXml (*parsed);

        if (loaded.hasType (IDs::Pet))
        {
            // Copy into the existing node so our listener stays attached.
            undoManager.beginNewTransaction ("Load pet");
            pet.copyPropertiesAndChildrenFrom (loaded, &undoManager);
        }
    }
    else
    {
        log ("Nothing saved yet: press Save first");
    }
};
```

To see it work: press **Save**, press **Rename** and **Add camera**, then press
**Load**. The log shows the tree returning to the saved state, and **Undo** takes
you back to the edited one.

Load copies into the existing `pet` with `copyPropertiesAndChildrenFrom()` rather
than assigning `pet = ValueTree::fromXml (...)`. Assignment would swap `pet` for a
different node, and the listener registered on the old node would hear nothing
more. Copying into the existing node keeps listeners attached and makes the load
undoable.

`ValueTree` can also write a compact binary form (`writeToStream()` and
`readFromStream()`), which is what plug-ins typically store as their state.

### Listening for changes

`MainComponent` also inherits `juce::ValueTree::Listener`, registers on `pet` in the
constructor, and overrides three of its callbacks. Every callback has an empty
default, so you override only the ones you need:

```cpp
void MainComponent::valueTreePropertyChanged (juce::ValueTree& tree, const juce::Identifier& property)
{
    log (tree.getType().toString() + "." + property.toString()
         + " is now " + tree[property].toString());
}

void MainComponent::valueTreeChildAdded (juce::ValueTree& parent, juce::ValueTree& child)
{
    log (child.getType().toString() + " added to " + parent.getType().toString());
}
```

Press **Rename** and **Add camera** and watch these lines appear in the log. The
other callbacks are `valueTreeChildRemoved()` (the demo logs this when you undo
**Add camera**), `valueTreeChildOrderChanged()`, `valueTreeParentChanged()`, and
`valueTreeRedirected()`.

- Callbacks are **synchronous** and propagate _up_ the tree, so a listener on the
  root hears about every descendant, as in the demo, where `Camera` is added to
  `Accessories` and `pet` is told. Filter with `tree == myNode` or by type.
- Do not do slow work in them. Hand it to an `AsyncUpdater` or a `Timer`.
- `juce::CachedValue<T>` binds a property to a typed C++ member that stays in
  sync, and `getPropertyAsValue()` gives a `juce::Value` that GUI components can
  share.

### Undo and redo

Every mutating call (`setProperty`, `addChild`, `removeChild`, `moveChild`,
`copyPropertiesFrom`, ...) takes an optional `UndoManager*`. Pass one, and the
change becomes an undoable action. Pass `nullptr` and it is just applied. The
demo owns one `UndoManager`, declared before `pet` so it outlives the tree, and
the **Rename** and **Add camera** buttons pass it in:

```cpp
rename.onClick = [this]
{
    undoManager.beginNewTransaction ("Rename pet");   // one step per click
    pet.setProperty (IDs::name,
                     pet[IDs::name].toString() == "Fluffmuff" ? "Whiskers" : "Fluffmuff",
                     &undoManager);
};

addCamera.onClick = [this]
{
    undoManager.beginNewTransaction ("Add camera");

    juce::ValueTree camera (IDs::Camera);
    camera.setProperty (IDs::hasFlash, false, nullptr);   // not yet in the tree, so no undo
    camera.setProperty (IDs::capacity, 32, nullptr);
    pet.getChildWithName (IDs::Accessories).addChild (camera, -1, &undoManager);
};
```

The **Undo** and **Redo** buttons you saw under [Option 1](#option-1-lambda-callbacks)
call `undoManager.undo()` and `redo()`. Their enabled state follows the manager
because `MainComponent` is a change listener on it:

```cpp
void MainComponent::changeListenerCallback (juce::ChangeBroadcaster*)
{
    undo.setEnabled (undoManager.canUndo());
    redo.setEnabled (undoManager.canRedo());
}
```

- Changes made between calls to `beginNewTransaction()` undo together. If you
  never begin a new transaction, everything merges into one, so begin one per
  user gesture, for example when a drag ends, or from a timer that fires every
  few hundred milliseconds while a document changes. The demo begins one per
  click.
- Listeners fire on undo and redo exactly as on ordinary edits. Press **Undo** and
  the log prints the reversed change through the same `valueTreePropertyChanged()`
  and `valueTreeChildRemoved()` callbacks, so a UI that redraws from the tree needs
  no undo-specific code.
- Bound the history with `setMaxNumberOfStoredUnits()`. For custom operations,
  subclass `UndoableAction` and hand it to `perform()`.
- Keep the `UndoManager` at a scope that lives as long as the tree it edits. When
  bound to a plug-in, `AudioProcessorValueTreeState` accepts one in its
  constructor (see [Plug-in parameters](09-plugin-parameters.md)).

## Build and run

With all the files in place, configure and build from the project folder:

```sh
cmake -B build
cmake --build build
```

The build puts the finished app in `build/ListenersDemo_artefacts/`. With CMake's default generator on each platform (Makefiles on macOS and Linux, and
Visual Studio on Windows, which adds the `Debug` folder):

| Platform | Run it with                                                |
| -------- | ---------------------------------------------------------- |
| macOS    | `open "build/ListenersDemo_artefacts/Listeners Demo.app"`  |
| Linux    | `./build/ListenersDemo_artefacts/Listeners\ Demo`          |
| Windows  | `"build\ListenersDemo_artefacts\Debug\Listeners Demo.exe"` |

In PowerShell, put `&` before the quoted path.

Xcode and Visual Studio are multi-config generators and add a configuration folder,
for example `build/ListenersDemo_artefacts/Debug/Listeners Demo.app`; build with
`cmake --build build --config Debug`. With Ninja there is no configuration folder, so
drop `Debug` from the Windows path.

> **"The application cannot be opened because its executable is missing"?**
> CMake creates the empty `.app` bundle at the start of the build and only fills
> in the executable when compiling and linking succeed. If `cmake --build build`
> reported errors, fix them and build again, then re-run `open`. Check that the
> last lines of the build output say `Built target ListenersDemo`.

> **"use of undeclared identifier 'juce'"?** CMake projects have no
> `JuceHeader.h`, so every source file must include the module headers it uses.
> `MainComponent.h` includes them and `Main.cpp` includes `MainComponent.h`.
> Without those includes the compiler does not know what `juce::`, `std::`, or
> `START_JUCE_APPLICATION` mean.

## Sources

Condensed from the JUCE tutorials _Listeners and Broadcasters_, _The ValueTree
class_, and _Using an UndoManager with a ValueTree_, Copyright (c) Raw Material
Software Limited, ISC licence. See [NOTICE.md](NOTICE.md).
