#pragma once

#include <juce_audio_basics/juce_audio_basics.h>
#include <juce_gui_basics/juce_gui_basics.h>
#include <box2d/box2d.h>
#include "../common/Scales.h"
#include <array>
#include <memory>
#include <vector>

namespace physicsmusic
{

/** What the physics engine tells the audio engine. Small, trivially copyable, no pointers. */
struct NoteEvent
{
    int midiNote = 60;
    float velocity = 0.5f;   // 0 to 1
    float pan = 0.5f;        // 0 (left) to 1 (right)
};

/** Extra data attached to every body through its user-data pointer. */
struct BodyInfo
{
    enum class Kind { ball, note, wall };

    Kind kind = Kind::wall;
    int degree = 0;              // for Kind::note: which scale degree this body sounds
    float hue = 0.0f;
    float flash = 0.0f;          // 1 when just hit, fades to 0 (for drawing only)
    double lastHitTime = -1.0;   // simulation time of the last note (for debouncing)
    double age = 0.0;            // balls only
};

/** A Box2D v3 world whose hit and sensor events become NoteEvents.

    Everything except popEvent() belongs to the message thread. popEvent() is the
    single-consumer end of a lock-free FIFO and is called from the audio thread.
*/
class PhysicsMusicWorld
{
public:
    enum class Scene { marimba = 1, plinko, zones };

    static constexpr float worldWidth = 20.0f, worldHeight = 15.0f;

    PhysicsMusicWorld();
    ~PhysicsMusicWorld();

    void setScene (Scene);
    void setScale (const Scale&, int rootNote);
    void setGravity (float metresPerSecondSquared);
    void setBounciness (float restitution);

    void addBall (b2Vec2 position, b2Vec2 velocity);
    void addRandomBall();
    void clearBalls();

    /** Runs the simulation forward using a fixed timestep, catching up as needed. */
    void advance (double elapsedSeconds);

    /** Audio thread: fetches the next pending event, if any. */
    bool popEvent (NoteEvent& result);

    void draw (juce::Graphics&, juce::Rectangle<float> area);

    juce::Point<float> screenToWorld (juce::Point<float> screenPoint, juce::Rectangle<float> area) const;

    int getNumBalls() const noexcept    { return (int) balls.size(); }

private:
    // Box2D v3 has no body list, and bodies are just ids, so we keep our own.
    struct Entry
    {
        b2BodyId body = b2_nullBodyId;
        b2ShapeId shape = b2_nullShapeId;
        std::unique_ptr<BodyInfo> info;
    };

    void rebuildScene();
    void addWall (float centreX, float centreY, float halfWidth, float halfHeight);
    void addNoteBox (float centreX, float centreY, float halfWidth, float halfHeight, int degree);
    void addNotePeg (float x, float y, int degree);
    void addNoteZone (float centreX, float centreY, float halfWidth, float halfHeight, int degree);
    Entry& createStatic (float x, float y, BodyInfo::Kind, int degree);

    void processEvents();
    void triggerNote (BodyInfo&, float velocity, float worldX);
    void removeBall (size_t index);

    static BodyInfo* getInfo (b2ShapeId shape)
    {
        return static_cast<BodyInfo*> (b2Body_GetUserData (b2Shape_GetBody (shape)));
    }

    std::vector<Entry> statics, balls;
    b2WorldId world = b2_nullWorldId;

    juce::AbstractFifo fifo { 512 };
    std::array<NoteEvent, 512> fifoStorage;

    Scene scene = Scene::marimba;
    Scale scale = getScales()[0];
    int rootNote = 48;
    float bounciness = 0.7f;
    double simulationTime = 0.0, leftOver = 0.0;
    juce::Random random;

    static constexpr double timeStep = 1.0 / 120.0;   // v3 favours larger steps with sub-stepping
    static constexpr int subStepCount = 4;
    static constexpr int maxBalls = 60;
    static constexpr double maxBallAge = 25.0;
    static constexpr float ballRadius = 0.3f;
    static constexpr float hitSpeedForFullVelocity = 16.0f;
    static constexpr double noteCooldown = 0.05;

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR (PhysicsMusicWorld)
};

} // namespace physicsmusic
