# What is JUCE?

**JUCE is a cross-platform C++ framework for building audio applications, audio plug-ins, and the GUIs that go with them.** You write your program once against JUCE's classes and it compiles for macOS, Windows, Linux, iOS, and Android.[^readme] The same code can also be wrapped as a VST3, AU, AUv3, AAX, or LV2 plug-in.[^readme]

The name began as *Jules' Utility Class Extensions*, after its original author, Julian "Jules" Storer. It is now owned by PACE Anti-Piracy, which acquired it from ROLI in 2020 (see [History](./history)).[^hist]

## What problem does it solve?

Writing audio software means dealing with several hard problems at once:

| Problem | Without JUCE | With JUCE |
| --- | --- | --- |
| **Audio I/O** | CoreAudio, WASAPI, ASIO, ALSA, JACK, Oboe… each with its own API and threading rules[^backends] | One `AudioDeviceManager` and one callback |
| **Plug-in formats** | A separate SDK and wrapper per format (VST3, AU, AAX, LV2) and per host quirk | Write one `AudioProcessor`; JUCE generates each format |
| **GUI** | Cocoa, Win32, X11/Wayland, UIKit, Android views | One `Component` tree drawn with one `Graphics` API |
| **Everything else** | Strings, files, threads, networking, XML/JSON, maths | `juce_core`, one consistent library |

The trade-off: JUCE is a *framework*, so it owns the event loop and the application lifecycle. You fill in the parts it calls, rather than calling it from your own `main()`.

## What you get

- **24 modules** of C++ source[^count] (see the [module map](../reference/module-map)). Each is a folder you add to your build; there are no pre-built binaries.
- **Tools** in `extras/`:
  - **Projucer**, a project generator and editor (the older way to configure projects)[^extras]
  - **AudioPluginHost**, a small host for testing plug-ins
  - **UnitTestRunner**, **BinaryBuilder**, and **AudioPerformanceTest**
- **CMake API** (`juce_add_plugin`, `juce_add_gui_app`, …), the modern way to build (see [Build systems](./build-systems)).[^cmake]
- **Examples** in `examples/`, including the **DemoRunner** app that bundles most demos.

## The five ideas that explain most of JUCE

1. **Everything is a module.** Modules are layered: `juce_core` at the bottom, plug-in wrappers at the top. Each module lists its dependencies in its header. → [Architecture](./architecture)
2. **Two important threads.** The *message thread* runs the GUI and events; the *audio thread* runs your DSP and must never block. Much of JUCE's design exists to move data safely between them. → [Core concepts](./core-concepts#threads)
3. **Components draw themselves.** A GUI is a tree of `Component` objects, each with `paint()` and `resized()`. → [Core concepts](./core-concepts#components)
4. **An `AudioProcessor` is the unit of audio work.** Plug-ins, graph nodes, and hosted third-party plug-ins all share this interface. → [Anatomy of a plug-in](./plugin-anatomy)
5. **State lives in trees.** `ValueTree` plus listeners gives you undo, serialisation, and UI binding almost for free. → [Core concepts](./core-concepts#state)

## Who uses it?

JUCE's own README describes it as a framework for desktop and mobile applications, including audio plug-ins and plug-in hosts.[^readme] This site does not survey who uses it. Its strength is audio; you can build general desktop apps with it, but the design choices visible in the source (the message thread, the audio thread, `AudioProcessor`) are made with real-time audio in mind.

## Licensing

The JUCE modules are dual-licensed:[^lic]

- **AGPLv3.** Free to use, but if you distribute your software (or let people use it over a network), you must release its source under the AGPLv3 as well.[^agpltext]
- **Commercial JUCE licence.** Governed by the [JUCE 9 End User Licence Agreement](https://juce.com/legal/juce-9-licence/). You need this for closed-source products. The [licensing FAQ](https://juce.com/get-juce/#licensing-faq) explains the available tiers.

The examples use the permissive ISC licence. Bundled third-party code keeps its own licence, listed in the SPDX bill of materials (`JUCE.spdx.json`). Plug-in SDKs such as AAX have their own agreements too.[^aax] See [`LICENSE.md`](https://github.com/andrewh/JUCE/blob/master/LICENSE.md).

::: warning Not legal advice
This is a summary of the licence files, not legal advice. The JUCE team says it cannot confirm compliance for specific usage, so read the EULA and licensing FAQ and take your own advice before shipping a product.[^lic]
:::

## Where to go next

- For how the pieces relate: [Architecture](./architecture)
- For the vocabulary: [Glossary](../reference/glossary)
- For a structured way to study: [Learning path](./learning-path)

## Sources

[^readme]: [`README.md`](https://github.com/andrewh/JUCE/blob/master/README.md): opening paragraph (VST, VST3, AU, AUv3, AAX and LV2 plug-ins and hosts; desktop and mobile applications) and "Deployment Targets" (macOS, Windows, Linux, iOS, Android).
[^hist]: See the sourced timeline on [History](./history), which cites Wikipedia, MusicRadar, and Synthtopia for the 2020 sale from ROLI to PACE.
[^backends]: Backends present under [`modules/juce_audio_devices/native/`](https://github.com/andrewh/JUCE/blob/master/modules/juce_audio_devices/native): CoreAudio, WASAPI, ASIO, DirectSound, ALSA, JACK, Oboe, OpenSL and iOS audio. The description of each having its own API is this site's summary.
[^count]: `ls modules/` in this repository lists 24 `juce_*` folders (JUCE 9.0.3). See the [module map](../reference/module-map), generated from the headers. Modules ship as source: the README's CMake and Projucer sections describe building them into your project.
[^extras]: The [`extras/`](https://github.com/andrewh/JUCE/blob/master/extras) folder contains `Projucer`, `AudioPluginHost`, `UnitTestRunner`, `BinaryBuilder`, and `AudioPerformanceTest`, among others.
[^cmake]: [`docs/CMake API.md`](https://github.com/andrewh/JUCE/blob/master/docs/CMake%20API.md), and the examples in [`examples/`](https://github.com/andrewh/JUCE/blob/master/examples) including `examples/DemoRunner`.
[^lic]: [`LICENSE.md`](https://github.com/andrewh/JUCE/blob/master/LICENSE.md): dual licence, the JUCE 9 EULA and licensing FAQ links, the ISC licence for examples, the SPDX bill of materials, and the statement that the JUCE team cannot provide compliance confirmations or legal advice.
[^agpltext]: [GNU AGPLv3 text](https://www.gnu.org/licenses/agpl-3.0.en.html), section 13 (remote network interaction).
[^aax]: [`LICENSE.md`](https://github.com/andrewh/JUCE/blob/master/LICENSE.md) says bundled third-party software keeps its own terms; the AAX signing requirement is in [`README.md`, "AAX Plug-Ins"](https://github.com/andrewh/JUCE/blob/master/README.md#aax-plug-ins).
