#include "PhysicsWorld.h"
#include <algorithm>

namespace modal
{

//==============================================================================
PhysicsWorld::PhysicsWorld()
{
    auto worldDef = b2DefaultWorldDef();
    worldDef.gravity = { 0.0f, -10.0f };
    worldDef.hitEventThreshold = 1.0f;
    world = b2CreateWorld (&worldDef);

    buildScene();
}

PhysicsWorld::~PhysicsWorld()
{
    b2DestroyWorld (world);
}

void PhysicsWorld::setGravity (float g)
{
    b2World_SetGravity (world, { 0.0f, -g });
}

void PhysicsWorld::setPitchSnap (bool snap, const physicsmusic::Scale& newScale, int newRoot)
{
    snapToScale = snap;
    scale = newScale;
    rootNote = newRoot;
}

//==============================================================================
float PhysicsWorld::getFundamental (const ObjectInfo& info) const
{
    if (info.degree >= 0)
        return juce::MidiMessage::getMidiNoteInHertz (physicsmusic::degreeToMidiNote (scale, rootNote, info.degree));

    // Bigger objects ring lower. A real bar goes as 1/length squared. We use a gentler
    // square-root law so that the whole range of sizes stays in a musical register.
    const auto frequency = juce::jlimit (40.0f, 3000.0f,
                                         getMaterial (info.material).baseFrequency * std::sqrt (0.3f / info.size));

    if (! snapToScale)
        return frequency;

    // Snap to the nearest note of the current scale.
    const auto midi = 69.0f + 12.0f * std::log2 (frequency / 440.0f);
    const auto rounded = (int) std::round (midi);
    auto best = rounded;
    auto bestDistance = 1.0e9f;

    for (int candidate = rounded - 7; candidate <= rounded + 7; ++candidate)
    {
        const auto pitchClass = ((candidate - rootNote) % 12 + 12) % 12;
        const auto inScale = std::find (scale.steps.begin(), scale.steps.end(), pitchClass) != scale.steps.end();

        if (inScale && std::abs ((float) candidate - midi) < bestDistance)
        {
            bestDistance = std::abs ((float) candidate - midi);
            best = candidate;
        }
    }

    return juce::MidiMessage::getMidiNoteInHertz (best);
}

//==============================================================================
void PhysicsWorld::addStatic (int material, float x, float y, float halfWidth, float halfHeight,
                              float angle, float size, int degree)
{
    Entry entry;
    entry.info = std::make_unique<ObjectInfo>();
    entry.info->material = material;
    entry.info->size = size;
    entry.info->degree = degree;

    auto bodyDef = b2DefaultBodyDef();
    bodyDef.position = { x, y };
    bodyDef.rotation = b2MakeRot (angle);
    bodyDef.userData = entry.info.get();
    entry.body = b2CreateBody (world, &bodyDef);

    const auto& m = getMaterial (material);
    auto shapeDef = b2DefaultShapeDef();
    shapeDef.material.friction = m.friction;
    shapeDef.material.restitution = m.restitution;
    shapeDef.enableHitEvents = true;

    auto box = b2MakeBox (halfWidth, halfHeight);
    b2CreatePolygonShape (entry.body, &shapeDef, &box);

    statics.push_back (std::move (entry));
}

void PhysicsWorld::buildScene()
{
    // Boundary: a stone floor and two stone walls. Their large size gives a low thud.
    addStatic (stone, worldWidth * 0.5f, -0.25f, worldWidth * 0.5f, 0.25f, 0.0f, 8.0f);
    addStatic (stone, -0.25f, worldHeight * 0.5f, 0.25f, worldHeight * 0.5f, 0.0f, 8.0f);
    addStatic (stone, worldWidth + 0.25f, worldHeight * 0.5f, 0.25f, worldHeight * 0.5f, 0.0f, 8.0f);

    // A zig-zag of sloping ramps. Balls roll down each one (a continuous sound),
    // drop off the end (a strike), and land on the next.
    const int ramps[] = { wood, glass, metal, wood };

    for (int i = 0; i < 4; ++i)
    {
        const bool slopesRight = i % 2 == 0;
        addStatic (ramps[i], slopesRight ? 8.0f : 12.0f, 12.0f - 2.6f * (float) i,
                   4.0f, 0.15f, slopesRight ? -0.18f : 0.18f, 2.0f);
    }

    // A xylophone along the floor. Each bar is pinned to a scale degree.
    const int bars[] = { wood, glass, wood, glass, wood, glass, wood, metal };

    for (int i = 0; i < 8; ++i)
        addStatic (bars[i], 2.0f + (float) i * 2.3f, 0.5f, 1.0f, 0.25f, 0.0f, 0.5f, i * 2);
}

//==============================================================================
void PhysicsWorld::spawn (int materialId, bool box, float size, b2Vec2 position, b2Vec2 velocity)
{
    if ((int) dynamics.size() >= maxObjects)
        removeDynamic (0);

    int slot = -1;

    for (int i = 0; i < numRollSlots; ++i)
        if (! slotInUse[(size_t) i])  { slot = i; break; }

    if (slot < 0)
        return;

    slotInUse[(size_t) slot] = true;

    Entry entry;
    entry.info = std::make_unique<ObjectInfo>();
    entry.info->material = materialId;
    entry.info->size = size;
    entry.info->dynamic = true;
    entry.info->rollSlot = slot;

    const auto& m = getMaterial (materialId);

    auto bodyDef = b2DefaultBodyDef();
    bodyDef.type = b2_dynamicBody;
    bodyDef.position = position;
    bodyDef.linearVelocity = velocity;
    bodyDef.rotation = b2MakeRot (random.nextFloat() * 6.28f);
    bodyDef.userData = entry.info.get();
    entry.body = b2CreateBody (world, &bodyDef);

    auto shapeDef = b2DefaultShapeDef();
    shapeDef.density = m.density;
    shapeDef.material.friction = m.friction;
    shapeDef.material.restitution = m.restitution;
    shapeDef.enableHitEvents = true;

    if (box)
    {
        auto polygon = b2MakeBox (size, size * 0.6f);
        b2CreatePolygonShape (entry.body, &shapeDef, &polygon);
    }
    else
    {
        b2Circle circle { { 0.0f, 0.0f }, size };
        b2CreateCircleShape (entry.body, &shapeDef, &circle);
    }

    dynamics.push_back (std::move (entry));
}

void PhysicsWorld::spawnRandom (int material, bool box, float size)
{
    spawn (material, box, size * (0.85f + 0.3f * random.nextFloat()),
           { 4.0f + random.nextFloat() * 5.0f, worldHeight - 0.5f },
           { random.nextFloat() * 2.0f, 0.0f });
}

void PhysicsWorld::removeDynamic (size_t index)
{
    auto& entry = dynamics[index];
    const auto slot = (size_t) entry.info->rollSlot;

    rollSlots[slot].level = 0.0f;
    slotInUse[slot] = false;

    b2DestroyBody (entry.body);
    dynamics.erase (dynamics.begin() + (std::ptrdiff_t) index);
}

void PhysicsWorld::clearObjects()
{
    while (! dynamics.empty())
        removeDynamic (dynamics.size() - 1);
}

//==============================================================================
void PhysicsWorld::advance (double elapsedSeconds)
{
    leftOver = juce::jmin (leftOver + elapsedSeconds, 0.1);

    while (leftOver >= timeStep)
    {
        b2World_Step (world, (float) timeStep, subStepCount);
        simulationTime += timeStep;
        leftOver -= timeStep;
        processHits();      // event buffers are only valid until the next step
    }

    updateRolling();

    for (auto& e : statics)
        e.info->flash = juce::jmax (0.0f, e.info->flash - (float) elapsedSeconds * 4.0f);

    for (size_t i = dynamics.size(); i-- > 0;)
    {
        auto& info = *dynamics[i].info;
        info.flash = juce::jmax (0.0f, info.flash - (float) elapsedSeconds * 4.0f);
        info.age += elapsedSeconds;

        if (info.age > maxAge || b2Body_GetPosition (dynamics[i].body).y < -5.0f)
            removeDynamic (i);
    }
}

//==============================================================================
void PhysicsWorld::pushStrike (ObjectInfo& struck, const ObjectInfo& other, float speed, float x)
{
    if (simulationTime - struck.lastHitTime < cooldown)
        return;

    struck.lastHitTime = simulationTime;
    struck.flash = 1.0f;

    const auto loudness = juce::jmin (1.0f, speed / hitSpeedForFullAmplitude);
    const auto& m = getMaterial (struck.material);

    StrikeEvent e;
    e.material = struck.material;
    e.f0 = getFundamental (struck);
    e.amplitude = std::pow (loudness, 1.3f);

    // Hertzian contact theory says contact time falls slowly with impact speed (as
    // speed to the power -0.2) and grows with the size of the bodies. Both bodies
    // take part, so hitting glass with wood is duller than hitting it with metal.
    e.contactMs = 0.5f * (m.contactMs + getMaterial (other.material).contactMs)
                    * std::pow (juce::jmax (0.5f, speed) / 4.0f, -0.2f)
                    * std::pow (struck.size / 0.3f, 0.4f);
    e.pan = juce::jlimit (0.0f, 1.0f, x / worldWidth);

    const auto writer = fifo.write (1);

    if (writer.blockSize1 > 0)
        fifoStorage[(size_t) writer.startIndex1] = e;
}

void PhysicsWorld::processHits()
{
    const auto events = b2World_GetContactEvents (world);

    for (int i = 0; i < events.hitCount; ++i)
    {
        const auto& hit = events.hitEvents[i];
        auto* a = getInfo (hit.shapeIdA);
        auto* b = getInfo (hit.shapeIdB);

        // Both bodies ring: this is what makes it feel like a physical object
        // rather than a trigger.
        pushStrike (*a, *b, hit.approachSpeed, hit.point.x);
        pushStrike (*b, *a, hit.approachSpeed, hit.point.x);
    }
}

bool PhysicsWorld::popStrike (StrikeEvent& result)
{
    const auto reader = fifo.read (1);

    if (reader.blockSize1 <= 0)
        return false;

    result = fifoStorage[(size_t) reader.startIndex1];
    return true;
}

//==============================================================================
void PhysicsWorld::updateRolling()
{
    for (auto& entry : dynamics)
    {
        auto& info = *entry.info;
        auto& slot = rollSlots[(size_t) info.rollSlot];

        std::array<b2ContactData, 4> contacts;
        const auto numContacts = b2Body_GetContactData (entry.body, contacts.data(), (int) contacts.size());

        const auto velocity = b2Body_GetLinearVelocity (entry.body);
        float bestLevel = 0.0f;
        const ObjectInfo* surface = nullptr;
        float surfaceX = 0.0f;

        for (int c = 0; c < numContacts; ++c)
        {
            const auto& contact = contacts[(size_t) c];
            const auto& manifold = contact.manifold;

            // Only contacts that are actually pressing count, not speculative ones.
            bool loaded = false;

            for (int p = 0; p < manifold.pointCount; ++p)
                loaded = loaded || manifold.points[p].totalNormalImpulse > 1.0e-3f;

            if (! loaded)
                continue;

            const bool weAreA = B2_ID_EQUALS (b2Shape_GetBody (contact.shapeIdA), entry.body);
            const auto otherShape = weAreA ? contact.shapeIdB : contact.shapeIdA;
            const auto otherBody = b2Shape_GetBody (otherShape);
            const auto point = manifold.points[0].point;

            // How fast our body's centre travels over the surface, along the surface.
            // This covers rolling and sliding alike: a rolling ball has zero speed at the
            // contact point, but the ground still rumbles as it passes.
            const auto relative = velocity - b2Body_GetWorldPointVelocity (otherBody, point);
            const b2Vec2 tangent { -manifold.normal.y, manifold.normal.x };
            const auto groundSpeed = std::abs (b2Dot (relative, tangent));

            const auto level = std::pow (juce::jmin (1.0f, groundSpeed / 8.0f), 1.3f);

            if (level > bestLevel)
            {
                bestLevel = level;
                surface = static_cast<ObjectInfo*> (b2Body_GetUserData (otherBody));
                surfaceX = point.x;
            }
        }

        if (surface == nullptr || bestLevel < 0.01f)
        {
            slot.level = 0.0f;
            continue;
        }

        // The surface is what resonates, so its material and pitch shape the rumble.
        slot.material = surface->material;
        slot.f0 = getFundamental (*surface);
        slot.pan = juce::jlimit (0.0f, 1.0f, surfaceX / worldWidth);
        slot.level = bestLevel;
        info.flash = juce::jmax (info.flash, bestLevel * 0.5f);
    }
}

//==============================================================================
static juce::Rectangle<float> getWorldArea (juce::Rectangle<float> area)
{
    const auto scaleFactor = juce::jmin (area.getWidth() / PhysicsWorld::worldWidth,
                                         area.getHeight() / PhysicsWorld::worldHeight);

    return juce::Rectangle<float> (PhysicsWorld::worldWidth * scaleFactor,
                                   PhysicsWorld::worldHeight * scaleFactor).withCentre (area.getCentre());
}

juce::Point<float> PhysicsWorld::screenToWorld (juce::Point<float> p, juce::Rectangle<float> area) const
{
    const auto worldArea = getWorldArea (area);
    const auto scaleFactor = worldArea.getWidth() / worldWidth;

    return { (p.x - worldArea.getX()) / scaleFactor, (worldArea.getBottom() - p.y) / scaleFactor };
}

void PhysicsWorld::draw (juce::Graphics& g, juce::Rectangle<float> area)
{
    const auto worldArea = getWorldArea (area);
    const auto scaleFactor = worldArea.getWidth() / worldWidth;

    g.setColour (juce::Colour (0xff14161b));
    g.fillRect (worldArea);

    auto drawEntry = [&] (const Entry& entry)
    {
        const auto& info = *entry.info;
        auto colour = juce::Colour (getMaterial (info.material).colour)
                          .interpolatedWith (juce::Colours::white, info.flash * 0.8f);

        const auto transform = b2Body_GetTransform (entry.body);

        auto toScreen = [&] (b2Vec2 local)
        {
            const auto p = b2TransformPoint (transform, local);
            return juce::Point<float> (worldArea.getX() + p.x * scaleFactor, worldArea.getBottom() - p.y * scaleFactor);
        };

        std::array<b2ShapeId, 2> shapes;
        const auto numShapes = b2Body_GetShapes (entry.body, shapes.data(), (int) shapes.size());

        for (int s = 0; s < numShapes; ++s)
        {
            g.setColour (colour);

            if (b2Shape_GetType (shapes[(size_t) s]) == b2_circleShape)
            {
                const auto circle = b2Shape_GetCircle (shapes[(size_t) s]);
                const auto centre = toScreen (circle.center);
                const auto r = circle.radius * scaleFactor;
                g.fillEllipse (centre.x - r, centre.y - r, r * 2.0f, r * 2.0f);

                // A line from the centre shows the rotation, which makes rolling visible.
                g.setColour (juce::Colours::black.withAlpha (0.35f));
                g.drawLine ({ centre, toScreen ({ circle.radius, 0.0f }) }, 2.0f);
            }
            else if (b2Shape_GetType (shapes[(size_t) s]) == b2_polygonShape)
            {
                const auto polygon = b2Shape_GetPolygon (shapes[(size_t) s]);
                juce::Path path;

                for (int v = 0; v < polygon.count; ++v)
                {
                    const auto p = toScreen (polygon.vertices[v]);

                    if (v == 0)  path.startNewSubPath (p);
                    else         path.lineTo (p);
                }

                path.closeSubPath();
                g.fillPath (path);

                if (info.degree >= 0)
                {
                    g.setColour (juce::Colours::black.withAlpha (0.7f));
                    g.setFont (juce::FontOptions (juce::jmax (9.0f, scaleFactor * 0.4f)));
                    g.drawText (juce::MidiMessage::getMidiNoteName (
                                    physicsmusic::degreeToMidiNote (scale, rootNote, info.degree), true, true, 4),
                                path.getBounds().toNearestInt(), juce::Justification::centred, false);
                }
            }
        }
    };

    for (auto& e : statics)   drawEntry (e);
    for (auto& e : dynamics)  drawEntry (e);
}

} // namespace modal
