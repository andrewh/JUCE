# What is JUCE?

**JUCE is a cross-platform C++ framework for building audio applications, audio plug-ins, and the GUIs that go with them.** You write your program once against JUCE's classes and it compiles for macOS, Windows, Linux, iOS, and Android. The same code can also be wrapped as a VST3, AU, AUv3, AAX, or LV2 plug-in.

The name began as *Jules' Utility Class Extensions*, after its original author, Julian "Jules" Storer. It is now maintained by the JUCE team at PACE Anti-Piracy (see [History](./history)).

## What problem does it solve?

Writing audio software means dealing with several hard problems at once:

| Problem | Without JUCE | With JUCE |
| --- | --- | --- |
| **Audio I/O** | CoreAudio, WASAPI, ASIO, ALSA, JACK, Oboe… each with its own API and threading rules | One `AudioDeviceManager` and one callback |
| **Plug-in formats** | A separate SDK and wrapper per format (VST3, AU, AAX, LV2) and per host quirk | Write one `AudioProcessor`; JUCE generates each format |
| **GUI** | Cocoa, Win32, X11/Wayland, UIKit, Android views | One `Component` tree drawn with one `Graphics` API |
| **Everything else** | Strings, files, threads, networking, XML/JSON, maths | `juce_core`, one consistent library |

The trade-off: JUCE is a *framework*, so it owns the event loop and the application lifecycle. You fill in the parts it calls, rather than calling it from your own `main()`.

## What you get

- **24 modules** of C++ source (see the [module map](../reference/module-map)). Each is a folder you add to your build; there are no pre-built binaries.
- **Tools** in `extras/`:
  - **Projucer**, a project generator and editor (the older way to configure projects)
  - **AudioPluginHost**, a small host for testing plug-ins
  - **UnitTestRunner**, **BinaryBuilder**, and **AudioPerformanceTest**
- **CMake API** (`juce_add_plugin`, `juce_add_gui_app`, …), the modern way to build (see [Build systems](./build-systems)).
- **Examples** in `examples/`, including the **DemoRunner** app that bundles most demos.

## The five ideas that explain most of JUCE

1. **Everything is a module.** Modules are layered: `juce_core` at the bottom, plug-in wrappers at the top. Each module lists its dependencies in its header. → [Architecture](./architecture)
2. **Two important threads.** The *message thread* runs the GUI and events; the *audio thread* runs your DSP and must never block. Much of JUCE's design exists to move data safely between them. → [Core concepts](./core-concepts#threads)
3. **Components draw themselves.** A GUI is a tree of `Component` objects, each with `paint()` and `resized()`. → [Core concepts](./core-concepts#components)
4. **An `AudioProcessor` is the unit of audio work.** Plug-ins, graph nodes, and hosted third-party plug-ins all share this interface. → [Anatomy of a plug-in](./plugin-anatomy)
5. **State lives in trees.** `ValueTree` plus listeners gives you undo, serialisation, and UI binding almost for free. → [Core concepts](./core-concepts#state)

## Who uses it?

JUCE is widely used for commercial audio plug-ins, DAWs, and music apps. It also turns up in research, education, and embedded audio devices. Its strength is audio; you can build general desktop apps with it, but most of its design choices are made with real-time audio in mind.

## Licensing

The JUCE modules are dual-licensed:

- **AGPLv3.** Free to use, but if you distribute your software (or let people use it over a network), you must release its source under the AGPLv3 as well.
- **Commercial JUCE licence.** Governed by the [JUCE 9 End User Licence Agreement](https://juce.com/legal/juce-9-licence/). You need this for closed-source products. The [licensing FAQ](https://juce.com/get-juce/#licensing-faq) explains the available tiers.

The examples use the permissive ISC licence. Bundled third-party code keeps its own licence, listed in the SPDX bill of materials (`JUCE.spdx.json`). Plug-in SDKs such as AAX have their own agreements too. See [`LICENSE.md`](https://github.com/andrewh/JUCE/blob/master/LICENSE.md).

::: tip For this learning project
Studying and experimenting under the AGPLv3 is fine. If you later ship a closed-source product, you will need a commercial licence.
:::

## Where to go next

- For how the pieces relate: [Architecture](./architecture)
- For the vocabulary: [Glossary](../reference/glossary)
- For a structured way to study: [Learning path](./learning-path)
