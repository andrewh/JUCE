# Changelog

**What changed on this site, newest first, and which JUCE version the content describes.** Entries come from this repository's git history, so each one links to its commit.

::: info Current content baseline
The pages describe **JUCE 9.0.3**, read from `JUCE_MAJOR_VERSION`, `JUCE_MINOR_VERSION` and `JUCE_BUILDNUMBER` in [`juce_StandardHeader.h`](https://github.com/andrewh/JUCE/blob/master/modules/juce_core/system/juce_StandardHeader.h). The module map and module table regenerate from the headers on every build, so they follow the checked-out version. Hand-written pages do not, so check the JUCE release notes below when you upgrade.
:::

## This site

### 2026-09-29: Copy review

- History: fixed the opening sentence of the lede.
- About this site: corrected the hosting description (the site is deployed by the Pages workflow, not by serving `docs/`) and the publishing steps.
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
- Footer: dropped the company name and shortened the licence line to a pointer to [`LICENSE.md`](https://github.com/andrewh/JUCE/blob/master/LICENSE.md), which holds the licence scope (modules AGPLv3 or commercial, examples ISC, third-party code under its own terms).

### 2026-09-28: CI publishing

- Added a GitHub Pages workflow that runs Doxygen and the VitePress build, and stopped `npm run deploy` copying the roughly 150 MB `api/` output into `docs/`. ([`a724f0c`](https://github.com/andrewh/JUCE/commit/a724f0ca))

### 2026-09-28: API reference

- Embedded a themed Doxygen API reference, linked class names in inline code to their Doxygen pages, and added an "API reference" nav entry. ([`8311f35`](https://github.com/andrewh/JUCE/commit/8311f356))

### 2026-09-28: Instrument-panel theme

- Restyled the site with a new palette, type, a live oscilloscope hero, and matching Mermaid, code, and table styling. ([`73eb9b4`](https://github.com/andrewh/JUCE/commit/73eb9b49))

### 2026-09-28: Initial site

- Added the VitePress learning site: overview, architecture, core concepts, plug-in anatomy, build systems, history, modules reference, glossary, learning path, and an interactive module dependency graph. ([`74ac78f`](https://github.com/andrewh/JUCE/commit/74ac78f8))

## JUCE releases in this checkout

Headline changes, condensed from [`CHANGE_LIST.md`](https://github.com/andrewh/JUCE/blob/master/CHANGE_LIST.md). Release dates are those of the "JUCE version x.y.z" commits in this repository's git history. For anything that can break your code, read [`BREAKING_CHANGES.md`](https://github.com/andrewh/JUCE/blob/master/BREAKING_CHANGES.md).

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
