#pragma once

#include <juce_audio_basics/juce_audio_basics.h>
#include <juce_gui_basics/juce_gui_basics.h>
#include <box2d/box2d.h>
#include "../common/Scales.h"
#include "ModalTypes.h"
#include <array>
#include <memory>
#include <vector>

namespace modal
{

/** Data attached to every body. */
struct ObjectInfo
{
    int material = wood;
    float size = 0.3f;           // characteristic size in metres: sets the pitch
    int degree = -1;             // >= 0 pins the pitch to a scale degree, whatever the size
    bool dynamic = false;
    float flash = 0.0f;          // drawing only
    double lastHitTime = -1.0;
    double age = 0.0;
    int rollSlot = -1;           // dynamic bodies only
};

/** A Box2D v3 world whose objects ring like the materials they are made of.

    The message thread owns the world. The audio thread only sees two lock-free
    channels: a FIFO of StrikeEvents and the array of RollSlots.
*/
class PhysicsWorld
{
public:
    static constexpr float worldWidth = 20.0f, worldHeight = 15.0f;

    PhysicsWorld();
    ~PhysicsWorld();

    void setGravity (float g);
    void setPitchSnap (bool snapToScale, const physicsmusic::Scale&, int rootNote);

    void spawn (int material, bool box, float size, b2Vec2 position, b2Vec2 velocity);
    void spawnRandom (int material, bool box, float size);
    void clearObjects();

    void advance (double elapsedSeconds);

    bool popStrike (StrikeEvent& result);
    const std::array<RollSlot, numRollSlots>& getRollSlots() const noexcept    { return rollSlots; }

    void draw (juce::Graphics&, juce::Rectangle<float> area);
    juce::Point<float> screenToWorld (juce::Point<float>, juce::Rectangle<float> area) const;

    int getNumObjects() const noexcept    { return (int) dynamics.size(); }

private:
    struct Entry
    {
        b2BodyId body = b2_nullBodyId;
        std::unique_ptr<ObjectInfo> info;
    };

    void buildScene();
    void addStatic (int material, float x, float y, float halfWidth, float halfHeight,
                    float angle, float size, int degree = -1);
    void processHits();
    void updateRolling();
    void removeDynamic (size_t index);

    float getFundamental (const ObjectInfo&) const;
    void pushStrike (ObjectInfo&, const ObjectInfo& other, float speed, float x);

    static ObjectInfo* getInfo (b2ShapeId shape)
    {
        return static_cast<ObjectInfo*> (b2Body_GetUserData (b2Shape_GetBody (shape)));
    }

    std::vector<Entry> statics, dynamics;
    b2WorldId world = b2_nullWorldId;

    juce::AbstractFifo fifo { 512 };
    std::array<StrikeEvent, 512> fifoStorage;
    std::array<RollSlot, numRollSlots> rollSlots;
    std::array<bool, numRollSlots> slotInUse {};

    bool snapToScale = true;
    physicsmusic::Scale scale = physicsmusic::getScales()[0];
    int rootNote = 48;

    double simulationTime = 0.0, leftOver = 0.0;
    juce::Random random;

    static constexpr double timeStep = 1.0 / 120.0;
    static constexpr int subStepCount = 4;
    static constexpr int maxObjects = 48;
    static constexpr double maxAge = 30.0;
    static constexpr double cooldown = 0.04;
    static constexpr float hitSpeedForFullAmplitude = 12.0f;

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR (PhysicsWorld)
};

} // namespace modal
