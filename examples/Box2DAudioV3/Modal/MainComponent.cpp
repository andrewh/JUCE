#include "MainComponent.h"

using namespace modal;

MainComponent::MainComponent()
{
    for (int m = 0; m < numMaterials; ++m)
        materialBox.addItem (getMaterial (m).name, m + 1);

    materialBox.setSelectedId (wood + 1, juce::dontSendNotification);

    shapeBox.addItem ("Ball", 1);
    shapeBox.addItem ("Box", 2);
    shapeBox.setSelectedId (1, juce::dontSendNotification);

    int id = 1;
    for (auto& scale : physicsmusic::getScales())
        scaleBox.addItem (scale.name, id++);

    scaleBox.setSelectedId (1, juce::dontSendNotification);
    scaleBox.onChange = [this] { applyPitchSettings(); };
    snapButton.setToggleState (true, juce::dontSendNotification);
    snapButton.onClick = [this] { applyPitchSettings(); };
    autoDropButton.setToggleState (true, juce::dontSendNotification);
    clearButton.onClick = [this] { physics.clearObjects(); };

    rootSlider.slider.onValueChange    = [this] { applyPitchSettings(); };
    gravitySlider.slider.onValueChange = [this] { physics.setGravity ((float) gravitySlider.slider.getValue()); };
    reverbSlider.slider.onValueChange  = [this] { reverbMix = (float) reverbSlider.slider.getValue(); };
    volumeSlider.slider.onValueChange  = [this] { masterGain = (float) volumeSlider.slider.getValue(); };

    for (auto* c : std::initializer_list<juce::Component*> { &materialBox, &shapeBox, &scaleBox, &clearButton,
                                                             &autoDropButton, &snapButton })
        addAndMakeVisible (c);

    applyPitchSettings();
    setSize (1000, 720);

    setAudioChannels (0, 2);

    lastTimerTime = juce::Time::getMillisecondCounterHiRes();
    startTimerHz (120);
}

MainComponent::~MainComponent()
{
    stopTimer();
    shutdownAudio();
}

void MainComponent::applyPitchSettings()
{
    physics.setPitchSnap (snapButton.getToggleState(),
                          physicsmusic::getScales()[(size_t) (scaleBox.getSelectedId() - 1)],
                          (int) rootSlider.slider.getValue());
}

//==============================================================================
void MainComponent::timerCallback()
{
    const auto now = juce::Time::getMillisecondCounterHiRes();
    const auto elapsed = (now - lastTimerTime) * 0.001;
    lastTimerTime = now;

    if (autoDropButton.getToggleState())
    {
        timeUntilNextDrop -= elapsed;

        if (timeUntilNextDrop <= 0.0)
        {
            physics.spawnRandom (materialBox.getSelectedId() - 1, shapeBox.getSelectedId() == 2,
                                 (float) sizeSlider.slider.getValue());
            timeUntilNextDrop += 1.0 / dropRateSlider.slider.getValue();
        }
    }

    physics.advance (elapsed);
    repaint();
}

//==============================================================================
juce::Rectangle<float> MainComponent::getWorldArea() const
{
    return getLocalBounds().withTrimmedTop (controlsHeight + 12).toFloat().reduced (8.0f);
}

void MainComponent::paint (juce::Graphics& g)
{
    g.fillAll (juce::Colour (0xff0b0c10));
    physics.draw (g, getWorldArea());

    if (isDragging)
    {
        g.setColour (juce::Colours::white.withAlpha (0.7f));
        g.drawArrow ({ dragCurrent, dragStart }, 2.0f, 10.0f, 10.0f);
    }

    g.setColour (juce::Colours::white.withAlpha (0.5f));
    g.setFont (juce::FontOptions (13.0f));
    g.drawText ("Click to drop an object, or drag and release to throw one. Objects: "
                    + juce::String (physics.getNumObjects()),
                getLocalBounds().removeFromBottom (20).reduced (12, 0), juce::Justification::centredLeft);
}

void MainComponent::resized()
{
    auto area = getLocalBounds().reduced (8, 6);
    auto controls = area.removeFromTop (controlsHeight);

    auto row1 = controls.removeFromTop (26);
    materialBox.setBounds (row1.removeFromLeft (110));
    row1.removeFromLeft (8);
    shapeBox.setBounds (row1.removeFromLeft (80));
    row1.removeFromLeft (8);
    sizeSlider.setBounds (row1.removeFromLeft (300));
    row1.removeFromLeft (8);
    gravitySlider.setBounds (row1.removeFromLeft (300));
    row1.removeFromLeft (8);
    clearButton.setBounds (row1.removeFromLeft (80));

    controls.removeFromTop (4);
    auto row2 = controls.removeFromTop (26);
    snapButton.setBounds (row2.removeFromLeft (130));
    scaleBox.setBounds (row2.removeFromLeft (160));
    row2.removeFromLeft (8);
    rootSlider.setBounds (row2.removeFromLeft (330));
    row2.removeFromLeft (8);
    reverbSlider.setBounds (row2.removeFromLeft (250));

    controls.removeFromTop (4);
    auto row3 = controls.removeFromTop (26);
    autoDropButton.setBounds (row3.removeFromLeft (110));
    dropRateSlider.setBounds (row3.removeFromLeft (300));
    row3.removeFromLeft (8);
    volumeSlider.setBounds (row3.removeFromLeft (300));
}

//==============================================================================
void MainComponent::mouseDown (const juce::MouseEvent& e)
{
    dragStart = dragCurrent = e.position;
    isDragging = true;
}

void MainComponent::mouseDrag (const juce::MouseEvent& e)
{
    dragCurrent = e.position;
    repaint();
}

void MainComponent::mouseUp (const juce::MouseEvent& e)
{
    isDragging = false;

    const auto area = getWorldArea();
    const auto start = physics.screenToWorld (dragStart, area);
    const auto end   = physics.screenToWorld (e.position, area);

    if (start.x < 0.0f || start.x > PhysicsWorld::worldWidth
         || start.y < 0.0f || start.y > PhysicsWorld::worldHeight)
        return;

    const auto pull = (start - end) * 3.0f;
    physics.spawn (materialBox.getSelectedId() - 1, shapeBox.getSelectedId() == 2,
                   (float) sizeSlider.slider.getValue(), { start.x, start.y }, { pull.x, pull.y });
}

//==============================================================================
void MainComponent::prepareToPlay (int, double sampleRate)
{
    engine.prepare (sampleRate);
    lastReverbMix = -1.0f;
}

void MainComponent::getNextAudioBlock (const juce::AudioSourceChannelInfo& info)
{
    juce::ScopedNoDenormals noDenormals;
    info.clearActiveBufferRegion();

    // Parameter changes made on the message thread are applied here, on the audio thread.
    if (const auto mix = reverbMix.load(); ! juce::approximatelyEqual (mix, lastReverbMix))
    {
        engine.setReverbMix (mix);
        lastReverbMix = mix;
    }

    StrikeEvent event;

    while (physics.popStrike (event))
        engine.strike (event);

    engine.render (*info.buffer, info.startSample, info.numSamples, physics.getRollSlots());
    engine.finish (*info.buffer, info.startSample, info.numSamples, masterGain.load());
}
