# Listeners, `ValueTree`, and undo

How JUCE objects tell each other about changes, and how to build an application
data model that notifies, serialises, and undoes for free.

**Level:** Beginner to intermediate

## Set up the project

The project below is the listener-class example from the first section, ready to run. The later snippets, including the `ValueTree` ones, can be tried by adding them to `MainComponent` or to a console-style test in its constructor.

This guide builds on [Getting started](01-getting-started.md). Make a copy of the
`HelloJuce` folder from that tutorial, **without** its `build` folder, and name
the copy `ListenersDemo`. Keep `Main.cpp` exactly as it is, then replace the other three files so the folder looks like this:

```text
ListenersDemo/
├── CMakeLists.txt      # new: renamed target, modules for this guide
├── Main.cpp            # copied unchanged from tutorial 1
├── MainComponent.h     # new: replaces the one from tutorial 1
└── MainComponent.cpp   # new: replaces the one from tutorial 1
```

In `CMakeLists.txt`, `/path/to/JUCE` stands for the JUCE path you already set in tutorial 1, so keep that path as it is unless JUCE has moved. This `CMakeLists.txt` renames the target to `ListenersDemo` and links the modules this guide needs.

**`CMakeLists.txt`**

```cmake
cmake_minimum_required(VERSION 3.22)
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

**`MainComponent.h`**

```cpp
#pragma once

#include <juce_gui_extra/juce_gui_extra.h>

class MainComponent final : public juce::Component,
                            private juce::Button::Listener
{
public:
    MainComponent();
    ~MainComponent() override;

    void resized() override;

private:
    void buttonClicked (juce::Button* button) override;

    juce::TextButton checkTime;
    juce::Label timeLabel;

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR (MainComponent)
};
```

**`MainComponent.cpp`**

```cpp
#include "MainComponent.h"

MainComponent::MainComponent()
{
    addAndMakeVisible (checkTime);
    checkTime.setButtonText ("Check the time...");
    checkTime.addListener (this);

    addAndMakeVisible (timeLabel);
    timeLabel.setJustificationType (juce::Justification::centred);

    setSize (400, 120);
}

MainComponent::~MainComponent()
{
    checkTime.removeListener (this);
}

void MainComponent::resized()
{
    auto area = getLocalBounds().reduced (10);
    checkTime.setBounds (area.removeFromTop (40));
    timeLabel.setBounds (area);
}

void MainComponent::buttonClicked (juce::Button* button)
{
    if (button == &checkTime)
        timeLabel.setText (juce::Time::getCurrentTime().toString (true, true),
                           juce::dontSendNotification);
}
```

`ValueTree` snippets that print to the log can use `DBG (...)`, which shows in your
IDE's debug console in a debug build. For on-screen output, append to a
`juce::TextEditor` member instead.

## Listeners and broadcasters

Buttons, sliders, combo boxes, `ValueTree`, `ChangeBroadcaster`, `Timer` and many
others broadcast changes. Anything interested registers as a listener.

### Option 1: lambda callbacks

For widgets that offer them (`onClick`, `onValueChange`, `onChange`,
`onTextChange`), assign a lambda. There is nothing to register or remove:

```cpp
checkTime.onClick = [this]
{
    timeLabel.setText (juce::Time::getCurrentTime().toString (true, true),
                       juce::dontSendNotification);
};
```

`dontSendNotification` stops the label broadcasting its own change to *its*
listeners. Use `sendNotification` when others should hear about it.

### Option 2: listener classes

Derive from the broadcaster's listener class, implement its callback, and
register:

```cpp
class Clock final : public juce::Component, private juce::Button::Listener
{
public:
    Clock()
    {
        addAndMakeVisible (checkTime);
        checkTime.setButtonText ("Check the time...");
        checkTime.addListener (this);
    }

    ~Clock() override { checkTime.removeListener (this); }

private:
    void buttonClicked (juce::Button* button) override
    {
        if (button == &checkTime)          // one listener often serves several broadcasters
            timeLabel.setText (juce::Time::getCurrentTime().toString (true, true),
                               juce::dontSendNotification);
    }

    juce::TextButton checkTime;
    juce::Label timeLabel;
};
```

- Listener classes have one required (pure virtual) callback and optional extras.
  The callback receives a pointer or reference to the broadcaster, so compare it
  with your members when you listen to more than one.
- Always deregister in the destructor if the broadcaster can outlive you.
  Broadcasters that you own as members are destroyed with you, but listeners
  attached to longer-lived objects must be removed or they will call into freed
  memory.
- `ChangeBroadcaster` uses `addChangeListener()` and `changeListenerCallback()`.
  It sends asynchronously on the message thread, so it is safe to trigger from
  any thread and coalesces bursts of changes.

## `ValueTree`: an application data model

A `ValueTree` is a reference-counted tree of nodes. Each node has a type, any
number of named properties, and any number of child nodes, like an XML element.
It gives you serialisation, change notification, and undo with one interface:

```
Pet   name="Fluffmuff"  animal="Cat"  size=2.4
 └─ Accessories
     ├─ Collar   colour="Pink"
     └─ Camera   hasFlash=false  capacity=32
```

### The three types you use with it

- **`ValueTree`**: the node. Copying it copies a *reference*, not the data, so it
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

```cpp
namespace IDs
{
    #define DECLARE_ID(name) const juce::Identifier name (#name);
    DECLARE_ID (Pet)  DECLARE_ID (name)  DECLARE_ID (size)  DECLARE_ID (Accessories)
    #undef DECLARE_ID
}

juce::ValueTree pet (IDs::Pet);
pet.setProperty (IDs::name, "Fluffmuff", nullptr);   // nullptr: no undo
pet.setProperty (IDs::size, 2.4, nullptr);

juce::String name = pet[IDs::name];                  // var converts implicitly
double size       = pet.getProperty (IDs::size, 1.0); // second argument: default

juce::ValueTree accessories (IDs::Accessories);
pet.addChild (accessories, -1, nullptr);             // -1 appends
auto again = pet.getChildWithName (IDs::Accessories);
auto parent = again.getParent();

for (int i = 0; i < pet.getNumProperties(); ++i)     // reflection over the data
    DBG (pet.getPropertyName (i).toString() << " = " << pet.getProperty (pet.getPropertyName (i)).toString());
```

Other lookups: `getChild (index)`, `getChildWithProperty()`, `hasProperty()`,
`removeProperty()`, `removeChild()`, and range-for over the children. Anything
that finds nothing returns an invalid tree. A node's type cannot change after
creation.

### Serialisation

```cpp
if (auto xml = pet.createXml())
    xml->writeTo (file);                       // or ValueTree::fromXml (*xml) to load

if (auto parsed = juce::XmlDocument::parse (file))
    pet = juce::ValueTree::fromXml (*parsed);
```

`ValueTree` can also write a compact binary form (`writeToStream()` and
`readFromStream()`), which is what plug-ins typically store as their state.

### Listening for changes

```cpp
class Watcher final : private juce::ValueTree::Listener
{
public:
    explicit Watcher (juce::ValueTree v) : tree (std::move (v)) { tree.addListener (this); }
    ~Watcher() override { tree.removeListener (this); }

private:
    void valueTreePropertyChanged (juce::ValueTree& t, const juce::Identifier& p) override
    {
        DBG (t.getType().toString() << "." << p.toString() << " changed");
    }

    void valueTreeChildAdded (juce::ValueTree&, juce::ValueTree&) override {}
    void valueTreeChildRemoved (juce::ValueTree&, juce::ValueTree&, int) override {}
    void valueTreeChildOrderChanged (juce::ValueTree&, int, int) override {}
    void valueTreeParentChanged (juce::ValueTree&) override {}

    juce::ValueTree tree;
};
```

- Callbacks are **synchronous** and propagate *up* the tree, so a listener on the
  root hears about every descendant. Filter with `t == myNode` or by type.
- Do not do slow work in them. Hand it to an `AsyncUpdater` or a `Timer`.
- `juce::CachedValue<T>` binds a property to a typed C++ member that stays in
  sync, and `getPropertyAsValue()` gives a `juce::Value` that GUI components can
  share.

### Undo and redo

Every mutating call (`setProperty`, `addChild`, `removeChild`, `moveChild`,
`copyPropertiesFrom`, ...) takes an optional `UndoManager*`. Pass one, and the
change becomes an undoable action. Pass `nullptr` and it is just applied.

```cpp
juce::UndoManager undoManager;

pet.setProperty (IDs::name, "Whiskers", &undoManager);
undoManager.beginNewTransaction ("Rename pet");    // groups what follows as one step
pet.addChild (juce::ValueTree (IDs::Accessories), -1, &undoManager);

undoButton.onClick = [this] { undoManager.undo(); };
redoButton.onClick = [this] { undoManager.redo(); };
```

- Changes made between calls to `beginNewTransaction()` undo together. If you
  never begin a new transaction, everything merges into one, so begin one per
  user gesture, for example when a drag ends, or from a timer that fires every
  few hundred milliseconds while a document changes.
- Listeners fire on undo and redo exactly as on ordinary edits, so a UI that
  redraws from the tree needs no undo-specific code.
- Bound the history with `setMaxNumberOfStoredUnits()`, and enable buttons with
  `canUndo()` and `canRedo()`. For custom operations, subclass `UndoableAction`
  and hand it to `perform()`.
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

| Platform | Run it with |
| -------- | ----------- |
| macOS    | `open "build/ListenersDemo_artefacts/Listeners Demo.app"` |
| Linux    | `./build/ListenersDemo_artefacts/Listeners\ Demo` |
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

Condensed from the JUCE tutorials *Listeners and Broadcasters*, *The ValueTree
class*, and *Using an UndoManager with a ValueTree*, Copyright (c) Raw Material
Software Limited, ISC licence. See [NOTICE.md](NOTICE.md).
