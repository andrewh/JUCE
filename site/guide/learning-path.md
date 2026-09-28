# Learning path

**A route through JUCE in six stages, each pairing a concept page with a real example from `examples/` and a small exercise.** Tick them off as you go; each stage builds on the one before.

::: tip Setup once
```sh
cd /path/to/JUCE
cmake . -B cmake-build -DJUCE_BUILD_EXAMPLES=ON -DJUCE_BUILD_EXTRAS=ON
cmake --build cmake-build --target DemoRunner
```
The **DemoRunner** app lets you browse and run every demo, with its source alongside. On Linux, install the packages in [`docs/Linux Dependencies.md`](https://github.com/andrewh/JUCE/blob/master/docs/Linux%20Dependencies.md) first.
:::

## 1. Foundations: `juce_core` and `juce_events`

- **Read:** [Core concepts → Strings](./core-concepts#strings), [Ownership](./core-concepts#ownership)
- **Study:** `examples/Utilities/XMLandJSONDemo.h`, `TimersAndEventsDemo.h`, `MultithreadingDemo.h`
- **Build:** start from `examples/CMake/ConsoleApp`. Write a tool that lists every `.wav` file in a folder (`File::findChildFiles`) and prints the results as JSON.

## 2. Components and drawing

- **Read:** [Core concepts → Components](./core-concepts#components), [Architecture → How the GUI reaches your code](./architecture#how-the-gui-reaches-your-code)
- **Study:** `examples/GUI/HelloWorldDemo.h`, `GraphicsDemo.h`, `FlexBoxDemo.h`, `LookAndFeelDemo.h`
- **Build:** start from `examples/CMake/GuiApp`. Make a window with three sliders laid out with `FlexBox`, and a custom-painted rotary knob using your own `LookAndFeel_V4` subclass.

## 3. State

- **Read:** [Core concepts → State](./core-concepts#state), [Listeners](./core-concepts#listeners)
- **Study:** `examples/Utilities/ValueTreesDemo.h`
- **Build:** store your slider values from stage 2 in a `ValueTree` with an `UndoManager`. Add undo and redo buttons, and save and load the tree as XML.

## 4. Real-time audio

- **Read:** [Architecture → How audio reaches your code](./architecture#how-audio-reaches-your-code), [Core concepts → Threads](./core-concepts#threads)
- **Study:** `examples/Audio/AudioAppDemo.h`, `AudioSettingsDemo.h`, `AudioPlaybackDemo.h`, `SimpleFFTDemo.h`
- **Build:** use an `AudioAppComponent` to generate a sine wave whose frequency is set by a slider. Use a `std::atomic<float>` and `SmoothedValue`, then add a level meter fed by a `Timer`. Deliberately allocate in the callback once, and listen for glitches.

## 5. DSP

- **Read:** [Modules → juce_dsp](../reference/modules#juce-dsp)
- **Study:** `examples/DSP/GainDemo.h`, `IIRFilterDemo.h`, `OverdriveDemo.h`, `ConvolutionDemo.h`
- **Build:** make a `dsp::ProcessorChain` of gain, filter, and waveshaper, and process your sine through it.

## 6. Plug-ins

- **Read:** [Anatomy of a plug-in](./plugin-anatomy)
- **Study:** `examples/Plugins/GainPluginDemo.h`, then `AudioPluginDemo.h`, `DSPModulePluginDemo.h`, and `WebViewPluginDemo.h`
- **Build:** start from `examples/CMake/AudioPlugin`. Port your stage-5 chain into a plug-in with an APVTS and slider attachments. Build the VST3 and Standalone targets, and test in `extras/AudioPluginHost`.

## Going further

- **Hosting:** `examples/Plugins/HostPluginDemo.h` and the AudioPluginHost source (`extras/AudioPluginHost`)
- **MIDI 2.0:** `examples/Audio/UmpDemo.h`, `CapabilityInquiryDemo.h`
- **OpenGL and animation:** `examples/GUI/OpenGLDemo.h`, `AnimatorsDemo.h`
- **Read the source:** when a class confuses you, open its header. The Doxygen comments are the real documentation, and the `jassert`s show intended use.

## How to grow this site as you learn

Each stage is a chance to add to these docs:

- Add every new term you meet to the [glossary](../reference/glossary).
- When a diagram clarifies something, add a Mermaid block to the relevant page.
- Keep a "gotchas" section on each page for the mistakes you actually made.
