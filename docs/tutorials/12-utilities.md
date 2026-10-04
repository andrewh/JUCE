# Core utilities: random numbers, bit sets, files, and OSC

Small, general-purpose classes from `juce_core` and `juce_osc` that turn up in
almost every project.

**Level:** Beginner to intermediate  
**Modules:** `juce_core`, and `juce_osc` for the OSC section

## Set up the project

The project below rolls a die with `juce::Random`, and already links `juce_osc` for the OSC section. Try each later snippet by calling it from the button handler or the constructor of `MainComponent`, and show results in a `Label` (or with `DBG()`, which prints to your IDE's debug console in a debug build).

This guide builds on [Getting started](01-getting-started.md). Make a copy of the
`HelloJuce` folder from that tutorial, **without** its `build` folder, and name
the copy `UtilitiesDemo`. Keep `Main.cpp` exactly as it is, then replace the other three files so the folder looks like this:

```text
UtilitiesDemo/
├── CMakeLists.txt      # new: renamed target, modules for this guide
├── Main.cpp            # copied unchanged from tutorial 1
├── MainComponent.h     # new: replaces the one from tutorial 1
└── MainComponent.cpp   # new: replaces the one from tutorial 1
```

In `CMakeLists.txt`, `/path/to/JUCE` stands for the JUCE path you already set in tutorial 1, so keep that path as it is unless JUCE has moved. This `CMakeLists.txt` renames the target to `UtilitiesDemo` and links the modules this guide needs.

**`CMakeLists.txt`**

```cmake
cmake_minimum_required(VERSION 3.22)
project(UTILITIESDEMO VERSION 0.0.1)

add_subdirectory(/path/to/JUCE JUCE)   # or find_package (JUCE CONFIG REQUIRED)

juce_add_gui_app(UtilitiesDemo PRODUCT_NAME "Utilities Demo")

target_sources(UtilitiesDemo PRIVATE Main.cpp MainComponent.cpp)

target_compile_definitions(UtilitiesDemo PRIVATE
    JUCE_WEB_BROWSER=0
    JUCE_USE_CURL=0
    JUCE_APPLICATION_NAME_STRING="$<TARGET_PROPERTY:UtilitiesDemo,JUCE_PRODUCT_NAME>"
    JUCE_APPLICATION_VERSION_STRING="$<TARGET_PROPERTY:UtilitiesDemo,JUCE_VERSION>")

target_link_libraries(UtilitiesDemo
    PRIVATE juce::juce_gui_extra
            juce::juce_osc
    PUBLIC  juce::juce_recommended_config_flags
            juce::juce_recommended_warning_flags)
```

**`MainComponent.h`**

```cpp
#pragma once

#include <juce_gui_extra/juce_gui_extra.h>
#include <juce_osc/juce_osc.h>

class MainComponent final : public juce::Component
{
public:
    MainComponent();

    void resized() override;

private:
    juce::Random rng { 1234 };    // fixed seed: the same rolls every run. Use setSeedRandomly() for real dice.

    juce::TextButton rollButton { "Roll a die" };
    juce::Label result;

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR (MainComponent)
};
```

**`MainComponent.cpp`**

```cpp
#include "MainComponent.h"

MainComponent::MainComponent()
{
    rollButton.onClick = [this]
    {
        auto roll = rng.nextInt (6) + 1;   // upper bound is exclusive: 0..5, plus one
        result.setText ("You rolled " + juce::String (roll), juce::dontSendNotification);
    };

    result.setJustificationType (juce::Justification::centred);
    result.setFont (juce::FontOptions (24.0f));

    addAndMakeVisible (rollButton);
    addAndMakeVisible (result);
    setSize (300, 160);
}

void MainComponent::resized()
{
    auto area = getLocalBounds().reduced (10);
    rollButton.setBounds (area.removeFromTop (40));
    result.setBounds (area);
}
```

## Random numbers: `Random`

`juce::Random` is a fast, seedable pseudo-random generator (not suitable for
cryptography). There is a shared, thread-safe-enough instance for casual use,
and you can create your own.

```cpp
auto& rng = juce::Random::getSystemRandom();     // shared, seeded randomly
juce::Random mine (1234);                        // deterministic, for reproducible tests
mine.setSeedRandomly();                          // or re-seed from the clock
```

| Need                              | Call                                         |
| --------------------------------- | -------------------------------------------- |
| Any 32-bit integer                | `rng.nextInt()`                              |
| `0 .. n-1`                        | `rng.nextInt (6)` (six faces: 0 to 5)        |
| `a .. b-1`                        | `rng.nextInt (juce::Range<int> (1, 7))`      |
| 64-bit integer                    | `rng.nextInt64()`                            |
| Float in `[0, 1)`                 | `rng.nextFloat()` (and `nextDouble()`)       |
| Coin flip                         | `rng.nextBool()`                             |
| Random bytes or bits              | `rng.fillBitsRandomly (buffer, size)`        |

The upper bound is *exclusive*: pass one more than the largest value you want.

Recipes:

```cpp
// Float in [min, max)
auto x = juce::jmap (rng.nextFloat(), 0.0f, 1.0f, -3.0f, 5.0f);

// Random rectangle inside a component
juce::Range<int> range (20, getWidth() / 2);
juce::Rectangle<int> r (rng.nextInt (range), rng.nextInt (range),
                        rng.nextInt (range), rng.nextInt (range));

// Random colour, then keep it bright enough to read
juce::Colour c ((juce::uint8) rng.nextInt (256), (juce::uint8) rng.nextInt (256), (juce::uint8) rng.nextInt (256));
if (c.getBrightness() < 0.75f)
    c = c.withBrightness (0.75f);

// Random element of an array
auto& item = array.getReference (rng.nextInt (array.size()));

// Audio noise: white noise from -1 to 1
auto noise = rng.nextFloat() * 2.0f - 1.0f;
```

**Non-uniform distributions.** `Random` is uniform. To favour some outcomes,
transform the uniform value: `std::pow (rng.nextFloat(), 3.0f)` biases towards zero,
and summing several uniform values approximates a bell curve (central limit
theorem). For a weighted choice, generate a number below the sum of the weights and
walk the list until the running total passes it.

Do not use `Random` on the audio thread if another thread also uses the shared
instance heavily: keep a `Random` member per audio object instead.

## Bit sets and big numbers: `BigInteger`

`BigInteger` is an arbitrarily long unsigned or signed integer, with bit-level
access. Use it as a bit set (for example, "which channels are active") or for
big-number arithmetic.

```cpp
juce::BigInteger bits;
bits.setBit (3);                      // set a single bit
bits.setRange (8, 4, true);           // set bits 8 to 11
bits.setBit (5, false);               // clear a bit

bool on   = bits[3];                  // read
int count = bits.countNumberOfSetBits();
int high  = bits.getHighestBit();     // index of the highest set bit, or -1
int next  = bits.findNextSetBit (4);  // iterate over set bits

bits.toString (2);                    // binary text; also base 8, 10, 16
bits.parseString ("ff", 16);          // parse from text

bits.shiftBits (4, 0);                // shift left by four from bit 0
```

The audio device APIs use it for channel masks (`getActiveInputChannels()`, see
[Audio input, output, files, and waveforms](05-audio-io-and-playback.md)):
`activeChannels[i]` tells whether channel `i` is on, and `getHighestBit() + 1` is the
number of channels to iterate. The same class is used to describe which MIDI notes a
`SamplerSound` covers (`setRange (0, 128, true)`).

Arithmetic (`+`, `-`, `*`, `/`, `%`, comparison) works as with built-in integers, plus:

```cpp
juce::BigInteger n, e, m;
n.parseString ("123456789", 10);  e.parseString ("65537", 10);  m.parseString ("1000000007", 10);
n.exponentModulo (e, m);                  // n = n^e mod m, in place
auto g = n.findGreatestCommonDivisor (m);
```

A `BigInteger` converts to and from raw bytes with `toMemoryBlock()` and
`loadFromMemoryBlock()`, so it is the building block for the `RSAKey` class and
similar. Do not use it for real cryptography without a vetted library.

## Files

### Paths: `File`

A `juce::File` is an *absolute path* to a file or directory, which may or may not
exist. It is a lightweight value type, and the same code works on every platform.

```cpp
juce::File path ("/path/to/file.txt");                       // Windows: "C:\\path\\to\\file.txt"
auto same = juce::File ("/path").getChildFile ("to").getChildFile ("file.txt");
auto sibling = path.getSiblingFile ("other.txt");
auto parent  = path.getParentDirectory();

auto docs = juce::File::getSpecialLocation (juce::File::userDocumentsDirectory);
auto data = juce::File::getSpecialLocation (juce::File::userApplicationDataDirectory)
                .getChildFile ("MyApp");
data.createDirectory();

path.existsAsFile();      path.isDirectory();       path.getFileName();
path.getFileNameWithoutExtension();                 path.getFileExtension();
```

Always build paths with `getChildFile()`, since it also resolves `..` and handles
separators. Check `existsAsFile()` before reading. Let users pick files with
`FileChooser` (as in [Audio input, output, files, and waveforms](05-audio-io-and-playback.md))
or a `FilenameComponent`, which shows an editable path with a browse button and
tells a `FilenameComponentListener` when it changes.

### Reading

The simplest cases are single calls:

```cpp
if (file.existsAsFile())
{
    juce::String text = file.loadFileAsString();        // whole file as text
    juce::MemoryBlock bytes;
    file.loadFileAsData (bytes);                        // whole file as bytes
}
```

For control, stream it. `File::createInputStream()` returns a
`std::unique_ptr<FileInputStream>` (null if it could not be opened):

```cpp
if (auto in = file.createInputStream())
{
    while (! in->isExhausted())
    {
        auto line = in->readNextLine();                 // text, line by line
        // ...
    }
}

// Byte by byte, e.g. to split on spaces
static juce::String readWord (juce::InputStream& in)
{
    juce::MemoryBlock buffer (256);
    auto* data = static_cast<char*> (buffer.getData());
    size_t i = 0;

    while (i < buffer.getSize() && (data[i] = in.readByte()) != 0)
        if (data[i++] == ' ')
            break;

    return juce::String::fromUTF8 (data, (int) i);
}
```

`InputStream` also reads binary values: `readInt()`, `readShort()`, `readFloat()`,
`readInt64()`, and so on, in little-endian order, with `...BigEndian()` variants for
big-endian formats. That is how you read your own binary files or parse existing
formats.

### Writing

```cpp
file.replaceWithText ("hello\n");        // overwrite (atomic where possible)
file.appendText ("more\n");

if (auto out = file.createOutputStream())      // std::unique_ptr<FileOutputStream>
{
    out->setPosition (0);
    out->truncate();                            // FileOutputStream appends unless you do this
    out->writeInt (42);
    out->writeText ("text", false, false, nullptr);
}
```

To avoid a half-written file if something fails, write to a `TemporaryFile` and call
`overwriteTargetFileWithTemporary()` when it is complete.

## Open Sound Control (OSC)

OSC sends messages such as `/juce/rotaryknob 0.42` over UDP between applications,
devices, and plug-ins on a network. Link `juce::juce_osc`.

### Sending

```cpp
juce::OSCSender sender;

if (! sender.connect ("127.0.0.1", 9001))
    juce::AlertWindow::showMessageBoxAsync (juce::MessageBoxIconType::WarningIcon,
                                            "Connection error", "Could not connect to UDP port 9001.");

knob.onValueChange = [this]
{
    if (! sender.send ("/juce/rotaryknob", (float) knob.getValue()))
        DBG ("Could not send OSC message");
};
```

`send (address, args...)` accepts ints, floats, strings, blobs, and colours. Build an
`OSCMessage` yourself for more control, or an `OSCBundle` to send several messages
with one timestamp.

### Receiving

An `OSCReceiver` listens on a port and calls listeners. By default, callbacks are
delivered on the message thread (`MessageLoopCallback`), so you can update the GUI
directly. Use `RealtimeCallback` only if you need low latency and can cope with the
network thread.

```cpp
class Receiver final : public juce::Component,
                       private juce::OSCReceiver,
                       private juce::OSCReceiver::ListenerWithOSCAddress<juce::OSCReceiver::MessageLoopCallback>
{
public:
    Receiver()
    {
        knob.setRange (0.0, 1.0);
        knob.setSliderStyle (juce::Slider::RotaryVerticalDrag);
        knob.setInterceptsMouseClicks (false, false);      // display only
        addAndMakeVisible (knob);

        if (! connect (9001))                               // bind the UDP port
            DBG ("Could not bind port 9001");

        addListener (this, "/juce/rotaryknob");             // only messages for this address
        setSize (200, 200);
    }

    void resized() override { knob.setBounds (getLocalBounds().reduced (10)); }

private:
    void oscMessageReceived (const juce::OSCMessage& message) override
    {
        if (message.size() == 1 && message[0].isFloat32())  // validate before use
            knob.setValue (juce::jlimit (0.0f, 1.0f, message[0].getFloat32()));
    }

    juce::Slider knob;
};
```

- Validate every message's argument count and types. Anything on the network can
  send anything.
- Register a listener without an address (`OSCReceiver::Listener<...>`) to receive
  everything, including `oscBundleReceived()`. That is how a *monitor* logs all
  traffic. `registerFormatErrorHandler()` reports malformed packets.
- Multiple receivers can listen to one sender only if the sender addresses each
  one, or broadcasts, since a UDP port can be bound by one receiver per machine.
- `connect()` and `disconnect()` return `false` on failure. Report the failure to
  the user, and let them choose a port between 1 and 65535.

## Build and run

With all the files in place, configure and build from the project folder:

```sh
cmake -B build
cmake --build build
```

The build puts the finished app in `build/UtilitiesDemo_artefacts/`. With CMake's default generator on each platform (Makefiles on macOS and Linux, and
Visual Studio on Windows, which adds the `Debug` folder):

| Platform | Run it with |
| -------- | ----------- |
| macOS    | `open "build/UtilitiesDemo_artefacts/Utilities Demo.app"` |
| Linux    | `./build/UtilitiesDemo_artefacts/Utilities\ Demo` |
| Windows  | `"build\UtilitiesDemo_artefacts\Debug\Utilities Demo.exe"` |

In PowerShell, put `&` before the quoted path.

Xcode and Visual Studio are multi-config generators and add a configuration folder,
for example `build/UtilitiesDemo_artefacts/Debug/Utilities Demo.app`; build with
`cmake --build build --config Debug`. With Ninja there is no configuration folder, so
drop `Debug` from the Windows path.

> **"The application cannot be opened because its executable is missing"?**
> CMake creates the empty `.app` bundle at the start of the build and only fills
> in the executable when compiling and linking succeed. If `cmake --build build`
> reported errors, fix them and build again, then re-run `open`. Check that the
> last lines of the build output say `Built target UtilitiesDemo`.

> **"use of undeclared identifier 'juce'"?** CMake projects have no
> `JuceHeader.h`, so every source file must include the module headers it uses.
> `MainComponent.h` includes them and `Main.cpp` includes `MainComponent.h`.
> Without those includes the compiler does not know what `juce::`, `std::`, or
> `START_JUCE_APPLICATION` mean.

## Sources

Condensed from the JUCE tutorials *The Random class*, *The BigInteger class*, *File
reading*, and *Implement the OSC protocol in your app*, Copyright (c) Raw Material
Software Limited, ISC licence. See [NOTICE.md](NOTICE.md).
