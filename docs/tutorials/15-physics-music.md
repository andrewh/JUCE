# Physics as a musical instrument with Box2D

Use the `juce_box2d` module to run a physics simulation, and turn its collisions
into notes. The finished app is [`examples/Box2DMusic`](../../examples/Box2DMusic).

**Level:** Intermediate to advanced  
**Prerequisites:** [Synthesis](06-synthesis.md) for the audio callback,
[MIDI and MPE](07-midi-and-mpe.md) if you want MIDI output, and
[Core utilities](12-utilities.md) for `Random`.

Unlike guides 01 to 14, this one is not adapted from juce.com: no official
tutorial covers Box2D.

## Set up the project

This guide builds an app out of several source files. Rather than repeat all of
them here, start from the finished app in the JUCE repository and read the steps
below as a tour of how it works.

Copy the example out of your JUCE checkout into a new folder, so that you can edit
it freely:

```sh
cp -r /path/to/JUCE/examples/Box2DMusic PhysicsMusic
```

The folder holds `Main.cpp`, `MainComponent.cpp`, `MainComponent.h`,
`PhysicsMusicWorld.cpp`, `PhysicsMusicWorld.h`, `PluckSynth.h`, and `Scales.h`.
Replace its `CMakeLists.txt` with the version below. It is the example's own file,
with the line that adds JUCE (`add_subdirectory`) included, because the copy no
longer sits inside the JUCE tree:

**`CMakeLists.txt`**

```cmake
cmake_minimum_required(VERSION 3.22)
project(BOX2D_MUSIC VERSION 1.0.0)

add_subdirectory(/path/to/JUCE JUCE)   # or find_package (JUCE CONFIG REQUIRED)

juce_add_gui_app(Box2DMusic
    PRODUCT_NAME "Physics Music"
    NEEDS_WEB_BROWSER FALSE
    NEEDS_CURL FALSE)

target_sources(Box2DMusic
    PRIVATE
        Main.cpp
        MainComponent.cpp
        PhysicsMusicWorld.cpp)

target_compile_definitions(Box2DMusic
    PRIVATE
        JUCE_WEB_BROWSER=0
        JUCE_USE_CURL=0
        JUCE_APPLICATION_NAME_STRING="$<TARGET_PROPERTY:Box2DMusic,JUCE_PRODUCT_NAME>"
        JUCE_APPLICATION_VERSION_STRING="$<TARGET_PROPERTY:Box2DMusic,JUCE_VERSION>")

target_link_libraries(Box2DMusic
    PRIVATE
        juce::juce_audio_utils
        juce::juce_box2d
        juce::juce_gui_extra
    PUBLIC
        juce::juce_recommended_config_flags
        juce::juce_recommended_lto_flags
        juce::juce_recommended_warning_flags)
```

Replace `/path/to/JUCE` with the folder you cloned JUCE into. The `juce_box2d`
module is part of JUCE, so nothing else needs downloading.

## What JUCE ships

- **The engine:** [`modules/juce_box2d/box2d`](../../modules/juce_box2d/box2d) is a
  vendored Box2D snapshot that reports itself as **2.2.1** (`b2_version`). It uses the
  upstream API, including the `float32` typedef and `b2World (gravity)` construction.
  It is a little newer than the 2.2.1 release, since it already has chain shapes,
  `b2RopeJoint`, `b2WheelJoint`, and gravity scale. Newer Box2D manuals describe a
  different API, so trust the headers here first. See
  [The bundled Box2D is old](#the-bundled-box2d-is-old).
- **A debug renderer:** `juce::Box2DRenderer` in
  [`juce_Box2DRenderer.h`](../../modules/juce_box2d/utils/juce_Box2DRenderer.h)
  draws a world into a `juce::Graphics`.
- **Upstream scenes:** [`examples/Assets/Box2DTests`](../../examples/Assets/Box2DTests)
  holds the Box2D testbed. The most relevant for music are `CollisionProcessing.h`,
  `SensorTest.h`, `Pinball.h`, `Tumbler.h`, `VaryingRestitution.h`, and `RayCast.h`.
  [`examples/Utilities/Box2DDemo.h`](../../examples/Utilities/Box2DDemo.h) shows how
  the demo hosts them.
- **Licences:** Box2D is zlib-licensed, JUCE is AGPLv3 or commercial. A commercial
  JUCE licence may be needed for closed-source products.

Link `juce::juce_box2d` (plus `juce::juce_audio_utils` for the audio in this guide).

## The Box2D model in five minutes

- A `b2World` holds bodies. Step it with `world.Step (dt, velocityIterations, positionIterations)`.
- A `b2Body` is a position and velocity. It is `b2_staticBody` (never moves),
  `b2_kinematicBody`, or `b2_dynamicBody`.
- A body has one or more **fixtures**, each pairing a shape (`b2CircleShape`,
  `b2PolygonShape`, edges, chains) with density, friction, and **restitution**
  (bounciness). A fixture flagged `isSensor` detects overlap but never collides.
- **Units are metres, kilograms, and seconds, with y pointing up.** Box2D works best
  for objects of about 0.1 to 10 m. Build your world at that scale, then map it to
  pixels when drawing. The example world is 20 m by 15 m.
- Bodies carry a `void* userData`. Store a pointer to your own struct there to say
  what a body *means* musically.

```cpp
b2World world (b2Vec2 (0.0f, -10.0f));          // gravity, in m/s^2

b2BodyDef bodyDef;
bodyDef.type = b2_dynamicBody;
bodyDef.position.Set (5.0f, 12.0f);
auto* body = world.CreateBody (&bodyDef);

b2CircleShape circle;
circle.m_radius = 0.3f;

b2FixtureDef fixture;
fixture.shape = &circle;
fixture.density = 1.0f;
fixture.restitution = 0.7f;
body->CreateFixture (&fixture);
```

## Step 1: give bodies a musical meaning

The example attaches a `BodyInfo` to every body. Static bodies hold a scale
*degree*, so changing the scale or root note retunes the instrument instantly,
without rebuilding the world.

```cpp
struct BodyInfo
{
    enum class Kind { ball, note, wall };

    Kind kind = Kind::wall;
    int degree = 0;              // which scale degree a note body sounds
    float hue = 0.0f;
    float flash = 0.0f;          // drawing only
    double lastHitTime = -1.0;   // for debouncing
    double age = 0.0;            // balls only
};
```

`Scales.h` turns a degree into a MIDI note, wrapping across octaves:

```cpp
inline int degreeToMidiNote (const Scale& scale, int rootNote, int degree)
{
    const auto size   = (int) scale.steps.size();
    const auto octave = degree >= 0 ? degree / size : -((-degree + size - 1) / size);
    const auto index  = degree - octave * size;

    return juce::jlimit (0, 127, rootNote + octave * 12 + scale.steps[(size_t) index]);
}
```

Snapping every note to a scale is the cheapest way to make random collisions sound
musical. The app offers pentatonic, major, Dorian, and whole-tone scales.

## Step 2: listen to collisions

`b2ContactListener` (in `b2WorldCallbacks.h`) has four callbacks:

| Callback       | Fires                                            | Use it for |
| -------------- | ------------------------------------------------ | ---------- |
| `BeginContact` | Two fixtures start touching                      | Note-on when no impulse is needed, and **sensors** |
| `EndContact`   | Two fixtures stop touching                       | Note-off, or a release |
| `PreSolve`     | Before the solver, for touching solid contacts   | Filtering, for example ignoring a one-way platform |
| `PostSolve`    | After the solver, with the computed impulses     | **Note-on with velocity from hit strength** |

`BeginContact` tells you *that* two things touched but not *how hard*. `PostSolve`
reports `b2ContactImpulse::normalImpulses`, the momentum exchanged along the contact
normal during that step, which is what you want for velocity.

```cpp
void PhysicsMusicWorld::PostSolve (b2Contact* contact, const b2ContactImpulse* impulse)
{
    // ... find the BodyInfo of each side; we want a ball hitting a note body ...

    float strongest = 0.0f;
    for (int i = 0; i < impulse->count; ++i)
        strongest = juce::jmax (strongest, impulse->normalImpulses[i]);

    if (strongest < impulseThreshold)      // resting contact produces tiny impulses every step
        return;

    b2WorldManifold manifold;
    contact->GetWorldManifold (&manifold); // where the hit happened, for panning

    triggerNote (*note, std::sqrt (juce::jmin (1.0f, strongest / impulseForFullVelocity)),
                 manifold.points[0].x);
}
```

Things to know about the callbacks:

- Impulses are **per step**. A ball resting on a bar produces a small impulse each
  step and never stops "touching", so a threshold is essential. Otherwise you get a
  constant buzz. The square root gives a gentler velocity curve.
- You may receive **several callbacks for the same contact** in one step, so
  debounce. The example ignores a note body that sounded within the last 50 ms.
- **Sensors never reach `PostSolve`.** The Zones scene uses `BeginContact` and the
  ball's speed instead.
- **You cannot create or destroy bodies inside a callback.** The example removes old
  balls after `Step()` returns, in `advance()`.
- Keep callbacks cheap. They run inside `Step()`, potentially many times per step.

## Step 3: the threading design

This is the most important decision in the app.

| Thread          | Owns                                                        |
| --------------- | ----------------------------------------------------------- |
| Message thread  | The `b2World`, stepping, drawing, mouse input, body creation |
| Audio thread    | The synthesiser and the read end of the FIFO                 |

- **Never step the world on the audio thread.** Box2D allocates and its running time
  varies, which breaks the real-time rules from [guide 05](05-audio-io-and-playback.md).
- Never let the audio thread read Box2D objects. They change while the world steps.
- Cross the boundary with one small, pointer-free struct through `juce::AbstractFifo`:

```cpp
struct NoteEvent { int midiNote = 60; float velocity = 0.5f; float pan = 0.5f; };

// Message thread, inside a contact callback:
const auto writer = fifo.write (1);
if (writer.blockSize1 > 0)
    fifoStorage[(size_t) writer.startIndex1] = event;

// Audio thread, at the start of getNextAudioBlock():
NoteEvent event;
while (physics.popEvent (event))
    synth.noteOn (event.midiNote, event.velocity, event.pan);
```

The FIFO has exactly one producer and one consumer, which is what `AbstractFifo`
requires. If the FIFO is full, `write()` gives a zero-size block and the event is
dropped, which is the right failure mode for a real-time system.

**Fixed timestep.** The world advances with an accumulator so the simulation is
deterministic whatever the frame rate:

```cpp
void PhysicsMusicWorld::advance (double elapsedSeconds)
{
    leftOver = juce::jmin (leftOver + elapsedSeconds, 0.1);   // clamp after a stall

    while (leftOver >= timeStep)                              // timeStep = 1/240 s
    {
        world->Step ((float32) timeStep, velocityIterations, positionIterations);
        leftOver -= timeStep;
        simulationTime += timeStep;
    }
}
```

A 120 Hz `Timer` calls this. The example uses the message thread because drawing and
stepping share the world without locks.

**Timing accuracy.** Events reach the synth at the next audio block, so a note can be
late by up to one timer period (about 8 ms) plus one block. That suits an
instrument you watch and play. If you need tight timing, step on a dedicated thread
at 240 Hz or more and draw from a copied snapshot, or timestamp events and
schedule them a block ahead.

## Step 4: the synthesiser

`PluckSynth` is a 32-voice marimba-like synth: a fundamental plus a fast-decaying
partial at four times the frequency, a 2 ms fade-in to avoid clicks, constant-power
panning, and stealing of the quietest voice when full.

```cpp
void noteOn (int midiNote, float velocity, float pan)
{
    auto& v = findVoice();

    const auto frequency = juce::MidiMessage::getMidiNoteInHertz (midiNote);
    const auto tau       = 0.25 + 0.6 * (1.0 - juce::jlimit (0.0, 1.0, midiNote / 100.0));

    v.active    = true;
    v.increment = juce::MathConstants<double>::twoPi * frequency / sampleRate;
    v.envelope  = 1.0f;
    v.decay     = (float) std::exp (-1.0 / (sampleRate * tau));   // lower notes ring longer
    v.gain      = 0.3f * velocity;
    v.gainLeft  = std::cos (pan * juce::MathConstants<float>::halfPi);
    v.gainRight = std::sin (pan * juce::MathConstants<float>::halfPi);
    // ...
}
```

The output goes through `std::tanh` as a soft limiter, because many balls can hit at
once.

## Step 5: three ways to map physics to music

The app has one scene per idea.

**Marimba (positions are pitches).** Ten static boxes along the floor, each a scale
degree. The ball's identity does not matter, the bar it hits does. Lower bars are
longer, as on a real instrument.

**Plinko (position and layout are pitches).** Staggered static circles.
`degree = column + row` means the x position picks the note and each row up is one
step higher, so a falling ball plays a rising or falling figure depending on its path.

**Zones (sensors and speed).** Rectangular sensor fixtures with no collision. A ball
falls through them, bounces off the floor, and passes through again, which plays
arpeggios. Velocity comes from the ball's speed at `BeginContact`:

```cpp
void PhysicsMusicWorld::BeginContact (b2Contact* contact)
{
    // ... exactly one fixture must be a sensor ...
    const auto speed = otherFixture->GetBody()->GetLinearVelocity().Length();
    triggerNote (*zone, juce::jmin (1.0f, speed / 16.0f), otherFixture->GetBody()->GetPosition().x);
}
```

More mappings to try:

- **Pitch:** body size (bigger is lower), height, angle, or a per-body note in `userData`.
- **Velocity:** normal impulse (as here), or relative speed of the two bodies.
- **Timbre:** the pair of materials, or a fixture's `userData` picking a sample.
- **Pan:** contact x-position (as here).
- **Continuous control:** each frame, map a body's speed or position to filter cutoff,
  vibrato depth, or reverb send.
- **Rhythm:** a `b2World::RayCast` sweeping across the scene works as a playhead, and
  a rotating kinematic paddle works as a clock.
- **Collisions between balls:** the example keeps them silent. Handle them in
  `PostSolve` with a soft "tick" and you get a percussion layer.
- **Change restitution or gravity** to shift the feel from a slow drip to a rapid cascade.

## Step 6: drawing

`PhysicsMusicWorld::draw()` walks `world->GetBodyList()`, converts each body's
fixtures to screen coordinates with a y-flip, and lights bodies up when `flash` is
high. For quick debugging, tick **Box2D debug view**, which uses `juce::Box2DRenderer`:

```cpp
// Passing top > bottom flips the y axis so that up is up.
debugRenderer.render (g, *world, 0.0f, worldHeight, worldWidth, 0.0f, worldArea);
```

The click-and-throw interaction converts screen to world coordinates and passes the
drag vector as an initial velocity to `addBall()`.

## Extending it

**Send MIDI instead of audio.** Because the FIFO carries plain note data, you can
consume it anywhere. The sketch below is not part of the example and is untested.
Drain the FIFO from the message thread after `advance()`, then send with
`MidiOutput`:

```cpp
// Setup (Windows has no virtual devices, so use openDevice() there):
midiOut = juce::MidiOutput::createNewDevice ("Physics Music");

// After physics.advance():
NoteEvent e;
while (physics.popEvent (e))
{
    midiOut->sendMessageNow (juce::MidiMessage::noteOn (1, e.midiNote, e.velocity));
    // A note-off is still needed, so schedule one, for example with a Timer.
}
```

**Make it a plug-in.** Reuse `PhysicsMusicWorld` unchanged inside an
`AudioProcessor` (see [guide 08](08-plugin-basics.md)). Drain the FIFO in
`processBlock()` and add events to the `MidiBuffer` with a sample offset. Use the
host's tempo and transport to quantise events, if you want them in time.

**Ideas to explore:** hinges and motors (`b2RevoluteJoint`) to build a music box,
`Tumbler.h`'s rotating container as a generative sequencer, edge and chain shapes
for ramps, and collision filtering (`b2Filter`) so different ball colours only
trigger certain bodies.

## The bundled Box2D is old

**Why.** The module's own `README.txt` says JUCE took the upstream source, changed
include paths, guarded a couple of headers, and cleaned up compiler warnings. It has
been carried along since then. The repository does not record why it was never
updated, so the following is inference:

- Every upgrade means re-applying those local edits and re-checking every warning
  flag JUCE builds with, on every supported platform and compiler.
- Upstream changed its API between releases (the 2.4 series dropped the `float32`
  typedef, and version 3 is a rewrite in C with a different API). An upgrade would
  break user code, and JUCE's `BREAKING_CHANGES.md` is reserved for changes that earn
  it.
- Box2D is a peripheral module. One demo uses it, and JUCE's focus is audio, UI, and
  plug-in formats.

**What is missing.** The list below comes from memory of the upstream release
notes, so check them before relying on a specific version number.

Compared with Box2D 2.3 and 2.4:

- `b2MotorJoint`, which drives one body toward a target position or angle.
- Ghost vertices for chain and edge shapes, which prevent bodies snagging on the
  seams of terrain built from many edges.
- Bug fixes to the solver, continuous collision, and joints accumulated since 2011.
- Later API conveniences, such as shifting the world origin for large worlds.

Compared with Box2D 3.x:

- A multithreaded solver, and a much faster one for large piles of bodies.
- Event queues. Version 3 gives you begin, end, and *hit* events, with approach speed,
  after each step, and sensor events, instead of callbacks that fire inside `Step()`.
  Hit events with approach speed are close to what this guide builds by hand from
  `PostSolve`, and would make the threading simpler.
- Better determinism, including a stated goal of matching results across platforms.
  The bundled version gives no such guarantee, so a saved "performance" may not
  replay identically on another machine or compiler.

What no version of Box2D gives you, and which affects musical use:

- It is 2D and rigid-body only: no soft bodies or fluids, and no 3D.
- It simulates at control rate. It does not model the *sound* of anything. That is
  what the synth is for, and physical-modelling synthesis is a different discipline.
- Its numbers are in floats, and stepping must be fixed and off the audio thread.

**Alternatives.** All of these are permissively licensed, which is compatible with
JUCE. Compare the current licences yourself before shipping.

| Engine | Dimensions | Notes |
| ------ | ---------- | ----- |
| Box2D 3.x (upstream) | 2D | Same author. C API, multithreaded, event queues. Closest upgrade path. |
| Chipmunk2D | 2D | C, small, easy to embed. A long-standing alternative. |
| Bullet | 3D (and 2D-constrained) | Mature and widely used. Larger. |
| Jolt Physics | 3D | Modern C++ with multithreading, used in games. Larger. |
| PhysX | 3D | Very capable, large dependency. |

**Using a newer Box2D yourself.** [Guide 16](16-box2d-v3.md) does exactly this, and
[guide 17](17-modal-physics-audio.md) builds a richer audio engine on top of it. In short: fetch it with CMake (`FetchContent`) or add it as a
submodule, and link it to your target. Do not link the `juce_box2d` module at the same
time, because both define the same `b2...` symbols. Wrap the engine behind a small
class like `PhysicsMusicWorld`, whose only output is `NoteEvent`s, so that swapping the
engine changes one file. A plug-in that steps on its own thread must also decide how
many worker threads the engine may create. Keep them away from the audio thread.

## Build and run

With all the files in place, configure and build from the project folder:

```sh
cmake -B build
cmake --build build
```

The build puts the finished app in `build/Box2DMusic_artefacts/`. With CMake's default generator on each platform (Makefiles on macOS and Linux, and
Visual Studio on Windows, which adds the `Debug` folder):

| Platform | Run it with |
| -------- | ----------- |
| macOS    | `open "build/Box2DMusic_artefacts/Physics Music.app"` |
| Linux    | `./build/Box2DMusic_artefacts/Physics\ Music` |
| Windows  | `build\Box2DMusic_artefacts\Debug\Physics Music.exe` |

Xcode and Visual Studio are multi-config generators and add a configuration folder,
for example `build/Box2DMusic_artefacts/Debug/Physics Music.app`; build with
`cmake --build build --config Debug`. With Ninja there is no configuration folder, so
drop `Debug` from the Windows path.

On Linux you also need the packages in
[Linux Dependencies](../Linux%20Dependencies.md), including ALSA.

Controls: choose a scene and scale, set the root note, click to drop a ball or drag
and release to throw one, and adjust gravity, bounciness, and the auto-drop rate.

> **"The application cannot be opened because its executable is missing"?**
> CMake creates the empty `.app` bundle at the start of the build and only fills
> in the executable when compiling and linking succeed. If `cmake --build build`
> reported errors, fix them and build again, then re-run `open`. Check that the
> last lines of the build output say `Built target Box2DMusic`.

> **"use of undeclared identifier 'juce'"?** CMake projects have no
> `JuceHeader.h`, so every source file must include the module headers it uses.
> `MainComponent.h` includes them and `Main.cpp` includes `MainComponent.h`.
> Without those includes the compiler does not know what `juce::`, `std::`, or
> `START_JUCE_APPLICATION` mean.

## Checklist

- Build the world in metres, at a sensible scale.
- Step at a fixed timestep, never on the audio thread.
- Put musical meaning in `userData`, not in the physics.
- Use `PostSolve` for velocity and `BeginContact` for sensors.
- Threshold and debounce, or resting contacts will buzz.
- Pass plain structs through a lock-free FIFO.
- Create and destroy bodies only outside callbacks.
