---
pageClass: wide
aside: false
---

# Module map

**Every JUCE module and every dependency between them, generated at build time from the `BEGIN_JUCE_MODULE_DECLARATION` blocks in `modules/*/juce_*.h`.** Columns are *layers*: a module's layer is the length of its longest dependency chain down to `juce_core`.

Click (or tab to and press Enter on) a module to highlight what it **depends on** (blue) and what is **built on it** (orange). Use the chips to hide groups.

<ModuleGraph />

## Reading the graph

- **Left means fundamental.** `juce_core` (layer 0) is needed by everything; nothing depends on the rightmost modules.
- **Linking pulls in the whole upstream chain.** Add `juce::juce_audio_utils` to a CMake target and you get it plus the 11 modules beneath it. Selecting a module shows this "pulls in" count.
- **Two independent trunks.** The audio chain (`audio_basics → audio_devices / audio_formats → dsp`) never touches the GUI chain (`graphics → gui_basics → gui_extra`). They only meet in `juce_audio_processors` and `juce_audio_utils`.
- **`juce_events` is the junction.** Almost every branch passes through it, because almost everything needs the message loop.
- **Some modules are leaves** (`juce_dsp`, `juce_osc`, `juce_midi_ci`, `juce_javascript`, `juce_video`, `juce_opengl`…). You can add or skip them freely.

## Questions to explore

1. Which module would you need for a command-line tool that converts WAV files to FLAC? What does it pull in?
2. Why does `juce_dsp` depend on `juce_audio_formats`? (Hint: look at `dsp::Convolution::loadImpulseResponse`.)
3. `juce_audio_processors_headless` pulls in only three modules. What kinds of program does that make possible that `juce_audio_processors` (which pulls in the whole GUI stack) did not?
