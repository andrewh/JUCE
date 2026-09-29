# Getting started: projects, applications, and windows

Set up a JUCE project, understand what the generated files do, and put a
window and a main component on screen.

**Level:** Beginner

## Choose a project type

| You want to build                                  | CMake target       | Starting point                                                      |
| -------------------------------------------------- | ------------------ | ------------------------------------------------------------------- |
| A desktop or mobile app with a GUI                 | `juce_add_gui_app` | [`examples/CMake/GuiApp`](../../examples/CMake/GuiApp)              |
| A command-line tool with no GUI                    | `juce_add_console_app` | [`examples/CMake/ConsoleApp`](../../examples/CMake/ConsoleApp)  |
| An audio plug-in (VST3, AU, AUv3, AAX, LV2, ...)   | `juce_add_plugin`  | [`examples/CMake/AudioPlugin`](../../examples/CMake/AudioPlugin)    |

If you are unsure, start with a GUI app. The Projucer offers the same choices
(plus audio, animated, and OpenGL app templates) and exports to Xcode, Visual
Studio, and Linux Makefiles. Its templates only differ in which base class
`MainComponent` derives from: `Component` for GUI apps, `AudioAppComponent`
for audio apps (see [Audio input, output, and playback](05-audio-io-and-playback.md)),
and `AnimatedAppComponent` for animation (see
[Graphics, layout, and animation](02-graphics-and-layout.md)).

## Create a project with CMake

Copy an example folder somewhere convenient, point it at JUCE, and build:

```cmake
cmake_minimum_required(VERSION 3.22)
project(MY_APP VERSION 0.0.1)

add_subdirectory(/path/to/JUCE JUCE)   # or find_package (JUCE CONFIG REQUIRED)

juce_add_gui_app(MyApp PRODUCT_NAME "My App")

target_sources(MyApp PRIVATE Main.cpp MainComponent.cpp)

target_compile_definitions(MyApp PRIVATE
    JUCE_WEB_BROWSER=0
    JUCE_USE_CURL=0
    JUCE_APPLICATION_NAME_STRING="$<TARGET_PROPERTY:MyApp,JUCE_PRODUCT_NAME>"
    JUCE_APPLICATION_VERSION_STRING="$<TARGET_PROPERTY:MyApp,JUCE_VERSION>")

target_link_libraries(MyApp
    PRIVATE juce::juce_gui_extra
    PUBLIC  juce::juce_recommended_config_flags
            juce::juce_recommended_warning_flags)
```

```sh
cmake -B build
cmake --build build
```

Each JUCE module you use is a `juce::juce_<module>` target to link against. See
the [CMake API](../CMake%20API.md) for every option.

> **Projucer users:** a Projucer project is a `.jucer` file plus a `Source`
> folder. Add source files and modules in the Projucer, choose an exporter per
> IDE, then save to regenerate the IDE project. Each module and configuration
> can be tuned in the project settings. The Projucer's GUI editor has been
> removed, so lay out interfaces in code.

## The application class

`Main.cpp` contains a class derived from `juce::JUCEApplication`. It provides
startup and shutdown hooks and is registered with `START_JUCE_APPLICATION`:

```cpp
class MyApplication final : public juce::JUCEApplication
{
public:
    const juce::String getApplicationName() override    { return "My App"; }
    const juce::String getApplicationVersion() override { return "1.0.0"; }

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

START_JUCE_APPLICATION (MyApplication)
```

Points worth knowing:

- `initialise()` runs as soon as the app starts, and `shutdown()` is where you
  release everything that must die before JUCE does. Keeping the window in a
  `std::unique_ptr` makes that a one-liner.
- `DocumentWindow` takes a title, a background colour, and a bitmask of title
  bar buttons. Combine `minimiseButton`, `maximiseButton`, and `closeButton`
  with `|`, or use `allButtons`.
- `setUsingNativeTitleBar (true)` gives the operating system's own window
  chrome and behaviour. Leave it off for an identical look on every platform.
- `setResizable (allowed, useBottomRightCornerResizer)`: with the second
  argument `false`, users resize by dragging any edge. Native title bars ignore
  it.
- `centreWithSize (w, h)` sets the size and centres on screen. Use
  `setBounds()` or `setBoundsRelative()` for explicit placement.
- Multi-touch is off by default on Windows since JUCE 9; see
  [BREAKING_CHANGES.md](../../BREAKING_CHANGES.md).

## The main component

`Component` is the base class of every on-screen object. Your window's content
is a component that draws itself in `paint()` and positions its children in
`resized()`:

```cpp
class MainComponent final : public juce::Component
{
public:
    MainComponent()
    {
        setSize (600, 400);   // initial size, also the window's initial size
    }

    void paint (juce::Graphics& g) override
    {
        g.fillAll (getLookAndFeel().findColour (juce::ResizableWindow::backgroundColourId));
        g.setColour (juce::Colours::white);
        g.setFont (20.0f);
        g.drawText ("Hello, JUCE!", getLocalBounds(), juce::Justification::centred, true);
    }

    void resized() override
    {
        // Position child components here using getLocalBounds()
    }

private:
    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR (MainComponent)
};
```

- `paint()` is called by JUCE whenever the component needs redrawing. Never
  call it yourself; call `repaint()` instead.
- `resized()` is called whenever the size changes, including once after the
  constructor's `setSize()`. Put all layout there so it adapts to resizing.
- Pass `MainComponent` to the window with `setContentOwned (..., true)` and the
  window sizes itself to fit.
- Use `getLocalBounds()` (origin at 0, 0) rather than `getBounds()` (position
  in the parent) when laying out children.

## Sources

Condensed from the JUCE tutorials *Projucer Part 1, getting started with the
Projucer*, *Projucer Part 2, manage your Projucer projects*, *Projucer Part 3,
choosing the right Projucer template for your application*, *The main
component*, and *The application window*, Copyright (c) Raw Material Software
Limited, ISC licence. See [NOTICE.md](NOTICE.md).
