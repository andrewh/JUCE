#include "MainComponent.h"

using namespace physicsmusic;

MainComponent::MainComponent()
{
    sceneBox.addItem ("Marimba: tuned bars", (int) PhysicsMusicWorld::Scene::marimba);
    sceneBox.addItem ("Plinko: tuned pegs",  (int) PhysicsMusicWorld::Scene::plinko);
    sceneBox.addItem ("Zones: sensors",      (int) PhysicsMusicWorld::Scene::zones);
    sceneBox.setSelectedId ((int) PhysicsMusicWorld::Scene::marimba, juce::dontSendNotification);
    sceneBox.onChange = [this]
    {
        physics.setScene ((PhysicsMusicWorld::Scene) sceneBox.getSelectedId());
        physics.setGravity ((float) gravitySlider.slider.getValue());
        physics.setBounciness ((float) bounceSlider.slider.getValue());
    };

    int id = 1;
    for (auto& scale : getScales())
        scaleBox.addItem (scale.name, id++);

    scaleBox.setSelectedId (1, juce::dontSendNotification);
    scaleBox.onChange = [this] { applyScale(); };

    rootSlider.slider.onValueChange    = [this] { applyScale(); };
    gravitySlider.slider.onValueChange = [this] { physics.setGravity ((float) gravitySlider.slider.getValue()); };
    bounceSlider.slider.onValueChange  = [this] { physics.setBounciness ((float) bounceSlider.slider.getValue()); };
    volumeSlider.slider.onValueChange  = [this] { masterGain = (float) volumeSlider.slider.getValue(); };

    clearButton.onClick = [this] { physics.clearBalls(); };
    autoDropButton.setToggleState (true, juce::dontSendNotification);

    for (auto* c : std::initializer_list<juce::Component*> { &sceneBox, &scaleBox, &clearButton,
                                                             &autoDropButton, &debugDrawButton })
        addAndMakeVisible (c);

    applyScale();
    setSize (1000, 720);

    // Open the default output device. This starts the audio callback.
    setAudioChannels (0, 2);

    lastTimerTime = juce::Time::getMillisecondCounterHiRes();
    startTimerHz (120);
}

MainComponent::~MainComponent()
{
    stopTimer();
    shutdownAudio();
}

void MainComponent::applyScale()
{
    physics.setScale (getScales()[(size_t) (scaleBox.getSelectedId() - 1)],
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
            physics.addRandomBall();
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
    physics.draw (g, getWorldArea(), debugDrawButton.getToggleState());

    if (isDragging)
    {
        // The "sling": drag away from where the ball should go.
        g.setColour (juce::Colours::white.withAlpha (0.7f));
        g.drawArrow ({ dragCurrent, dragStart }, 2.0f, 10.0f, 10.0f);
    }

    g.setColour (juce::Colours::white.withAlpha (0.5f));
    g.setFont (juce::FontOptions (13.0f));
    g.drawText ("Click to drop a ball, or drag and release to throw one. Balls: "
                    + juce::String (physics.getNumBalls()),
                getLocalBounds().removeFromBottom (20).reduced (12, 0), juce::Justification::centredLeft);
}

void MainComponent::resized()
{
    auto area = getLocalBounds().reduced (8, 6);
    auto controls = area.removeFromTop (controlsHeight);

    auto row1 = controls.removeFromTop (26);
    sceneBox.setBounds (row1.removeFromLeft (200));
    row1.removeFromLeft (8);
    scaleBox.setBounds (row1.removeFromLeft (160));
    row1.removeFromLeft (8);
    rootSlider.setBounds (row1.removeFromLeft (330));
    row1.removeFromLeft (8);
    volumeSlider.setBounds (row1);

    controls.removeFromTop (4);
    auto row2 = controls.removeFromTop (26);
    gravitySlider.setBounds (row2.removeFromLeft (300));
    row2.removeFromLeft (8);
    bounceSlider.setBounds (row2.removeFromLeft (300));
    row2.removeFromLeft (8);
    clearButton.setBounds (row2.removeFromLeft (100));

    controls.removeFromTop (4);
    auto row3 = controls.removeFromTop (26);
    autoDropButton.setBounds (row3.removeFromLeft (110));
    dropRateSlider.setBounds (row3.removeFromLeft (300));
    row3.removeFromLeft (8);
    debugDrawButton.setBounds (row3.removeFromLeft (170));
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

    if (start.x < 0.0f || start.x > PhysicsMusicWorld::worldWidth
         || start.y < 0.0f || start.y > PhysicsMusicWorld::worldHeight)
        return;

    // A plain click drops the ball. A drag throws it: the velocity is proportional to
    // the distance the mouse was pulled back.
    const auto pull = (start - end) * 3.0f;
    physics.addBall (b2Vec2 (start.x, start.y), b2Vec2 (pull.x, pull.y));
}

//==============================================================================
void MainComponent::prepareToPlay (int, double sampleRate)
{
    synth.prepare (sampleRate);
}

void MainComponent::getNextAudioBlock (const juce::AudioSourceChannelInfo& info)
{
    juce::ScopedNoDenormals noDenormals;
    info.clearActiveBufferRegion();

    // 1. Drain events produced by the physics thread since the last block.
    NoteEvent event;

    while (physics.popEvent (event))
        synth.noteOn (event.midiNote, event.velocity, event.pan);

    // 2. Render the voices, then apply master gain and a soft limiter.
    synth.render (*info.buffer, info.startSample, info.numSamples);

    const auto gain = masterGain.load();

    for (int channel = 0; channel < info.buffer->getNumChannels(); ++channel)
    {
        auto* data = info.buffer->getWritePointer (channel, info.startSample);

        for (int i = 0; i < info.numSamples; ++i)
            data[i] = std::tanh (data[i] * gain);
    }
}

void MainComponent::releaseResources() {}
