# Listeners, `ValueTree`, and undo

How JUCE objects tell each other about changes, and how to build an application
data model that notifies, serialises, and undoes for free.

**Level:** Beginner to intermediate

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

## Sources

Condensed from the JUCE tutorials *Listeners and Broadcasters*, *The ValueTree
class*, and *Using an UndoManager with a ValueTree*, Copyright (c) Raw Material
Software Limited, ISC licence. See [NOTICE.md](NOTICE.md).
