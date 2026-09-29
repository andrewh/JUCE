<script setup lang="ts">
import PlotFigure from './PlotFigure.vue'

// A gain change from 0.2 to 1.0 at 48 kHz, applied as a step and as a 20 ms linear ramp,
// which is what juce::SmoothedValue<float, ValueSmoothingTypes::Linear> does.
const sr = 48000
const rampSamples = Math.round(0.02 * sr)
const from = 0.2
const to = 1.0
const change = 0.005 // seconds into the block
const n = Math.round(0.04 * sr)
const rows: { ms: number; gain: number; kind: string }[] = []
for (let i = 0; i < n; i += 2) {
  const t = i / sr
  const k = Math.max(0, i - Math.round(change * sr))
  rows.push({ ms: t * 1000, gain: t < change ? from : to, kind: 'Jump (no smoothing)' })
  rows.push({ ms: t * 1000, gain: t < change ? from : from + (to - from) * Math.min(1, k / rampSamples), kind: 'Ramp (SmoothedValue)' })
}
// Multiply a 250 Hz sine by each gain curve to show the audible result.
const wave = rows.map((r) => ({ ...r, out: r.gain * Math.sin(2 * Math.PI * 250 * (r.ms / 1000)) }))

const build = (Plot: any, width: number, c: any) => {
  const colour = { domain: ['Jump (no smoothing)', 'Ramp (SmoothedValue)'], range: [c.peak, c.brand] }
  return Plot.plot({
    width,
    height: 340,
    marginLeft: 48,
    marginRight: 36,
    style: { background: 'transparent', color: c.ink, fontSize: '12px' },
    x: { label: 'Time (ms)', grid: true },
    y: { label: '↑ Output sample', domain: [-1.1, 1.1], grid: true },
    color: { ...colour, legend: true },
    marks: [
      Plot.ruleY([0]),
      Plot.line(wave, { x: 'ms', y: 'out', stroke: 'kind', strokeWidth: 1.5 }),
      Plot.ruleX([change * 1000], { stroke: c.muted, strokeDasharray: '3 4' }),
      Plot.text([{ x: change * 1000, y: 1.05 }], { x: 'x', y: 'y', text: () => 'gain parameter changes', dx: 6, textAnchor: 'start', fill: c.muted })
    ]
  })
}
</script>

<template>
  <PlotFigure
    :build="build"
    label="Two traces of a 250 Hz sine wave whose gain rises from 0.2 to 1.0: one jumps instantly, the other ramps over 20 milliseconds"
    caption="A 250 Hz tone at 48 kHz whose gain rises from 0.2 to 1.0. Applied as a jump, the waveform has a discontinuity that is heard as a click (zipper noise when it repeats). A 20 ms linear ramp, as SmoothedValue produces, changes the level without one. Computed, not recorded."
  />
</template>
