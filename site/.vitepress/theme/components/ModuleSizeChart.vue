<script setup lang="ts">
import PlotFigure from './PlotFigure.vue'
import data from '../../../data/modules.json'

// Public header count per module, from data/modules.json (parsed from ../modules by gen-modules.mjs).
const rows = (data.modules as any[])
  .map((m) => ({ id: m.id.replace('juce_', ''), headers: m.headerCount, group: m.group }))
  .sort((a, b) => b.headers - a.headers)
const groups = ['foundation', 'audio', 'gui', 'plugins', 'services']

const build = (Plot: any, width: number, c: any) =>
  Plot.plot({
    width,
    height: 40 + rows.length * 20,
    marginLeft: 150,
    marginRight: 40,
    style: { background: 'transparent', color: c.ink, fontSize: '12px' },
    x: { label: 'Headers listed in the module →', grid: true },
    y: { label: null, domain: rows.map((r) => r.id) },
    color: { domain: groups, range: [c.muted, c.brand, c.cyan, c.peak, c.yellow], legend: true },
    marks: [
      Plot.barX(rows, { y: 'id', x: 'headers', fill: 'group', tip: true }),
      Plot.text(rows, { y: 'id', x: 'headers', text: 'headers', dx: 4, textAnchor: 'start', fill: c.ink }),
      Plot.ruleX([0])
    ]
  })
</script>

<template>
  <PlotFigure
    :build="build"
    label="Horizontal bar chart of the number of public headers in each of JUCE's modules, coloured by group"
    caption="Number of headers each module's own header lists, from the same parse that builds the module map. It counts files, not lines, so it is a rough guide to surface area only."
  />
</template>
