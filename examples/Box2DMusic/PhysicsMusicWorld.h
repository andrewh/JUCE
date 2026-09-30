#pragma once

#include <juce_audio_basics/juce_audio_basics.h>
#include <juce_box2d/juce_box2d.h>
#include <juce_gui_basics/juce_gui_basics.h>
#include "Scales.h"
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

/** Extra data attached to every b2Body through its user-data pointer. */
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

/** A Box2D world whose collisions become NoteEvents.

    Everything except popEvent() belongs to the message thread. popEvent() is the
    single-consumer end of a lock-free FIFO and is called from the audio thread.
*/
class PhysicsMusicWorld : private b2ContactListener
{
public:
    enum class Scene { marimba = 1, plinko, zones };

    static constexpr float worldWidth = 20.0f, worldHeight = 15.0f;

    PhysicsMusicWorld();
    ~PhysicsMusicWorld() override;

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

    /** Draws the scene into the given area, with the world's y axis pointing up. */
    void draw (juce::Graphics&, juce::Rectangle<float> area, bool useBox2DDebugRenderer);

    juce::Point<float> screenToWorld (juce::Point<float> screenPoint, juce::Rectangle<float> area) const;

    int getNumBalls() const noexcept    { return numBalls; }

private:
    void BeginContact (b2Contact*) override;
    void PostSolve (b2Contact*, const b2ContactImpulse*) override;

    void rebuildScene();
    void addWall (float centreX, float centreY, float halfWidth, float halfHeight);
    void addNoteBox (float centreX, float centreY, float halfWidth, float halfHeight, int degree);
    void addNotePeg (float x, float y, int degree);
    void addNoteZone (float centreX, float centreY, float halfWidth, float halfHeight, int degree);
    b2Body* createStaticBody (float x, float y, BodyInfo::Kind, int degree);
    void destroyBody (b2Body*);
    void removeOldBalls();
    void triggerNote (BodyInfo&, float velocity, float worldX);

    static BodyInfo* getInfo (const b2Body* body) { return static_cast<BodyInfo*> (body->GetUserData()); }

    // Declared before the world, so it is destroyed after it.
    std::vector<std::unique_ptr<BodyInfo>> staticInfos;
    std::unique_ptr<b2World> world;

    juce::AbstractFifo fifo { 512 };
    std::array<NoteEvent, 512> fifoStorage;

    Scene scene = Scene::marimba;
    Scale scale = getScales()[0];
    int rootNote = 48;
    float bounciness = 0.7f;
    int numBalls = 0;
    double simulationTime = 0.0, leftOver = 0.0;
    juce::Random random;
    juce::Colour backgroundColour = juce::Colour (0xff15171c);

    juce::Box2DRenderer debugRenderer;

    static constexpr double timeStep = 1.0 / 240.0;
    static constexpr int velocityIterations = 8, positionIterations = 3;
    static constexpr int maxBalls = 60;
    static constexpr double maxBallAge = 25.0;
    static constexpr float ballRadius = 0.3f;
    static constexpr float impulseThreshold = 0.15f;   // ignores resting contact
    static constexpr float impulseForFullVelocity = 8.0f;
    static constexpr double noteCooldown = 0.05;

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR (PhysicsMusicWorld)
};

} // namespace physicsmusic
