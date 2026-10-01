#include "PhysicsMusicWorld.h"

namespace physicsmusic
{

//==============================================================================
PhysicsMusicWorld::PhysicsMusicWorld()
{
    rebuildScene();
}

PhysicsMusicWorld::~PhysicsMusicWorld()
{
    if (b2World_IsValid (world))
        b2DestroyWorld (world);   // destroys every body and shape in it
}

//==============================================================================
void PhysicsMusicWorld::setScene (Scene newScene)
{
    scene = newScene;
    rebuildScene();
}

void PhysicsMusicWorld::setScale (const Scale& newScale, int newRootNote)
{
    scale = newScale;
    rootNote = newRootNote;
}

void PhysicsMusicWorld::setGravity (float g)
{
    b2World_SetGravity (world, { 0.0f, -g });
}

void PhysicsMusicWorld::setBounciness (float restitution)
{
    bounciness = restitution;

    for (auto& ball : balls)
        b2Shape_SetRestitution (ball.shape, restitution);
}

//==============================================================================
PhysicsMusicWorld::Entry& PhysicsMusicWorld::createStatic (float x, float y, BodyInfo::Kind kind, int degree)
{
    Entry entry;
    entry.info = std::make_unique<BodyInfo>();
    entry.info->kind   = kind;
    entry.info->degree = degree;
    entry.info->hue    = (float) (degree % (int) scale.steps.size()) / (float) scale.steps.size();

    auto def = b2DefaultBodyDef();
    def.position = { x, y };
    def.userData = entry.info.get();
    entry.body = b2CreateBody (world, &def);

    statics.push_back (std::move (entry));
    return statics.back();
}

void PhysicsMusicWorld::addWall (float x, float y, float halfWidth, float halfHeight)
{
    auto& e = createStatic (x, y, BodyInfo::Kind::wall, 0);
    auto box = b2MakeBox (halfWidth, halfHeight);
    auto shapeDef = b2DefaultShapeDef();
    e.shape = b2CreatePolygonShape (e.body, &shapeDef, &box);
}

void PhysicsMusicWorld::addNoteBox (float x, float y, float halfWidth, float halfHeight, int degree)
{
    auto& e = createStatic (x, y, BodyInfo::Kind::note, degree);
    auto box = b2MakeBox (halfWidth, halfHeight);
    auto shapeDef = b2DefaultShapeDef();
    e.shape = b2CreatePolygonShape (e.body, &shapeDef, &box);
}

void PhysicsMusicWorld::addNotePeg (float x, float y, int degree)
{
    auto& e = createStatic (x, y, BodyInfo::Kind::note, degree);
    b2Circle circle { { 0.0f, 0.0f }, 0.18f };
    auto shapeDef = b2DefaultShapeDef();
    e.shape = b2CreateCircleShape (e.body, &shapeDef, &circle);
}

void PhysicsMusicWorld::addNoteZone (float x, float y, float halfWidth, float halfHeight, int degree)
{
    auto& e = createStatic (x, y, BodyInfo::Kind::note, degree);
    auto box = b2MakeBox (halfWidth, halfHeight);
    auto shapeDef = b2DefaultShapeDef();
    shapeDef.isSensor = true;            // detects overlaps, never pushes anything
    shapeDef.enableSensorEvents = true;  // sensor events are opt-in in v3
    e.shape = b2CreatePolygonShape (e.body, &shapeDef, &box);
}

//==============================================================================
void PhysicsMusicWorld::rebuildScene()
{
    fifo.reset();   // events from the old scene are stale

    if (b2World_IsValid (world))
        b2DestroyWorld (world);

    balls.clear();
    statics.clear();

    auto worldDef = b2DefaultWorldDef();
    worldDef.gravity = { 0.0f, -10.0f };
    worldDef.hitEventThreshold = 0.8f;    // approach speed (m/s) below which no hit event is made
    worldDef.restitutionThreshold = 0.3f; // v3 stops bouncing below this speed (default 1 m/s)
    world = b2CreateWorld (&worldDef);

    simulationTime = leftOver = 0.0;

    addWall (worldWidth * 0.5f, -0.25f, worldWidth * 0.5f, 0.25f);
    addWall (-0.25f, worldHeight * 0.5f, 0.25f, worldHeight * 0.5f);
    addWall (worldWidth + 0.25f, worldHeight * 0.5f, 0.25f, worldHeight * 0.5f);

    if (scene == Scene::marimba)
    {
        const int numBars = 10;
        const auto pitch = worldWidth / (float) numBars;

        for (int i = 0; i < numBars; ++i)
            addNoteBox ((float) i * pitch + pitch * 0.5f, 0.6f + 0.15f * (float) i, pitch * 0.45f, 0.4f, i);
    }
    else if (scene == Scene::plinko)
    {
        const int rows = 7, columns = 10;
        const auto spacing = worldWidth / (float) columns;

        for (int row = 0; row < rows; ++row)
        {
            const auto offset = (row % 2 == 0) ? 0.0f : spacing * 0.5f;
            const auto y = 3.0f + (float) row * 1.4f;

            for (int col = 0; col < columns; ++col)
            {
                const auto x = spacing * 0.5f + offset + (float) col * spacing;

                if (x < worldWidth - 0.3f)
                    addNotePeg (x, y, col + row);
            }
        }
    }
    else
    {
        const int columns = 8;
        const auto spacing = worldWidth / (float) columns;

        for (int row = 0; row < 3; ++row)
            for (int col = 0; col < columns; ++col)
                addNoteZone ((float) col * spacing + spacing * 0.5f, 2.5f + (float) row * 3.5f,
                             spacing * 0.42f, 0.5f, col + row * 3);
    }
}

//==============================================================================
void PhysicsMusicWorld::addBall (b2Vec2 position, b2Vec2 velocity)
{
    if ((int) balls.size() >= maxBalls)
        removeBall (0);   // balls are appended, so index 0 is the oldest

    Entry entry;
    entry.info = std::make_unique<BodyInfo>();
    entry.info->kind = BodyInfo::Kind::ball;
    entry.info->hue  = random.nextFloat();

    auto bodyDef = b2DefaultBodyDef();
    bodyDef.type = b2_dynamicBody;
    bodyDef.position = position;
    bodyDef.linearVelocity = velocity;
    bodyDef.userData = entry.info.get();
    entry.body = b2CreateBody (world, &bodyDef);

    auto shapeDef = b2DefaultShapeDef();
    shapeDef.density = 1.0f;
    shapeDef.material.friction = 0.3f;
    shapeDef.material.restitution = bounciness;
    shapeDef.enableHitEvents = true;         // opt-in: hit events are only made for flagged shapes
    shapeDef.enableSensorEvents = true;      // and only visitors flagged like this trigger sensors

    b2Circle circle { { 0.0f, 0.0f }, ballRadius * (0.8f + 0.5f * random.nextFloat()) };
    entry.shape = b2CreateCircleShape (entry.body, &shapeDef, &circle);

    balls.push_back (std::move (entry));
}

void PhysicsMusicWorld::addRandomBall()
{
    addBall ({ 1.0f + random.nextFloat() * (worldWidth - 2.0f), worldHeight - 0.5f },
             { random.nextFloat() * 2.0f - 1.0f, 0.0f });
}

void PhysicsMusicWorld::removeBall (size_t index)
{
    b2DestroyBody (balls[index].body);   // also destroys its shapes
    balls.erase (balls.begin() + (std::ptrdiff_t) index);
}

void PhysicsMusicWorld::clearBalls()
{
    while (! balls.empty())
        removeBall (balls.size() - 1);
}

//==============================================================================
void PhysicsMusicWorld::advance (double elapsedSeconds)
{
    leftOver = juce::jmin (leftOver + elapsedSeconds, 0.1);

    while (leftOver >= timeStep)
    {
        b2World_Step (world, (float) timeStep, subStepCount);
        simulationTime += timeStep;
        leftOver -= timeStep;

        // Event buffers belong to the world and are overwritten by the next step,
        // so they have to be consumed here, inside the loop.
        processEvents();
    }

    for (auto& e : statics)
        e.info->flash = juce::jmax (0.0f, e.info->flash - (float) elapsedSeconds * 4.0f);

    // Housekeeping happens outside the step. Erasing from the back keeps indices valid.
    for (size_t i = balls.size(); i-- > 0;)
    {
        auto& info = *balls[i].info;
        info.flash = juce::jmax (0.0f, info.flash - (float) elapsedSeconds * 4.0f);
        info.age += elapsedSeconds;

        if (info.age > maxBallAge || b2Body_GetPosition (balls[i].body).y < -5.0f)
            removeBall (i);
    }
}

//==============================================================================
void PhysicsMusicWorld::triggerNote (BodyInfo& noteInfo, float velocity, float worldX)
{
    if (simulationTime - noteInfo.lastHitTime < noteCooldown)
        return;

    noteInfo.lastHitTime = simulationTime;
    noteInfo.flash = 1.0f;

    NoteEvent event;
    event.midiNote = degreeToMidiNote (scale, rootNote, noteInfo.degree);
    event.velocity = juce::jlimit (0.05f, 1.0f, velocity);
    event.pan      = juce::jlimit (0.0f, 1.0f, worldX / worldWidth);

    const auto writer = fifo.write (1);

    if (writer.blockSize1 > 0)
        fifoStorage[(size_t) writer.startIndex1] = event;
}

void PhysicsMusicWorld::processEvents()
{
    // Hit events: two shapes approached each other faster than the threshold.
    // Unlike v2's PostSolve, there is no impulse to threshold. Resting contact simply
    // never produces a hit event, and the approach speed is what we want anyway.
    const auto contacts = b2World_GetContactEvents (world);

    for (int i = 0; i < contacts.hitCount; ++i)
    {
        const auto& hit = contacts.hitEvents[i];
        auto* a = getInfo (hit.shapeIdA);
        auto* b = getInfo (hit.shapeIdB);

        BodyInfo* note = nullptr;

        if (a->kind == BodyInfo::Kind::note && b->kind == BodyInfo::Kind::ball)  note = a;
        if (b->kind == BodyInfo::Kind::note && a->kind == BodyInfo::Kind::ball)  note = b;

        if (note != nullptr)
            triggerNote (*note, std::sqrt (juce::jmin (1.0f, hit.approachSpeed / hitSpeedForFullVelocity)),
                         hit.point.x);
    }

    // Sensor events replace v2's BeginContact-on-a-sensor trick.
    const auto sensors = b2World_GetSensorEvents (world);

    for (int i = 0; i < sensors.beginCount; ++i)
    {
        const auto& begin = sensors.beginEvents[i];
        auto* zone = getInfo (begin.sensorShapeId);
        auto* visitor = getInfo (begin.visitorShapeId);

        if (zone->kind == BodyInfo::Kind::note && visitor->kind == BodyInfo::Kind::ball)
        {
            const auto body = b2Shape_GetBody (begin.visitorShapeId);
            const auto speed = b2Length (b2Body_GetLinearVelocity (body));
            triggerNote (*zone, juce::jmin (1.0f, speed / 16.0f), b2Body_GetPosition (body).x);
        }
    }
}

bool PhysicsMusicWorld::popEvent (NoteEvent& result)
{
    const auto reader = fifo.read (1);

    if (reader.blockSize1 <= 0)
        return false;

    result = fifoStorage[(size_t) reader.startIndex1];
    return true;
}

//==============================================================================
static juce::Rectangle<float> getWorldArea (juce::Rectangle<float> area)
{
    const auto scaleFactor = juce::jmin (area.getWidth() / PhysicsMusicWorld::worldWidth,
                                         area.getHeight() / PhysicsMusicWorld::worldHeight);

    return juce::Rectangle<float> (PhysicsMusicWorld::worldWidth * scaleFactor,
                                   PhysicsMusicWorld::worldHeight * scaleFactor).withCentre (area.getCentre());
}

juce::Point<float> PhysicsMusicWorld::screenToWorld (juce::Point<float> p, juce::Rectangle<float> area) const
{
    const auto worldArea = getWorldArea (area);
    const auto scaleFactor = worldArea.getWidth() / worldWidth;

    return { (p.x - worldArea.getX()) / scaleFactor,
             (worldArea.getBottom() - p.y) / scaleFactor };
}

void PhysicsMusicWorld::draw (juce::Graphics& g, juce::Rectangle<float> area)
{
    const auto worldArea = getWorldArea (area);
    const auto scaleFactor = worldArea.getWidth() / worldWidth;

    g.setColour (juce::Colour (0xff15171c));
    g.fillRect (worldArea);

    auto drawEntry = [&] (const Entry& entry)
    {
        const auto& info = *entry.info;
        const bool isBall = info.kind == BodyInfo::Kind::ball;

        auto colour = isBall ? juce::Colour::fromHSV (info.hue, 0.55f, 0.95f, 1.0f)
                             : info.kind == BodyInfo::Kind::note
                                   ? juce::Colour::fromHSV (info.hue, 0.6f, 0.75f, 1.0f)
                                   : juce::Colour (0xff3a3f4b);

        colour = colour.interpolatedWith (juce::Colours::white, info.flash * 0.8f);

        const auto transform = b2Body_GetTransform (entry.body);

        auto toScreen = [&] (b2Vec2 local)
        {
            const auto p = b2TransformPoint (transform, local);
            return juce::Point<float> (worldArea.getX() + p.x * scaleFactor,
                                       worldArea.getBottom() - p.y * scaleFactor);
        };

        std::array<b2ShapeId, 4> shapes;
        const auto numShapes = b2Body_GetShapes (entry.body, shapes.data(), (int) shapes.size());

        for (int s = 0; s < numShapes; ++s)
        {
            const auto shape = shapes[(size_t) s];
            g.setColour (b2Shape_IsSensor (shape) ? colour.withAlpha (0.25f + 0.5f * info.flash) : colour);

            if (b2Shape_GetType (shape) == b2_circleShape)
            {
                const auto circle = b2Shape_GetCircle (shape);
                const auto centre = toScreen (circle.center);
                const auto r = circle.radius * scaleFactor;
                g.fillEllipse (centre.x - r, centre.y - r, r * 2.0f, r * 2.0f);
            }
            else if (b2Shape_GetType (shape) == b2_polygonShape)
            {
                const auto polygon = b2Shape_GetPolygon (shape);
                juce::Path path;

                for (int v = 0; v < polygon.count; ++v)
                {
                    const auto p = toScreen (polygon.vertices[v]);

                    if (v == 0)  path.startNewSubPath (p);
                    else         path.lineTo (p);
                }

                path.closeSubPath();
                g.fillPath (path);

                if (info.kind == BodyInfo::Kind::note)
                {
                    g.setColour (juce::Colours::white.withAlpha (0.8f));
                    g.setFont (juce::FontOptions (juce::jmax (9.0f, scaleFactor * 0.4f)));
                    g.drawText (juce::MidiMessage::getMidiNoteName (degreeToMidiNote (scale, rootNote, info.degree),
                                                                    true, true, 4),
                                path.getBounds().toNearestInt(), juce::Justification::centred, false);
                }
            }
        }
    };

    for (auto& e : statics)  drawEntry (e);
    for (auto& e : balls)    drawEntry (e);
}

} // namespace physicsmusic
