# Architecture

**JUCE is a stack of layered modules with two runtimes on top: an event-driven GUI on the *message thread*, and a real-time audio pipeline on the *audio thread*.** Most of what you write plugs into one of these two and passes data safely to the other.

## The layer cake

Each module declares its dependencies in its main header, so the framework forms a strict hierarchy with no cycles. Simplified, it looks like this (the [interactive module map](../reference/module-map) has every module and edge):

```mermaid
flowchart TB
  subgraph F["Foundation"]
    core["juce_core<br/><small>strings, containers, files, threads</small>"]
    events["juce_events<br/><small>message loop, timers</small>"]
    data["juce_data_structures<br/><small>ValueTree, undo</small>"]
  end
  subgraph G["Graphics &amp; GUI"]
    graphics["juce_graphics<br/><small>2D drawing, fonts, images</small>"]
    gui["juce_gui_basics<br/><small>Components, windows, widgets</small>"]
    guiextra["juce_gui_extra<br/><small>WebView, code editor, native embeds</small>"]
  end
  subgraph A["Audio &amp; MIDI"]
    abasics["juce_audio_basics<br/><small>buffers, MIDI, synth</small>"]
    adevices["juce_audio_devices<br/><small>sound cards, MIDI ports</small>"]
    aformats["juce_audio_formats<br/><small>WAV, FLAC, MP3, Opus…</small>"]
    dsp["juce_dsp<br/><small>filters, FFT, oversampling</small>"]
  end
  subgraph P["Plug-ins"]
    headless["juce_audio_processors_headless<br/><small>AudioProcessor, graph, hosting</small>"]
    procs["juce_audio_processors<br/><small>editors, scanning</small>"]
    client["juce_audio_plugin_client<br/><small>VST3 / AU / AAX / LV2 wrappers</small>"]
    utils["juce_audio_utils<br/><small>players, audio widgets</small>"]
  end

  events --> core
  data --> events
  graphics --> events
  gui --> graphics
  gui --> data
  guiextra --> gui
  abasics --> core
  adevices --> abasics
  adevices --> events
  aformats --> abasics
  dsp --> aformats
  headless --> abasics
  headless --> events
  procs --> headless
  procs --> guiextra
  client --> procs
  utils --> procs
  utils --> adevices
  utils --> aformats
```

Arrows point from a module to what it depends on. Some things to notice:

- **`juce_core` depends on nothing.** It is JUCE's replacement for much of the C++ standard library, plus OS services.
- **`juce_events` is the hinge.** Anything asynchronous (GUI, timers, device change notifications, OSC) needs its message loop.
- **The audio stack does not need the GUI.** `juce_audio_basics`, `juce_audio_devices`, `juce_audio_formats`, and `juce_dsp` never touch `juce_graphics`. You can build a headless audio tool or server.
- **Plug-in code is split in two.** `juce_audio_processors_headless` holds the `AudioProcessor` interface, parameters, graph, and format hosting with no GUI dependency. `juce_audio_processors` adds editors and plug-in scanning UI on top. (The split arrived in JUCE 8.0.11, so older tutorials only mention `juce_audio_processors`.)
- **`juce_audio_utils` sits at the top** because it glues everything together: device selectors, waveform thumbnails, keyboard widgets, and players.

## The two runtimes

```mermaid
flowchart LR
  subgraph MT["Message thread (one per app)"]
    direction TB
    os["OS events<br/>mouse, keys, window, timers"] --> mm["MessageManager"]
    mm --> comp["Component tree<br/>paint(), resized(), mouseDown()"]
    mm --> timers["Timer / AsyncUpdater<br/>ChangeListener callbacks"]
    comp --> state["App state<br/>ValueTree, parameters"]
  end
  subgraph AT["Audio thread (driven by the device or host)"]
    direction TB
    dev["Audio device or plug-in host"] --> cb["Audio callback"]
    cb --> proc["Your DSP<br/>processBlock() / getNextAudioBlock()"]
  end
  state -. "atomics, lock-free FIFOs" .-> proc
  proc -. "meters, analysis via FIFO + Timer" .-> timers
```

| | Message thread | Audio thread |
| --- | --- | --- |
| **Who drives it** | `MessageManager` running the OS event loop | The audio driver or plug-in host, every few milliseconds |
| **What runs there** | GUI, timers, file dialogs, most listeners | `processBlock()`, `getNextAudioBlock()`, `audioDeviceIOCallbackWithContext()` |
| **Rules** | May block briefly; must not freeze | No locks that can wait, no allocation, no file or network I/O, no GUI calls |
| **Talking to the other side** | Write atomics or push to a FIFO | Read atomics or pop from a FIFO; never call into Components |

Getting this boundary right is the most important skill in JUCE programming. See [Core concepts → Threads](./core-concepts#threads) for the tools JUCE gives you.

## How audio reaches your code

There are three common entry points. They share the same idea: something outside your code owns the clock and calls you with a buffer to fill.

### 1. A standalone audio app

```mermaid
sequenceDiagram
  participant HW as Sound card driver
  participant ADM as AudioDeviceManager
  participant P as AudioSourcePlayer / AudioProcessorPlayer
  participant Y as Your code
  Note over ADM: Opens the device chosen by the user<br/>(CoreAudio, WASAPI, ASIO, ALSA, JACK, Oboe…)
  ADM->>P: audioDeviceAboutToStart(device)
  P->>Y: prepareToPlay(sampleRate, blockSize)
  loop Every block (for example 512 samples)
    HW->>ADM: I/O callback on the audio thread
    ADM->>P: audioDeviceIOCallbackWithContext(inputs, outputs, n)
    P->>Y: getNextAudioBlock() / processBlock()
    Y-->>P: filled buffer
  end
  ADM->>P: audioDeviceStopped()
  P->>Y: releaseResources()
```

`AudioAppComponent` (in `juce_audio_utils`) packages this for you. It is a `Component` *and* an `AudioSource`, with its own `AudioDeviceManager` and `AudioSourcePlayer`.

### 2. A plug-in

The host owns the clock. A format wrapper in `juce_audio_plugin_client` translates the host's calls (VST3's `process()`, AU's render callback, and so on) into `AudioProcessor::processBlock()`. See [Anatomy of a plug-in](./plugin-anatomy).

### 3. A plug-in host or modular app

`AudioProcessorGraph` connects many `AudioProcessor`s (your own or loaded third-party plug-ins) into one. An `AudioProcessorPlayer` then feeds it from an audio device. This is how `extras/AudioPluginHost` works.

## How the GUI reaches your code

```mermaid
sequenceDiagram
  participant OS as Operating system
  participant Peer as ComponentPeer (native window)
  participant C as Your Component
  OS->>Peer: mouse click at (x, y)
  Peer->>C: mouseDown(event) on the component under the mouse
  C->>C: update state, call repaint()
  Note over C: repaint() only marks a region dirty
  OS->>Peer: paint request for dirty region
  Peer->>C: paint(Graphics&) for each overlapping component
```

- A **top-level** `Component` (usually a `DocumentWindow`) gets a `ComponentPeer`, the platform-specific native window.
- **Child** components are lightweight: they have no native window. JUCE hit-tests and clips them itself, so the same UI renders identically everywhere.
- Drawing goes through `Graphics`, which targets a rendering backend: CoreGraphics, Direct2D, the software renderer, or OpenGL.

## How an app starts

```mermaid
flowchart LR
  macro["START_JUCE_APPLICATION(MyApp)"] --> main["generated main() / WinMain"]
  main --> init["JUCEApplication::initialise()<br/>create windows and managers"]
  init --> loop["MessageManager runs the event loop"]
  loop --> quit["systemRequestedQuit() → quit()"]
  quit --> shutdown["shutdown()<br/>destroy windows"]
```

For a plug-in there is no `main()`: the host loads your binary and the wrapper calls `createPluginFilter()`, a function you provide that returns your `AudioProcessor`.

## Where the tools fit

```mermaid
flowchart LR
  subgraph Authoring
    cmake["CMake + JUCEUtils.cmake<br/>juce_add_plugin(), juce_add_gui_app()"]
    projucer["Projucer<br/>.jucer file → IDE projects"]
  end
  subgraph Code["Your source + JUCE modules"]
    src["Your .cpp / .h"]
    mods["modules/juce_*"]
  end
  subgraph Outputs
    app["Desktop / mobile app"]
    plug["VST3 · AU · AUv3 · AAX · LV2 · Standalone"]
  end
  cmake --> Code
  projucer --> Code
  Code --> app
  Code --> plug
  plug --> host["AudioPluginHost<br/>(for testing)"]
```

See [Build systems](./build-systems) for details.
