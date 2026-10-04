# DSP: processors, filters, delay lines, convolution, and the FFT

Use the `juce_dsp` module to build effects and instruments from tested blocks, and
analyse audio in the frequency domain.

**Level:** Intermediate to advanced  
**Module:** link `juce::juce_dsp` (and `juce::juce_audio_utils` for examples)

## Set up the project

The project below plays a quiet 220 Hz tone through the oscillator, filter, and gain chain from the processor-chain section. Turn your volume down first. The later examples (distortion, convolution, delay lines, the FFT) are further processors and displays to add to it.

This guide builds on [Getting started](01-getting-started.md). Make a copy of the
`HelloJuce` folder from that tutorial, **without** its `build` folder, and name
the copy `DspDemo`. Keep `Main.cpp` exactly as it is, then replace the other three files so the folder looks like this:

```text
DspDemo/
├── CMakeLists.txt      # new: renamed target, modules for this guide
├── Main.cpp            # copied unchanged from tutorial 1
├── MainComponent.h     # new: replaces the one from tutorial 1
└── MainComponent.cpp   # new: replaces the one from tutorial 1
```

Replace `/path/to/JUCE` in `CMakeLists.txt` with the folder you cloned JUCE into, as in tutorial 1. This `CMakeLists.txt` renames the target to `DspDemo` and links the modules this guide needs.

**`CMakeLists.txt`**

```cmake
cmake_minimum_required(VERSION 3.22)
project(DSPDEMO VERSION 0.0.1)

add_subdirectory(/path/to/JUCE JUCE)   # or find_package (JUCE CONFIG REQUIRED)

juce_add_gui_app(DspDemo PRODUCT_NAME "Dsp Demo")

target_sources(DspDemo PRIVATE Main.cpp MainComponent.cpp)

target_compile_definitions(DspDemo PRIVATE
    JUCE_WEB_BROWSER=0
    JUCE_USE_CURL=0
    JUCE_APPLICATION_NAME_STRING="$<TARGET_PROPERTY:DspDemo,JUCE_PRODUCT_NAME>"
    JUCE_APPLICATION_VERSION_STRING="$<TARGET_PROPERTY:DspDemo,JUCE_VERSION>")

target_link_libraries(DspDemo
    PRIVATE juce::juce_audio_utils
            juce::juce_dsp
    PUBLIC  juce::juce_recommended_config_flags
            juce::juce_recommended_warning_flags)
```

**`MainComponent.h`**

```cpp
#pragma once

#include <juce_audio_utils/juce_audio_utils.h>
#include <juce_dsp/juce_dsp.h>

// An oscillator -> filter -> gain chain built from juce::dsp blocks
class Voice
{
public:
    enum { oscIndex, filterIndex, gainIndex };

    Voice()
    {
        chain.get<oscIndex>().initialise ([] (float x) { return std::sin (x); }, 128);  // lookup table
        chain.get<filterIndex>().setCutoffFrequencyHz (1000.0f);
        chain.get<filterIndex>().setResonance (0.7f);
        chain.get<gainIndex>().setGainLinear (0.1f);   // kept quiet so the demo is safe to run
    }

    void prepare (const juce::dsp::ProcessSpec& spec) { chain.prepare (spec); }
    void reset()                                       { chain.reset(); }

    template <typename Context>
    void process (const Context& context)              { chain.process (context); }

    void setFrequency (float hz, bool force = false)   { chain.get<oscIndex>().setFrequency (hz, force); }

private:
    juce::dsp::ProcessorChain<juce::dsp::Oscillator<float>,
                              juce::dsp::LadderFilter<float>,
                              juce::dsp::Gain<float>> chain;
};

class MainComponent final : public juce::AudioAppComponent
{
public:
    MainComponent();
    ~MainComponent() override;

    void prepareToPlay (int samplesPerBlockExpected, double sampleRate) override;
    void getNextAudioBlock (const juce::AudioSourceChannelInfo& info) override;
    void releaseResources() override;

private:
    Voice voice;

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR (MainComponent)
};
```

**`MainComponent.cpp`**

```cpp
#include "MainComponent.h"

MainComponent::MainComponent()
{
    setSize (400, 200);
    setAudioChannels (0, 2);   // no inputs, two outputs
}

MainComponent::~MainComponent()
{
    shutdownAudio();
}

void MainComponent::prepareToPlay (int samplesPerBlockExpected, double sampleRate)
{
    voice.prepare ({ sampleRate, (juce::uint32) samplesPerBlockExpected, 2 });
    voice.setFrequency (220.0f, true);
}

void MainComponent::getNextAudioBlock (const juce::AudioSourceChannelInfo& info)
{
    info.clearActiveBufferRegion();

    // Process only the region of the buffer JUCE asked us to fill
    juce::dsp::AudioBlock<float> block (*info.buffer);
    auto sub = block.getSubBlock ((size_t) info.startSample, (size_t) info.numSamples);
    voice.process (juce::dsp::ProcessContextReplacing<float> (sub));
}

void MainComponent::releaseResources()
{
    voice.reset();
}
```

## Concepts in one page

- **Time domain vs frequency domain.** Audio samples are a signal over time. The
  **FFT** converts a block of them to a spectrum (magnitude and phase per
  frequency), and back.
- **FIR filters** compute each output from a finite window of inputs: always
  stable, and can have linear phase. **IIR filters** also feed back their own
  outputs: cheap and flexible, but can become unstable. `juce_dsp` provides
  design helpers for both (Butterworth, Chebyshev, Elliptic, and other IIR
  designs; window, Kaiser, least-squares, and other FIR designs).
- **Waveshaping** applies a function to each sample. Clipping and `tanh` add
  harmonics, and so create distortion.
- **Convolution** applies an impulse response (a recording of how a space or
  device reacts to a click) to any signal: reverbs, cabinet and tape simulations.
- **Delay lines** hold past samples in a circular buffer: echoes, chorus, comb
  filters, and physical models of strings and tubes.

## The processor lifecycle

Every `juce::dsp` processor follows the same protocol, which is why they compose:

| Method      | Purpose                                                                    |
| ----------- | -------------------------------------------------------------------------- |
| `prepare (const ProcessSpec&)` | Called before processing with the sample rate, maximum block size, and channel count. Allocate here. |
| `process (const ProcessContext&)` | Process a block. Real-time safe.                             |
| `reset()`   | Clear internal state (filter memory, delay lines, smoothing).              |

```cpp
juce::dsp::AudioBlock<float> block (buffer);                    // a lightweight view of an AudioBuffer
juce::dsp::ProcessContextReplacing<float> context (block);      // process in place
processor.process (context);
```

`ProcessContextReplacing` reads and writes the same block. `ProcessContextNonReplacing`
takes separate input and output blocks. `AudioBlock::getSubBlock (start, length)` lets
you process part of a buffer, such as the region of a synthesiser's output block.

### Chains

`ProcessorChain<A, B, C>` runs processors in sequence, and forwards `prepare()`,
`process()`, and `reset()` to each of them. Access a member by index with
`get<index>()`:

```cpp
class Voice
{
public:
    enum { oscIndex, filterIndex, gainIndex };

    Voice()
    {
        chain.get<oscIndex>().initialise ([] (float x) { return std::sin (x); }, 128);  // lookup table
        chain.get<filterIndex>().setCutoffFrequencyHz (1000.0f);
        chain.get<filterIndex>().setResonance (0.7f);
        chain.get<gainIndex>().setGainLinear (0.7f);
    }

    void prepare (const juce::dsp::ProcessSpec& spec) { chain.prepare (spec); }
    void reset()                                       { chain.reset(); }

    template <typename Context>
    void process (const Context& context)              { chain.process (context); }

    void setFrequency (float hz, bool force = false)   { chain.get<oscIndex>().setFrequency (hz, force); }

private:
    juce::dsp::ProcessorChain<juce::dsp::Oscillator<float>,
                              juce::dsp::LadderFilter<float>,
                              juce::dsp::Gain<float>> chain;
};
```

Any class with `prepare`, `process`, and `reset` can join a chain, including your own
(a `CustomOscillator` made of two detuned oscillators, for example), so complex
voices are assembled from simple parts.

- `dsp::Oscillator<T>::initialise (function, lookupTableSize)` builds a
  waveform from any function of phase (`[-π, π]`). A sawtooth is
  `jmap (x, -pi, pi, -1, 1)`. The table approximates expensive maths for cheaper
  playback. Use `1 << n` entries and more for smoother output.
- Detune a second oscillator by about 1% for a thicker tone.
- Modulate from a control-rate LFO: run a second `Oscillator` at
  `sampleRate / 100`, process the audio in sub-blocks of about 100 samples, and
  update (say) the filter cutoff once per sub-block with
  `jmap (lfo.processSample (0.0f), -1.0f, 1.0f, 100.0f, 2000.0f)`.
- `dsp::Reverb`, `Chorus`, `Phaser`, `Compressor`, `Limiter`, `NoiseGate`, and
  `Oversampling` are ready-made effects that slot into the same chain.

### Multi-channel filters

An IIR `Filter<float>` is mono. To process several channels with one set of
coefficients, wrap it in `ProcessorDuplicator`, and update the *state*:

```cpp
juce::dsp::ProcessorDuplicator<juce::dsp::IIR::Filter<float>,
                               juce::dsp::IIR::Coefficients<float>> filter;

void prepare (const juce::dsp::ProcessSpec& spec)
{
    *filter.state = *juce::dsp::IIR::Coefficients<float>::makeHighPass (spec.sampleRate, 1000.0f);
    filter.prepare (spec);
}
```

Filter design lives on `IIR::Coefficients` (`makeLowPass`, `makeHighPass`,
`makeBandPass`, `makePeakFilter`, and so on); FIR design in `FIR::Coefficients` and
`FilterDesign`. For parameters that move continuously, `StateVariableTPTFilter` is
stable under fast modulation.

## Distortion: `WaveShaper`

```cpp
juce::dsp::ProcessorChain<juce::dsp::Gain<float>,
                          juce::dsp::WaveShaper<float>,
                          juce::dsp::Gain<float>> distortion;

// Hard clip:       x -> jlimit (-0.1f, 0.1f, x)
// Soft clip:       x -> std::tanh (x), driven by the pre-gain
distortion.get<1>().functionToUse = [] (float x) { return std::tanh (x); };
distortion.get<0>().setGainDecibels (30.0f);    // drive: more gain = more harmonics
distortion.get<2>().setGainDecibels (-20.0f);   // compensate for the level increase
```

Hard clipping (`signum`, `jlimit`) makes harsh, odd-harmonic-rich distortion. `tanh`
rounds the corners for a softer sound, and boosting the signal before shaping pushes
it towards a square wave. Consider `Oversampling` around a waveshaper to keep the
new harmonics from aliasing.

## Convolution

```cpp
juce::dsp::Convolution convolution;     // uniform-partitioned; loads on a background thread

void prepare (const juce::dsp::ProcessSpec& spec)
{
    convolution.prepare (spec);
    convolution.loadImpulseResponse (juce::File ("/path/to/ir.wav"),
                                     juce::dsp::Convolution::Stereo::yes,
                                     juce::dsp::Convolution::Trim::yes,
                                     0,                                         // 0 = whole IR
                                     juce::dsp::Convolution::Normalise::yes);
}

void process (const juce::dsp::ProcessContextReplacing<float>& context) { convolution.process (context); }
```

- `loadImpulseResponse()` also accepts in-memory data (for example from
  `BinaryData`) and an `AudioBuffer`. Loading happens off the audio thread and the
  new response is swapped in when ready.
- Convolution adds latency for long responses. The `Latency` and `NonUniform`
  constructors trade latency against CPU. Report it with
  `setLatencySamples (convolution.getLatency())` in a plug-in.
- Mix wet and dry with `dsp::DryWetMixer` for reverbs.

## Delay lines and a string model

`dsp::DelayLine<float>` is a ready-made, interpolating circular buffer:

```cpp
juce::dsp::DelayLine<float> delay { 96000 };        // maximum delay in samples

delay.prepare (spec);
delay.setDelay (0.25f * (float) spec.sampleRate);   // quarter of a second

for (size_t i = 0; i < numSamples; ++i)
{
    auto delayed = delay.popSample (channel);                  // read the delayed sample
    delay.pushSample (channel, std::tanh (in[i] + feedback * delayed));  // feed back, saturated
    out[i] = in[i] + wet * delayed;
}
```

Writing your own shows what is happening: a `std::vector` with a moving "least recent"
index; `push()` overwrites the oldest sample and steps the index back, and
`get (n)` reads `rawData[(index + 1 + n) % size]`.

- **Feedback delay.** Feed part of the output back into the line (through a
  saturator to keep it stable). Filter the feedback path with a low-pass so each
  repeat is duller, or a high-pass so each repeat is brighter.
- **Stereo delay.** Keep one delay line and delay time per channel (for example
  0.7 s and 0.5 s).
- **Waveguide string** (Karplus–Strong family). Two delay lines carry waves in
  opposite directions along the string. Each sample: read the ends, push the
  inverted reflection into the other line, low-pass filter one path (higher
  harmonics decay faster in real strings), scale by a decay coefficient, and read
  the output at a "pickup" position. The line length is
  `sampleRate / frequency`, so pitch comes from the length. A "pluck" fills both
  lines with a triangular displacement, peaking at the trigger position and
  scaled by note velocity:

```cpp
auto length = (size_t) juce::roundToInt (sampleRate / freqHz);
forward.resize (length);  backward.resize (length);

Type processSample() noexcept
{
    auto forwardOut  = forward.back();
    auto backwardOut = backward.back();
    forward.push  (-backwardOut);                                   // reflect at the far end
    backward.push (-decayCoef * lowpass.processSample (forwardOut)); // lose energy, dull the tone
    return forward.get (forwardPickup) + backward.get (backwardPickup);
}
```

## The FFT

`dsp::FFT` transforms blocks whose size is a power of two, given as an *order*
(`size = 1 << order`).

```cpp
juce::dsp::FFT fft (11);                              // 2048 points
std::array<float, 2 * 2048> data {};                  // needs 2 * size floats

// Fill data[0 .. size) with (windowed) samples, then:
fft.performRealOnlyForwardTransform (data.data());    // complex, interleaved output
// or, when you only need magnitudes:
fft.performFrequencyOnlyForwardTransform (data.data());   // first size/2 entries = magnitudes

fft.performRealOnlyInverseTransform (data.data());    // back to samples
```

Bin `k` corresponds to `k * sampleRate / size` Hz. Resolution improves, and time
resolution worsens, as the size grows.

## Real-time spectrum analyser

Collect samples on the audio thread, transform and draw on the message thread:

```cpp
class Analyser final : public juce::AudioAppComponent, private juce::Timer
{
public:
    enum { fftOrder = 11, fftSize = 1 << fftOrder, scopeSize = 512 };

    Analyser() : forwardFFT (fftOrder),
                 window (fftSize, juce::dsp::WindowingFunction<float>::hann)
    {
        setAudioChannels (2, 0);
        startTimerHz (30);
    }

    ~Analyser() override { shutdownAudio(); }

    void getNextAudioBlock (const juce::AudioSourceChannelInfo& info) override
    {
        if (info.buffer->getNumChannels() > 0)
        {
            auto* in = info.buffer->getReadPointer (0, info.startSample);
            for (int i = 0; i < info.numSamples; ++i)
                pushNextSampleIntoFifo (in[i]);
        }
    }

    void paint (juce::Graphics& g) override
    {
        g.fillAll (juce::Colours::black);
        g.setColour (juce::Colours::white);

        auto w = getWidth();
        auto h = (float) getHeight();
        for (int i = 1; i < scopeSize; ++i)
            g.drawLine ((float) juce::jmap (i - 1, 0, scopeSize - 1, 0, w),
                        juce::jmap (scope[(size_t) i - 1], 0.0f, 1.0f, h, 0.0f),
                        (float) juce::jmap (i,     0, scopeSize - 1, 0, w),
                        juce::jmap (scope[(size_t) i],     0.0f, 1.0f, h, 0.0f));
    }

private:
    void pushNextSampleIntoFifo (float sample) noexcept
    {
        if (fifoIndex == fftSize)
        {
            if (! nextBlockReady)                       // drop a block if the GUI is behind
            {
                std::fill (fftData.begin(), fftData.end(), 0.0f);
                std::copy (fifo.begin(), fifo.end(), fftData.begin());
                nextBlockReady = true;
            }
            fifoIndex = 0;
        }
        fifo[(size_t) fifoIndex++] = sample;
    }

    void timerCallback() override
    {
        if (! nextBlockReady) return;

        window.multiplyWithWindowingTable (fftData.data(), fftSize);   // reduce spectral leakage
        forwardFFT.performFrequencyOnlyForwardTransform (fftData.data());

        constexpr float mindB = -100.0f, maxdB = 0.0f;
        for (int i = 0; i < scopeSize; ++i)
        {
            auto skewed = 1.0f - std::exp (std::log (1.0f - (float) i / (float) scopeSize) * 0.2f);
            auto bin    = juce::jlimit (0, fftSize / 2, (int) (skewed * (float) fftSize * 0.5f));
            auto dB     = juce::Decibels::gainToDecibels (fftData[(size_t) bin])
                          - juce::Decibels::gainToDecibels ((float) fftSize);
            scope[(size_t) i] = juce::jmap (juce::jlimit (mindB, maxdB, dB), mindB, maxdB, 0.0f, 1.0f);
        }

        nextBlockReady = false;
        repaint();
    }

    void prepareToPlay (int, double) override {}
    void releaseResources() override {}

    juce::dsp::FFT forwardFFT;
    juce::dsp::WindowingFunction<float> window;
    std::array<float, fftSize>     fifo {};
    std::array<float, 2 * fftSize> fftData {};
    std::array<float, scopeSize>   scope {};
    int fifoIndex = 0;
    std::atomic<bool> nextBlockReady { false };
};
```

- **Windowing.** An FFT assumes its block repeats forever, and the seam between
  the end and start smears energy across bins (*spectral leakage*). Multiply the
  block by a window first. `rectangular` has the best resolution but the worst
  leakage, `hann` and `hamming` are good general choices, and `blackman` has the
  highest dynamic range and the lowest resolution.
- The display skews the frequency axis (`log`-like) so the bass region is not
  squashed, and maps decibels to `0..1` for drawing.
- The handshake flag `nextBlockReady` must be atomic because two threads use it.
  For a stricter design use `AbstractFifo` or a lock-free queue.

## SIMD acceleration

`dsp::SIMDRegister<float>` wraps the CPU's vector unit (SSE, AVX, or NEON), so one
operation handles several samples at once. It reads like ordinary maths, and
branches become masks:

```cpp
using Reg = juce::dsp::SIMDRegister<float>;

Reg calc (Reg x, Reg y)
{
    auto mask = Reg::greaterThan (x, y);                 // per-lane condition
    return ((x + y * 2.0f) & mask) + (y & ~mask);        // branch-free select
}
```

The usual use is to process a group of independent channels in one pass: interleave
`Reg::size()` channels into `AudioBlock<SIMDRegister<float>>`, run a
`IIR::Filter<SIMDRegister<float>>` over it, and de-interleave
(`SIMDInterleavingHelpers`). Guard the code with `#if JUCE_USE_SIMD`, align data,
and measure: the gains are largest for many-channel filter banks.

## Build and run

With all the files in place, configure and build from the project folder:

```sh
cmake -B build
cmake --build build
```

The build puts the finished app in `build/DspDemo_artefacts/`. With CMake's default generator on each platform (Makefiles on macOS and Linux, and
Visual Studio on Windows, which adds the `Debug` folder):

| Platform | Run it with |
| -------- | ----------- |
| macOS    | `open "build/DspDemo_artefacts/Dsp Demo.app"` |
| Linux    | `./build/DspDemo_artefacts/Dsp\ Demo` |
| Windows  | `build\DspDemo_artefacts\Debug\Dsp Demo.exe` |

Xcode and Visual Studio are multi-config generators and add a configuration folder,
for example `build/DspDemo_artefacts/Debug/Dsp Demo.app`; build with
`cmake --build build --config Debug`. With Ninja there is no configuration folder, so
drop `Debug` from the Windows path.

> **"The application cannot be opened because its executable is missing"?**
> CMake creates the empty `.app` bundle at the start of the build and only fills
> in the executable when compiling and linking succeed. If `cmake --build build`
> reported errors, fix them and build again, then re-run `open`. Check that the
> last lines of the build output say `Built target DspDemo`.

> **"use of undeclared identifier 'juce'"?** CMake projects have no
> `JuceHeader.h`, so every source file must include the module headers it uses.
> `MainComponent.h` includes them and `Main.cpp` includes `MainComponent.h`.
> Without those includes the compiler does not know what `juce::`, `std::`, or
> `START_JUCE_APPLICATION` mean.

## Sources

Condensed from the JUCE tutorials *Introduction to DSP*, *Add distortion through
waveshaping and convolution*, *Create a string model with delay lines*, *The fast
Fourier transform*, *Visualise the frequencies of a signal in real time*, and
*Optimisation using the SIMDRegister class*, Copyright (c) Raw Material Software
Limited, ISC licence. See [NOTICE.md](NOTICE.md).
