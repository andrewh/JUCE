# Box2D v3 audio examples

Two standalone JUCE apps built on Box2D v3.1.1, which CMake downloads with
`FetchContent`. This folder is its own CMake project (it adds the JUCE checkout it lives
in), so ordinary JUCE builds never need network access.

| Target    | What it is | Guide |
| --------- | ---------- | ----- |
| `MusicV3` | The [Box2DMusic](../Box2DMusic) example ported to v3's hit and sensor events | [16](../../docs/tutorials/16-box2d-v3.md) |
| `Modal`   | Objects made of wood, glass, metal and stone that ring through modal synthesis, with rolling and scraping noise | [17](../../docs/tutorials/17-modal-physics-audio.md) |

    cmake -S examples/Box2DAudioV3 -B build-box2d-v3
    cmake --build build-box2d-v3 --target MusicV3
    cmake --build build-box2d-v3 --target Modal

Click to drop an object, or drag and release to throw one.

| Path | Role |
| ---- | ---- |
| `common/Scales.h` | Scales and degree-to-MIDI mapping (shared) |
| `MusicV3/` | v3 port of the physics-music app |
| `Modal/ModalTypes.h` | Materials, `StrikeEvent`, `RollSlot` |
| `Modal/ModalEngine.h` | Resonator bank, strike and roll voices, reverb and limiter (audio thread) |
| `Modal/PhysicsWorld.*` | The Box2D world, hit events, rolling detection (message thread) |
