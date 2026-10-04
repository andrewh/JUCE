# Profiling on macOS with dSYM files

Build a JUCE app from the terminal with CMake, produce a dSYM file, and profile
the running app with `sample`, Activity Monitor, or Instruments so that stack
traces show function names, source files, and line numbers instead of raw
addresses.

This guide is specific to macOS on Apple Silicon. It uses the `GraphicsDemo` app
from [Graphics, layout, and animation](02-graphics-and-layout.md), but the steps
work for any JUCE CMake project.

**Level:** Intermediate

## What a dSYM is

Compiling with debug information (`-g`) records function names, files, and line
numbers as DWARF data. On macOS the linker leaves that data in the object files
and the executable only keeps a map back to them. A **dSYM bundle**
(`Graphics Demo.app.dSYM`) collects the DWARF data into one place that profilers
and crash tools can read. They match it to the executable by its **UUID**, so a
dSYM only works for the exact build that made it.

JUCE has no special setting for this. It comes from Xcode's standard
`DEBUG_INFORMATION_FORMAT` build setting. The Projucer's Xcode exporter writes
`dwarf`, which makes no dSYM, so a CMake project is the easier route.

## Configure with dSYM generation

Use the Xcode generator and ask for `dwarf-with-dsym` in every configuration.
From the `GraphicsDemo` folder:

```sh
cmake -G Xcode -B build -DCMAKE_XCODE_ATTRIBUTE_DEBUG_INFORMATION_FORMAT=dwarf-with-dsym
```

You still build from the terminal. `cmake --build` runs `xcodebuild` for you.

Xcode is a multi-config generator, so the configuration is chosen at build time,
not configure time. Profile an optimised build, because a Debug build has
different performance characteristics from the app your users run:

```sh
cmake --build build --config RelWithDebInfo
```

`RelWithDebInfo` is optimised and keeps debug information. During the build you
should see a `GenerateDSYMFile` step, and the dSYM appears next to the app:

```text
build/GraphicsDemo_artefacts/RelWithDebInfo/Graphics Demo.app
build/GraphicsDemo_artefacts/RelWithDebInfo/Graphics Demo.app.dSYM
```

> **Warnings about CoreDevice or CoreSimulator being out of date?** Messages such
> as `DVTCoreDeviceCore ... Symbol not found` or `CoreSimulator is out of date`
> mean the installed Xcode is newer than the system components in macOS. They
> only disable iOS simulator and device discovery and do not affect a macOS
> build. Update macOS, or run `xcodebuild -runFirstLaunch`, to clear them.

## Check that the dSYM matches

Both commands must print the same UUID. Quote the paths, because the app name
contains a space:

```sh
APP="build/GraphicsDemo_artefacts/RelWithDebInfo/Graphics Demo.app"
dwarfdump --uuid "$APP/Contents/MacOS/Graphics Demo"
dwarfdump --uuid "$APP.dSYM"
```

If they differ, the dSYM belongs to an earlier build. Every rebuild that
relinks the executable changes the UUID, so always profile the app and dSYM from
the same build.

Do not run `strip` on the executable before profiling. It removes the symbols
that `sample` falls back on when it cannot find a dSYM.

## Profile with `sample`

`sample` is the command-line equivalent of Activity Monitor's **Sample Process**
button. Start the app, give it something to do, and sample it for ten seconds:

```sh
open "$APP"
sample "Graphics Demo" 10 -file gd.txt
```

The process name is the executable's name. If `sample` cannot find it, run
`pgrep -l -f Graphics` and pass the process ID instead.

`sample` locates the dSYM through Spotlight. If the output still shows raw
addresses, index the build folder and sample again:

```sh
mdimport build/GraphicsDemo_artefacts
mdfind "com_apple_xcode_dsym_uuids == <UUID from dwarfdump>"
```

The second command should print the path of the `.dSYM`.

### Read the output

A symbolicated JUCE frame looks like this:

```text
juce::NSViewComponentPeer::AsyncRepainter::handleAsyncUpdate()  (in GraphicsDemo) + 136  [0x104b6f95c]  juce_NSViewComponentPeer_mac.mm:1825
```

- The numbers at the start of each line count samples, so larger means more time.
  Compare them with the total on the top frame to get a share.
- A call stack that ends in `mach_msg` or `__CFRunLoopServiceMachPort` is the main
  thread waiting for events. If most samples are there, the app was idle and the
  sample says little. Make the app busy first, for example by resizing the window
  or running an animation, then sample.
- Frames shown as `???  (in AppKit)  load address ...` are Apple system code
  without public symbols. They do not mean your dSYM is missing.
- Read the **Sort by top of stack** section at the end of the file. It lists the
  functions where the CPU spent the most time itself, which is usually the quickest
  way to find a hot spot.

## Use Activity Monitor

Open the app, select its process in Activity Monitor, then choose
**View > Sample Process** (or the gear menu, **Sample Process**). The sample window
uses the same symbolication as `sample`, so the dSYM must be findable by Spotlight
in the same way.

## Use Instruments from the terminal

Instruments gives a time-based view and flame graphs. `xctrace` records a trace
without opening the Instruments window:

```sh
open "$APP"
xctrace record --template "Time Profiler" --attach "Graphics Demo" --time-limit 10s --output gd.trace
open gd.trace
```

## Stop everything rebuilding

If every `cmake --build` recompiles the JUCE modules, profiling turns slow. The
JUCE module sources, for example `juce_graphics_libjpg_3.c`, are compiled as part of
your target, so it matters that incremental builds work.

Check these first:

- **One build folder per generator.** CMake refuses to reuse a build folder that was
  configured with a different generator, so it reports an error instead of
  rebuilding. Use separate folders such as `build-xcode` and `build-ninja`. Changing
  a flag that affects compilation, such as `CMAKE_BUILD_TYPE` or the compiler flags,
  does recompile the affected files, so keep those settings fixed between builds.
- **Unexpected timestamp changes.** If the JUCE checkout sits in a synced folder, or
  something touches its files, they look modified. List recently changed files with
  `find /path/to/JUCE/modules -newer build/CMakeCache.txt | head`.
- **A second build that compiles nothing.** Run the same build command twice in a
  row, with the same configuration, and without changing any file. For the Xcode
  generator that is `cmake --build build --config RelWithDebInfo` both times,
  because a build without `--config` uses a different configuration and compiles
  everything again. The second run should not compile. If it does, find out why
  before adding a cache.

With Ninja, ask the build why each file is considered stale:

```sh
cmake -G Ninja -B build-ninja -DCMAKE_BUILD_TYPE=RelWithDebInfo
cmake --build build-ninja -- -d explain | head -50
```

### Cache compiles with ccache

Once incremental builds work, `ccache` makes clean rebuilds fast. It works with the
Ninja and Makefile generators, but the Xcode generator ignores compiler launchers:

```sh
brew install ccache
cmake -G Ninja -B build-ninja -DCMAKE_BUILD_TYPE=RelWithDebInfo \
      -DCMAKE_C_COMPILER_LAUNCHER=ccache -DCMAKE_CXX_COMPILER_LAUNCHER=ccache
```

Ninja does not create a dSYM by itself. Add a post-build step to the
`GraphicsDemo` target in `CMakeLists.txt`:

```cmake
if (APPLE)
    add_custom_command(TARGET GraphicsDemo POST_BUILD
        COMMAND dsymutil "$<TARGET_BUNDLE_DIR:GraphicsDemo>/Contents/MacOS/Graphics Demo"
                -o "$<TARGET_BUNDLE_DIR:GraphicsDemo>.dSYM"
        COMMENT "Generating dSYM for GraphicsDemo")
endif()
```

If you use the Xcode generator with `dwarf-with-dsym` you do not need this step.
Adjust the executable name if you changed `PRODUCT_NAME`.

## Summary

| Goal                                  | Command                                                              |
| ------------------------------------- | -------------------------------------------------------------------- |
| Configure with dSYMs                  | `cmake -G Xcode -B build -DCMAKE_XCODE_ATTRIBUTE_DEBUG_INFORMATION_FORMAT=dwarf-with-dsym` |
| Build an optimised app with symbols   | `cmake --build build --config RelWithDebInfo`                        |
| Compare UUIDs                         | `dwarfdump --uuid <executable>` and `dwarfdump --uuid <app>.dSYM`    |
| Sample a running app                  | `sample "Graphics Demo" 10 -file gd.txt`                             |
| Record in Instruments                 | `xctrace record --template "Time Profiler" --attach "Graphics Demo"` |
| Create a dSYM by hand                 | `dsymutil <executable> -o <app>.dSYM`                                |

## Sources

This guide is original to this repository and has no juce.com tutorial behind it.
It draws on the behaviour of Xcode's `DEBUG_INFORMATION_FORMAT` setting, Apple's
`sample`, `dsymutil`, `dwarfdump`, and `xctrace` tools, and the Projucer Xcode
exporter in `extras/Projucer/Source/ProjectSaving/jucer_ProjectExport_Xcode.h`.
