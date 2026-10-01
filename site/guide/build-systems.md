# Build systems

**JUCE ships as source. You compile the modules you need into your project, using either CMake (the modern default) or the Projucer (JUCE's original project generator).[^readme]**

## How a module is compiled

A JUCE module is a folder with one main header and a small number of `.cpp` files that `#include` everything else. This is a "unity build" per module. The intent is reasonable compile times and no per-module include-path setup.[^fmt]

```
juce_audio_basics/
├── juce_audio_basics.h      ← main header: declaration block + #includes of public headers
├── juce_audio_basics.cpp    ← compile unit: #includes the implementation files
├── juce_audio_basics.mm     ← same, compiled instead of the .cpp on Apple platforms
├── buffers/                 ← implementation, grouped by topic
├── midi/
└── ...
```

The comment block at the top of the main header is machine-readable. This site's [module map](../reference/module-map) is generated from it:

```
BEGIN_JUCE_MODULE_DECLARATION
  ID:                 juce_audio_devices
  dependencies:       juce_audio_basics, juce_events
  OSXFrameworks:      CoreAudio CoreMIDI AudioToolbox
  linuxPackages:      alsa
END_JUCE_MODULE_DECLARATION
```

Platform-specific files use suffixes (`_mac`, `_windows`, `_linux`, `_android`, `_ios`). The full rules are in [`docs/JUCE Module Format.md`](https://github.com/juce-framework/JUCE/blob/master/docs/JUCE%20Module%20Format.md).[^fmt] You can write your own modules in the same format.

## CMake (recommended)

JUCE 6 added a first-class CMake API.[^cl6] The helpers live in `extras/Build/CMake/`.[^cmake]

```cmake
cmake_minimum_required(VERSION 3.22)
project(MyPlugin VERSION 0.1.0)

add_subdirectory(JUCE)                    # or find_package(JUCE CONFIG REQUIRED)

juce_add_plugin(MyPlugin
    COMPANY_NAME "Me"
    PLUGIN_MANUFACTURER_CODE Mfgr
    PLUGIN_CODE Mplg
    FORMATS VST3 AU Standalone
    PRODUCT_NAME "My Plugin")

target_sources(MyPlugin PRIVATE PluginProcessor.cpp PluginEditor.cpp)

target_link_libraries(MyPlugin
    PRIVATE juce::juce_audio_utils juce::juce_dsp
    PUBLIC  juce::juce_recommended_config_flags
            juce::juce_recommended_lto_flags
            juce::juce_recommended_warning_flags)
```

| Function | Makes |
| --- | --- |
| `juce_add_gui_app` | a desktop or mobile GUI application |
| `juce_add_console_app` | a command-line tool |
| `juce_add_plugin` | a shared-code target plus one target per format (`MyPlugin_VST3`, `MyPlugin_AU`, …) |
| `juce_add_binary_data` | a static library embedding files (images, samples) as C++ arrays |
| `juce_add_module` / `juce_add_modules` | a target for your own or third-party JUCE-format modules |
| `juce_generate_juce_header` | a `JuceHeader.h` that includes the linked modules' headers; optional in plain CMake projects[^cmake] |

Linking `juce::juce_<module>` pulls in that module *and its dependencies*, which is why the module graph matters.[^cmake]

Starting points: `examples/CMake/GuiApp`, `examples/CMake/ConsoleApp`, and `examples/CMake/AudioPlugin`. The full reference is [`docs/CMake API.md`](https://github.com/juce-framework/JUCE/blob/master/docs/CMake%20API.md).

## The Projucer

The Projucer (in `extras/Projucer`) is a GUI app that edits a `.jucer` XML file describing your project, modules, and per-platform settings. It then **exports** native IDE projects: Xcode, Visual Studio, Android Studio, and Linux Makefiles.[^readme] It also includes a code editor.[^readme]

```mermaid
flowchart LR
  jucer[".jucer file"] --> P["Projucer"]
  P --> xcode["Xcode project"]
  P --> vs["Visual Studio solution"]
  P --> as["Android Studio project"]
  P --> mk["Linux Makefile"]
  P --> jl["JuceLibraryCode/<br/>module wrappers + AppConfig"]
```

**When to use which?**

- **CMake**: CI-friendly and composes with other C++ libraries. The README lists it first, and this site's examples use it (this is a judgement, not a survey of what most projects use).
- **Projucer**: quickest to try JUCE if you are comfortable in an IDE, and still needed by some older codebases. Its exporters cover Android and iOS as well as desktop targets.

## PIPs

A **PIP** (*Projucer Instant Project*) is a single header file with a metadata block at the top. The Projucer (or `juce_add_pip` in CMake) turns it into a full project. Many of the demos in `examples/` are PIPs.[^pip] Read the metadata block of any file in `examples/Audio` to see the format.

## Useful configuration flags

Modules expose options as preprocessor macros (`JUCE_*`), documented in each module's main header under "Config:" comments. Some you will meet early:

| Flag | Effect |
| --- | --- |
| `JUCE_WEB_BROWSER` | Enable `WebBrowserComponent` (on by default; the CMake examples turn it off and ask for `NEEDS_WEB_BROWSER TRUE` if you need it)[^flags] |
| `JUCE_USE_CURL` | Use libcurl for networking on Linux[^flags] |
| `JUCE_ASIO` | Enable ASIO audio device support on Windows (off by default)[^flags] |
| `JUCE_VST3_CAN_REPLACE_VST2` | Let a VST3 build load and save VST2-compatible state, so hosts can replace a VST2 with it[^flags] |

In CMake, set them with `target_compile_definitions(MyTarget PUBLIC JUCE_WEB_BROWSER=0)`.

## Sources

[^readme]: [`README.md`](https://github.com/juce-framework/JUCE/blob/master/README.md): "JUCE projects can be managed with either CMake or the Projucer", and the Projucer section (exports for Xcode, Visual Studio, Android Studio, and Linux Makefiles, plus a source code editor).
[^fmt]: [`docs/JUCE Module Format.md`](https://github.com/juce-framework/JUCE/blob/master/docs/JUCE%20Module%20Format.md) and the module declaration blocks in headers such as [`juce_audio_devices.h`](https://github.com/juce-framework/JUCE/blob/master/modules/juce_audio_devices/juce_audio_devices.h). The reasons given for unity builds are this site's reading of the layout, not a quotation.
[^cl6]: [`CHANGE_LIST.md`](https://github.com/juce-framework/JUCE/blob/master/CHANGE_LIST.md), Version 6.0.0: "Added support for building JUCE projects with CMake".
[^cmake]: [`docs/CMake API.md`](https://github.com/juce-framework/JUCE/blob/master/docs/CMake%20API.md) (functions `juce_add_plugin`, `juce_add_binary_data`, `juce_add_module`, `juce_generate_juce_header`, and the format list `Standalone Unity VST3 AU AUv3 AAX VST LV2`) and the examples in [`examples/CMake`](https://github.com/juce-framework/JUCE/blob/master/examples/CMake). The `extras/Build/CMake` path is [in the repository](https://github.com/juce-framework/JUCE/blob/master/extras/Build/CMake).
[^pip]: [`docs/CMake API.md`](https://github.com/juce-framework/JUCE/blob/master/docs/CMake%20API.md), `juce_add_pip`: "parses the PIP metadata block in the provided header".
[^flags]: `JUCE_WEB_BROWSER`: [`juce_gui_extra.h`](https://github.com/juce-framework/JUCE/blob/master/modules/juce_gui_extra/juce_gui_extra.h) (default 1) and [`examples/CMake/AudioPlugin/CMakeLists.txt`](https://github.com/juce-framework/JUCE/blob/master/examples/CMake/AudioPlugin/CMakeLists.txt). `JUCE_USE_CURL`: [`juce_core.h`](https://github.com/juce-framework/JUCE/blob/master/modules/juce_core/juce_core.h). `JUCE_ASIO`: [`juce_audio_devices.h`](https://github.com/juce-framework/JUCE/blob/master/modules/juce_audio_devices/juce_audio_devices.h) (default 0). `JUCE_VST3_CAN_REPLACE_VST2`: [`juce_audio_plugin_client.h`](https://github.com/juce-framework/JUCE/blob/master/modules/juce_audio_plugin_client/juce_audio_plugin_client.h).
