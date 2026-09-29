# Modules

**One section per module, grouped by role, with the classes you will meet first.** The purpose column and dependencies below are generated from each module's header.[^gen] The notes underneath are hand-written. For the visual version, see the [module map](./module-map).

<ModuleTable />

## Foundation

These modules have no GUI or audio code. Anything can use them, including command-line tools and servers.

### juce_core {#juce-core}

The base of everything, with no dependencies of its own. It covers what the C++ standard library does (and in JUCE's early days didn't), plus OS services.

- **Text**: `String`, `StringArray`, `Identifier`, `StringRef`, `CharPointer_UTF8`
- **Containers**: `Array`, `OwnedArray`, `ReferenceCountedArray`, `HashMap`, `var`, `DynamicObject`, `ListenerList`, `AbstractFifo`
- **Memory**: `HeapBlock`, `MemoryBlock`, `ReferenceCountedObject`, `WeakReference`, leak detector
- **Files and streams**: `File`, `FileInputStream`, `MemoryOutputStream`, `ZipFile`, `GZIPCompressorOutputStream`
- **Threads**: `Thread`, `ThreadPool`, `CriticalSection`, `SpinLock`, `WaitableEvent`, `ChildProcess`
- **Data formats**: `XmlElement`, `XmlDocument`, `JSON`
- **Network**: `URL`, `WebInputStream`, `StreamingSocket`, `DatagramSocket`
- **Misc**: `Time`, `RelativeTime`, `Random`, `Uuid`, `SystemStats`, `Logger`, `UnitTest`

*Start here:* `String`, `File`, `Array`, and `Thread`. You'll use them in every project.

### juce_events {#juce-events}

The **message loop** and everything asynchronous.

- `MessageManager`: runs the event loop; `callAsync()` posts work to it
- `JUCEApplicationBase`: the base of the app lifecycle (`JUCEApplication` in `juce_gui_basics` builds on it)
- `Timer`, `HighResolutionTimer`, `MultiTimer`
- `AsyncUpdater`, `ChangeBroadcaster`/`ChangeListener`, `ActionBroadcaster`
- Inter-process communication: `InterprocessConnection`, `ChildProcessCoordinator` / `ChildProcessWorker`
- `ScopedJuceInitialiser_GUI`, for starting JUCE's message system from your own `main()`

### juce_data_structures {#juce-data-structures}

Observable data and undo.

- `ValueTree` and `ValueTree::Listener`: the recommended app-state model
- `Value`, `ValueSource`
- `UndoManager`, `UndoableAction`
- `PropertiesFile`, `ApplicationProperties`: settings files
- `ValueTreeSynchroniser`: mirror a tree to another process or machine

### juce_cryptography {#juce-cryptography}

Hashes and basic crypto: `MD5`, `SHA256`, `Whirlpool`, `RSAKey`, `BlowFish`, and `Primes`. Useful for checksums and licence keys. For security-critical work, use a dedicated, audited library.

### juce_javascript {#juce-javascript}

`JavascriptEngine`, an embedded JavaScript interpreter built on QuickJS (via the bundled `choc` library)[^spdx], with `JSObject` and `JSCursor` for working with values. Split out of `juce_core` in 8.0.4. Useful for scripting and user-programmable features.

## Graphics & GUI

### juce_graphics {#juce-graphics}

2D drawing, independent of windows and widgets.

- `Graphics`: the drawing context passed to `paint()`
- Geometry: `Point`, `Line`, `Rectangle`, `Path`, `AffineTransform`, `RectangleList`
- `Colour`, `Colours`, `ColourGradient`, `FillType`
- `Image`, `ImageCache`, and image formats (PNG, JPEG, GIF, WebP)
- `Font`, `FontOptions`, `GlyphArrangement`, `TextLayout`, `AttributedString`, with Unicode shaping via HarfBuzz and SheenBidi[^spdx]
- `DropShadow`, `GlowEffect`
- Native renderers: CoreGraphics (Apple), Direct2D (Windows), and the software renderer

### juce_gui_basics {#juce-gui-basics}

The biggest module: the component system and standard widgets.

- **Core**: `Component`, `Desktop`, `ComponentPeer`, `MouseEvent`, `KeyPress`, `FocusTraverser`
- **App and windows**: `JUCEApplication`, `DocumentWindow`, `ResizableWindow`, `DialogWindow`, `AlertWindow`, `CallOutBox`
- **Widgets**: `TextButton`, `ToggleButton`, `Slider`, `ComboBox`, `Label`, `TextEditor`, `ListBox`, `TableListBox`, `TreeView`, `Viewport`, `TabbedComponent`, `PopupMenu`, `MenuBarComponent`
- **Layout**: `FlexBox`, `Grid`, `ComponentBoundsConstrainer`, `StretchableLayoutManager`
- **Look and feel**: `LookAndFeel`, `LookAndFeel_V4` (the default)[^laf]
- **Drawables**: `Drawable`, `DrawablePath`, `DrawableImage`, with a new SVG parser in JUCE 9[^cl]
- **Other**: `FileChooser`, `ApplicationCommandManager` (menus and shortcuts), `VBlankAttachment`, accessibility support

### juce_gui_extra {#juce-gui-extra}

Specialised GUI components, often wrapping native OS features.

- `WebBrowserComponent` plus relays (`WebSliderRelay`, …) for **WebView UIs**
- `CodeEditorComponent`, `CodeDocument`, `CPlusPlusCodeTokeniser`
- Native embedding: `NSViewComponent`, `HWNDComponent`, `XEmbedComponent`, `UIViewComponent`
- `SystemTrayIconComponent`, `PushNotifications`, `AnimatedAppComponent`, `ColourSelector`, `KeyMappingEditorComponent`, `RecentlyOpenedFilesList`

### juce_opengl {#juce-opengl}

Hardware-accelerated rendering. Attach an `OpenGLContext` to any component to render its `paint()` with OpenGL, or implement `OpenGLRenderer` for custom GL code. Also includes `OpenGLShaderProgram`, `OpenGLTexture`, `OpenGLFrameBuffer`, and `OpenGLAppComponent`. JUCE 9 added OpenGL ES on Linux.

### juce_animation {#juce-animation}

Added in JUCE 8.[^cl] Declarative animations: build an `Animator` with `ValueAnimatorBuilder` or `AnimatorSetBuilder`, then drive it with an `AnimatorUpdater` or a `VBlankAnimatorUpdater` synced to the display refresh rate. Includes easing functions.

### juce_video {#juce-video}

`VideoComponent` for playback and `CameraDevice` for capture, built on each platform's native media APIs.

### juce_box2d {#juce-box2d}

The Box2D 2D physics engine, bundled, plus `Box2DRenderer` to draw a Box2D world with JUCE `Graphics`. Handy for playful UIs and demos.

## Audio & MIDI

### juce_audio_basics {#juce-audio-basics}

Audio data types and building blocks with no device or file dependencies.

- **Buffers**: `AudioBuffer<float/double>`, `FloatVectorOperations` (SIMD helpers), `AudioChannelSet`, `AudioData` (sample-format conversion)
- **MIDI**: `MidiMessage`, `MidiBuffer`, `MidiMessageSequence`, `MidiFile`, `MidiKeyboardState`, **MPE** classes, and **MIDI 2.0 Universal MIDI Packets** (`ump/`)
- **Sources**: the `AudioSource` interface and helpers (`MixerAudioSource`, `ResamplingAudioSource`, `ToneGeneratorAudioSource`, …)
- **Synthesis**: `Synthesiser`, `SynthesiserVoice`, `SynthesiserSound`, `MPESynthesiser`
- **Utilities**: `SmoothedValue`, `ADSR`, `Reverb`, `IIRFilter`, `Decibels`, `AudioPlayHead`

### juce_audio_devices {#juce-audio-devices}

Talking to hardware.

- `AudioDeviceManager`: opens and manages the input and output device; the one class most apps need
- `AudioIODevice`, `AudioIODeviceType`, `AudioIODeviceCallback`
- Backends: CoreAudio (new implementation in JUCE 9)[^cl], WASAPI, DirectSound, ASIO, ALSA, JACK, Oboe, OpenSL, and iOS audio sessions
- MIDI I/O: `MidiInput`, `MidiOutput`, `MidiMessageCollector`, Bluetooth MIDI, and Windows MIDI Services
- `AudioSourcePlayer`, `AudioTransportSource`

### juce_audio_formats {#juce-audio-formats}

Reading and writing audio files.

- `AudioFormatManager`: register formats, then `createReaderFor (file)`
- `AudioFormatReader`, `AudioFormatWriter`, `AudioFormatReaderSource`, `BufferingAudioReader`
- Codecs: WAV, AIFF, FLAC, Ogg Vorbis, Opus, MP3 (decoding), CoreAudio and Windows Media (OS codecs), and a LAME-based MP3 encoder wrapper
- `AudioSubsectionReader`, `MemoryMappedAudioFormatReader`, and ARA audio readers

### juce_dsp {#juce-dsp}

Signal-processing building blocks with a common `prepare` / `process` / `reset` interface.

- **Framework**: `ProcessSpec`, `ProcessContextReplacing`, `AudioBlock`, `ProcessorChain`, `ProcessorDuplicator`
- **Filters**: `IIR::Filter`, `FIR::Filter`, `StateVariableTPTFilter`, `LinkwitzRileyFilter`, `LadderFilter`, and `FilterDesign`
- **Effects ("widgets")**: `Gain`, `Compressor`, `Limiter`, `NoiseGate`, `Chorus`, `Phaser`, `Reverb`, `WaveShaper`, `Oscillator`, `DelayLine`, `DryWetMixer`, `Panner`
- **Frequency domain**: `FFT`, `Convolution` (impulse responses), `WindowingFunction`
- **Maths**: `Oversampling`, `LookupTable`, `FastMathApproximations`, `Matrix`, `SIMDRegister`

### juce_midi_ci {#juce-midi-ci}

Added in 7.0.9. An implementation of **MIDI Capability Inquiry**, the MIDI 2.0 negotiation layer: discovery, profiles, and property exchange. The central class is `ci::Device`.

### juce_osc {#juce-osc}

Open Sound Control over UDP: `OSCSender`, `OSCReceiver`, `OSCMessage`, `OSCBundle`, and `OSCAddressPattern`. Often used for remote control from apps like TouchOSC, or to link with Max/MSP and SuperCollider.

## Plug-ins & hosting

### juce_audio_processors_headless {#juce-audio-processors-headless}

The GUI-free core of the plug-in model, split out in 8.0.11.

- `AudioProcessor`: the central interface (see [Anatomy of a plug-in](../guide/plugin-anatomy))
- Parameters: `AudioProcessorParameter`, `RangedAudioParameter`, `AudioParameterFloat` / `Int` / `Bool` / `Choice`, `AudioProcessorParameterGroup`
- `AudioProcessorGraph`: route processors into a network
- Hosting: `AudioPluginFormatManager`, `AudioPluginFormat`, `AudioPluginInstance`, `PluginDescription`, and headless format implementations (VST3, AU, LV2, LADSPA)
- **ARA** support classes, and the bundled VST3 SDK

### juce_audio_processors {#juce-audio-processors}

The GUI-dependent half.

- `AudioProcessorEditor`, `GenericAudioProcessorEditor`
- `AudioProcessorValueTreeState` and its `SliderAttachment`, `ButtonAttachment`, and `ComboBoxAttachment`
- `ParameterAttachment` and helpers for custom controls
- Scanning: `KnownPluginList`, `PluginDirectoryScanner`, `PluginListComponent`
- Format classes that can show a plug-in's own editor: `VST3PluginFormat`, `AudioUnitPluginFormat`, `LV2PluginFormat`, `VSTPluginFormat`

### juce_audio_plugin_client {#juce-audio-plugin-client}

The **format wrappers**: VST3, AU, AUv3, AAX, LV2, VST2, Unity, and Standalone. You never call this module directly. The build system compiles the right wrapper for each format target, and the wrapper calls your `createPluginFilter()`.

### juce_audio_utils {#juce-audio-utils}

Glue and ready-made audio UI.

- `AudioAppComponent`: the quickest way to a standalone audio app
- `AudioProcessorPlayer`: drive an `AudioProcessor` (or graph) from an audio device
- `AudioDeviceSelectorComponent`: a ready-made audio settings panel
- `AudioThumbnail`, `AudioThumbnailCache`: waveform displays
- `MidiKeyboardComponent`, `MPEKeyboardComponent`, `AudioVisualiserComponent`
- `SoundPlayer`, `AudioCDReader`, `BluetoothMidiDevicePairingDialogue`

## Commercial services

### juce_analytics {#juce-analytics}

Added in 5.2.0. Event tracking for your app: `Analytics` collects events and forwards them to `ThreadedAnalyticsDestination` subclasses that you implement to send data to your own back end. `ButtonTracker` logs button presses.

### juce_product_unlocking {#juce-product-unlocking}

Copy protection and purchasing.

- `OnlineUnlockStatus` and `OnlineUnlockForm`: activate a product against a server
- `TracktionMarketplaceStatus`: an implementation for the Tracktion marketplace
- `KeyGeneration`: generate RSA-signed licence keys
- `InAppPurchases`: the iOS, macOS, and Android store APIs

## Sources

The class lists above are hand-written from each module's headers in [`modules/`](https://github.com/andrewh/JUCE/blob/master/modules); the Doxygen comments there are the authority. Treat any list as a starting point rather than a complete API.

[^gen]: Generated by [`site/scripts/gen-modules.mjs`](https://github.com/andrewh/JUCE/blob/master/site/scripts/gen-modules.mjs) from each `BEGIN_JUCE_MODULE_DECLARATION` block.
[^laf]: [`juce_Desktop.cpp`](https://github.com/andrewh/JUCE/blob/master/modules/juce_gui_basics/desktop/juce_Desktop.cpp): `defaultLookAndFeel.reset (new LookAndFeel_V4());`.
[^cl]: [`CHANGE_LIST.md`](https://github.com/andrewh/JUCE/blob/master/CHANGE_LIST.md): 9.0.0 ("Added a new SVG parser", "Added a new macOS CoreAudio implementation") and 8.0.0 ("Added a new animation module").
[^spdx]: [`JUCE.spdx.json`](https://github.com/andrewh/JUCE/blob/master/JUCE.spdx.json) lists QuickJS, CHOC, HarfBuzz, and SheenBidi as bundled dependencies; the QuickJS helpers are in [`modules/juce_javascript/detail`](https://github.com/andrewh/JUCE/blob/master/modules/juce_javascript/detail).
