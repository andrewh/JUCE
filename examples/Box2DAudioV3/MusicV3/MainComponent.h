#pragma once

#include <juce_audio_utils/juce_audio_utils.h>
#include <juce_gui_extra/juce_gui_extra.h>
#include "PhysicsMusicWorld.h"
#include "PluckSynth.h"

//==============================================================================
/** A slider with a caption, to keep the layout code short. */
struct LabelledSlider
{
    LabelledSlider (juce::Component& parent, const juce::String& name,
                    double min, double max, double interval, double initial)
    {
        label.setText (name, juce::dontSendNotification);
        label.setJustificationType (juce::Justification::centredRight);
        slider.setRange (min, max, interval);
        slider.setValue (initial, juce::dontSendNotification);
        slider.setTextBoxStyle (juce::Slider::TextBoxRight, false, 48, 20);
        parent.addAndMakeVisible (label);
        parent.addAndMakeVisible (slider);
    }

    void setBounds (juce::Rectangle<int> r)
    {
        label.setBounds (r.removeFromLeft (80));
        slider.setBounds (r);
    }

    juce::Label label;
    juce::Slider slider { juce::Slider::LinearHorizontal, juce::Slider::TextBoxRight };
};

//==============================================================================
class MainComponent final : public juce::AudioAppComponent,
                            private juce::Timer
{
public:
    MainComponent();
    ~MainComponent() override;

    void paint (juce::Graphics&) override;
    void resized() override;

    void mouseDown (const juce::MouseEvent&) override;
    void mouseDrag (const juce::MouseEvent&) override;
    void mouseUp (const juce::MouseEvent&) override;

    void prepareToPlay (int samplesPerBlockExpected, double sampleRate) override;
    void getNextAudioBlock (const juce::AudioSourceChannelInfo&) override;
    void releaseResources() override;

private:
    void timerCallback() override;
    void applyScale();
    juce::Rectangle<float> getWorldArea() const;

    physicsmusic::PhysicsMusicWorld physics;
    physicsmusic::PluckSynth synth;

    std::atomic<float> masterGain { 0.7f };

    juce::ComboBox sceneBox, scaleBox;
    juce::TextButton clearButton { "Clear balls" };
    juce::ToggleButton autoDropButton { "Auto-drop" };
    LabelledSlider rootSlider    { *this, "Root note", 24, 72, 1, 48 },
                   gravitySlider { *this, "Gravity", 2, 30, 0.1, 10 },
                   bounceSlider  { *this, "Bounciness", 0, 0.95, 0.01, 0.7 },
                   volumeSlider  { *this, "Volume", 0, 1, 0.01, 0.7 },
                   dropRateSlider { *this, "Drops/sec", 0.2, 8, 0.1, 2 };

    static constexpr int controlsHeight = 88;
    juce::Point<float> dragStart, dragCurrent;
    bool isDragging = false;

    double lastTimerTime = 0.0, timeUntilNextDrop = 0.0;
    juce::Random random;

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR (MainComponent)
};
