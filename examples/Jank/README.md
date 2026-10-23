# JUCE + jank (proof of concept)

Calls JUCE from [jank](https://github.com/jank-lang/jank), a Clojure dialect hosted on LLVM/C++.
Status: **scaffold**. The bridge library builds and works from C++. The `.jank` file has not been run
against a real jank build (see [docs/Jank Integration Notes.md](../../docs/Jank%20Integration%20Notes.md)).

## Layout

- `bridge/` - a shared library (`jank_juce_bridge`) wrapping a few JUCE calls behind a JUCE-free header.
- `src/juce_hello.jank` - the example, which includes the header with `cpp/raw` and calls into it.
- `CMakeLists.txt` - builds the library and generates `run-juce-hello.sh` with the right jank flags.

## Build and run

Requires a jank install (alpha; needs LLVM 22, see jank's `compiler+runtime/doc/build.md`) on `PATH`.

    cmake -S examples/Jank -B build-jank -G Ninja -DJANK_EXECUTABLE=/path/to/jank
    cmake --build build-jank
    ./build-jank/run-juce-hello.sh

The generated script runs `jank -I <bridge dir> -L <lib dir> -l jank_juce_bridge --module-path src run-main juce-hello`.

Licensing: JUCE is AGPLv3 or commercial. See [LICENSE.md](../../LICENSE.md).
