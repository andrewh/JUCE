# Glossary

**JUCE classes, audio terms, and plug-in jargon in plain English.** Terms are alphabetical; every entry has its own link anchor, and the site search (<kbd>/</kbd> or <kbd>Ctrl</kbd>+<kbd>K</kbd>) finds them too.

<div class="glossary-index">
  <a href="#a">A</a><a href="#b">B</a><a href="#c">C</a><a href="#d">D</a><a href="#e">E</a><a href="#f">F</a><a href="#g">G</a><a href="#h">H</a><a href="#i">I</a><a href="#j">J</a><a href="#l">L</a><a href="#m">M</a><a href="#o">O</a><a href="#p">P</a><a href="#r">R</a><a href="#s">S</a><a href="#t">T</a><a href="#u">U</a><a href="#v">V</a><a href="#w">W</a>
</div>

## A {#a}

### AAX {#aax}
Avid Audio eXtension, the plug-in format for **Pro Tools**. JUCE bundles the SDK, but shipping requires signing with PACE tools. → [Plug-in formats](../guide/plugin-anatomy#formats-at-a-glance)

### AbstractFifo {#abstractfifo}
Manages the read and write positions of a lock-free, single-producer, single-consumer ring buffer. You supply the storage. The standard way to stream data between the audio and GUI threads. *juce_core*

### APVTS (AudioProcessorValueTreeState) {#apvts}
Owns a plug-in's parameters, keeps them in sync with a `ValueTree` for saving, and provides attachments that bind widgets to parameters. *juce_audio_processors* → [State](../guide/core-concepts#state)

### ARA {#ara}
Audio Random Access, a Celemony-led extension that lets a plug-in (such as Melodyne) see a host's whole audio clips and timeline, not only the live stream. Supported since JUCE 7.

### Attachment {#attachment}
A small object (`SliderAttachment`, `ButtonAttachment`, `ComboBoxAttachment`, `ParameterAttachment`) that keeps a UI control and a plug-in parameter in sync in both directions, including host automation and undo gestures.

### AU / AUv3 {#au}
Apple's **Audio Unit** plug-in formats. AU (v2) is a macOS bundle used by Logic and GarageBand. AUv3 is an app extension, sandboxed, and the only plug-in format on iOS.

### Audio thread {#audio-thread}
The high-priority thread, owned by the driver or host, that calls your processing code every block. It must never wait. → [Threads](../guide/core-concepts#threads)

### AudioBuffer {#audiobuffer}
A multi-channel block of `float` or `double` samples, stored as one array per channel (non-interleaved). The main data type passed to `processBlock()`. *juce_audio_basics*

### AudioDeviceManager {#audiodevicemanager}
Opens, configures, and remembers the audio and MIDI devices for a standalone app, and calls your `AudioIODeviceCallback`s. *juce_audio_devices*

### AudioProcessor {#audioprocessor}
The abstract base class for anything that processes audio and MIDI in blocks: your plug-in, a node in a graph, or a hosted third-party plug-in. *juce_audio_processors_headless* → [Anatomy of a plug-in](../guide/plugin-anatomy)

### AudioProcessorEditor {#audioprocessoreditor}
The `Component` that forms a plug-in's GUI. It is created by `AudioProcessor::createEditor()` and may be destroyed and recreated at any time.

### AudioProcessorGraph {#audioprocessorgraph}
An `AudioProcessor` that contains other processors joined by audio and MIDI connections. The basis of modular hosts such as the AudioPluginHost.

### AudioSource {#audiosource}
A simpler, pull-based audio interface (`prepareToPlay` / `getNextAudioBlock` / `releaseResources`) used by players, mixers, and file readers. Unlike `AudioProcessor`, it has no parameters, buses, or MIDI.

## B {#b}

### Block / block size {#block-size}
The number of samples processed per callback, for example 64–1024. Smaller blocks mean lower latency but more CPU overhead. **Never assume a fixed size**: hosts may send shorter blocks than `prepareToPlay()` announced.

### Bus {#bus}
A named group of channels on a processor, such as "Main In" (stereo) or "Sidechain" (mono). Negotiated with the host through `BusesProperties` and `isBusesLayoutSupported()`.

## C {#c}

### Component {#component}
The base class of every GUI element: a rectangle that paints itself, holds children, and receives mouse and keyboard events. *juce_gui_basics* → [Components](../guide/core-concepts#components)

### ComponentPeer {#componentpeer}
The platform-specific native window behind a top-level `Component`. Child components don't have one.

### createPluginFilter() {#createpluginfilter}
The free function every JUCE plug-in must define. It returns a new instance of your `AudioProcessor`, and the format wrappers call it. ("Filter" is a legacy word for processor.)

## D {#d}

### Denormals {#denormals}
Extremely small floating-point numbers that can make CPUs slow down dramatically, typically in decaying filter tails. `ScopedNoDenormals` at the top of `processBlock()` switches them off.

### DSP {#dsp}
Digital signal processing: the maths applied to audio samples. Also the `juce_dsp` module.

## E {#e}

### Exporter {#exporter}
In the Projucer, a target IDE configuration: Xcode (macOS or iOS), Visual Studio, Android, or Linux Makefile.

## F {#f}

### FloatVectorOperations {#floatvectoroperations}
SIMD-accelerated functions for whole arrays of samples: add, multiply, copy, clip, find min and max. *juce_audio_basics*

## G {#g}

### Graphics {#graphics}
The drawing context passed to `Component::paint()`. It fills, strokes, draws text and images, and clips, independent of the platform renderer. *juce_graphics*

## H {#h}

### Headless {#headless}
Running without a display or GUI, for example on a server, in CI, or on embedded Linux. JUCE 6 added headless Linux support. `juce_audio_processors_headless` provides the plug-in model without `juce_graphics`.

### Host {#host}
The application that loads plug-ins: a DAW such as Ableton Live, Logic, Pro Tools, or Reaper, or JUCE's own AudioPluginHost.

## I {#i}

### Introjucer {#introjucer}
The Projucer's predecessor, a project generator for the module format. It was merged into the Projucer in JUCE 4.2.

## J {#j}

### jassert {#jassert}
JUCE's debug-only assertion macro. When one fires, the comment above it usually explains what you did wrong.

### JUCEApplication {#juceapplication}
The base class for a GUI application's lifecycle (`initialise`, `shutdown`, `systemRequestedQuit`, …). The `START_JUCE_APPLICATION` macro creates `main()` for you.

### JuceHeader.h {#juceheader}
A legacy convenience header that includes all of a project's modules. The Projucer generates it, and CMake does so via `juce_generate_juce_header`. Modern code usually includes module headers directly.

## L {#l}

### Latency {#latency}
The delay between sound entering and leaving the system. It is driven by the block size, the driver, and any look-ahead in your algorithm. Report algorithmic latency with `setLatencySamples()` so hosts can compensate.

### LookAndFeel {#lookandfeel}
An object that draws the built-in widgets. Swap or subclass it (usually `LookAndFeel_V4`) to restyle an app without subclassing each widget.

### LV2 {#lv2}
An open, extensible plug-in standard, popular on Linux. JUCE 7 added authoring and hosting.

## M {#m}

### Message thread {#message-thread}
The single thread that runs the event loop, GUI, timers, and most callbacks. Only this thread may touch `Component`s. → [Threads](../guide/core-concepts#threads)

### MessageManager {#messagemanager}
Runs the message loop. `MessageManager::callAsync()` queues a function to run on the message thread. *juce_events*

### MIDI / MIDI 2.0 / UMP {#midi}
The Musical Instrument Digital Interface protocol. `MidiMessage` and `MidiBuffer` carry MIDI 1.0 events. MIDI 2.0 adds higher resolution and bidirectional negotiation (**MIDI-CI**), and uses **Universal MIDI Packets** (UMP). *juce_audio_basics, juce_midi_ci*

### Module {#module}
A folder of JUCE source with one main header, a declaration block, and a few compile-unit `.cpp` files. The unit of dependency in JUCE. → [Build systems](../guide/build-systems)

### MPE {#mpe}
MIDI Polyphonic Expression, a convention for per-note pitch bend, pressure, and timbre by giving each note its own MIDI channel. Supported by `MPESynthesiser` and related classes.

## O {#o}

### OSC {#osc}
Open Sound Control, a network protocol for sending addressed control messages (`/synth/cutoff 0.5`) over UDP. *juce_osc*

### Oversampling {#oversampling}
Processing at a multiple of the sample rate to reduce aliasing in non-linear effects such as distortion. `dsp::Oversampling`.

## P {#p}

### PACE {#pace}
PACE Anti-Piracy, the company that owns JUCE (since 2020). It also makes iLok and the signing tools required for AAX.

### Parameter {#parameter}
A host-visible, automatable control of a plug-in, such as `AudioParameterFloat`. Its ID must stay stable across versions.

### PIP {#pip}
Projucer Instant Project: a single header with a metadata block that tools turn into a full project. Most JUCE demos are PIPs.

### prepareToPlay() {#preparetoplay}
Called before processing starts, with the sample rate and maximum block size. Allocate and reset here, not in the audio callback.

### processBlock() {#processblock}
The audio callback of an `AudioProcessor`. It receives an `AudioBuffer` (input and output, processed in place) and a `MidiBuffer`. It runs on the audio thread.

### Projucer {#projucer}
JUCE's GUI project manager and IDE exporter. It edits `.jucer` files. It is an alternative to CMake. → [Build systems](../guide/build-systems#the-projucer)

## R {#r}

### Real-time safe {#real-time-safe}
Code that finishes in bounded time: no locks that might wait, no allocation, no system calls with unbounded duration. Required on the audio thread.

### repaint() {#repaint}
Marks a component (or area) as needing a redraw. The actual `paint()` happens later, and multiple calls are merged.

### resized() {#resized}
Called when a component's size changes. This is where you set the bounds of its children.

## S {#s}

### Sample rate {#sample-rate}
Samples per second per channel, commonly 44,100 or 48,000 Hz. It can change between `prepareToPlay()` calls, so never hard-code it.

### SafePointer {#safepointer}
`Component::SafePointer<T>`: a pointer to a component that automatically becomes null if the component is deleted. Use it in async callbacks.

### SmoothedValue {#smoothedvalue}
Ramps a value to its target over a set time, to avoid clicks ("zipper noise") when parameters jump.

### Standalone {#standalone}
A plug-in format target that wraps your plug-in in its own application window, with audio and MIDI settings.

### Synthesiser {#synthesiser}
A polyphonic synth framework: a `Synthesiser` owns `SynthesiserVoice`s, assigns incoming notes to them, and mixes their output.

## T {#t}

### Timer {#timer}
Calls `timerCallback()` on the message thread at a set interval. Ideal for polling audio-thread state to drive meters.

### Tracktion {#tracktion}
The DAW Julian Storer wrote, from which JUCE was extracted. Its engine now lives on as the open-source Tracktion Engine, built on JUCE.

## U {#u}

### UndoManager {#undomanager}
Records `UndoableAction`s (and `ValueTree` changes you pass it to) into transactions that can be undone and redone. *juce_data_structures*

## V {#v}

### ValueTree {#valuetree}
A reference-counted tree of typed nodes with properties and children. It is observable, undoable, and serialisable, and it is JUCE's recommended model for app and plug-in state. *juce_data_structures*

### var {#var}
A variant type holding an int, double, bool, string, array, object, or binary data. It is used for `ValueTree` properties and JSON.

### VST3 {#vst3}
Steinberg's current plug-in format, supported on macOS, Windows, and Linux. Its SDK is bundled with JUCE and has been MIT-licensed since version 3.8.0.

## W {#w}

### WebView UI {#webview-ui}
A plug-in or app interface written in HTML, CSS, and JavaScript, hosted in a `WebBrowserComponent` and bound to parameters via relays. Added in JUCE 8.

### Wrapper {#wrapper}
The code in `juce_audio_plugin_client` that implements a plug-in format's API and forwards calls to your `AudioProcessor`.
