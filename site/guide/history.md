# History

**JUCE began in the early 2000s as the in-house toolkit behind the Tracktion DAW, became a public framework, changed owners twice, and grew from one monolithic library into today's 24 modules.** This history explains many of its quirks: its own `String` and containers, its Projucer, and its naming conventions.

::: info Sources
Numbered footnotes link each claim to its source. Version features and module arrival dates come from this repository's `CHANGE_LIST.md` and git history. Company events cite public write-ups. Release years for JUCE 4 to 8 are approximate, because this fork's git history only starts in January 2025 and `CHANGE_LIST.md` records versions rather than dates. Where a claim could not be sourced, the page says so.
:::

## Timeline

<ol class="timeline">
  <li class="tl-raw"><span class="tl-when">Before 2004</span><strong>Tracktion</strong><span class="tl-what">Julian Storer writes the Tracktion DAW and the cross-platform C++ toolkit underneath it.</span></li>
  <li class="tl-raw"><span class="tl-when">2004</span><strong>Public release</strong><span class="tl-what">The toolkit is released publicly as JUCE, "Jules' Utility Class Extensions".</span></li>
  <li class="tl-raw"><span class="tl-when">By JUCE 3.x</span><strong>Introjucer</strong><span class="tl-what">The Introjucer project tool is already in use; the 3.x change list mentions it.</span></li>
  <li class="tl-roli"><span class="tl-when">Nov 2014</span><strong>ROLI</strong><span class="tl-what">ROLI acquires JUCE and Raw Material Software.</span></li>
  <li class="tl-roli"><span class="tl-when">2015–16</span><strong>JUCE 4</strong><span class="tl-what">The Projucer arrives (merged with the Introjucer in 4.2), plus OSC support and multi-bus plug-ins.</span></li>
  <li class="tl-roli"><span class="tl-when">2017</span><strong>JUCE 5</strong><span class="tl-what">A new licensing model and C++11/14 modernisation. 5.1 adds <code>juce_dsp</code>.</span></li>
  <li class="tl-pace"><span class="tl-when">2020</span><strong>PACE, JUCE 6</strong><span class="tl-what">PACE Anti-Piracy acquires JUCE (announced April 2020). JUCE 6 adds the CMake API and headless Linux.</span></li>
  <li class="tl-pace"><span class="tl-when">2022</span><strong>JUCE 7</strong><span class="tl-what">LV2 and ARA support and new Apple renderers. MIDI-CI followed in 7.0.9.</span></li>
  <li class="tl-pace"><span class="tl-when">2024</span><strong>JUCE 8</strong><span class="tl-what">Direct2D, WebView UIs, <code>juce_animation</code>, and the move to AGPLv3.</span></li>
  <li class="tl-pace"><span class="tl-when">2026</span><strong>JUCE 9</strong><span class="tl-what">A new SVG parser, variable fonts, a new CoreAudio backend, and OpenGL ES on Linux.</span></li>
</ol>

<p class="tl-legend"><span class="tl-raw">Raw Material Software</span><span class="tl-roli">ROLI</span><span class="tl-pace">PACE</span></p>

## Eras

### Origins: a toolkit extracted from a DAW

Julian Storer ("Jules") created JUCE as the underlying C++ code of the **Tracktion** digital audio workstation, and JUCE was first released to the public in 2004.[^wiki] Raw Material Software was the company behind it.[^roli] The motivation below is inferred from the code's shape rather than from a source: a DAW needed audio, GUI, and plug-in support that behaved the same on every platform.

That origin still shows:

- **Self-sufficiency.** JUCE has its own `String`, `Array`, `File`, `Thread`, and smart pointers. It dates from before C++11 made the standard library a reasonable foundation for this kind of code.
- **Pragmatism over purity.** The APIs were shaped by what a real DAW needed, including `AudioProcessorGraph`, `AudioThumbnail`, and plug-in scanning.
- **The name.** *Jules' Utility Class Extensions.*[^wiki]

Today JUCE is dual-licensed: AGPLv3 or a commercial licence.[^licence] This page does not claim what the licence was at the 2004 release, because no source for that was found.

### Modularisation and the Introjucer

JUCE is organised into **modules**, each with a machine-readable declaration block. That lets a tool assemble projects from them: the **Introjucer**, which generated IDE projects. `CHANGE_LIST.md` mentions the Introjucer as early as version 3.3.0.[^cl3] The module format was simplified in JUCE 4.2, when the JSON module definition files were removed, and it is still used today (see [Build systems](./build-systems)).[^cl42] This repository does not record which release first introduced modules, so this page does not say.

### The ROLI years (2014–2020)

The music-technology company **ROLI** acquired JUCE and Raw Material Software in November 2014.[^roli] The change list records ROLI-era work such as an API and examples for ROLI Blocks in 4.3.0.[^cl43] Highlights from the change list:

- **JUCE 4**: the **Projucer** arrived as "Initial release of the Projucer!" in 4.0.1.[^cl401] Its live C++ compilation engine was initially closed source. In 4.2 it was merged with the Introjucer into a single open-source app.[^cl42] Also OSC (`juce_osc`, 4.0.1) and multi-bus support for plug-in clients (4.1).[^cl401][^cl41]
- **JUCE 5**: a new licensing model, the standalone plug-in format, and a codebase modernised to C++11/14.[^cl5] **`juce_dsp`** was released in 5.1.0, **`juce_analytics`** arrived in 5.2.0, and an in-app purchases module in 5.1.2.[^mods]

### The PACE years (2020–present)

**PACE Anti-Piracy**, known for iLok and AAX signing,[^pace] acquired JUCE from ROLI, announced in April 2020.[^roli] Releases since then focus on modern build tooling, rendering, and standards:

- **JUCE 6 (2020)**: the **CMake API**, headless Linux support, VST3 on Linux, a revamped DSP module, and removal of the Projucer's sign-in requirement and analytics.[^cl6]
- **JUCE 7 (2022)**: **ARA** (Audio Random Access) support, **LV2** authoring and hosting, new macOS and iOS renderers, a reworked `AudioPlayHead`, and better accessibility.[^cl7] **MIDI-CI** support (`juce_midi_ci`) followed in 7.0.9.[^mods]
- **JUCE 8 (2024)**: a **Direct2D** renderer on Windows, **WebView-based UIs**, consistent Unicode text handling, the **`juce_animation`** module, and the AAX SDK bundled.[^cl8] The open-source licence moved from GPLv3 to **AGPLv3**: the `LICENSE.md` at tag 7.0.12 describes GPLv3, and the one at 8.0.0 says the modules are dual-licensed under AGPLv3.[^agpl] JavaScript support moved into its own **`juce_javascript`** module in 8.0.4. **`juce_audio_processors_headless`** split the GUI-free half of plug-in support out of `juce_audio_processors` in 8.0.11. That release also moved to the MIT-licensed VST3 SDK 3.8.0.[^mods]
- **JUCE 9 (July 2026)**: a new SVG parser, variable fonts, a new macOS CoreAudio implementation, a faster software renderer, OpenGL ES on Linux, better multi-touch, and a CMake build that works better in headless environments. Point releases have added Opus and WebP support, enabled `MP3AudioFormat` by default, and published a TypeScript npm package for WebView integration.[^cl9]

## Recent release cadence

From this fork's git history (commits titled "JUCE version x.y.z"):[^git]

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

Reconstructed from `CHANGE_LIST.md`.[^mods] Modules without an entry predate the change list's detail, or arrived without a headline mention.

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

- **Old tutorials use old APIs.** Before trusting a forum post, check [`BREAKING_CHANGES.md`](https://github.com/juce-framework/JUCE/blob/master/BREAKING_CHANGES.md) for the versions in between. It lists breaking changes per release with a workaround.
- **Look-and-feel versions** (`LookAndFeel_V1` to `V4`) are fossils of past visual styles, kept for compatibility.
- **Parallel APIs** often coexist, such as `ScopedPointer` (gone) and `std::unique_ptr`, or listener interfaces and `std::function` callbacks (`onClick`). The newer one is usually preferred.

## Sources

[^wiki]: [JUCE, Wikipedia](https://en.wikipedia.org/wiki/JUCE): name "Jules' Utility Class Extensions"; first released to the public in 2004; created from the code underneath the Tracktion DAW. Retrieved 2026-09-29; Wikipedia was opened, MusicRadar and Synthtopia were read as search-result summaries.
[^roli]: ROLI acquisition in November 2014 and sale to PACE in April 2020: [JUCE, Wikipedia](https://en.wikipedia.org/wiki/JUCE); [PACE acquires JUCE from ROLI, MusicRadar](https://www.musicradar.com/news/ilok-developer-pace-acquires-the-juce-development-framework-from-roli); [PACE Acquires JUCE, Synthtopia](https://www.synthtopia.com/content/2020/04/22/pace-acquires-juce-audio-development-platform-from-roli/). Retrieved 2026-09-29; Wikipedia was opened, MusicRadar and Synthtopia were read as search-result summaries.
[^pace]: iLok: [MusicRadar headline, "iLok developer Pace acquires the JUCE development framework from ROLI"](https://www.musicradar.com/news/ilok-developer-pace-acquires-the-juce-development-framework-from-roli). AAX signing: [`README.md`, "AAX Plug-Ins"](https://github.com/juce-framework/JUCE/blob/master/README.md#aax-plug-ins).
[^licence]: [`LICENSE.md`](https://github.com/juce-framework/JUCE/blob/master/LICENSE.md): "dual-licensed under the AGPLv3 and the commercial JUCE licence".
[^agpl]: `LICENSE.md` at [tag 7.0.12](https://raw.githubusercontent.com/juce-framework/JUCE/7.0.12/LICENSE.md) and [tag 8.0.0](https://raw.githubusercontent.com/juce-framework/JUCE/8.0.0/LICENSE.md) in the upstream repository.
[^cl3]: [`CHANGE_LIST.md`, Version 3.3.0](https://github.com/juce-framework/JUCE/blob/master/CHANGE_LIST.md): "New command-line options in the introjucer".
[^cl401]: `CHANGE_LIST.md`, Version 4.0.1: "Initial release of the Projucer!" and "Full OSC support!".
[^cl41]: `CHANGE_LIST.md`, Version 4.1: "Added multi-bus support for audio plug-in clients".
[^cl42]: `CHANGE_LIST.md`, Version 4.2: simplified module format, Introjucer deleted and unified with the Projucer.
[^cl43]: `CHANGE_LIST.md`, Version 4.3.0: "Added API and examples for ROLI Blocks".
[^cl5]: `CHANGE_LIST.md`, Version 5.0.0.
[^cl6]: `CHANGE_LIST.md`, Version 6.0.0.
[^cl7]: `CHANGE_LIST.md`, Version 7.0.0.
[^cl8]: `CHANGE_LIST.md`, Version 8.0.0.
[^cl9]: `CHANGE_LIST.md`, Versions 9.0.0 to 9.0.3.
[^mods]: `CHANGE_LIST.md`, Versions 5.1.0, 5.1.2, 5.2.0, 7.0.9, 8.0.0, 8.0.4 and 8.0.11.
[^git]: `git log` of this repository, commits "JUCE version 8.0.12" to "JUCE version 9.0.3". The history starts in January 2025, so earlier release dates are not available here.
