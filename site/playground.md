# Audio playground

**Hear a few of the ideas from the JUCE guide, live in your browser, by writing them in Cmajor.** The page compiles Cmajor source to WebAssembly and runs it in a Web Audio worklet. JUCE itself does not run here. The point is to get quick feedback on audio-processing concepts that carry straight over to JUCE.

<CmajorPlayground />

## What to look for, in JUCE terms

Start with **Sine with gain**, press *Build and play*, then drag the sliders.

| In the playground | In JUCE |
| --- | --- |
| `loop { … advance(); }` writes one frame per `advance()` | The body of `processBlock()`, where you fill each sample of an `AudioBuffer` |
| `processor.period`, `processor.frequency` | The sample rate you receive in `prepareToPlay()` |
| `input value float gain [[ min, max, init, unit ]]` | A parameter declared through [`AudioProcessorValueTreeState`](./guide/plugin-anatomy#parameters) |
| The sliders under the editor | A host's generic UI, or JUCE's `GenericAudioProcessorEditor` |
| `std::levels::dBtoGain (gain)` | `Decibels::decibelsToGain()` |

Try these small changes in the editable patches, then rebuild:

1. **Hear zipper noise.** Drag *Gain* quickly while a note plays. The value jumps between blocks. JUCE's answer is `SmoothedValue`, covered in [Core concepts](./guide/core-concepts). Cmajor has its own smoothing tools, but the problem is the same.
2. **Change the waveform.** Replace `sin (phase)` with a sawtooth such as `phase / pi - 1`. Listen to the aliasing at high frequencies, which is why JUCE's `dsp::Oscillator` and wavetable tools exist.
3. **Add a second parameter.** Declare one, use it, and watch a new slider appear. In JUCE the same change touches the parameter layout, the processor, and usually the editor.
4. **Break the code on purpose.** The compiler reports the error and line below the buttons.

Then read the same ideas in C++ with the [gain plug-in example](./examples/gain-plugin) and the [DSP gain example](./examples/dsp-gain).

## How it works

- The Cmajor compiler is built to WebAssembly. Pressing *Build and play* downloads it from [cmajor.dev](https://cmajor.dev) the first time, compiles your source to WASM, and runs it in an `AudioWorklet`.
- The *hosted* patches load their own files from cmajor.dev, including GUIs and samples. Their source is not editable here.
- Nothing you type is sent anywhere. Compilation happens in your browser.
- Browsers only allow audio after a click, which is why nothing plays until you press the button.

## Where this could go

Cmajor also has a JUCE bridge, `cmaj_JUCEPlugin.h`, that hosts a Cmajor patch inside a JUCE plug-in. That makes it a good route into Cmajor itself later, starting from the JUCE side.

## Licence

The playground loads the [Cmajor](https://github.com/cmajor-lang/cmajor) compiler at run time. Cmajor is published under GPLv3 or later, or a commercial licence; see its [licence page](https://cmajor.dev/docs/Licence). JUCE's own terms are in the footer.
