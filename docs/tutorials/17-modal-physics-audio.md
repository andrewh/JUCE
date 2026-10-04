# A physical audio engine: modal synthesis driven by physics

Make objects that sound like what they are made of. Physics decides *when*, *how hard*,
and *by what* an object is hit or rolled, and a modal synthesiser turns that into
sound. The finished app is [`examples/Box2DAudioV3`](../../examples/Box2DAudioV3),
target `Modal`.

**Level:** Advanced  
**Prerequisites:** [Physics as a musical instrument](15-physics-music.md) for the
threading design, and [Integrating Box2D v3](16-box2d-v3.md) for the API used here.

Guides 15 and 16 turn each collision into a *note*: one sine-ish voice with a pitch
from a lookup. That is a trigger, and it always sounds like a marimba. This guide
builds something closer to a physical instrument:

- Every object has a **material** with its own set of vibration modes.
- **Both** objects in a collision ring, each at its own pitch.
- **Pitch comes from size**, optionally snapped to a scale.
- The **brightness of a hit** comes from the physics of the contact.
- **Rolling and sliding** make continuous sound, not just discrete events.
- Voices are managed, the output is spatialised and limited, and none of it
  allocates on the audio thread.

## Set up the project

This guide builds on [Integrating Box2D v3](16-box2d-v3.md), and uses the same project. Start from the finished apps and read the steps below as a tour of how the `Modal` app works.

Copy the `Box2DAudioV3` example out of your JUCE checkout into a new folder, so that
you can edit it freely:

```sh
cp -r /path/to/JUCE/examples/Box2DAudioV3 Box2DAudio
```

```text
Box2DAudio/
├── CMakeLists.txt     # adds JUCE, fetches Box2D v3, defines both apps
├── common/            # Scales.h, shared by both apps
├── MusicV3/           # target MusicV3: guide 15's app ported to Box2D v3
└── Modal/             # target Modal: the modal-synthesis app of guide 17
```

The `CMakeLists.txt` finds JUCE two folders above itself by default, which is wrong
for the copy, so tell it where JUCE is when you configure (see
[Build and run](#build-and-run)). Its key parts are the `FetchContent` call that
downloads Box2D v3 the first time you configure, and the `box2d` library it links:

```cmake
project(BOX2D_AUDIO_V3 VERSION 1.0.0 LANGUAGES C CXX)

set(BOX2D_AUDIO_JUCE_DIR "${CMAKE_CURRENT_LIST_DIR}/../.." CACHE PATH "Path to the JUCE repository")
add_subdirectory("${BOX2D_AUDIO_JUCE_DIR}" JUCE)

include(FetchContent)
FetchContent_Declare(box2d
    GIT_REPOSITORY https://github.com/erincatto/box2d.git
    GIT_TAG        v3.1.1
    GIT_SHALLOW    TRUE)
FetchContent_MakeAvailable(box2d)
```

Configuring needs network access the first time, because of that download.

## The architecture

```
message thread                                  audio thread
-----------------                               ----------------------------
Box2D v3 world                                  ModalEngine
  hit events  -> StrikeEvent ---- FIFO -------> strike voices (48)
  contact data -> RollSlot ------ atomics ----> roll voices (one per slot)
                                                  |
                                                  +--> sum -> reverb -> tanh -> out
```

There are **two kinds of signal** between the threads, and they need different
channels:

| Signal               | Nature                    | Channel                                  |
| -------------------- | ------------------------- | ---------------------------------------- |
| An impact            | Discrete, must not be lost | `AbstractFifo` of `StrikeEvent`s         |
| Rolling and scraping | Continuous, latest value wins | `std::atomic` fields in a `RollSlot` array |

A FIFO is right for events because every one matters. It is wrong for a continuous
value: the audio thread only wants the *current* level, and a queue of stale ones adds
latency. An atomic per parameter gives the newest value, costs nothing, and cannot
block. The fields are independent and a value one block old is harmless, so
`std::memory_order_relaxed` is enough.

## Step 1: what a material is

Modal synthesis models an object as a sum of vibration modes. Each mode is a damped
sinusoid with its own frequency and decay time. A material is then a table:

```cpp
struct Material
{
    const char* name;
    int numModes;
    std::array<float, 8> ratios;   // mode frequencies as multiples of the fundamental
    float decaySeconds;            // decay time constant of the fundamental
    float decayTilt;               // higher modes die faster
    float contactMs;               // reference contact duration: soft materials are longer
    float baseFrequency;           // fundamental in Hz for an object of reference size
    float density, friction, restitution;
    juce::uint32 colour;
};
```

The example has four:

| Material | Mode ratios                              | Decay   | Character |
| -------- | ---------------------------------------- | ------- | --------- |
| Wood     | 1, 2.76, 5.40, 8.93, 13.34, 18.64 (a free bar) | short   | Marimba-like |
| Glass    | 1, 2.32, 4.25, 6.63, 9.38                | medium  | Bright ring |
| Metal    | 0.5, 1, 1.19, 1.56, 2, 2.51 (bell partials) | long    | Bell |
| Stone    | 1, 1.83, 3.07, 4.6                       | very short | A dull tock |

These values are plausible approximations, not measurements. The mode ratios of real
objects depend on shape and boundary conditions, and the decay times you like will
depend on your ears. The `Material` table is the part to experiment with.

The same table feeds Box2D: density, friction, and restitution go into each
`b2ShapeDef`, so a stone ball really is heavier and bounces less than a glass one.

Damping is frequency-dependent. Real objects lose their high modes first, so each
mode's time constant is

```
tau_k = tau_0 / (1 + tilt * (ratio_k - 1))
```

## Step 2: the resonator bank

A damped sinusoid can be produced by a two-pole resonator:

```
y[n] = a1 * y[n-1] + a2 * y[n-2] + in * x[n]
a1 = 2 r cos(theta)    a2 = -r^2
r = exp(-1 / (fs * tau))    theta = 2 pi f / fs
```

Its impulse response is a decaying sinusoid, so feeding it an impulse *is* striking the
mode. Multiply the input by `sin(theta)` to make the impulse response unit amplitude.
It costs two multiplies and an add per mode per sample, with no `sin()` call and no
allocation. (`ModalBank` in `ModalEngine.h`)

```cpp
void configure (const Material& m, float f0, float sampleRate, float decayScale)
{
    for (int k = 0; k < numModes; ++k)
    {
        const auto ratio = m.ratios[(size_t) k];
        const auto tau   = jmax (0.002f, decayScale * m.decaySeconds / (1.0f + m.decayTilt * (ratio - 1.0f)));
        const auto r     = std::exp (-1.0f / (sampleRate * tau));
        const auto theta = twoPi * f0 * ratio / sampleRate;

        a1[k] = 2.0f * r * std::cos (theta);
        a2[k] = -r * r;
        in[k] = std::sin (theta) * weights[k] / totalWeight;
    }
}

float process (float x) noexcept
{
    float out = 0.0f;
    for (int k = 0; k < numModes; ++k)
    {
        const auto y = a1[k] * y1[k] + a2[k] * y2[k] + in[k] * x;
        y2[k] = y1[k];
        y1[k] = y;
        out += y;
    }
    return out;
}
```

Modes above 0.45 of the sample rate are dropped when configuring, so they do not alias.
The same bank works for both kinds of excitation below.

## Step 3: the strike, and why the contact matters

Feeding one sample of value 1 into the bank rings every mode equally, which sounds
harsh and identical for every hit. A real contact is not an impulse: it lasts a
fraction of a millisecond to several milliseconds, and its duration filters the
spectrum. A long contact excites only the low modes, and a short one excites all of
them. That is the difference between a soft and a hard mallet.

`ModalEngine::strike()` therefore excites the bank with a **half-sine force pulse**,
whose length is `contactMs`:

```cpp
v.pulseLength = jmax (2, (int) (e.contactMs * 0.001f * sampleRate));
v.pulseGain   = 1.2f * e.amplitude * pi / (2.0f * (float) v.pulseLength);
// ...per sample:
x = v.pulseGain * std::sin (pi * ((float) v.pulsePosition + 0.5f) / (float) v.pulseLength);
```

The `pi / (2 L)` factor makes the pulse's area constant, so the loudness depends on the
hit and not on the pulse length. Only the *brightness* changes.

The physics side chooses `contactMs`. Hertzian contact theory gives a contact time
that falls slowly with impact speed (as speed to the power -0.2) and grows with the size
of the bodies. Both materials take part:

```cpp
e.contactMs = 0.5f * (m.contactMs + getMaterial (other.material).contactMs)
                * std::pow (jmax (0.5f, speed) / 4.0f, -0.2f)
                * std::pow (struck.size / 0.3f, 0.4f);
```

So a hard hit is brighter, and a big object is duller. A wooden ball on a glass ramp
sounds different from a metal ball on the same ramp, because the contact duration
differs, even though the ramp's modes are identical.

**Loudness** is `(approachSpeed / 12)^1.3`, clamped to 1. The exponent above 1 gives
soft hits more room, so a quiet scene stays quiet.

## Step 4: both objects ring

Each hit event names two shapes. The example makes a `StrikeEvent` for **each** body:

```cpp
pushStrike (*a, *b, hit.approachSpeed, hit.point.x);
pushStrike (*b, *a, hit.approachSpeed, hit.point.x);
```

A ball falling onto a ramp plays the ball *and* the ramp, at their own pitches and with
their own decays. The floor and walls are stone objects, so they add a low thud. This
one change makes the scene sound like a set of physical objects rather than a set of
triggers.

## Step 5: pitch from size

Bigger objects ring lower. A real bar's fundamental goes as 1 / length². The example
uses a gentler square-root law, so a wide range of sizes stays in a usable register:

```cpp
const auto frequency = jlimit (40.0f, 3000.0f,
                               getMaterial (info.material).baseFrequency * std::sqrt (0.3f / info.size));
```

`Snap to scale` then moves that frequency to the nearest note of the current scale,
using the same `Scale` tables as the earlier guides:

```cpp
const auto midi = 69.0f + 12.0f * std::log2 (frequency / 440.0f);
// search +-7 semitones for the nearest pitch class that is in the scale...
```

Turn snapping off to hear the raw physical pitches, which are usually not in tune with
each other. The xylophone bars along the floor bypass the size law: each has a `degree`
that pins it to a scale note, as in guide 15.

## Step 6: rolling and sliding

An impact is a moment. Rolling and scraping are *states*: while a ball rolls down a
ramp, the ramp rumbles, quieter when slow and louder when fast. Modelling that needs
the contact data every frame, not events.

Once per frame, for each dynamic body, the physics side asks Box2D for its touching
contacts and computes how fast the body is travelling over the surface it touches,
along the surface:

```cpp
std::array<b2ContactData, 4> contacts;
const auto numContacts = b2Body_GetContactData (entry.body, contacts.data(), (int) contacts.size());

// for each contact that is really pressing (totalNormalImpulse > 0):
const auto relative = velocity - b2Body_GetWorldPointVelocity (otherBody, point);
const b2Vec2 tangent { -manifold.normal.y, manifold.normal.x };
const auto groundSpeed = std::abs (b2Dot (relative, tangent));
const auto level = std::pow (jmin (1.0f, groundSpeed / 8.0f), 1.3f);
```

Contacts that are only *speculative* (close but not touching) have zero impulse and
are ignored. The speed uses the body's centre, so a ball that rolls without slipping
still counts, even though its contact point is momentarily at rest.

The result goes into a `RollSlot`. The **surface** decides the timbre, not the ball,
because the surface is what resonates:

```cpp
slot.material = surface->material;
slot.f0       = getFundamental (*surface);
slot.pan      = jlimit (0.0f, 1.0f, surfaceX / worldWidth);
slot.level    = bestLevel;
```

On the audio thread, each active slot drives its own resonator bank with **noise**:

```cpp
v.level += (target - v.level) * rollSmoothing;                       // 15 ms smoothing
const auto s = v.bank.process (v.nextNoise() * v.level * rollGain);
```

Two details make this sound like a rumble and not like a whistle:

- The bank is configured with `decayScale = 0.06`, so the modes are broad. Noise into
  a narrow resonator sounds like a pitched hiss, and into a broad one like a resonant
  scrape.
- When the material or pitch changes, the coefficients are recomputed but the
  **filter state is kept**, so there is no click. The level is smoothed for the same
  reason.

Idle slots (`level` near zero and no tail) are skipped with a single comparison.

## Step 7: voices, spatialisation, and output

- **Voice stealing.** 48 strike voices. When all are busy, the one with the lowest
  envelope estimate is replaced. The estimate multiplies the strike amplitude by the
  slowest mode's pole radius each sample, so no `abs()` or peak tracking is needed.
- **Spatialisation.** Each event carries `pan = x / worldWidth`, applied with a
  constant-power law. Sounds in the world appear where they happen.
- **Reverb.** `juce::Reverb` on the summed output gives the objects a room to sit in,
  with a wet/dry control that the audio thread applies when it sees the atomic change.
- **Limiter.** Everything ends in `tanh`. With many objects, sums exceed 1, and a soft
  clip degrades gracefully where a hard one crackles.

Parameter changes from the UI (reverb mix, master gain) are `std::atomic<float>`s read
at the start of each block. Never call a `Slider` or a JUCE component method from the
audio thread.

## Calibrating levels

Physical models have no natural output scale, so measure. The development test
rendered the engine offline and compared peaks and RMS values:

- An isolated full-velocity strike at 300 Hz peaked at about 0.14 (stone), 0.17 (wood),
  0.45 (glass), and 0.63 (metal), because metal's short contact excites more of its
  modes.
- Full-level rolling noise had an RMS of about 0.07, well under the strikes.
- A busy scene of about 36 objects gave an RMS of about 0.22, with a peak of about 0.9
  after the limiter.

The engine constants (`1.2` for strike gain, `0.035` for `rollGain`) came from that
process. If you change the materials, change these too. Then listen.

## Extending it

- **More physics inputs.** Angular velocity for a spinning-coin buzz, joints for a wind
  chime (a pendulum striking a chime), or `b2World_CastRay` for a beam that damps a
  string.
- **More materials.** Add rows to the table. Sampled modal data from a real object
  (an FFT of a recorded hit gives peak frequencies and decays) is a good source.
- **Per-object variation.** Randomise each mode's frequency by a fraction of a percent
  so that two objects of the same material and size are not identical.
- **Damping on touch.** Hold a finger on a chime and it stops ringing. In this design,
  a contact with a "damper" body could multiply that object's voice envelope.
- **Non-linear effects.** Real bells shift pitch with hit strength. Scale `f0` by a
  small function of amplitude in `strike()`.
- **A plug-in.** `ModalEngine` has no GUI dependencies. Run it inside an
  `AudioProcessor`'s `processBlock()`, with `PhysicsWorld` on a timer.

## Limits of this approach

- It is a *model of the idea* of modal synthesis, not a physical simulation of vibrating
  solids. Real objects couple their modes to their shape, and the same object rings
  differently where it is struck. Here every strike of an object excites the same
  mix of modes.
- The physics runs at control rate (120 Hz here). Events are placed at the start of the
  next audio block, so timing has a few milliseconds of jitter. See guide 15.
- Continuous contact sounds are driven by speed only. Real rolling depends on surface
  roughness and on the ball's rotation. A "roughness" property per material would
  be the next step.
- The pitch law and the mode tables are hand-picked. For accurate results, derive them
  from measurements.

## Build and run

Configure from the `Box2DAudio` folder, giving it your JUCE checkout, then build the
`Modal` target:

```sh
cmake -B build -DBOX2D_AUDIO_JUCE_DIR=/path/to/JUCE
cmake --build build --target Modal
```

Run the app (`cmake --build` puts it in `build/Modal_artefacts/`):

| Platform | Run it with |
| -------- | ----------- |
| macOS    | `open "build/Modal_artefacts/Modal Physics.app"` |
| Linux    | `./build/Modal_artefacts/Modal\ Physics` |
| Windows  | `build\\Modal_artefacts\\Debug\\Modal Physics.exe` |

On Windows, the default Visual Studio generator adds the `Debug` folder (add
`--config Debug` to the build command). Makefile and Ninja builds have no such folder.

If you have already downloaded Box2D, avoid the network fetch with
`-DFETCHCONTENT_SOURCE_DIR_BOX2D=/path/to/box2d`. On Linux you also need the
packages in [Linux Dependencies](../Linux%20Dependencies.md), including ALSA.

> **"The application cannot be opened because its executable is missing"?**
> CMake creates the empty `.app` bundle at the start of the build and only fills
> in the executable when compiling and linking succeed. If `cmake --build` reported
> errors, fix them and build again. Check that the last lines of the output say
> `Built target Modal`.

## Checklist

- Send discrete events through a FIFO, and continuous values through atomics.
- Excite modes with a short pulse whose length comes from the physics, not an impulse.
- Let both bodies in a collision ring.
- Let the surface, not the moving object, decide the timbre of rolling.
- Keep filter state when retuning, and smooth every level.
- Measure output levels offline before tuning by ear.
