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
    // Bodies are destroyed with the world, but balls own their BodyInfo.
    clearBalls();
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
    world->SetGravity (b2Vec2 (0.0f, -g));

    for (auto* body = world->GetBodyList(); body != nullptr; body = body->GetNext())
        body->SetAwake (true);
}

void PhysicsMusicWorld::setBounciness (float restitution)
{
    bounciness = restitution;

    for (auto* body = world->GetBodyList(); body != nullptr; body = body->GetNext())
        if (auto* info = getInfo (body); info != nullptr && info->kind == BodyInfo::Kind::ball)
            for (auto* f = body->GetFixtureList(); f != nullptr; f = f->GetNext())
                f->SetRestitution (restitution);
}

//==============================================================================
b2Body* PhysicsMusicWorld::createStaticBody (float x, float y, BodyInfo::Kind kind, int degree)
{
    staticInfos.push_back (std::make_unique<BodyInfo>());
    auto* info = staticInfos.back().get();
    info->kind   = kind;
    info->degree = degree;
    info->hue    = (float) (degree % (int) scale.steps.size()) / (float) scale.steps.size();

    b2BodyDef def;
    def.position.Set (x, y);
    def.userData = info;
    return world->CreateBody (&def);
}

void PhysicsMusicWorld::addWall (float x, float y, float halfWidth, float halfHeight)
{
    auto* body = createStaticBody (x, y, BodyInfo::Kind::wall, 0);

    b2PolygonShape shape;
    shape.SetAsBox (halfWidth, halfHeight);
    body->CreateFixture (&shape, 0.0f);
}

void PhysicsMusicWorld::addNoteBox (float x, float y, float halfWidth, float halfHeight, int degree)
{
    auto* body = createStaticBody (x, y, BodyInfo::Kind::note, degree);

    b2PolygonShape shape;
    shape.SetAsBox (halfWidth, halfHeight);
    body->CreateFixture (&shape, 0.0f);
}

void PhysicsMusicWorld::addNotePeg (float x, float y, int degree)
{
    auto* body = createStaticBody (x, y, BodyInfo::Kind::note, degree);

    b2CircleShape shape;
    shape.m_radius = 0.18f;
    body->CreateFixture (&shape, 0.0f);
}

void PhysicsMusicWorld::addNoteZone (float x, float y, float halfWidth, float halfHeight, int degree)
{
    auto* body = createStaticBody (x, y, BodyInfo::Kind::note, degree);

    b2PolygonShape shape;
    shape.SetAsBox (halfWidth, halfHeight);

    b2FixtureDef def;
    def.shape = &shape;
    def.isSensor = true;      // detects overlaps, but never pushes anything
    body->CreateFixture (&def);
}

//==============================================================================
void PhysicsMusicWorld::rebuildScene()
{
    // Clear the FIFO: events from the old scene are stale.
    fifo.reset();

    // Balls own their info, so release those before the world goes away.
    if (world != nullptr)
        clearBalls();

    world.reset();
    staticInfos.clear();

    world = std::make_unique<b2World> (b2Vec2 (0.0f, -10.0f));
    world->SetContactListener (this);
    simulationTime = leftOver = 0.0;

    // Boundary: floor and two side walls. The ceiling is open so balls can be dropped in.
    addWall (worldWidth * 0.5f, -0.25f, worldWidth * 0.5f, 0.25f);
    addWall (-0.25f, worldHeight * 0.5f, 0.25f, worldHeight * 0.5f);
    addWall (worldWidth + 0.25f, worldHeight * 0.5f, 0.25f, worldHeight * 0.5f);

    if (scene == Scene::marimba)
    {
        // A row of tuned bars. Lower notes get longer bars, as on a real marimba.
        const int numBars = 10;
        const auto pitch = worldWidth / (float) numBars;

        for (int i = 0; i < numBars; ++i)
            addNoteBox ((float) i * pitch + pitch * 0.5f,
                        0.6f + 0.15f * (float) i,
                        pitch * 0.45f, 0.4f, i);
    }
    else if (scene == Scene::plinko)
    {
        // Staggered pegs: x picks the note, and each row up is one scale step higher.
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
        // Sensor zones. Balls fall through them and bounce off the floor, so each ball
        // plays an arpeggio as it repeatedly passes through.
        const int columns = 8;
        const auto spacing = worldWidth / (float) columns;

        for (int row = 0; row < 3; ++row)
            for (int col = 0; col < columns; ++col)
                addNoteZone ((float) col * spacing + spacing * 0.5f,
                             2.5f + (float) row * 3.5f,
                             spacing * 0.42f, 0.5f,
                             col + row * 3);
    }
}

//==============================================================================
void PhysicsMusicWorld::addBall (b2Vec2 position, b2Vec2 velocity)
{
    if (numBalls >= maxBalls)
        removeOldBalls();

    auto info = std::make_unique<BodyInfo>();
    info->kind = BodyInfo::Kind::ball;
    info->hue  = random.nextFloat();

    b2BodyDef def;
    def.type = b2_dynamicBody;
    def.position = position;
    def.linearVelocity = velocity;
    def.userData = info.release();    // freed in destroyBody()

    auto* body = world->CreateBody (&def);

    b2CircleShape shape;
    shape.m_radius = ballRadius * (0.8f + 0.5f * random.nextFloat());

    b2FixtureDef fixture;
    fixture.shape = &shape;
    fixture.density = 1.0f;
    fixture.friction = 0.3f;
    fixture.restitution = bounciness;
    body->CreateFixture (&fixture);

    ++numBalls;
}

void PhysicsMusicWorld::addRandomBall()
{
    addBall (b2Vec2 (1.0f + random.nextFloat() * (worldWidth - 2.0f), worldHeight - 0.5f),
             b2Vec2 (random.nextFloat() * 2.0f - 1.0f, 0.0f));
}

void PhysicsMusicWorld::destroyBody (b2Body* body)
{
    if (auto* info = getInfo (body); info != nullptr && info->kind == BodyInfo::Kind::ball)
    {
        delete info;
        --numBalls;
    }

    world->DestroyBody (body);
}

void PhysicsMusicWorld::clearBalls()
{
    for (auto* body = world->GetBodyList(); body != nullptr;)
    {
        auto* next = body->GetNext();

        if (auto* info = getInfo (body); info != nullptr && info->kind == BodyInfo::Kind::ball)
            destroyBody (body);

        body = next;
    }
}

void PhysicsMusicWorld::removeOldBalls()
{
    b2Body* oldest = nullptr;

    for (auto* body = world->GetBodyList(); body != nullptr; body = body->GetNext())
        if (auto* info = getInfo (body); info != nullptr && info->kind == BodyInfo::Kind::ball)
            if (oldest == nullptr || info->age > getInfo (oldest)->age)
                oldest = body;

    if (oldest != nullptr)
        destroyBody (oldest);
}

//==============================================================================
void PhysicsMusicWorld::advance (double elapsedSeconds)
{
    // Fixed timestep with an accumulator: the simulation is deterministic whatever the
    // frame rate. Clamping the catch-up avoids a "spiral of death" after a stall.
    leftOver = juce::jmin (leftOver + elapsedSeconds, 0.1);

    while (leftOver >= timeStep)
    {
        world->Step ((float32) timeStep, velocityIterations, positionIterations);
        leftOver += -timeStep;
        simulationTime += timeStep;
    }

    // Box2D forbids creating or destroying bodies inside callbacks, so housekeeping
    // happens here, after Step().
    for (auto* body = world->GetBodyList(); body != nullptr;)
    {
        auto* next = body->GetNext();

        if (auto* info = getInfo (body); info != nullptr)
        {
            info->flash = juce::jmax (0.0f, info->flash - (float) elapsedSeconds * 4.0f);

            if (info->kind == BodyInfo::Kind::ball)
            {
                info->age += elapsedSeconds;

                if (info->age > maxBallAge || body->GetPosition().y < -5.0f)
                    destroyBody (body);
            }
        }

        body = next;
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

    // The whole hand-over to the audio thread: copy one struct into a lock-free FIFO.
    const auto writer = fifo.write (1);

    if (writer.blockSize1 > 0)
        fifoStorage[(size_t) writer.startIndex1] = event;
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
void PhysicsMusicWorld::PostSolve (b2Contact* contact, const b2ContactImpulse* impulse)
{
    auto* fixtureA = contact->GetFixtureA();
    auto* fixtureB = contact->GetFixtureB();

    if (fixtureA->IsSensor() || fixtureB->IsSensor())
        return;

    auto* a = getInfo (fixtureA->GetBody());
    auto* b = getInfo (fixtureB->GetBody());

    if (a == nullptr || b == nullptr)
        return;

    // We want a ball hitting a note body. Ball-ball and ball-wall contacts stay silent.
    BodyInfo* note = nullptr;

    if (a->kind == BodyInfo::Kind::note && b->kind == BodyInfo::Kind::ball)  note = a;
    if (b->kind == BodyInfo::Kind::note && a->kind == BodyInfo::Kind::ball)  note = b;

    if (note == nullptr)
        return;

    // Impulse is momentum transferred in this one step, so a resting ball produces a
    // tiny value each step, and a real hit produces a large one.
    float strongest = 0.0f;

    for (int i = 0; i < impulse->count; ++i)
        strongest = juce::jmax (strongest, impulse->normalImpulses[i]);

    if (strongest < impulseThreshold)
        return;

    b2WorldManifold manifold;
    contact->GetWorldManifold (&manifold);

    // The square root gives a gentler, more musical velocity curve.
    triggerNote (*note, std::sqrt (juce::jmin (1.0f, strongest / impulseForFullVelocity)), manifold.points[0].x);
}

void PhysicsMusicWorld::BeginContact (b2Contact* contact)
{
    auto* fixtureA = contact->GetFixtureA();
    auto* fixtureB = contact->GetFixtureB();

    // Sensors never reach PostSolve, so zones use BeginContact and the ball's speed.
    if (fixtureA->IsSensor() == fixtureB->IsSensor())
        return;

    auto* sensorFixture = fixtureA->IsSensor() ? fixtureA : fixtureB;
    auto* otherFixture  = fixtureA->IsSensor() ? fixtureB : fixtureA;

    auto* zone = getInfo (sensorFixture->GetBody());
    auto* ball = getInfo (otherFixture->GetBody());

    if (zone == nullptr || ball == nullptr || ball->kind != BodyInfo::Kind::ball)
        return;

    const auto speed = otherFixture->GetBody()->GetLinearVelocity().Length();
    triggerNote (*zone, juce::jmin (1.0f, speed / 16.0f), otherFixture->GetBody()->GetPosition().x);
}

//==============================================================================
juce::Point<float> PhysicsMusicWorld::screenToWorld (juce::Point<float> p, juce::Rectangle<float> area) const
{
    const auto scaleFactor = juce::jmin (area.getWidth() / worldWidth, area.getHeight() / worldHeight);
    const auto worldArea = juce::Rectangle<float> (worldWidth * scaleFactor, worldHeight * scaleFactor)
                               .withCentre (area.getCentre());

    return { (p.x - worldArea.getX()) / scaleFactor,
             (worldArea.getBottom() - p.y) / scaleFactor };
}

void PhysicsMusicWorld::draw (juce::Graphics& g, juce::Rectangle<float> area, bool useDebugRenderer)
{
    const auto scaleFactor = juce::jmin (area.getWidth() / worldWidth, area.getHeight() / worldHeight);
    const auto worldArea = juce::Rectangle<float> (worldWidth * scaleFactor, worldHeight * scaleFactor)
                               .withCentre (area.getCentre());

    g.setColour (backgroundColour);
    g.fillRect (worldArea);

    if (useDebugRenderer)
    {
        // Box2DRenderer maps a world rectangle onto a target rectangle. Passing top > bottom
        // flips the y axis so that up is up.
        debugRenderer.render (g, *world, 0.0f, worldHeight, worldWidth, 0.0f, worldArea);
        return;
    }

    auto toScreen = [&] (b2Vec2 p)
    {
        return juce::Point<float> (worldArea.getX() + p.x * scaleFactor,
                                   worldArea.getBottom() - p.y * scaleFactor);
    };

    for (auto* body = world->GetBodyList(); body != nullptr; body = body->GetNext())
    {
        auto* info = getInfo (body);

        if (info == nullptr)
            continue;

        const bool isBall = info->kind == BodyInfo::Kind::ball;

        auto colour = isBall ? juce::Colour::fromHSV (info->hue, 0.55f, 0.95f, 1.0f)
                             : info->kind == BodyInfo::Kind::note
                                   ? juce::Colour::fromHSV (info->hue, 0.6f, 0.75f, 1.0f)
                                   : juce::Colour (0xff3a3f4b);

        colour = colour.interpolatedWith (juce::Colours::white, info->flash * 0.8f);

        for (auto* f = body->GetFixtureList(); f != nullptr; f = f->GetNext())
        {
            const bool isSensor = f->IsSensor();
            g.setColour (isSensor ? colour.withAlpha (0.25f + 0.5f * info->flash) : colour);

            if (f->GetType() == b2Shape::e_circle)
            {
                auto* circle = static_cast<b2CircleShape*> (f->GetShape());
                const auto centre = toScreen (body->GetWorldPoint (circle->m_p));
                const auto r = circle->m_radius * scaleFactor;
                g.fillEllipse (centre.x - r, centre.y - r, r * 2.0f, r * 2.0f);
            }
            else if (f->GetType() == b2Shape::e_polygon)
            {
                auto* polygon = static_cast<b2PolygonShape*> (f->GetShape());
                juce::Path path;

                for (int i = 0; i < polygon->m_vertexCount; ++i)
                {
                    const auto p = toScreen (body->GetWorldPoint (polygon->m_vertices[i]));

                    if (i == 0)  path.startNewSubPath (p);
                    else         path.lineTo (p);
                }

                path.closeSubPath();
                g.fillPath (path);

                if (info->kind == BodyInfo::Kind::note)
                {
                    g.setColour (juce::Colours::white.withAlpha (0.8f));
                    g.setFont (juce::FontOptions (juce::jmax (9.0f, scaleFactor * 0.4f)));
                    g.drawText (juce::MidiMessage::getMidiNoteName (degreeToMidiNote (scale, rootNote, info->degree),
                                                                    true, true, 4),
                                path.getBounds().toNearestInt(), juce::Justification::centred, false);
                }
            }
        }
    }
}

} // namespace physicsmusic
