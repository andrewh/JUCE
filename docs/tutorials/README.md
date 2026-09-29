# JUCE tutorials, condensed

Fourteen guides that distil the tutorials at <https://juce.com/learn/tutorials/>
into one page per topic. Multi-part tutorials are merged, prose is shortened, and
code is updated for the JUCE version in this repository (for example `FontOptions`
instead of the deprecated `Font` constructors, `ParameterID` for parameters,
CMake-first project setup). For the full step-by-step walkthroughs, screenshots,
demo projects, and exercises, use the originals.

The guides are adapted from the ISC-licensed
[JUCE-tutorials](https://github.com/juce-framework/JUCE-tutorials) sources,
Copyright (c) Raw Material Software Limited. See [NOTICE.md](NOTICE.md) for the
attribution and licence text.

For API details, the headers are the reference: see the notes on finding
documentation in the main [README](../../README.md#api-documentation), and check
[BREAKING_CHANGES.md](../../BREAKING_CHANGES.md) when moving code between versions.

## Suggested order

| #  | Guide                                                              | You will learn                                                        | Level        |
| -- | ------------------------------------------------------------------ | --------------------------------------------------------------------- | ------------ |
| 01 | [Getting started](01-getting-started.md)                           | Project types, CMake and Projucer, the application class, windows, the main component | Beginner |
| 02 | [Graphics, layout, and animation](02-graphics-and-layout.md)       | `Graphics`, nested components, `Rectangle`, `FlexBox`, `Grid`, colours, look and feel, animation | Beginner |
| 03 | [Built-in widgets](03-widgets.md)                                  | `Label`, `Slider`, `ComboBox`, buttons, `TableListBox`                | Beginner     |
| 04 | [Listeners, `ValueTree`, and undo](04-listeners-and-state.md)      | Broadcasting changes, data models, serialisation, `UndoManager`       | Beginner to intermediate |
| 05 | [Audio input, output, files, and waveforms](05-audio-io-and-playback.md) | `AudioAppComponent`, devices, input processing, file playback, looping, thumbnails | Intermediate |
| 06 | [Synthesis](06-synthesis.md)                                       | Noise, sine, levels and decibels, `Synthesiser`, wavetables           | Intermediate |
| 07 | [MIDI and MPE](07-midi-and-mpe.md)                                 | `MidiMessage`, `MidiBuffer`, MIDI input, MPE zones and synthesis      | Intermediate |
| 08 | [Audio plug-in basics](08-plugin-basics.md)                        | Processor and editor, MIDI plug-ins, bus layouts, packaging           | Beginner to intermediate |
| 09 | [Plug-in parameters and state](09-plugin-parameters.md)            | Parameters, `AudioProcessorValueTreeState`, attachments, saving state | Intermediate |
| 10 | [Cascading effects with `AudioProcessorGraph`](10-audio-processor-graph.md) | Node graphs, dynamic effect chains, hosting processors | Advanced |
| 11 | [DSP](11-dsp.md)                                                   | Processor chains, filters, waveshaping, convolution, delay lines, FFT, SIMD | Intermediate to advanced |
| 12 | [Core utilities](12-utilities.md)                                  | `Random`, `BigInteger`, `File` and streams, OSC                       | Beginner to intermediate |
| 13 | [Rendering with OpenGL](13-opengl.md)                              | `OpenGLAppComponent`, shaders, matrices                               | Advanced     |
| 14 | [Mobile and app services](14-mobile-and-app-services.md)           | Android setup and screen sizes, purchases, notifications, analytics, licensing | Intermediate to advanced |

## Where each original tutorial went

| Original tutorial (juce.com)                                        | Guide |
| ------------------------------------------------------------------- | ----- |
| Projucer Part 1, getting started with the Projucer                  | 01    |
| Projucer Part 2, manage your Projucer projects                      | 01    |
| Projucer Part 3, choosing the right Projucer template               | 01    |
| The main component                                                  | 01    |
| The application window                                              | 01    |
| The Graphics class                                                  | 02    |
| Parent and child components                                         | 02    |
| The Point, Line, and Rectangle classes                              | 02    |
| Advanced GUI layout techniques                                      | 02    |
| Responsive GUI layouts using FlexBox and Grid                       | 02    |
| Colours in JUCE                                                     | 02    |
| Customise the look and feel of your app                             | 02    |
| Animating geometry                                                  | 02    |
| The Label class                                                     | 03    |
| The Slider class                                                    | 03    |
| The ComboBox class                                                  | 03    |
| Radio buttons and checkboxes                                        | 03    |
| The TableListBox class                                              | 03    |
| Listeners and Broadcasters                                          | 04    |
| The ValueTree class                                                 | 04    |
| Using an UndoManager with a ValueTree                               | 04    |
| The AudioDeviceManager class                                        | 05    |
| Processing audio input                                              | 05    |
| Build an audio player                                               | 05    |
| Looping audio using the AudioSampleBuffer class                     | 05    |
| Looping audio using the AudioSampleBuffer class (advanced)          | 05    |
| Draw audio waveforms                                                | 05    |
| Build a white noise generator                                       | 06    |
| Build a sine wave synthesiser                                       | 06    |
| Control audio levels                                                | 06    |
| Control audio levels using decibels                                 | 06    |
| Build a MIDI synthesiser                                            | 06    |
| Wavetable synthesis                                                 | 06    |
| Create MIDI data                                                    | 07    |
| Handling MIDI events                                                | 07    |
| Build a multi-polyphonic synthesiser                                | 07    |
| Understanding MPE zones                                             | 07    |
| Create a basic Audio/MIDI plugin, Part 1                            | 08    |
| Create a basic Audio/MIDI plugin, Part 2                            | 08    |
| Plugin examples                                                     | 08    |
| Configuring the right bus layouts for your plugins                  | 08    |
| Package your app or plugin for distribution                         | 08    |
| Adding plug-in parameters                                           | 09    |
| Saving and loading your plug-in state                               | 09    |
| Cascading plug-in effects                                           | 10    |
| Introduction to DSP                                                 | 11    |
| Add distortion through waveshaping and convolution                  | 11    |
| Create a string model with delay lines                              | 11    |
| The fast Fourier transform                                          | 11    |
| Visualise the frequencies of a signal in real time                  | 11    |
| Optimisation using the SIMDRegister class                           | 11    |
| The Random class                                                    | 12    |
| The BigInteger class                                                | 12    |
| File reading                                                        | 12    |
| Implement the OSC protocol in your app                              | 12    |
| Build an OpenGL application                                         | 13    |
| Getting started with Android                                        | 14    |
| Managing Android screen sizes                                       | 14    |
| In-App Purchases on desktop and mobile devices                      | 14    |
| Push Notifications on desktop and mobile devices                    | 14    |
| App analytics collection                                            | 14    |
| Unlock your plugins through online registration                     | 14    |

## Notes on the examples

- Code blocks are illustrative. They are written against this repository's JUCE
  version, but they are excerpts, so add the includes, `JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR`,
  and remaining pure-virtual overrides that your own classes need. Complete, buildable
  programs live in [`examples`](../../examples) and [`examples/CMake`](../../examples/CMake).
- Real-time code (audio callbacks, MIDI callbacks, `render()` in OpenGL) runs off the
  message thread. Each guide flags the thread rules that apply.
- Using JUCE requires compliance with its licence: see [LICENSE.md](../../LICENSE.md).
  A commercial JUCE licence may be required for closed-source products.
