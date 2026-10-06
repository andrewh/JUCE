# Changelog

**What changed on this site, newest first, and which JUCE version the content describes.** Entries come from this repository's git history, so each one links to its commit.

::: info Current content baseline
The pages describe **JUCE 9.0.3**, read from `JUCE_MAJOR_VERSION`, `JUCE_MINOR_VERSION` and `JUCE_BUILDNUMBER` in [`juce_StandardHeader.h`](https://github.com/juce-framework/JUCE/blob/master/modules/juce_core/system/juce_StandardHeader.h). The module map and module table regenerate from the headers on every build, so they follow the checked-out version. Hand-written pages do not, so check the JUCE release notes below when you upgrade.
:::

## This site

### 2026-10-05: Starter projects and tutorial 06

- Tutorials: every tutorial that sets up a project now offers a starter-project zip to download, so you can begin from a working skeleton instead of typing it in. Thirteen zips cover tutorials 2 to 14, built by a new `gen-downloads` step. ([`c1b241b`](https://github.com/andrewh/JUCE/commit/c1b241b), [`f4dfbd7`](https://github.com/andrewh/JUCE/commit/f4dfbd7))
- Tutorials: the build and run sections target macOS and Linux and assume JUCE is cloned to `~/JUCE`. ([`24f98e3`](https://github.com/andrewh/JUCE/commit/24f98e3), [`623fb32`](https://github.com/andrewh/JUCE/commit/623fb32))
- Tutorial 06, Synthesis: rebuilt as a six-step build-up of one runnable demo. It drains MIDI in every mode, connects MIDI after audio starts, and warns about clipping with several voices. ([`0a9a384`](https://github.com/andrewh/JUCE/commit/0a9a384), [`a66b712`](https://github.com/andrewh/JUCE/commit/a66b712), [`b0b2f12`](https://github.com/andrewh/JUCE/commit/b0b2f12))

### 2026-10-04: Self-contained tutorials and profiling guide

- Tutorials: added guide 18, profiling on macOS with Instruments and dSYM files. ([`a57b949`](https://github.com/andrewh/JUCE/commit/a57b949))
- Tutorials: made tutorials 2 to 17 self-contained, so each can be followed without finishing the earlier ones. Tutorial 1 now names its files explicitly, explains how to run the built app, and puts the build and run steps after the code. ([`beda974`](https://github.com/andrewh/JUCE/commit/beda974), [`5e726d8`](https://github.com/andrewh/JUCE/commit/5e726d8), [`32f2cbc`](https://github.com/andrewh/JUCE/commit/32f2cbc), [`c89a476`](https://github.com/andrewh/JUCE/commit/c89a476))
- Tutorials 4 and 5: rebuilt as a single runnable demo built up in steps. Tutorial 4 now checks the result of `XmlElement::writeTo`. ([`6e0ba78`](https://github.com/andrewh/JUCE/commit/6e0ba78), [`541a81e`](https://github.com/andrewh/JUCE/commit/541a81e), [`d84639c`](https://github.com/andrewh/JUCE/commit/d84639c))
- Tutorials: macOS builds default to arm64. Fixed Windows run paths in tutorials 16 and 17, and corrected issues found in review in tutorials 2, 8, 9, 10, 13 and 14, including a lock around graph changes in tutorial 10. ([`046db44`](https://github.com/andrewh/JUCE/commit/046db44), [`7aff618`](https://github.com/andrewh/JUCE/commit/7aff618), [`56299d2`](https://github.com/andrewh/JUCE/commit/56299d2))
- README: added instructions for building the VitePress site locally. ([`3469c1d`](https://github.com/andrewh/JUCE/commit/3469c1d))
- JUCE: `CGMetalLayerRenderer` no longer emits deprecation warnings for managed storage on macOS. ([`e4f4e1e`](https://github.com/andrewh/JUCE/commit/e4f4e1e))

### 2026-10-02: Example browser

- Added an Examples section with a nav item and sidebar. It shows 17 of JUCE's examples with full source, one page per example, syntax-highlighted at build time. It is generated from `examples/` by `gen-examples`. ([`eee5f05`](https://github.com/andrewh/JUCE/commit/eee5f05))

### 2026-10-01: Box2D tutorials

- Tutorials: added three original guides to the Tutorials section, with sidebar labels. They are Markdown in `docs/tutorials/`, so the build picks them up. The home page and About page no longer call every guide a condensed adaptation of a juce.com tutorial.
  - 15, Physics as a musical instrument: the bundled `juce_box2d` module, turning contact callbacks into notes, the threading design, and why the bundled Box2D is old and what it lacks. Companion app: `examples/Box2DMusic`, added to the examples build. ([`8aa43908`](https://github.com/andrewh/JUCE/commit/8aa43908), [`6e30cdf7`](https://github.com/andrewh/JUCE/commit/6e30cdf7))
  - 16, Integrating Box2D v3: fetching v3.1.1 with CMake `FetchContent`, ids instead of pointers, hit and sensor events. Companion app: `MusicV3` in `examples/Box2DAudioV3`. ([`8748cf59`](https://github.com/andrewh/JUCE/commit/8748cf59))
  - 17, A physical audio engine: modal synthesis driven by contact events, rolling noise, voice management. Companion app: `Modal` in `examples/Box2DAudioV3`. ([`8748cf59`](https://github.com/andrewh/JUCE/commit/8748cf59))
- `examples/Box2DAudioV3` is a separate CMake project that downloads Box2D, so ordinary JUCE builds do not need network access.

### 2026-09-29: Copy review and tutorials

- History: fixed the opening sentence of the lede.
- About this site: corrected the hosting description (the site is deployed by the Pages workflow, not by serving `docs/`) and the publishing steps.
- Tutorials: added fourteen condensed guides under a new Tutorials section (nav item, sidebar, and home page entry). They are generated at build time from `docs/tutorials/`, so the Markdown stays readable on GitHub, and they credit the ISC-licensed JUCE tutorials they adapt.
- Rebuilt the static copy in `docs/`, which was missing the API reference nav entry and this changelog.

### 2026-09-29: Sources and changelog

- Added this changelog.
- Added numbered source footnotes and a **Sources** section to the guide and reference pages. Sources are repository files (`README.md`, `LICENSE.md`, `CHANGE_LIST.md`, `docs/`, module headers) or public web pages, with retrieval dates for web pages.
- Corrected or removed claims that could not be sourced:
  - History: JUCE's first public release is now 2004, ROLI's acquisition is November 2014, and PACE's is April 2020. The earlier "early 2000s" and "mid 2000s" dates are gone.
  - History: removed the statements about the original licence, about JUCE 2 introducing modules, about the Audio Developer Conference growing out of the JUCE Summit, and about ROLI investing in documentation and community. None had a source.
  - History: the AGPLv3 move is now tied to the `LICENSE.md` files at tags 7.0.12 (GPLv3) and 8.0.0 (AGPLv3).
  - What is JUCE: replaced the unsourced "who uses it" paragraph, and added a not-legal-advice note to the licensing section.
  - Glossary and Anatomy of a plug-in: removed "AUv3 is sandboxed and the only plug-in format on iOS", "LV2 is popular on Linux", and the AbstractFifo "single-producer, single-consumer" wording (the header says single-reader, single-writer).
  - Build systems: removed the "template wizard" and "most new projects and tutorials use CMake" claims.
- Added a "Sources and accuracy" section to [About this site](./about).
- Footer: dropped the company name and shortened the licence line to a pointer to [`LICENSE.md`](https://github.com/juce-framework/JUCE/blob/master/LICENSE.md), which holds the licence scope (modules AGPLv3 or commercial, examples ISC, third-party code under its own terms).

### 2026-09-28: CI publishing

- Added a GitHub Pages workflow that runs Doxygen and the VitePress build, and stopped `npm run deploy` copying the roughly 150 MB `api/` output into `docs/`. ([`a724f0c`](https://github.com/andrewh/JUCE/commit/a724f0ca))

### 2026-09-28: API reference

- Embedded a themed Doxygen API reference, linked class names in inline code to their Doxygen pages, and added an "API reference" nav entry. ([`8311f35`](https://github.com/andrewh/JUCE/commit/8311f356))

### 2026-09-28: Instrument-panel theme

- Restyled the site with a new palette, type, a live oscilloscope hero, and matching Mermaid, code, and table styling. ([`73eb9b4`](https://github.com/andrewh/JUCE/commit/73eb9b49))

### 2026-09-28: Initial site

- Added the VitePress learning site: overview, architecture, core concepts, plug-in anatomy, build systems, history, modules reference, glossary, learning path, and an interactive module dependency graph. ([`74ac78f`](https://github.com/andrewh/JUCE/commit/74ac78f8))

## JUCE releases in this checkout

Headline changes, condensed from [`CHANGE_LIST.md`](https://github.com/juce-framework/JUCE/blob/master/CHANGE_LIST.md). Release dates are those of the "JUCE version x.y.z" commits in this repository's git history. For anything that can break your code, read [`BREAKING_CHANGES.md`](https://github.com/juce-framework/JUCE/blob/master/BREAKING_CHANGES.md).

| Version | Date | Headlines |
| --- | --- | --- |
| 9.0.3 | 2026-09-28 | Opus and WebP support; Windows MIDI Services preview 7 API; ALSA, window focus, and OpenGLFrameBuffer fixes; recursive LV2 scanning. Breaking: `SystemStats::isOperatingSystem64Bit()` now reports the OS rather than the process. |
| 9.0.2 | 2026-09-07 | `MP3AudioFormat` enabled by default; OpenGL performance; CoreAudio and VST3 hosting fixes; `SECURITY.md` and a software bill of materials. Breaking: `ThreadPool::addJob` accepts one callable type returning `void` or `ThreadPoolJob::JobStatus`. |
| 9.0.1 | 2026-08-10 | TypeScript npm package for WebView integration; protection against malformed `AudioFormat` input. |
| 9.0.0 | 2026-07-21 | New SVG parser, variable fonts, new macOS CoreAudio implementation, faster software renderer, OpenGL ES on Linux, better multi-touch, CMake improvements for headless builds. |

Older releases are covered in [History](./guide/history).

## How this page is maintained

- Add an entry under **This site** in the same commit as any content change worth mentioning.
- When the JUCE version in the checkout changes, add a row to the releases table from `CHANGE_LIST.md` and update the baseline above.
