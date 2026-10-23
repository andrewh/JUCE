# JUCE and jank: integration notes

## Approach

jank JIT-compiles C++ with Clang/LLVM and reaches native code through `cpp/` forms
(`cpp/raw` for includes, `cpp/ns.fn` calls, `cpp/Type.` constructors, `cpp/.method` calls,
`cpp/new`, `cpp/box`/`cpp/unbox`). Native libraries are supplied with `-I`, `-D`, `-L`, `-l`
and `--framework` CLI flags.

This scaffold uses the **bridge library** route: JUCE is compiled normally by CMake into a shared
library, and jank only sees a small header with plain C++ types. Reasons:

- JUCE modules rely on module compile units, generated defines and platform frameworks, which are
  awkward to reproduce at JIT time.
- Parsing JUCE headers in jank's embedded Clang is slow and unproven.
- A narrow API makes the jank side easy to test and the C++ side easy to keep stable.

The alternative (stage 2) is including JUCE headers directly with `cpp/raw "#include <juce_core/juce_core.h>"`
plus `-I`, `-D` flags and `-l` for a prebuilt JUCE static/shared library.

## Assumptions (unverified)

- jank is alpha, and interop syntax and flags change. Details above come from the jank blog, CLI source
  and book, not from a working build here. LLVM 22 was not available in this environment.
- Argument and return conversion between jank values and `const char*`, `int`, `float` and `double`
  is assumed to work implicitly. It may need `cpp/cast` or `cpp/box`.
- The `-I`/`-L`/`-l` flags are placed before the subcommand in the generated script; jank may require a different order.

## Open issues

1. **Message thread and event loop.** JUCE GUI and audio code needs `MessageManager` running on a
   thread that jank's REPL/main does not currently own. Likely needs a bridge `init/shutdown` plus a pump or dedicated thread.
2. **Callbacks.** Subclassing (`AudioProcessor`, `Component`, `Timer`) cannot be done from jank directly;
   the bridge needs C-style function pointers or `std::function` shims that jank closures can fill.
3. **Real-time safety.** jank's GC (bdwgc) and JIT must stay off the audio thread. Audio callbacks should
   call precompiled code only.
4. **Plug-in formats.** Hosts load VST3/AU binaries, so jank would need AOT compilation
   (`jank compile` / `compile-module`) and a bundled runtime. That is the hardest part.
5. **Ownership.** Mapping JUCE `Component` ownership to jank GC (`cpp/new` uses the GC allocator; destructors
   for stack objects are not yet automatic).
6. **Toolchain mismatch.** JUCE's minimum compilers differ from jank's LLVM 22 requirement; ABI and libstdc++ alignment matter when loading the bridge.

## Suggested next steps

1. Verify the example against a real jank build and fix syntax.
2. Add bridge init/shutdown and a `MessageManager` pump, then a window with one `juce::Component`.
3. Try direct JUCE header includes in jank for `juce_core` only.
4. Prototype an audio processor shim calling a precompiled jank/AOT function.
