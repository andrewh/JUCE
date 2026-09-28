---
layout: home

hero:
  name: Learning JUCE
  text: How the framework fits together
  tagline: A personal field guide to the JUCE C++ framework, built from reading its source. What it is, how the modules interact, and where it came from.
  image:
    src: /favicon.svg
    alt: Oscilloscope trace
  actions:
    - theme: brand
      text: Start with the big picture
      link: /guide/what-is-juce
    - theme: alt
      text: Explore the module map
      link: /reference/module-map
    - theme: alt
      text: Glossary
      link: /reference/glossary

features:
  - title: The big picture
    details: What JUCE is for, what you get, and the handful of ideas that make everything else make sense.
    link: /guide/what-is-juce
  - title: Architecture
    details: Layers, threads, and the paths data takes from a sound card or plug-in host through your code and back.
    link: /guide/architecture
  - title: Interactive module map
    details: All 24 modules, generated from their headers. Click one to trace what it depends on and what depends on it.
    link: /reference/module-map
  - title: Anatomy of a plug-in
    details: How one AudioProcessor becomes a VST3, AU, AAX, LV2 and standalone app, and what the host calls when.
    link: /guide/plugin-anatomy
  - title: Glossary
    details: Plain-English definitions of JUCE classes, audio jargon, and plug-in formats, cross-linked to the guides.
    link: /reference/glossary
  - title: History
    details: From Tracktion's utility code in the early 2000s to JUCE 9, and why the codebase looks the way it does.
    link: /guide/history
---
