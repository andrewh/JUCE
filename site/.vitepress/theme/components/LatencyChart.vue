<script setup lang="ts">
import PlotFigure from './PlotFigure.vue'

// Latency of one buffer is simply samples / sample rate. No measurement involved.
const sizes = [32, 64, 128, 256, 512, 1024, 2048]
const rates = [44100, 48000, 96000]
const rows = rates.flatMap((sr) =>
  sizes.map((n) => ({ sr: `${sr / 1000} kHz`, n, ms: (n / sr) * 1000 }))
)

const build = (Plot: any, width: number, c: any) =>
  Plot.plot({
    width,
    height: 300,
    marginLeft: 48,
    marginRight: 36,
    style: { background: 'transparent', color: c.ink, fontSize: '12px' },
    x: { type: 'log', label: 'Buffer size (samples) →', ticks: sizes, tickRotate: 0, tickFormat: (d: number) => String(d), grid: true },
    y: { label: '↑ Time available per callback (ms)', grid: true, zero: true },
    color: { domain: ['44.1 kHz', '48 kHz', '96 kHz'], range: [c.muted, c.brand, c.peak], legend: true },
    marks: [
      Plot.ruleY([0]),
      Plot.line(rows, { x: 'n', y: 'ms', stroke: 'sr', strokeWidth: 2 }),
      Plot.dot(rows, { x: 'n', y: 'ms', stroke: 'sr', fill: 'sr', r: 3 }),
      Plot.tip(rows, Plot.pointer({ x: 'n', y: 'ms', title: (d: any) => `${d.n} samples at ${d.sr}\n${d.ms.toFixed(2)} ms` }))
    ]
  })
</script>

<template>
  <PlotFigure
    :build="build"
    label="Line chart: time available per audio callback in milliseconds against buffer size, for three sample rates"
    caption="Each audio callback must return before the next buffer is due, so the buffer duration is the deadline: samples ÷ sample rate. Larger buffers give more headroom and more latency. Computed from that formula, not measured."
  />
</template>
