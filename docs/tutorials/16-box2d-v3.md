# Integrating Box2D v3

Use a current Box2D release in a JUCE app, instead of the older snapshot bundled in
`juce_box2d`, and let its event system replace the contact listener from
[guide 15](15-physics-music.md). The finished app is
[`examples/Box2DAudioV3`](../../examples/Box2DAudioV3), target `MusicV3`.

**Level:** Intermediate to advanced  
**Prerequisite:** [Physics as a musical instrument](15-physics-music.md). This guide
builds the same three scenes, so read that first.

Box2D v3 is a full rewrite by the same author, released in 2024. This guide uses
**v3.1.1**. The API is not source-compatible with v2, and the bundled JUCE module does
not contain it, so you fetch it yourself.

## Why bother

- **Events instead of callbacks.** After each step, ask the world for arrays of
  *hit events* (with the approach speed), *begin and end touch events*, and *sensor
  events*. There is no listener running inside `Step()`, and no impulse to threshold.
- **A better solver.** A sub-stepping solver replaces the velocity and position
  iteration counts, and the engine is much faster with many bodies.
- **Cross-platform determinism** is a stated goal of the 3.1 release, useful if you
  want the same input to sound the same on every machine. Check the upstream release
  notes for the current guarantees.
- **It is maintained.** The vendored v2 snapshot is not.

What you give up:

- The API is C, using **ids instead of pointers**. There is no C++ class hierarchy.
- Some features that v2 had are absent or arrived later. The upstream migration guide
  said the gear and pulley joints were removed in 3.0, so check the current release
  before relying on them.
- Every definition struct must be initialised with its `b2Default...()` function.

## Step 1: get Box2D with CMake

Box2D's own CMake project has a target called `box2d`. It skips its samples and tests
when it is not the top-level project, so `FetchContent` builds only the library:

```cmake
include(FetchContent)

FetchContent_Declare(box2d
    GIT_REPOSITORY https://github.com/erincatto/box2d.git
    GIT_TAG        v3.1.1
    GIT_SHALLOW    TRUE)

FetchContent_MakeAvailable(box2d)

target_link_libraries(MyApp PRIVATE box2d juce::juce_gui_extra)
```

Pin a tag, so your build does not change under you. Do not link the `juce_box2d`
module in the same target: both define `b2...` names, and they will collide.

The full file is
[`examples/Box2DAudioV3/CMakeLists.txt`](../../examples/Box2DAudioV3/CMakeLists.txt). It
is a standalone CMake project, not part of the JUCE examples build, so that ordinary
JUCE builds never need network access. Build it with:

```
cmake -S examples/Box2DAudioV3 -B build-box2d-v3
cmake --build build-box2d-v3 --target MusicV3
```

Two integration details are worth knowing.

**Warnings from Box2D's headers.** JUCE's `juce_recommended_warning_flags` include
`-Wfloat-equal`, which Box2D's inline math functions trip. Every file that includes
`box2d/box2d.h` warns. Mark the include directory as a system include, which
silences warnings from those headers only:

```cmake
target_include_directories(MusicV3 SYSTEM PRIVATE "${box2d_SOURCE_DIR}/include")
```

**C in a C++ project.** The header is C, and wraps its functions in
`extern "C"` when compiled as C++, so `#include <box2d/box2d.h>` just works. The
project must enable the `C` language (`project (... LANGUAGES C CXX)`).

## Step 2: translate the concepts

| v2 (the `juce_box2d` module)               | v3                                               |
| ------------------------------------------ | ------------------------------------------------ |
| `b2World world (gravity)`                  | `b2WorldDef def = b2DefaultWorldDef(); b2CreateWorld (&def)` |
| `b2Body*`, `b2Fixture*`                    | `b2BodyId`, `b2ShapeId` (small values, passed by copy) |
| `world.GetBodyList()`                      | none: **keep your own list of bodies**          |
| `world.Step (dt, velIters, posIters)`      | `b2World_Step (world, dt, subStepCount)`, usually 4 sub-steps |
| `b2ContactListener::PostSolve` + impulse   | `b2World_GetContactEvents().hitEvents`, with `approachSpeed` |
| `BeginContact` on a sensor                 | `b2World_GetSensorEvents().beginEvents`         |
| `body->GetUserData()`                      | `b2Body_GetUserData (bodyId)`                   |
| `fixtureDef.restitution`                   | `shapeDef.material.restitution`                 |
| `fixtureDef.isSensor`                      | `shapeDef.isSensor` and `shapeDef.enableSensorEvents` |
| `world.DestroyBody (body)`                 | `b2DestroyBody (bodyId)`                        |

The definition structs work like this:

```cpp
auto bodyDef = b2DefaultBodyDef();
bodyDef.type = b2_dynamicBody;
bodyDef.position = position;
bodyDef.userData = entry.info.get();
entry.body = b2CreateBody (world, &bodyDef);

auto shapeDef = b2DefaultShapeDef();
shapeDef.density = 1.0f;
shapeDef.material.friction = 0.3f;
shapeDef.material.restitution = bounciness;
shapeDef.enableHitEvents = true;      // opt-in
shapeDef.enableSensorEvents = true;   // opt-in

b2Circle circle { { 0.0f, 0.0f }, radius };
entry.shape = b2CreateCircleShape (entry.body, &shapeDef, &circle);
```

Bodies are ids, not pointers, and there is no body list, so the example keeps its
own:

```cpp
struct Entry
{
    b2BodyId body = b2_nullBodyId;
    b2ShapeId shape = b2_nullShapeId;
    std::unique_ptr<BodyInfo> info;    // what the body means musically
};

std::vector<Entry> statics, balls;
```

The world owns bodies and shapes, but not your `BodyInfo`. Keep the info alive for as
long as the body exists, and free it after `b2DestroyBody`. Here the `unique_ptr` in
`Entry` does that.

## Step 3: hit events replace `PostSolve`

Events are **opt-in per shape**. A hit event is made only if the shape has
`enableHitEvents` set (here the ball's), and only when the approach speed exceeds
`b2WorldDef::hitEventThreshold`:

```cpp
auto worldDef = b2DefaultWorldDef();
worldDef.gravity = { 0.0f, -10.0f };
worldDef.hitEventThreshold = 0.8f;    // m/s: below this, no hit event
world = b2CreateWorld (&worldDef);
```

Reading them is a loop over an array. The guide 15 version threshold-tested an
impulse to tell hits from resting contact. Here that filtering is done for you:

```cpp
const auto contacts = b2World_GetContactEvents (world);

for (int i = 0; i < contacts.hitCount; ++i)
{
    const auto& hit = contacts.hitEvents[i];
    auto* a = getInfo (hit.shapeIdA);       // b2Body_GetUserData (b2Shape_GetBody (shape))
    auto* b = getInfo (hit.shapeIdB);

    // ... work out which side is the note body and which is the ball ...

    triggerNote (*note,
                 std::sqrt (juce::jmin (1.0f, hit.approachSpeed / hitSpeedForFullVelocity)),
                 hit.point.x);
}
```

`hit.approachSpeed` is the closing speed in m/s, `hit.point` is where it happened, and
`hit.normal` points from A to B. This is what guide 15 approximated with an impulse
and `GetWorldManifold`, and it does not depend on the mass of the ball. Two balls of
different sizes dropped from the same height give the same velocity.

Things to know:

- **Buffers are per step.** The event arrays are valid until the next `b2World_Step`.
  Read them inside your fixed-timestep loop, not after it, or you miss events when
  several steps run in one frame:

  ```cpp
  while (leftOver >= timeStep)
  {
      b2World_Step (world, (float) timeStep, subStepCount);
      simulationTime += timeStep;
      leftOver -= timeStep;
      processEvents();
  }
  ```
- **Debounce still applies.** A ball bouncing on a bar makes a hit event for each
  bounce, and jitter can make two in close succession. The example keeps
  `noteCooldown` per note body.
- **There is a restitution threshold.** v3 stops bouncing below
  `restitutionThreshold` (1 m/s by default), so low bounces die out sooner than in
  v2. The example lowers it to 0.3 m/s to keep the marimba lively.
- **You still cannot destroy bodies while iterating** a step's events. The example
  removes old balls after the loop, in `advance()`.

## Step 4: sensors

In v2, a sensor fixture produced `BeginContact` calls and you had to check
`IsSensor()`. In v3, sensor events are their own list, and **both sides opt in**: the
sensor shape and the shapes that may visit it.

```cpp
// The zone:
shapeDef.isSensor = true;
shapeDef.enableSensorEvents = true;

// ...and the ball's shapeDef, above, has enableSensorEvents = true too.

const auto sensors = b2World_GetSensorEvents (world);

for (int i = 0; i < sensors.beginCount; ++i)
{
    const auto& begin = sensors.beginEvents[i];
    auto* zone = getInfo (begin.sensorShapeId);
    auto* visitor = getInfo (begin.visitorShapeId);
    // ... trigger the zone's note, using the visitor body's speed for velocity ...
}
```

Sensor events also have `endEvents`. The shape ids in an end event may refer to
destroyed shapes, so check `b2Shape_IsValid` before using them.

## Step 5: drawing without a body list

`PhysicsMusicWorld::draw()` loops over its own `statics` and `balls`, gets each
body's `b2Body_GetTransform`, and each shape from `b2Body_GetShapes`:

```cpp
const auto transform = b2Body_GetTransform (entry.body);
const auto polygon = b2Shape_GetPolygon (shape);

for (int v = 0; v < polygon.count; ++v)
{
    const auto p = b2TransformPoint (transform, polygon.vertices[v]);   // local -> world
    // ... convert to screen coordinates, flipping y ...
}
```

Upstream provides `b2World_Draw` with a `b2DebugDraw` struct of function pointers, and
you could wrap it the way `juce::Box2DRenderer` wraps v2's `b2Draw`. The example does
not, so the v3 app has no "debug view" toggle.

## Step 6: threads and determinism

- **Box2D does not create threads.** `b2WorldDef::workerCount` defaults to 1, and it is
  only the number of workers *you* provide through `enqueueTask` and `finishTask`. For
  an audio app that is the right default: the world steps on the message thread and
  nothing else touches it. If you supply a task system, use your own worker threads,
  never the audio thread, and never `juce::ThreadPool` jobs that the audio callback
  waits for.
- **Determinism.** Upstream's CMake adds `-ffp-contract=off` to its own build so that
  float results do not vary with fused multiply-add. Your own code that feeds the
  world (spawn positions, timing) must be equally repeatable if you want repeatable
  music: use a fixed `juce::Random` seed and drive the world from the fixed timestep,
  not the wall clock.
- **Thread rules from guide 15 are unchanged.** Step on one thread, hand plain structs
  to the audio thread through an `AbstractFifo`.

## Step 7: what v3 does not change

- Units are metres, kilograms, and seconds, with y pointing up.
- You still choose how physics maps to music. Hit events remove the impulse plumbing,
  and everything from guide 15's mapping section still applies.
- Gravity, restitution, and friction are still the cheapest expressive controls.

## Checklist

- Pin a Box2D tag, and fetch it with `FetchContent`.
- Add its include directory as `SYSTEM` to keep JUCE's warning flags quiet.
- Initialise every definition with `b2Default...()`.
- Opt shapes in to hit events and sensor events.
- Read event arrays inside the fixed-step loop.
- Keep your own body list, and free your user data after `b2DestroyBody`.
- Do not link `juce_box2d` alongside it.
