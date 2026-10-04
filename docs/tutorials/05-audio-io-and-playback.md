# Audio input, output, files, and waveforms

Get audio in and out of an application, play and read sound files, loop buffers,
and draw waveforms.

**Level:** Intermediate  
**Platforms:** Windows, macOS, Linux (and mobile with the appropriate permissions)

Link `juce::juce_audio_utils` (which brings in devices, formats, and basics).

## Set up the project

The project below opens the default audio device and shows its sample rate. The snippets that follow change what `MainComponent` does with audio.

This guide builds on [Getting started](01-getting-started.md). Make a copy of the
`HelloJuce` folder from that tutorial, **without** its `build` folder, and name
the copy `AudioDemo`. Keep `Main.cpp` exactly as it is, then replace the other three files so the folder looks like this:

```text
AudioDemo/
├── CMakeLists.txt      # new: renamed target, modules for this guide
├── Main.cpp            # copied unchanged from tutorial 1
├── MainComponent.h     # new: replaces the one from tutorial 1
└── MainComponent.cpp   # new: replaces the one from tutorial 1
```

In `CMakeLists.txt`, `/path/to/JUCE` stands for the JUCE path you already set in tutorial 1, so keep that path as it is unless JUCE has moved. This `CMakeLists.txt` renames the target to `AudioDemo` and links the modules this guide needs.

**`CMakeLists.txt`**

```cmake
cmake_minimum_required(VERSION 3.22)
project(AUDIODEMO VERSION 0.0.1)

add_subdirectory(/path/to/JUCE JUCE)   # or find_package (JUCE CONFIG REQUIRED)

juce_add_gui_app(AudioDemo PRODUCT_NAME "Audio Demo"
    MICROPHONE_PERMISSION_ENABLED TRUE)

target_sources(AudioDemo PRIVATE Main.cpp MainComponent.cpp)

target_compile_definitions(AudioDemo PRIVATE
    JUCE_WEB_BROWSER=0
    JUCE_USE_CURL=0
    JUCE_APPLICATION_NAME_STRING="$<TARGET_PROPERTY:AudioDemo,JUCE_PRODUCT_NAME>"
    JUCE_APPLICATION_VERSION_STRING="$<TARGET_PROPERTY:AudioDemo,JUCE_VERSION>")

target_link_libraries(AudioDemo
    PRIVATE juce::juce_audio_utils
    PUBLIC  juce::juce_recommended_config_flags
            juce::juce_recommended_warning_flags)
```

**`MainComponent.h`**

```cpp
#pragma once

#include <juce_audio_utils/juce_audio_utils.h>

class MainComponent final : public juce::AudioAppComponent
{
public:
    MainComponent();
    ~MainComponent() override;

    void prepareToPlay (int samplesPerBlockExpected, double sampleRate) override;
    void getNextAudioBlock (const juce::AudioSourceChannelInfo& info) override;
    void releaseResources() override;

    void paint (juce::Graphics& g) override;

private:
    std::atomic<double> currentSampleRate { 0.0 };

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR (MainComponent)
};
```

**`MainComponent.cpp`**

```cpp
#include "MainComponent.h"

MainComponent::MainComponent()
{
    setSize (400, 200);
    setAudioChannels (2, 2);   // inputs, outputs: opens the default device
}

MainComponent::~MainComponent()
{
    shutdownAudio();           // mandatory: stops the audio thread first
}

void MainComponent::prepareToPlay (int, double sampleRate)
{
    currentSampleRate = sampleRate;

    juce::MessageManager::callAsync ([safe = juce::Component::SafePointer<MainComponent> (this)]
    {
        if (safe != nullptr)
            safe->repaint();
    });
}

void MainComponent::getNextAudioBlock (const juce::AudioSourceChannelInfo& info)
{
    info.clearActiveBufferRegion();   // silence for now
}

void MainComponent::releaseResources() {}

void MainComponent::paint (juce::Graphics& g)
{
    g.fillAll (juce::Colours::black);
    g.setColour (juce::Colours::white);
    g.drawText ("Audio running at " + juce::String (currentSampleRate.load()) + " Hz",
                getLocalBounds(), juce::Justification::centred);
}
```

`MICROPHONE_PERMISSION_ENABLED TRUE` in `CMakeLists.txt` adds the microphone
permission string that macOS and iOS require before an app can record. Without it,
the app is killed when it opens an input device, and you only get silence on
input. Add `MICROPHONE_PERMISSION_TEXT "Why you need the mic"` to change the
wording the user sees. On the first run, macOS asks for permission.

How to use the snippets in this guide: whole-class snippets replace
`MainComponent` (put them in `MainComponent.h`, and move the member function
bodies into `MainComponent.cpp` if you prefer). Individual member functions such
as `getNextAudioBlock()` replace the same function in the project above.

## `AudioAppComponent`: the audio callback

`AudioAppComponent` is a `Component` that is also an `AudioSource` and owns an
`AudioDeviceManager` named `deviceManager`. It is the quickest route to a working
audio application (the Projucer's "Audio Application" template is this class).

```cpp
class MainComponent final : public juce::AudioAppComponent
{
public:
    MainComponent()
    {
        setSize (400, 200);
        setAudioChannels (2, 2);              // inputs, outputs: opens the default device
    }

    ~MainComponent() override { shutdownAudio(); }   // mandatory: stops the audio thread first

    void prepareToPlay (int samplesPerBlockExpected, double sampleRate) override
    {
        // Allocate and initialise anything that depends on the sample rate or block size
    }

    void getNextAudioBlock (const juce::AudioSourceChannelInfo& info) override
    {
        // Called on the audio thread. Fill info.buffer from info.startSample,
        // for info.numSamples samples.
        info.clearActiveBufferRegion();
    }

    void releaseResources() override {}
};
```

Rules for `getNextAudioBlock()`, which runs on a real-time thread:

- Do not allocate, lock, block, do file or network I/O, or touch GUI objects.
- Read GUI values through a `std::atomic`, `SmoothedValue`, or another
  real-time-safe channel, not by calling slider methods directly. (The
  tutorial code reads `slider.getValue()` for brevity; treat that as demo-only.)
- The buffer may contain stale data: overwrite or clear every sample you are
  responsible for.
- `prepareToPlay()` may be called again whenever the device changes, so re-derive
  every sample-rate-dependent value there.

## Choosing devices: `AudioDeviceManager`

`deviceManager` opens the default device unless told otherwise, and is also the
hub for incoming MIDI. Give users a settings panel with
`AudioDeviceSelectorComponent`:

```cpp
juce::AudioDeviceSelectorComponent selector { deviceManager,
                                              0, 256,      // min/max input channels
                                              0, 256,      // min/max output channels
                                              false,       // show MIDI inputs
                                              false,       // show MIDI outputs
                                              false,       // channels as stereo pairs
                                              false };     // hide advanced options
```

It offers device, channel, sample rate, and buffer size choices, plus a "Test"
button that plays a tone. `AudioDeviceManager` is a `ChangeBroadcaster`, so
listen to be told when settings change, then inspect the device:

```cpp
void changeListenerCallback (juce::ChangeBroadcaster*) override
{
    if (auto* device = deviceManager.getCurrentAudioDevice())
        DBG (device->getName() << ": " << device->getCurrentSampleRate() << " Hz, "
             << device->getCurrentBufferSizeSamples() << " samples, "
             << device->getActiveInputChannels().countNumberOfSetBits() << " in / "
             << device->getActiveOutputChannels().countNumberOfSetBits() << " out");
}
```

`deviceManager.getCpuUsage()` returns the fraction of the audio time budget
used (poll it from a `Timer`). Save and restore user choices with
`deviceManager.createStateXml()` and the `initialise()` overload that accepts
that XML.

## Processing audio input

Input and output share **one buffer**: the input arrives in the channels of
`info.buffer` and you overwrite it with the output. Read first, then write. Work
out which channels are live:

```cpp
void getNextAudioBlock (const juce::AudioSourceChannelInfo& info) override
{
    auto* device = deviceManager.getCurrentAudioDevice();
    auto activeIn  = device->getActiveInputChannels();
    auto activeOut = device->getActiveOutputChannels();
    auto maxIn  = activeIn.getHighestBit() + 1;
    auto maxOut = activeOut.getHighestBit() + 1;
    auto level  = noiseLevel.load();                       // atomic<float> set from the GUI

    for (int ch = 0; ch < maxOut; ++ch)
    {
        if (! activeOut[ch] || maxIn == 0 || ! activeIn[ch % maxIn])
        {
            info.buffer->clear (ch, info.startSample, info.numSamples);
            continue;
        }

        auto* in  = info.buffer->getReadPointer  (ch % maxIn, info.startSample);
        auto* out = info.buffer->getWritePointer (ch,         info.startSample);

        for (int i = 0; i < info.numSamples; ++i)
            out[i] = in[i] + in[i] * (random.nextFloat() * 2.0f - 1.0f) * level;  // ring-modulate
    }
}
```

When there are more outputs than inputs, map them with `ch % maxIn` (or output
silence). On macOS and iOS, and on Android, the app needs microphone permission
declared in its project settings before input works. Wear headphones when
experimenting: feedback is loud.

## Playing sound files

Compose the pipeline from `AudioSource`s and let `AudioTransportSource` handle
start, stop, and position:

| Class                     | Role                                                          |
| ------------------------- | ------------------------------------------------------------- |
| `AudioFormatManager`      | Knows the file formats; `registerBasicFormats()` adds WAV, AIFF, FLAC, Ogg, MP3 (where enabled), and the platform's codecs |
| `AudioFormatReader`       | Low-level decoding of one file                                |
| `AudioFormatReaderSource` | Wraps a reader as an `AudioSource`                            |
| `AudioTransportSource`    | Play, stop, seek, and (optionally) resample and read ahead    |

```cpp
class PlayerComponent final : public juce::AudioAppComponent,
                              private juce::ChangeListener
{
public:
    PlayerComponent()
    {
        formatManager.registerBasicFormats();
        transport.addChangeListener (this);
        setAudioChannels (0, 2);
        // ... buttons as in Widgets ...
    }

    ~PlayerComponent() override
    {
        shutdownAudio();
        transport.setSource (nullptr);
    }

    void prepareToPlay (int block, double rate) override { transport.prepareToPlay (block, rate); }
    void releaseResources() override                     { transport.releaseResources(); }

    void getNextAudioBlock (const juce::AudioSourceChannelInfo& info) override
    {
        if (readerSource == nullptr) { info.clearActiveBufferRegion(); return; }
        transport.getNextAudioBlock (info);
    }

private:
    void openFile()
    {
        chooser = std::make_unique<juce::FileChooser> ("Select an audio file...",
                                                       juce::File {}, "*.wav;*.aiff;*.flac");
        chooser->launchAsync (juce::FileBrowserComponent::openMode
                              | juce::FileBrowserComponent::canSelectFiles,
                              [this] (const juce::FileChooser& fc)
        {
            if (auto file = fc.getResult(); file != juce::File {})
                if (auto* reader = formatManager.createReaderFor (file))   // may be null
                {
                    auto source = std::make_unique<juce::AudioFormatReaderSource> (reader, true);
                    transport.setSource (source.get(), 0, nullptr, reader->sampleRate);
                    readerSource = std::move (source);   // keep it alive; deletes the reader
                }
        });
    }

    void changeListenerCallback (juce::ChangeBroadcaster*) override
    {
        if (transport.isPlaying())        setState (Playing);
        else if (state == Stopping || state == Playing) setState (Stopped);
        else if (state == Pausing)        setState (Paused);
    }

    enum State { Stopped, Starting, Playing, Pausing, Paused, Stopping };

    void setState (State newState)
    {
        if (state == newState) return;
        state = newState;

        switch (state)
        {
            case Stopped:  transport.setPosition (0.0); break;
            case Starting: transport.start();           break;
            case Pausing:
            case Stopping: transport.stop();            break;
            case Playing:
            case Paused:   break;                       // update buttons here
        }
    }

    juce::AudioFormatManager formatManager;
    std::unique_ptr<juce::AudioFormatReaderSource> readerSource;
    juce::AudioTransportSource transport;
    std::unique_ptr<juce::FileChooser> chooser;          // must outlive the async dialog
    State state = Stopped;
};
```

Key points:

- Model playback as a small state machine, changed in one function. The
  transport confirms `start()` and `stop()` *asynchronously*, via a change
  message. Use the intermediate states (Starting, Stopping, Pausing) so the UI
  reacts to what the audio actually did.
- Pausing is `stop()` without rewinding. Stopping also `setPosition (0.0)`.
- Keep the `FileChooser` in a member: `launchAsync()` returns immediately.
- `AudioFormatReaderSource (reader, true)` takes ownership of the reader. Detach
  it from the transport (`setSource (nullptr)`) before deleting it.
- The second and third arguments of `AudioTransportSource::setSource()` set
  optional read-ahead buffering on a background thread, which keeps disk hiccups
  out of the audio callback for large files.

## Reading a file into memory and looping it

For short samples and loops, read the whole file into an `AudioBuffer` and play
it from a position that wraps:

```cpp
juce::AudioBuffer<float> fileBuffer;
int position = 0;

void loadFile (const juce::File& file)
{
    if (auto* reader = formatManager.createReaderFor (file))
    {
        std::unique_ptr<juce::AudioFormatReader> owned (reader);
        fileBuffer.setSize ((int) owned->numChannels, (int) owned->lengthInSamples);
        owned->read (&fileBuffer, 0, (int) owned->lengthInSamples, 0, true, true);
        position = 0;
    }
}

void getNextAudioBlock (const juce::AudioSourceChannelInfo& info) override
{
    auto numIn = fileBuffer.getNumChannels();
    if (numIn == 0) { info.clearActiveBufferRegion(); return; }

    auto outCh = info.buffer->getNumChannels();
    auto remaining = info.numSamples;
    auto outPos = info.startSample;

    while (remaining > 0)
    {
        auto chunk = juce::jmin (remaining, fileBuffer.getNumSamples() - position);

        for (int ch = 0; ch < outCh; ++ch)
            info.buffer->copyFrom (ch, outPos, fileBuffer, ch % numIn, position, chunk);

        position = (position + chunk) % fileBuffer.getNumSamples();   // wrap
        outPos += chunk;
        remaining -= chunk;
    }
}
```

- Do the loading off the audio thread, then swap the buffer in safely (for
  example behind a `SpinLock` with `try_lock`, or by handing a
  `std::shared_ptr` across with an atomic exchange).
- The copy is split in two whenever a block straddles the loop end; the
  `while` loop handles any number of wraps.
- If the file's sample rate differs from the device, resample: wrap the reader in
  an `AudioTransportSource`, or use `ResamplingAudioSource`.
- Do the reverse to *record*: keep a circular `AudioBuffer` and a write
  position, and copy from `info.buffer` into it with the same wrap logic.
- `reader->read()` reads a range into float channels. `readMaxLevels()` is the
  cheap way to find peaks without decoding into a buffer.

## Drawing a waveform: `AudioThumbnail`

`AudioThumbnail` builds a compact, cached overview of a file and draws it, loading
in the background.

```cpp
class WaveformDisplay final : public juce::Component, private juce::ChangeListener
{
public:
    WaveformDisplay (juce::AudioFormatManager& fm)
        : thumbnail (512, fm, cache)            // 512 source samples per thumbnail sample
    {
        thumbnail.addChangeListener (this);
    }

    void setFile (const juce::File& file)
    {
        thumbnail.setSource (new juce::FileInputSource (file));   // takes ownership
    }

    void paint (juce::Graphics& g) override
    {
        g.fillAll (juce::Colours::darkgrey);
        g.setColour (juce::Colours::lightgreen);

        if (thumbnail.getNumChannels() == 0)
            g.drawFittedText ("No file loaded", getLocalBounds(), juce::Justification::centred, 1);
        else
            thumbnail.drawChannels (g, getLocalBounds().reduced (4),
                                    0.0, thumbnail.getTotalLength(), 1.0f);
    }

private:
    void changeListenerCallback (juce::ChangeBroadcaster*) override { repaint(); }

    juce::AudioThumbnailCache cache { 5 };      // caches up to five thumbnails
    juce::AudioThumbnail thumbnail;
};
```

- Repaint from the change callback; the thumbnail loads incrementally, so
  the display fills in as data arrives.
- Draw a playhead by converting the transport's `getCurrentPosition()` to an x
  coordinate over the visible range, and update it from a `Timer`. Pair with
  mouse handling to seek by clicking.
- The first constructor argument trades resolution against memory. Larger values
  give a smaller, coarser thumbnail.

## Build and run

With all the files in place, configure and build from the project folder:

```sh
cmake -B build
cmake --build build
```

The build puts the finished app in `build/AudioDemo_artefacts/`. With CMake's default generator on each platform (Makefiles on macOS and Linux, and
Visual Studio on Windows, which adds the `Debug` folder):

| Platform | Run it with |
| -------- | ----------- |
| macOS    | `open "build/AudioDemo_artefacts/Audio Demo.app"` |
| Linux    | `./build/AudioDemo_artefacts/Audio\ Demo` |
| Windows  | `"build\AudioDemo_artefacts\Debug\Audio Demo.exe"` |

In PowerShell, put `&` before the quoted path.

Xcode and Visual Studio are multi-config generators and add a configuration folder,
for example `build/AudioDemo_artefacts/Debug/Audio Demo.app`; build with
`cmake --build build --config Debug`. With Ninja there is no configuration folder, so
drop `Debug` from the Windows path.

> **"The application cannot be opened because its executable is missing"?**
> CMake creates the empty `.app` bundle at the start of the build and only fills
> in the executable when compiling and linking succeed. If `cmake --build build`
> reported errors, fix them and build again, then re-run `open`. Check that the
> last lines of the build output say `Built target AudioDemo`.

> **"use of undeclared identifier 'juce'"?** CMake projects have no
> `JuceHeader.h`, so every source file must include the module headers it uses.
> `MainComponent.h` includes them and `Main.cpp` includes `MainComponent.h`.
> Without those includes the compiler does not know what `juce::`, `std::`, or
> `START_JUCE_APPLICATION` mean.

## Sources

Condensed from the JUCE tutorials *The AudioDeviceManager class*, *Processing
audio input*, *Build an audio player*, *Looping audio using the AudioSampleBuffer
class* (and its advanced part), and *Draw audio waveforms*, Copyright (c) Raw
Material Software Limited, ISC licence. See [NOTICE.md](NOTICE.md).
