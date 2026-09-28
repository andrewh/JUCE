# History

**JUCE began in the early 2000s as the in-house toolkit behind the Tracktion DAW, became a public framework, changed owners twice, and grew from one monolithic library into today's 24 modules.** Knowing this history explains many of its quirks: its own `String` and containers, its Projucer, and its naming conventions.

::: info Sources
Version features and module arrival dates on this page come from this repository's `CHANGE_LIST.md`, `BREAKING_CHANGES.md`, and git history. Company events and years before the git history are summarised from public announcements and are approximate. Check juce.com for anything you need to cite.
:::

## Timeline

<ol class="timeline">
  <li class="tl-raw"><span class="tl-when">Early 2000s</span><strong>Tracktion</strong><span class="tl-what">Julian Storer writes the Tracktion DAW and the cross-platform C++ toolkit underneath it.</span></li>
  <li class="tl-raw"><span class="tl-when">Mid 2000s</span><strong>Public release</strong><span class="tl-what">The toolkit is released as JUCE, "Jules' Utility Class Extensions", under GPL or a commercial licence.</span></li>
  <li class="tl-raw"><span class="tl-when">Early 2010s</span><strong>Modules</strong><span class="tl-what">JUCE 2 and 3 introduce the module format and the Introjucer project tool.</span></li>
  <li class="tl-roli"><span class="tl-when">2014</span><strong>ROLI</strong><span class="tl-what">ROLI acquires JUCE.</span></li>
  <li class="tl-roli"><span class="tl-when">2015–16</span><strong>JUCE 4</strong><span class="tl-what">The Projucer arrives (merged with the Introjucer in 4.2), plus OSC support and multi-bus plug-ins.</span></li>
  <li class="tl-roli"><span class="tl-when">2017</span><strong>JUCE 5</strong><span class="tl-what">A new licensing model and C++11/14 modernisation. 5.1 adds <code>juce_dsp</code>.</span></li>
  <li class="tl-pace"><span class="tl-when">2020</span><strong>PACE, JUCE 6</strong><span class="tl-what">PACE Anti-Piracy acquires JUCE. JUCE 6 adds the CMake API and headless Linux.</span></li>
  <li class="tl-pace"><span class="tl-when">2022</span><strong>JUCE 7</strong><span class="tl-what">LV2 and ARA support and new Apple renderers. MIDI-CI followed in 7.0.9.</span></li>
  <li class="tl-pace"><span class="tl-when">2024</span><strong>JUCE 8</strong><span class="tl-what">Direct2D, WebView UIs, <code>juce_animation</code>, and the move to AGPLv3.</span></li>
  <li class="tl-pace"><span class="tl-when">2026</span><strong>JUCE 9</strong><span class="tl-what">A new SVG parser, variable fonts, a new CoreAudio backend, and OpenGL ES on Linux.</span></li>
</ol>

<p class="tl-legend"><span class="tl-raw">Raw Material Software</span><span class="tl-roli">ROLI</span><span class="tl-pace">PACE</span></p>

## Eras

### Origins: a toolkit extracted from a DAW

Julian Storer ("Jules") built JUCE while developing **Tracktion**, a digital audio workstation first released in the early 2000s by his company, Raw Material Software. He needed audio, GUI, and plug-in support that worked identically on Windows and macOS. He wrote his own because nothing suitable existed.

That origin still shows:

- **Self-sufficiency.** JUCE has its own `String`, `Array`, `File`, `Thread`, and smart pointers. It dates from before C++11 made the standard library a reasonable foundation for this kind of code.
- **Pragmatism over purity.** The APIs were shaped by what a real DAW needed, including `AudioProcessorGraph`, `AudioThumbnail`, and plug-in scanning.
- **The name.** *Jules' Utility Class Extensions.*

JUCE was released publicly under a dual model: open source (GPL) or a paid commercial licence for closed-source products. That model, in updated form, is still how JUCE is licensed.

### Modularisation and the Introjucer

Early JUCE was one large library. Around JUCE 2 it was split into **modules**, each with a machine-readable declaration block. That allowed a tool to assemble projects from them: the **Introjucer**, which generated IDE projects for each platform. The same module format, simplified in JUCE 4.2, is still used today (see [Build systems](./build-systems)).

### The ROLI years (2014–2020)

The music-technology company **ROLI** acquired JUCE in 2014 and invested in the team, documentation, and community. Its annual JUCE Summit grew into the **Audio Developer Conference (ADC)**. Highlights from the change list:

- **JUCE 4**: the **Projucer** arrived. Its live C++ compilation engine was initially closed source. In 4.2 it was merged with the Introjucer into a single open-source app. Also OSC (`juce_osc`, 4.0.1) and multi-bus plug-ins (4.1).
- **JUCE 5**: a new licensing model, the standalone plug-in format, and a codebase modernised to C++11/14. **`juce_dsp`** was released in 5.1.0, **`juce_analytics`** arrived in 5.2.0, and an in-app purchases module in 5.1.2.

### The PACE years (2020–present)

**PACE Anti-Piracy**, known for iLok and AAX signing, acquired JUCE in 2020. Releases since then focus on modern build tooling, rendering, and standards:

- **JUCE 6 (2020)**: the **CMake API**, headless Linux support, VST3 on Linux, a revamped DSP module, and removal of the Projucer's sign-in requirement and analytics.
- **JUCE 7 (2022)**: **ARA** (Audio Random Access) support, **LV2** authoring and hosting, new macOS and iOS renderers, a reworked `AudioPlayHead`, and better accessibility. **MIDI-CI** support (`juce_midi_ci`) followed in 7.0.9.
- **JUCE 8 (2024)**: a **Direct2D** renderer on Windows, **WebView-based UIs**, consistent Unicode text handling, the **`juce_animation`** module, and the AAX SDK bundled. The open-source licence moved from GPLv3 to **AGPLv3**. JavaScript support moved into its own **`juce_javascript`** module in 8.0.4. **`juce_audio_processors_headless`** split the GUI-free half of plug-in support out of `juce_audio_processors` in 8.0.11. That release also moved to the MIT-licensed VST3 SDK 3.8.0.
- **JUCE 9 (July 2026)**: a new SVG parser, variable fonts, a new macOS CoreAudio implementation, a faster software renderer, OpenGL ES on Linux, better multi-touch, and a CMake build that works better in headless environments. Point releases have added Opus and WebP support, enabled `MP3AudioFormat` by default, and published a TypeScript npm package for WebView integration.

## Recent release cadence

From this fork's git history:

| Version | Date |
| --- | --- |
| 9.0.3 | 2026-09-28 |
| 9.0.2 | 2026-09-07 |
| 9.0.1 | 2026-08-10 |
| 9.0.0 | 2026-07-21 |
| 8.0.15 | 2026-07-21 |
| 8.0.14 | 2026-06-22 |
| 8.0.13 | 2026-05-19 |
| 8.0.12 | 2025-12-16 |

## When each module arrived

Reconstructed from `CHANGE_LIST.md`. Modules without an entry predate the change list's detail, or arrived without a headline mention.

| Module | First mentioned |
| --- | --- |
| `juce_osc` | 4.0.1 ("Full OSC support!") |
| `juce_dsp` | 5.1.0 |
| In-app purchases (now part of `juce_product_unlocking`) | 5.1.2 |
| `juce_analytics` | 5.2.0 |
| `juce_midi_ci` | 7.0.9 |
| `juce_animation` | 8.0.0 |
| `juce_javascript` | 8.0.4 (split out of `juce_core`) |
| `juce_audio_processors_headless` | 8.0.11 (split out of `juce_audio_processors`) |

## Why history matters when you read code

- **Old tutorials use old APIs.** Before trusting a forum post, check [`BREAKING_CHANGES.md`](https://github.com/andrewh/JUCE/blob/master/BREAKING_CHANGES.md) for the versions in between. It lists every breaking change with a workaround.
- **Look-and-feel versions** (`LookAndFeel_V1` to `V4`) are fossils of past visual styles, kept for compatibility.
- **Parallel APIs** often coexist, such as `ScopedPointer` (gone) and `std::unique_ptr`, or listener interfaces and `std::function` callbacks (`onClick`). The newer one is usually preferred.
