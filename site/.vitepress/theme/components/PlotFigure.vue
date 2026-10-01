<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

// Wraps Observable Plot for the site. Plot is imported on the client only, sized to the
// container, and redrawn when the light/dark toggle flips so colours follow the theme.
export interface Palette {
  ink: string
  muted: string
  grid: string
  brand: string
  peak: string
  cyan: string
  yellow: string
}
const props = defineProps<{
  build: (Plot: typeof import('@observablehq/plot'), width: number, c: Palette) => Element
  label: string
  caption?: string
}>()

const host = ref<HTMLElement | null>(null)
let PlotLib: typeof import('@observablehq/plot') | null = null
let ro: ResizeObserver | null = null
let mo: MutationObserver | null = null

function palette(el: HTMLElement): Palette {
  const s = getComputedStyle(el)
  const v = (n: string) => s.getPropertyValue(n).trim()
  return {
    ink: v('--vp-c-text-1'),
    muted: v('--vp-c-text-2'),
    grid: v('--vp-c-divider'),
    brand: v('--vp-c-brand-1'),
    peak: v('--jl-peak'),
    cyan: v('--jl-cyan'),
    yellow: v('--jl-yellow')
  }
}

function render() {
  const el = host.value
  if (!el || !PlotLib) return
  const width = Math.max(280, Math.floor(el.clientWidth))
  const chart = props.build(PlotLib, width, palette(el))
  el.replaceChildren(chart)
}

onMounted(async () => {
  PlotLib = await import('@observablehq/plot')
  render()
  if (host.value) {
    ro = new ResizeObserver(render)
    ro.observe(host.value)
  }
  mo = new MutationObserver(render)
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
})
onBeforeUnmount(() => {
  ro?.disconnect()
  mo?.disconnect()
})
</script>

<template>
  <figure class="plot-figure">
    <div ref="host" class="plot-host" role="img" :aria-label="label" />
    <figcaption v-if="caption">{{ caption }}</figcaption>
  </figure>
</template>

<style scoped>
.plot-figure {
  margin: 24px 0;
  padding: 16px 16px 12px;
  border: 1px solid var(--vp-c-border);
  background: var(--vp-c-bg-elv);
}
.plot-host { min-height: 240px; }
.plot-host :deep(svg) {
  display: block;
  max-width: 100%;
  font-family: var(--vp-font-family-base);
  /* Plot's tips fill with --plot-background (default white) and draw text in the inherited
     colour, so in dark mode they came out light-on-white. Follow the theme instead. */
  --plot-background: var(--vp-c-bg-elv);
  color: var(--vp-c-text-1);
}
figcaption {
  margin-top: 10px;
  font-size: 13.5px;
  line-height: 1.55;
  color: var(--vp-c-text-2);
}
</style>
