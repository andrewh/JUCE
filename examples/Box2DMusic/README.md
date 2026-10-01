# Physics Music

A standalone JUCE app that turns Box2D collisions into notes. Balls fall through
one of three scenes (tuned bars, tuned pegs, or sensor zones), and each hit plays a
marimba-like note whose velocity comes from the collision impulse.

The walkthrough is [docs/tutorials/15-physics-music.md](../../docs/tutorials/15-physics-music.md).

| File | Role |
| ---- | ---- |
| `PhysicsMusicWorld.h/.cpp` | Box2D world, contact listener, lock-free FIFO of `NoteEvent`s, drawing |
| `PluckSynth.h` | 32-voice synthesiser, audio thread only |
| `Scales.h` | Scales and degree-to-MIDI mapping |
| `MainComponent.h/.cpp` | UI, 120 Hz timer that steps the world, audio callback |
| `Main.cpp` | Application boilerplate |

Build from the JUCE root:

    cmake . -B cmake-build -DJUCE_BUILD_EXAMPLES=ON
    cmake --build cmake-build --target Box2DMusic

Click to drop a ball, or drag and release to throw one.
