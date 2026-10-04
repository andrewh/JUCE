# Audio input, output, files, and waveforms

Get audio in and out of an application, play and read sound files, loop buffers,
and draw waveforms.

**Level:** Intermediate  
**Platforms:** Windows, macOS, Linux (and mobile with the appropriate permissions)

Link `juce::juce_audio_utils` (which brings in devices, formats, and basics).

## Step 1: set up the project

You will build one app, `AudioDemo`, in six steps. Each step adds a feature and
leaves you with something you can build and run:

| Step | You add                                                        | Classes and techniques                                   |
| ---- | -------------------------------------------------------------- | -------------------------------------------------------- |
| 1    | A window that opens the default audio device                   | `AudioAppComponent` and the audio callback               |
| 2    | An **Audio settings...** button, a device read-out, a CPU meter | `AudioDeviceManager`, `AudioDeviceSelectorComponent`, `ChangeListener`, `Timer` |
| 3    | A **Live input** mode with a noise slider                      | Processing audio input                                   |
| 4    | **Open file...**, **Play**/**Pause**, and **Stop** buttons     | `AudioFormatManager`, `AudioTransportSource`, a state machine |
| 5    | An **In-memory loop** mode                                     | Reading a file into an `AudioBuffer` and looping it      |
| 6    | A waveform with a moving playhead                              | `AudioThumbnail`                                         |

Step 1 is the project below. Every later step lists the exact edits to make to
`MainComponent.h` and `MainComponent.cpp`, in the order they appear in the files,
and ends with what to try. Build and run after each step (see
[Build and run](#build-and-run)). The [complete source](#complete-source) at the end
shows both files as they look after step 6, for checking your work.

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
set(CMAKE_OSX_ARCHITECTURES "arm64" CACHE STRING "macOS architectures")  # must come before project()
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

Build and run it. You get a black window reading "Audio running at ... Hz", and
silence from the speakers. The rest of the guide grows this app.

### How the audio callback works

`AudioAppComponent` is a `Component` that is also an `AudioSource` and owns an
`AudioDeviceManager` named `deviceManager`. It is the quickest route to a working
audio application (the Projucer's "Audio Application" template is this class).
`MainComponent` overrides three functions, which the device calls in this order:

- `prepareToPlay()`: the device is about to start, with this sample rate and
  block size. Allocate and initialise anything that depends on them.
  It runs again whenever the device changes, so re-derive every
  sample-rate-dependent value there. The project stores the rate and asks for a
  repaint with `MessageManager::callAsync()`, because the audio device may call
  this on a thread other than the message thread.
- `getNextAudioBlock()`: called over and over to fill `info.buffer`, from
  `info.startSample`, for `info.numSamples` samples. The project fills it with
  silence using `info.clearActiveBufferRegion()`.
- `releaseResources()`: the device has stopped; free what `prepareToPlay()` made.

`setAudioChannels (2, 2)` asks for two inputs and two outputs on the default
device, and `shutdownAudio()` in the destructor is mandatory: it stops the audio
thread before the members it uses are destroyed.

Rules for `getNextAudioBlock()`, which runs on a real-time thread:

- Do not allocate, lock, block, do file or network I/O, or touch GUI objects.
- Read GUI values through a `std::atomic`, `SmoothedValue`, or another
  real-time-safe channel, not by calling slider methods directly.
- The buffer may contain stale data: overwrite or clear every sample you are
  responsible for.

## Step 2: choose devices with `AudioDeviceManager`

`deviceManager` opens the default device unless told otherwise, and is also the
hub for incoming MIDI. This step adds a button that shows a settings panel,
`AudioDeviceSelectorComponent`, plus a read-out of the open device and a CPU meter.
It offers device, channel, sample rate, and buffer size choices, and a "Test"
button that plays a tone.

Two things in this step are worth noticing before the code:

- `AudioDeviceManager` is a `ChangeBroadcaster`, so `MainComponent` registers as a
  `ChangeListener` and refreshes the read-out whenever the settings change. This
  replaces the `callAsync()` repaint from step 1.
- `deviceManager.getCpuUsage()` returns the fraction of the audio time budget in
  use. Poll it from a `Timer`; do not read it from the audio thread.

Replace `MainComponent.h` and `MainComponent.cpp` with the versions below. The
`currentSampleRate` member and `paint()` are gone, because the device read-out
shows the sample rate now.

**`MainComponent.h`**

```cpp
#pragma once

#include <juce_audio_utils/juce_audio_utils.h>

class MainComponent final : public juce::AudioAppComponent,
                            private juce::ChangeListener,
                            private juce::Timer
{
public:
    MainComponent();
    ~MainComponent() override;

    void prepareToPlay (int samplesPerBlockExpected, double sampleRate) override;
    void getNextAudioBlock (const juce::AudioSourceChannelInfo& info) override;
    void releaseResources() override;

    void resized() override;

private:
    // juce::ChangeListener: the AudioDeviceManager is a ChangeBroadcaster
    void changeListenerCallback (juce::ChangeBroadcaster* source) override;

    // juce::Timer
    void timerCallback() override;

    void updateDeviceInfo();

    juce::AudioDeviceSelectorComponent selector { deviceManager,
                                                  0, 256,      // min/max input channels
                                                  0, 256,      // min/max output channels
                                                  false,       // show MIDI inputs
                                                  false,       // show MIDI outputs
                                                  false,       // channels as stereo pairs
                                                  false };     // hide advanced options

    juce::TextButton audioSettings { "Audio settings..." };
    juce::Label deviceInfo, cpuLabel;

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR (MainComponent)
};
```

**`MainComponent.cpp`**

```cpp
#include "MainComponent.h"

MainComponent::MainComponent()
{
    deviceManager.addChangeListener (this);

    addAndMakeVisible (audioSettings);
    addAndMakeVisible (deviceInfo);
    addAndMakeVisible (cpuLabel);
    addChildComponent (selector);                    // hidden until the button is pressed

    audioSettings.setClickingTogglesState (true);
    audioSettings.onClick = [this] { selector.setVisible (audioSettings.getToggleState()); };

    setSize (560, 520);
    setAudioChannels (2, 2);                         // inputs, outputs: opens the default device
    updateDeviceInfo();
    startTimerHz (30);
}

MainComponent::~MainComponent()
{
    stopTimer();
    deviceManager.removeChangeListener (this);
    shutdownAudio();                                 // mandatory: stops the audio thread first
}

void MainComponent::prepareToPlay (int, double) {}

void MainComponent::getNextAudioBlock (const juce::AudioSourceChannelInfo& info)
{
    info.clearActiveBufferRegion();                  // silence for now
}

void MainComponent::releaseResources() {}

void MainComponent::resized()
{
    auto area = getLocalBounds().reduced (10);

    audioSettings.setBounds (area.removeFromTop (28).removeFromLeft (150));
    area.removeFromTop (6);

    deviceInfo.setBounds (area.removeFromTop (24));
    cpuLabel.setBounds (area.removeFromTop (24));
    area.removeFromTop (6);

    selector.setBounds (area);                       // fills the rest of the window while visible
}

void MainComponent::changeListenerCallback (juce::ChangeBroadcaster*)
{
    updateDeviceInfo();
}

void MainComponent::timerCallback()
{
    cpuLabel.setText ("CPU: " + juce::String (juce::roundToInt (deviceManager.getCpuUsage() * 100.0)) + "%",
                      juce::dontSendNotification);
}

void MainComponent::updateDeviceInfo()
{
    if (auto* device = deviceManager.getCurrentAudioDevice())
        deviceInfo.setText (device->getName() + ": "
                            + juce::String (device->getCurrentSampleRate()) + " Hz, "
                            + juce::String (device->getCurrentBufferSizeSamples()) + " samples, "
                            + juce::String (device->getActiveInputChannels().countNumberOfSetBits()) + " in / "
                            + juce::String (device->getActiveOutputChannels().countNumberOfSetBits()) + " out",
                            juce::dontSendNotification);
    else
        deviceInfo.setText ("No audio device open", juce::dontSendNotification);
}
```

Build and run it. **Audio settings...** toggles the selector over the lower part
of the window. Change the output device, sample rate or buffer size and watch the
read-out update. Press **Test** to hear a tone. The CPU figure should sit near
zero while the app plays silence.

`createStateXml()` and the `initialise()` overload that accepts that XML save
and restore the user's choices between runs. Add them when you build a real
application.

## Step 3: process audio input

Input and output share **one buffer**: the input arrives in the channels of
`info.buffer` and you overwrite it with the output. Read first, then write. This
step adds a **mode** menu, so you can switch between silence and live input, and
a **Noise level** slider that ring-modulates the microphone signal with random
noise. Later steps add more modes to the same menu.

Wear headphones when you try it: a live microphone next to speakers gives loud
feedback. The app starts in **Silence** mode for that reason.

**In `MainComponent.h`**, add an enum at the top of the `private:` section. Its
values double as the menu's item IDs (a `ComboBox` ID must be greater than zero):

```cpp
private:
    enum Mode { silenceMode = 1, liveInputMode };   // also the ComboBox item IDs
```

Add the new function, the values the audio thread reads, and the widgets. Put the
function and the atomics after `updateDeviceInfo()`, and the widgets in place of
the existing `juce::Label` line:

```cpp
    void updateDeviceInfo();
    void processLiveInput (const juce::AudioSourceChannelInfo& info);

    std::atomic<int> mode { silenceMode };      // written by the GUI, read by the audio thread
    std::atomic<float> noiseLevel { 0.0f };
    juce::Random random;

    // ... selector and audioSettings stay as they are ...

    juce::ComboBox modeBox;
    juce::Label deviceInfo, cpuLabel, noiseLabel { {}, "Noise level" };
    juce::Slider noiseSlider;
```

**In `MainComponent.cpp`**, in the constructor, make the two new widgets visible
alongside the existing ones:

```cpp
    addAndMakeVisible (audioSettings);
    addAndMakeVisible (modeBox);
    addAndMakeVisible (deviceInfo);
    addAndMakeVisible (cpuLabel);
    addAndMakeVisible (noiseLabel);
    addAndMakeVisible (noiseSlider);
    addChildComponent (selector);                    // hidden until the button is pressed
```

Then configure them, just before the `setSize (560, 520);` line. Both write to
atomics, which is how GUI values reach the audio thread:

```cpp
    modeBox.addItemList ({ "Silence", "Live input (ring modulated)" }, silenceMode);
    modeBox.setSelectedId (silenceMode, juce::dontSendNotification);
    modeBox.onChange = [this] { mode = modeBox.getSelectedId(); };

    noiseSlider.setRange (0.0, 1.0);
    noiseSlider.setTextBoxStyle (juce::Slider::TextBoxRight, false, 60, 20);
    noiseSlider.onValueChange = [this] { noiseLevel = (float) noiseSlider.getValue(); };
```

Replace `getNextAudioBlock()` and `resized()`, and add `processLiveInput()` at the
end of the file:

```cpp
void MainComponent::getNextAudioBlock (const juce::AudioSourceChannelInfo& info)
{
    if (mode.load() == liveInputMode)
        processLiveInput (info);
    else
        info.clearActiveBufferRegion();
}

void MainComponent::resized()
{
    auto area = getLocalBounds().reduced (10);

    auto top = area.removeFromTop (28);
    audioSettings.setBounds (top.removeFromLeft (150));
    top.removeFromLeft (8);
    modeBox.setBounds (top);
    area.removeFromTop (6);

    deviceInfo.setBounds (area.removeFromTop (24));
    cpuLabel.setBounds (area.removeFromTop (24));
    area.removeFromTop (6);

    auto noiseRow = area.removeFromTop (28);
    noiseLabel.setBounds (noiseRow.removeFromLeft (100));
    noiseSlider.setBounds (noiseRow);
    area.removeFromTop (6);

    selector.setBounds (area);                       // fills the rest of the window while visible
}

void MainComponent::processLiveInput (const juce::AudioSourceChannelInfo& info)
{
    auto* device = deviceManager.getCurrentAudioDevice();

    if (device == nullptr)
    {
        info.clearActiveBufferRegion();
        return;
    }

    auto activeIn  = device->getActiveInputChannels();
    auto activeOut = device->getActiveOutputChannels();
    auto maxIn  = activeIn.getHighestBit() + 1;
    auto maxOut = activeOut.getHighestBit() + 1;
    auto level  = noiseLevel.load();

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
            out[i] = in[i] + in[i] * (random.nextFloat() * 2.0f - 1.0f) * level;   // ring-modulate
    }
}
```

Build and run, pick **Live input (ring modulated)**, and raise **Noise level**. On
macOS the first run asks for microphone permission.

How `processLiveInput()` works:

- `getActiveInputChannels()` and `getActiveOutputChannels()` are bit masks of the
  channels the device is actually using. `getHighestBit() + 1` turns a mask
  into a channel count.
- When there are more outputs than inputs, `ch % maxIn` maps them onto the
  inputs you have. A channel with no live input is cleared, which gives silence
  instead of stale data.
- If `getCurrentAudioDevice()` returns `nullptr` (no device open), the function
  clears the buffer and returns.
- On macOS and iOS, and on Android, the app needs microphone permission
  declared in its project settings before input works. The CMake file in step 1
  already does this with `MICROPHONE_PERMISSION_ENABLED`.

## Step 4: play sound files

Compose the pipeline from `AudioSource`s and let `AudioTransportSource` handle
start, stop, and position:

| Class                     | Role                                                          |
| ------------------------- | ------------------------------------------------------------- |
| `AudioFormatManager`      | Knows the file formats; `registerBasicFormats()` adds WAV, AIFF, FLAC, Ogg, MP3 (where enabled), and the platform's codecs |
| `AudioFormatReader`       | Low-level decoding of one file                                |
| `AudioFormatReaderSource` | Wraps a reader as an `AudioSource`                            |
| `AudioTransportSource`    | Play, stop, seek, and (optionally) resample and read ahead    |

This step adds **Open file...**, **Play**/**Pause**, and **Stop** buttons and a
**File player** mode. Playback is a small state machine: the transport confirms
`start()` and `stop()` *asynchronously*, with a change message, so the app tracks
`Starting`, `Pausing`, and `Stopping` states and updates the buttons only once the
transport has really changed. The transport is a second `ChangeBroadcaster` that
`MainComponent` already listens to, so `changeListenerCallback()` now has to work
out which broadcaster called it.

**In `MainComponent.h`**, extend the enum and add a `State` enum:

```cpp
    enum Mode { silenceMode = 1, liveInputMode, filePlayerMode };   // also the ComboBox item IDs
    enum State { Stopped, Starting, Playing, Pausing, Paused, Stopping };
```

Add the new functions after `processLiveInput()`:

```cpp
    void openFile();
    void loadFile (const juce::File& file);
    void setState (State newState);
    void stopPlayback();
```

Add the playback members after `juce::Random random;`:

```cpp
    juce::AudioFormatManager formatManager;
    std::unique_ptr<juce::AudioFormatReaderSource> readerSource;
    juce::AudioTransportSource transport;
    std::unique_ptr<juce::FileChooser> chooser;   // must outlive the async dialog
    State state = Stopped;
```

Add the buttons after `noiseSlider`:

```cpp
    juce::TextButton openButton { "Open file..." }, playPause { "Play" }, stopButton { "Stop" };
```

**In `MainComponent.cpp`**, make these changes in order.

At the start of the constructor, register the formats and listen to the transport
as well:

```cpp
    formatManager.registerBasicFormats();
    deviceManager.addChangeListener (this);
    transport.addChangeListener (this);
```

Make the buttons visible, after `addAndMakeVisible (noiseSlider);`:

```cpp
    addAndMakeVisible (openButton);
    addAndMakeVisible (playPause);
    addAndMakeVisible (stopButton);
```

Replace the `modeBox` lines with this version, which adds the new item and stops
the transport when you leave file mode. Stopping has to happen *before* the mode
changes, because `AudioTransportSource::stop()` waits for the audio thread to
process one more block, and the audio thread only does that while the mode is
still **File player**:

```cpp
    modeBox.addItemList ({ "Silence", "Live input (ring modulated)", "File player" }, silenceMode);
    modeBox.setSelectedId (silenceMode, juce::dontSendNotification);
    modeBox.onChange = [this]
    {
        stopPlayback();                              // stop the transport while the audio thread still pulls it
        mode = modeBox.getSelectedId();
    };
```

Add the button handlers just before `setSize (560, 520);`. **Play** switches to
file mode first, so it always does something audible, and **Stop** from `Paused`
goes straight to `Stopped`, because a paused transport has nothing to confirm:

```cpp
    openButton.onClick = [this] { openFile(); };

    playPause.setEnabled (false);                    // until a file is loaded
    stopButton.setEnabled (false);

    playPause.onClick = [this]
    {
        if (state == Playing)
        {
            setState (Pausing);
        }
        else
        {
            modeBox.setSelectedId (filePlayerMode, juce::sendNotification);
            setState (Starting);
        }
    };

    stopButton.onClick = [this] { setState (state == Paused ? Stopped : Stopping); };
```

In the destructor, remove the new listener and detach the source after the audio
has stopped:

```cpp
MainComponent::~MainComponent()
{
    stopTimer();
    deviceManager.removeChangeListener (this);
    transport.removeChangeListener (this);
    shutdownAudio();                                 // mandatory: stops the audio thread first
    transport.setSource (nullptr);
}
```

Replace `prepareToPlay()`, `getNextAudioBlock()`, `releaseResources()`, and
`changeListenerCallback()`. The transport needs to hear about the device's sample
rate and block size, and file mode hands the whole buffer to it:

```cpp
void MainComponent::prepareToPlay (int samplesPerBlockExpected, double sampleRate)
{
    transport.prepareToPlay (samplesPerBlockExpected, sampleRate);
}

void MainComponent::getNextAudioBlock (const juce::AudioSourceChannelInfo& info)
{
    switch (mode.load())
    {
        case liveInputMode:  processLiveInput (info);            break;
        case filePlayerMode: transport.getNextAudioBlock (info); break;
        default:             info.clearActiveBufferRegion();     break;
    }
}

void MainComponent::releaseResources()
{
    transport.releaseResources();
}

void MainComponent::changeListenerCallback (juce::ChangeBroadcaster* source)
{
    if (source == &deviceManager)
    {
        updateDeviceInfo();
    }
    else if (source == &transport)
    {
        if (transport.isPlaying())
            setState (Playing);
        else if (state == Stopping || state == Playing)
            setState (Stopped);
        else if (state == Pausing)
            setState (Paused);
    }
}
```

In `resized()`, add the button row after the `noiseRow` block and before the
`selector.setBounds` line.:

```cpp
    auto buttons = area.removeFromTop (32);
    const auto width = buttons.getWidth() / 3;
    openButton.setBounds (buttons.removeFromLeft (width).reduced (2, 0));
    playPause.setBounds  (buttons.removeFromLeft (width).reduced (2, 0));
    stopButton.setBounds (buttons.reduced (2, 0));
    area.removeFromTop (6);
```

Finally, add the four new functions at the end of the file:

```cpp
void MainComponent::openFile()
{
    chooser = std::make_unique<juce::FileChooser> ("Select an audio file...",
                                                   juce::File {}, "*.wav;*.aiff;*.flac");
    chooser->launchAsync (juce::FileBrowserComponent::openMode
                          | juce::FileBrowserComponent::canSelectFiles,
                          [this] (const juce::FileChooser& fc)
    {
        if (auto file = fc.getResult(); file != juce::File {})
            loadFile (file);
    });
}

void MainComponent::loadFile (const juce::File& file)
{
    auto* reader = formatManager.createReaderFor (file);   // may be null

    if (reader == nullptr)
        return;

    stopPlayback();

    auto source = std::make_unique<juce::AudioFormatReaderSource> (reader, true);   // owns the reader
    transport.setSource (source.get(), 0, nullptr, reader->sampleRate);
    readerSource = std::move (source);                     // keep it alive; deletes the reader

    playPause.setEnabled (true);
}

void MainComponent::setState (State newState)
{
    if (state == newState)
        return;

    state = newState;

    switch (state)
    {
        case Stopped:
            playPause.setButtonText ("Play");
            stopButton.setEnabled (false);
            transport.setPosition (0.0);
            break;

        case Starting:
            transport.start();
            break;

        case Playing:
            playPause.setButtonText ("Pause");
            stopButton.setEnabled (true);
            break;

        case Pausing:
        case Stopping:
            transport.stop();
            break;

        case Paused:
            playPause.setButtonText ("Resume");
            break;
    }
}

void MainComponent::stopPlayback()
{
    setState (transport.isPlaying() ? Stopping : Stopped);
}
```

Build and run. Press **Open file...**, choose a WAV, AIFF or FLAC file, then use
**Play**, **Pause**, **Resume**, and **Stop**. Switch the mode menu while a file
plays and the music stops.

Key points:

- Change state in one function, `setState()`. Pausing is `stop()` without
  rewinding. Stopping also calls `setPosition (0.0)`.
- Keep the `FileChooser` in a member: `launchAsync()` returns immediately and the
  dialog needs the object to stay alive.
- `createReaderFor()` returns a raw pointer, or `nullptr` if the file is not
  readable. `AudioFormatReaderSource (reader, true)` takes ownership of the
  reader. Detach the source from the transport (`setSource (nullptr)`) before
  deleting it, as the destructor does.
- The fourth argument to `setSource()` is the file's sample rate, so the transport
  resamples to the device rate for you. The second and third arguments set
  optional read-ahead buffering on a background thread, which keeps disk hiccups
  out of the audio callback for large files.

## Step 5: read a file into memory and loop it

For short samples and loops, read the whole file into an `AudioBuffer` and play
it from a position that wraps. This step adds an **In-memory loop** mode that
plays the file you opened in step 4 in a seamless loop. `loadFile()` reads the
file into memory as well as handing it to the transport.

The buffer is shared between the message thread (which loads it) and the audio
thread (which plays it), so a `juce::SpinLock` guards it. The audio thread uses
`ScopedTryLock` and outputs silence if it cannot get the lock, so it never waits.
The loader swaps a freshly filled buffer in under the lock, then lets the old one
be freed outside it.

**In `MainComponent.h`**, add the new mode to the enum:

```cpp
    enum Mode { silenceMode = 1, liveInputMode, filePlayerMode, loopMode };   // also the ComboBox item IDs
```

Add two functions after `loadFile()`:

```cpp
    void loadIntoMemory (juce::AudioFormatReader& reader);
    void playLoop (const juce::AudioSourceChannelInfo& info);
```

Add the loop members after `State state = Stopped;`:

```cpp
    juce::SpinLock loopLock;                      // guards loopBuffer and loopPosition
    juce::AudioBuffer<float> loopBuffer;
    int loopPosition = 0;
```

**In `MainComponent.cpp`**, add the menu item:

```cpp
    modeBox.addItemList ({ "Silence", "Live input (ring modulated)", "File player", "In-memory loop" }, silenceMode);
```

Add the case to `getNextAudioBlock()`:

```cpp
        case filePlayerMode: transport.getNextAudioBlock (info); break;
        case loopMode:       playLoop (info);                    break;
```

In `loadFile()`, add one line after `stopPlayback();`:

```cpp
    stopPlayback();
    loadIntoMemory (*reader);
```

Add the two functions at the end of the file:

```cpp
void MainComponent::loadIntoMemory (juce::AudioFormatReader& reader)
{
    if (reader.lengthInSamples > 30 * (juce::int64) reader.sampleRate)
        return;                                            // keep the in-memory loop for short files

    juce::AudioBuffer<float> newBuffer ((int) reader.numChannels, (int) reader.lengthInSamples);
    reader.read (&newBuffer, 0, newBuffer.getNumSamples(), 0, true, true);

    {
        const juce::SpinLock::ScopedLockType lock (loopLock);
        std::swap (loopBuffer, newBuffer);
        loopPosition = 0;
    }                                                      // the old buffer is freed here, outside the lock
}

void MainComponent::playLoop (const juce::AudioSourceChannelInfo& info)
{
    const juce::SpinLock::ScopedTryLockType lock (loopLock);   // never wait on the audio thread

    if (! lock.isLocked() || loopBuffer.getNumSamples() == 0)
    {
        info.clearActiveBufferRegion();
        return;
    }

    const auto numIn = loopBuffer.getNumChannels();
    const auto numOut = info.buffer->getNumChannels();
    auto remaining = info.numSamples;
    auto outPos = info.startSample;

    while (remaining > 0)
    {
        const auto chunk = juce::jmin (remaining, loopBuffer.getNumSamples() - loopPosition);

        for (int ch = 0; ch < numOut; ++ch)
            info.buffer->copyFrom (ch, outPos, loopBuffer, ch % numIn, loopPosition, chunk);

        loopPosition = (loopPosition + chunk) % loopBuffer.getNumSamples();   // wrap
        outPos += chunk;
        remaining -= chunk;
    }
}
```

Build and run. Open a short file (under 30 seconds), then pick **In-memory loop**
from the menu. Files longer than 30 seconds still play in file mode but skip the
in-memory copy, so the loop stays silent for them.

- The copy is split in two whenever a block straddles the loop end; the `while`
  loop handles any number of wraps.
- `ch % numIn` spreads a mono file across both outputs.
- `loadIntoMemory()` reads on the message thread, which is fine for short
  samples and would stall the UI for long ones. For those, load on a background
  thread and swap the result in the same way.
- The loop plays at the file's own sample rate. If the file's rate differs from
  the device's, it plays at the wrong pitch: resample, or use the
  `AudioTransportSource` route from step 4, which does it for you.
- Do the reverse to *record*: keep a circular `AudioBuffer` and a write
  position, and copy from `info.buffer` into it with the same wrap logic.
- `reader.read()` reads a range into float channels. `readMaxLevels()` is the
  cheap way to find peaks without decoding into a buffer.

## Step 6: draw a waveform with `AudioThumbnail`

`AudioThumbnail` builds a compact, cached overview of a file and draws it, loading
in the background. This step wraps one in a small `WaveformDisplay` component,
shows it below the buttons, and draws a playhead that follows the transport.

**In `MainComponent.h`**, add this class above `MainComponent`:

```cpp
class WaveformDisplay final : public juce::Component,
                              private juce::ChangeListener
{
public:
    explicit WaveformDisplay (juce::AudioFormatManager& formatManager)
        : thumbnail (512, formatManager, thumbnailCache)   // 512 source samples per thumbnail sample
    {
        thumbnail.addChangeListener (this);
    }

    ~WaveformDisplay() override { thumbnail.removeChangeListener (this); }

    void setFile (const juce::File& file)
    {
        thumbnail.setSource (new juce::FileInputSource (file));   // takes ownership
    }

    void setPlayheadSeconds (double seconds)
    {
        if (! juce::exactlyEqual (seconds, playhead))
        {
            playhead = seconds;
            repaint();
        }
    }

    void paint (juce::Graphics& g) override
    {
        g.fillAll (juce::Colours::darkgrey);
        g.setColour (juce::Colours::lightgreen);

        const auto area = getLocalBounds().reduced (4);

        if (thumbnail.getNumChannels() == 0)
        {
            g.drawFittedText ("No file loaded", area, juce::Justification::centred, 1);
            return;
        }

        thumbnail.drawChannels (g, area, 0.0, thumbnail.getTotalLength(), 1.0f);

        g.setColour (juce::Colours::white);
        const auto x = (float) area.getX() + (float) (playhead / thumbnail.getTotalLength()) * (float) area.getWidth();
        g.drawLine (x, (float) area.getY(), x, (float) area.getBottom(), 2.0f);
    }

private:
    void changeListenerCallback (juce::ChangeBroadcaster*) override { repaint(); }

    juce::AudioThumbnailCache thumbnailCache { 5 };   // declared first: the thumbnail uses it
    juce::AudioThumbnail thumbnail;
    double playhead = 0.0;
};
```

Add a member that uses it, just before `juce::TextButton audioSettings`. It must
come after `formatManager`, which it is constructed from:

```cpp
    WaveformDisplay waveform { formatManager };
```

**In `MainComponent.cpp`**, make it visible, after `addAndMakeVisible (stopButton);`:

```cpp
    addAndMakeVisible (waveform);
```

In `resized()`, give the waveform the space the selector used to own alone. The
selector now overlaps it and hides it while the settings are showing:

```cpp
    waveform.setBounds (area);
    selector.setBounds (area);                       // covers the waveform while visible
```

Update the playhead from the timer you added in step 2, by adding one line to
`timerCallback()`:

```cpp
void MainComponent::timerCallback()
{
    cpuLabel.setText ("CPU: " + juce::String (juce::roundToInt (deviceManager.getCpuUsage() * 100.0)) + "%",
                      juce::dontSendNotification);
    waveform.setPlayheadSeconds (transport.getCurrentPosition());
}
```

And in `loadFile()`, tell the display about the file, before enabling the Play
button:

```cpp
    waveform.setFile (file);
    playPause.setEnabled (true);
```

Build and run, open a file, and press **Play**. The waveform fills in as the
background thread reads the file, and the white playhead sweeps across it.

- Repaint from the change callback; the thumbnail loads incrementally, so the
  display fills in as data arrives.
- `AudioThumbnailCache` is declared before the thumbnail because the thumbnail's
  constructor uses it, and `{ 5 }` caches up to five thumbnails.
- The first constructor argument trades resolution against memory. Larger values
  give a smaller, coarser thumbnail.
- Add mouse handling that converts a click's x coordinate to a time and calls
  `transport.setPosition()` to seek by clicking.

## Complete source

After step 6, the two files look like this. `CMakeLists.txt` and `Main.cpp` are
unchanged from step 1.

<details>
<summary><code>MainComponent.h</code></summary>

```cpp
#pragma once

#include <juce_audio_utils/juce_audio_utils.h>

class WaveformDisplay final : public juce::Component,
                              private juce::ChangeListener
{
public:
    explicit WaveformDisplay (juce::AudioFormatManager& formatManager)
        : thumbnail (512, formatManager, thumbnailCache)   // 512 source samples per thumbnail sample
    {
        thumbnail.addChangeListener (this);
    }

    ~WaveformDisplay() override { thumbnail.removeChangeListener (this); }

    void setFile (const juce::File& file)
    {
        thumbnail.setSource (new juce::FileInputSource (file));   // takes ownership
    }

    void setPlayheadSeconds (double seconds)
    {
        if (! juce::exactlyEqual (seconds, playhead))
        {
            playhead = seconds;
            repaint();
        }
    }

    void paint (juce::Graphics& g) override
    {
        g.fillAll (juce::Colours::darkgrey);
        g.setColour (juce::Colours::lightgreen);

        const auto area = getLocalBounds().reduced (4);

        if (thumbnail.getNumChannels() == 0)
        {
            g.drawFittedText ("No file loaded", area, juce::Justification::centred, 1);
            return;
        }

        thumbnail.drawChannels (g, area, 0.0, thumbnail.getTotalLength(), 1.0f);

        g.setColour (juce::Colours::white);
        const auto x = (float) area.getX() + (float) (playhead / thumbnail.getTotalLength()) * (float) area.getWidth();
        g.drawLine (x, (float) area.getY(), x, (float) area.getBottom(), 2.0f);
    }

private:
    void changeListenerCallback (juce::ChangeBroadcaster*) override { repaint(); }

    juce::AudioThumbnailCache thumbnailCache { 5 };   // declared first: the thumbnail uses it
    juce::AudioThumbnail thumbnail;
    double playhead = 0.0;
};

class MainComponent final : public juce::AudioAppComponent,
                            private juce::ChangeListener,
                            private juce::Timer
{
public:
    MainComponent();
    ~MainComponent() override;

    void prepareToPlay (int samplesPerBlockExpected, double sampleRate) override;
    void getNextAudioBlock (const juce::AudioSourceChannelInfo& info) override;
    void releaseResources() override;

    void resized() override;

private:
    enum Mode { silenceMode = 1, liveInputMode, filePlayerMode, loopMode };   // also the ComboBox item IDs
    enum State { Stopped, Starting, Playing, Pausing, Paused, Stopping };

    // juce::ChangeListener: the device manager and the transport are both ChangeBroadcasters
    void changeListenerCallback (juce::ChangeBroadcaster* source) override;

    // juce::Timer
    void timerCallback() override;

    void updateDeviceInfo();
    void processLiveInput (const juce::AudioSourceChannelInfo& info);
    void openFile();
    void loadFile (const juce::File& file);
    void loadIntoMemory (juce::AudioFormatReader& reader);
    void playLoop (const juce::AudioSourceChannelInfo& info);
    void setState (State newState);
    void stopPlayback();

    std::atomic<int> mode { silenceMode };      // written by the GUI, read by the audio thread
    std::atomic<float> noiseLevel { 0.0f };
    juce::Random random;

    juce::AudioFormatManager formatManager;
    std::unique_ptr<juce::AudioFormatReaderSource> readerSource;
    juce::AudioTransportSource transport;
    std::unique_ptr<juce::FileChooser> chooser;   // must outlive the async dialog
    State state = Stopped;

    juce::SpinLock loopLock;                      // guards loopBuffer and loopPosition
    juce::AudioBuffer<float> loopBuffer;
    int loopPosition = 0;

    juce::AudioDeviceSelectorComponent selector { deviceManager,
                                                  0, 256,      // min/max input channels
                                                  0, 256,      // min/max output channels
                                                  false,       // show MIDI inputs
                                                  false,       // show MIDI outputs
                                                  false,       // channels as stereo pairs
                                                  false };     // hide advanced options

    WaveformDisplay waveform { formatManager };

    juce::TextButton audioSettings { "Audio settings..." };
    juce::ComboBox modeBox;
    juce::Label deviceInfo, cpuLabel, noiseLabel { {}, "Noise level" };
    juce::Slider noiseSlider;
    juce::TextButton openButton { "Open file..." }, playPause { "Play" }, stopButton { "Stop" };

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR (MainComponent)
};
```

</details>

<details>
<summary><code>MainComponent.cpp</code></summary>

```cpp
#include "MainComponent.h"

MainComponent::MainComponent()
{
    formatManager.registerBasicFormats();
    deviceManager.addChangeListener (this);
    transport.addChangeListener (this);

    addAndMakeVisible (audioSettings);
    addAndMakeVisible (modeBox);
    addAndMakeVisible (deviceInfo);
    addAndMakeVisible (cpuLabel);
    addAndMakeVisible (noiseLabel);
    addAndMakeVisible (noiseSlider);
    addAndMakeVisible (openButton);
    addAndMakeVisible (playPause);
    addAndMakeVisible (stopButton);
    addAndMakeVisible (waveform);
    addChildComponent (selector);                    // hidden until the button is pressed

    audioSettings.setClickingTogglesState (true);
    audioSettings.onClick = [this] { selector.setVisible (audioSettings.getToggleState()); };

    modeBox.addItemList ({ "Silence", "Live input (ring modulated)", "File player", "In-memory loop" }, silenceMode);
    modeBox.setSelectedId (silenceMode, juce::dontSendNotification);
    modeBox.onChange = [this]
    {
        stopPlayback();                              // stop the transport while the audio thread still pulls it
        mode = modeBox.getSelectedId();
    };

    noiseSlider.setRange (0.0, 1.0);
    noiseSlider.setTextBoxStyle (juce::Slider::TextBoxRight, false, 60, 20);
    noiseSlider.onValueChange = [this] { noiseLevel = (float) noiseSlider.getValue(); };

    openButton.onClick = [this] { openFile(); };

    playPause.setEnabled (false);                    // until a file is loaded
    stopButton.setEnabled (false);

    playPause.onClick = [this]
    {
        if (state == Playing)
        {
            setState (Pausing);
        }
        else
        {
            modeBox.setSelectedId (filePlayerMode, juce::sendNotification);
            setState (Starting);
        }
    };

    stopButton.onClick = [this] { setState (state == Paused ? Stopped : Stopping); };

    setSize (560, 520);
    setAudioChannels (2, 2);                         // inputs, outputs: opens the default device
    updateDeviceInfo();
    startTimerHz (30);
}

MainComponent::~MainComponent()
{
    stopTimer();
    deviceManager.removeChangeListener (this);
    transport.removeChangeListener (this);
    shutdownAudio();                                 // mandatory: stops the audio thread first
    transport.setSource (nullptr);
}

void MainComponent::prepareToPlay (int samplesPerBlockExpected, double sampleRate)
{
    transport.prepareToPlay (samplesPerBlockExpected, sampleRate);
}

void MainComponent::getNextAudioBlock (const juce::AudioSourceChannelInfo& info)
{
    switch (mode.load())
    {
        case liveInputMode:  processLiveInput (info);            break;
        case filePlayerMode: transport.getNextAudioBlock (info); break;
        case loopMode:       playLoop (info);                    break;
        default:             info.clearActiveBufferRegion();     break;
    }
}

void MainComponent::releaseResources()
{
    transport.releaseResources();
}

void MainComponent::resized()
{
    auto area = getLocalBounds().reduced (10);

    auto top = area.removeFromTop (28);
    audioSettings.setBounds (top.removeFromLeft (150));
    top.removeFromLeft (8);
    modeBox.setBounds (top);
    area.removeFromTop (6);

    deviceInfo.setBounds (area.removeFromTop (24));
    cpuLabel.setBounds (area.removeFromTop (24));
    area.removeFromTop (6);

    auto noiseRow = area.removeFromTop (28);
    noiseLabel.setBounds (noiseRow.removeFromLeft (100));
    noiseSlider.setBounds (noiseRow);
    area.removeFromTop (6);

    auto buttons = area.removeFromTop (32);
    const auto width = buttons.getWidth() / 3;
    openButton.setBounds (buttons.removeFromLeft (width).reduced (2, 0));
    playPause.setBounds  (buttons.removeFromLeft (width).reduced (2, 0));
    stopButton.setBounds (buttons.reduced (2, 0));
    area.removeFromTop (6);

    waveform.setBounds (area);
    selector.setBounds (area);                       // covers the waveform while visible
}

void MainComponent::changeListenerCallback (juce::ChangeBroadcaster* source)
{
    if (source == &deviceManager)
    {
        updateDeviceInfo();
    }
    else if (source == &transport)
    {
        if (transport.isPlaying())
            setState (Playing);
        else if (state == Stopping || state == Playing)
            setState (Stopped);
        else if (state == Pausing)
            setState (Paused);
    }
}

void MainComponent::timerCallback()
{
    cpuLabel.setText ("CPU: " + juce::String (juce::roundToInt (deviceManager.getCpuUsage() * 100.0)) + "%",
                      juce::dontSendNotification);
    waveform.setPlayheadSeconds (transport.getCurrentPosition());
}

void MainComponent::updateDeviceInfo()
{
    if (auto* device = deviceManager.getCurrentAudioDevice())
        deviceInfo.setText (device->getName() + ": "
                            + juce::String (device->getCurrentSampleRate()) + " Hz, "
                            + juce::String (device->getCurrentBufferSizeSamples()) + " samples, "
                            + juce::String (device->getActiveInputChannels().countNumberOfSetBits()) + " in / "
                            + juce::String (device->getActiveOutputChannels().countNumberOfSetBits()) + " out",
                            juce::dontSendNotification);
    else
        deviceInfo.setText ("No audio device open", juce::dontSendNotification);
}

void MainComponent::processLiveInput (const juce::AudioSourceChannelInfo& info)
{
    auto* device = deviceManager.getCurrentAudioDevice();

    if (device == nullptr)
    {
        info.clearActiveBufferRegion();
        return;
    }

    auto activeIn  = device->getActiveInputChannels();
    auto activeOut = device->getActiveOutputChannels();
    auto maxIn  = activeIn.getHighestBit() + 1;
    auto maxOut = activeOut.getHighestBit() + 1;
    auto level  = noiseLevel.load();

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
            out[i] = in[i] + in[i] * (random.nextFloat() * 2.0f - 1.0f) * level;   // ring-modulate
    }
}

void MainComponent::openFile()
{
    chooser = std::make_unique<juce::FileChooser> ("Select an audio file...",
                                                   juce::File {}, "*.wav;*.aiff;*.flac");
    chooser->launchAsync (juce::FileBrowserComponent::openMode
                          | juce::FileBrowserComponent::canSelectFiles,
                          [this] (const juce::FileChooser& fc)
    {
        if (auto file = fc.getResult(); file != juce::File {})
            loadFile (file);
    });
}

void MainComponent::loadFile (const juce::File& file)
{
    auto* reader = formatManager.createReaderFor (file);   // may be null

    if (reader == nullptr)
        return;

    stopPlayback();
    loadIntoMemory (*reader);

    auto source = std::make_unique<juce::AudioFormatReaderSource> (reader, true);   // owns the reader
    transport.setSource (source.get(), 0, nullptr, reader->sampleRate);
    readerSource = std::move (source);                     // keep it alive; deletes the reader

    waveform.setFile (file);
    playPause.setEnabled (true);
}

void MainComponent::setState (State newState)
{
    if (state == newState)
        return;

    state = newState;

    switch (state)
    {
        case Stopped:
            playPause.setButtonText ("Play");
            stopButton.setEnabled (false);
            transport.setPosition (0.0);
            break;

        case Starting:
            transport.start();
            break;

        case Playing:
            playPause.setButtonText ("Pause");
            stopButton.setEnabled (true);
            break;

        case Pausing:
        case Stopping:
            transport.stop();
            break;

        case Paused:
            playPause.setButtonText ("Resume");
            break;
    }
}

void MainComponent::stopPlayback()
{
    setState (transport.isPlaying() ? Stopping : Stopped);
}

void MainComponent::loadIntoMemory (juce::AudioFormatReader& reader)
{
    if (reader.lengthInSamples > 30 * (juce::int64) reader.sampleRate)
        return;                                            // keep the in-memory loop for short files

    juce::AudioBuffer<float> newBuffer ((int) reader.numChannels, (int) reader.lengthInSamples);
    reader.read (&newBuffer, 0, newBuffer.getNumSamples(), 0, true, true);

    {
        const juce::SpinLock::ScopedLockType lock (loopLock);
        std::swap (loopBuffer, newBuffer);
        loopPosition = 0;
    }                                                      // the old buffer is freed here, outside the lock
}

void MainComponent::playLoop (const juce::AudioSourceChannelInfo& info)
{
    const juce::SpinLock::ScopedTryLockType lock (loopLock);   // never wait on the audio thread

    if (! lock.isLocked() || loopBuffer.getNumSamples() == 0)
    {
        info.clearActiveBufferRegion();
        return;
    }

    const auto numIn = loopBuffer.getNumChannels();
    const auto numOut = info.buffer->getNumChannels();
    auto remaining = info.numSamples;
    auto outPos = info.startSample;

    while (remaining > 0)
    {
        const auto chunk = juce::jmin (remaining, loopBuffer.getNumSamples() - loopPosition);

        for (int ch = 0; ch < numOut; ++ch)
            info.buffer->copyFrom (ch, outPos, loopBuffer, ch % numIn, loopPosition, chunk);

        loopPosition = (loopPosition + chunk) % loopBuffer.getNumSamples();   // wrap
        outPos += chunk;
        remaining -= chunk;
    }
}
```

</details>

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
