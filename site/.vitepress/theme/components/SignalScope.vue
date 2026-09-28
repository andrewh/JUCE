<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

// An oscilloscope showing one audio callback: the signal going into a
// processBlock() and the same signal coming out, split into fixed-size blocks.
const canvas = ref<HTMLCanvasElement | null>(null)

const BLOCKS = 4
const IN_COLOUR = '#9aa4ff'
const OUT_COLOUR = '#ff4f93'
const GRID = 'rgba(154, 164, 255, 0.13)'
const GRID_AXIS = 'rgba(154, 164, 255, 0.32)'
const LABEL = 'rgba(190, 197, 240, 0.72)'

let raf = 0
let observer: ResizeObserver | null = null
let ctx: CanvasRenderingContext2D | null = null
let w = 0
let h = 0
let visible = true
let reduced = false
let io: IntersectionObserver | null = null

const wave = (x: number, t: number) =>
  0.55 * Math.sin(x * 2 * Math.PI * 2.0 - t) +
  0.28 * Math.sin(x * 2 * Math.PI * 5.0 - t * 1.7 + 0.8) +
  0.14 * Math.sin(x * 2 * Math.PI * 11.0 - t * 2.9 + 2.1)

// The "processor": a gentle low-pass, so the highest partials fade.
const processed = (x: number, t: number) =>
  0.55 * 0.92 * Math.sin(x * 2 * Math.PI * 2.0 - t - 0.25) +
  0.28 * 0.55 * Math.sin(x * 2 * Math.PI * 5.0 - t * 1.7 + 0.55) +
  0.14 * 0.12 * Math.sin(x * 2 * Math.PI * 11.0 - t * 2.9 + 1.6)

function resize() {
  const el = canvas.value
  if (!el) return
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const rect = el.getBoundingClientRect()
  w = rect.width
  h = rect.height
  el.width = Math.round(w * dpr)
  el.height = Math.round(h * dpr)
  ctx = el.getContext('2d')
  ctx?.setTransform(dpr, 0, 0, dpr, 0, 0)
  draw(performance.now())
}

function trace(fn: (x: number, t: number) => number, t: number, mid: number, amp: number, colour: string) {
  if (!ctx) return
  ctx.beginPath()
  const steps = Math.max(120, Math.floor(w / 2))
  for (let i = 0; i <= steps; i++) {
    const x = i / steps
    const px = padL + x * (w - padL - padR)
    const py = mid - fn(x, t) * amp
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)
  }
  ctx.lineJoin = 'round'
  ctx.strokeStyle = colour
  ctx.shadowColor = colour
  ctx.shadowBlur = 10
  ctx.lineWidth = 1.8
  ctx.stroke()
  ctx.shadowBlur = 0
}

const padL = 44
const padR = 14
const padT = 44
const padB = 44

function draw(now: number) {
  if (!ctx) return
  const t = reduced ? 1.2 : now / 1400
  ctx.clearRect(0, 0, w, h)

  const innerW = w - padL - padR
  const innerH = h - padT - padB
  const lane = innerH / 2
  const midIn = padT + lane / 2
  const midOut = padT + lane + lane / 2
  const amp = lane * 0.42

  // graticule
  ctx.lineWidth = 1
  for (let i = 0; i <= 8; i++) {
    const x = Math.round(padL + (innerW * i) / 8) + 0.5
    ctx.strokeStyle = GRID
    ctx.beginPath()
    ctx.moveTo(x, padT)
    ctx.lineTo(x, h - padB)
    ctx.stroke()
  }
  for (const mid of [midIn, midOut]) {
    for (const f of [-1, -0.5, 0, 0.5, 1]) {
      const y = Math.round(mid - f * amp) + 0.5
      ctx.strokeStyle = f === 0 ? GRID_AXIS : GRID
      ctx.beginPath()
      ctx.moveTo(padL, y)
      ctx.lineTo(w - padR, y)
      ctx.stroke()
    }
  }

  // block boundaries
  ctx.setLineDash([3, 4])
  ctx.strokeStyle = GRID_AXIS
  for (let b = 0; b <= BLOCKS; b++) {
    const x = Math.round(padL + (innerW * b) / BLOCKS) + 0.5
    ctx.beginPath()
    ctx.moveTo(x, padT - 14)
    ctx.lineTo(x, h - padB + 6)
    ctx.stroke()
  }
  ctx.setLineDash([])

  trace(wave, t, midIn, amp, IN_COLOUR)
  trace(processed, t, midOut, amp, OUT_COLOUR)

  // labels
  ctx.font = '500 11px "Martian Mono", ui-monospace, monospace'
  ctx.fillStyle = LABEL
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'left'
  ctx.fillText('48 kHz', padL, 16)
  ctx.textAlign = 'right'
  ctx.fillText(w > 420 ? '512 samples / block' : '512 smp', w - padR, 16)
  ctx.textAlign = 'center'
  for (let b = 0; b < BLOCKS; b++) {
    const x = padL + (innerW * (b + 0.5)) / BLOCKS
    ctx.fillText(`block ${b}`, x, padT - 14)
  }
  ctx.textAlign = 'right'
  ctx.fillStyle = IN_COLOUR
  ctx.fillText('IN', padL - 10, midIn)
  ctx.fillStyle = OUT_COLOUR
  ctx.fillText('OUT', padL - 10, midOut)
  ctx.textAlign = 'left'
  ctx.fillStyle = LABEL
  ctx.fillText('processBlock()', padL, h - 16)
  if (w > 560) {
    ctx.textAlign = 'right'
    ctx.fillText('one audio-thread callback per block', w - padR, h - 16)
  }
}

function loop(now: number) {
  if (visible) draw(now)
  raf = requestAnimationFrame(loop)
}

onMounted(() => {
  reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  resize()
  if (canvas.value) {
    observer = new ResizeObserver(resize)
    observer.observe(canvas.value)
    io = new IntersectionObserver(([e]) => (visible = e.isIntersecting))
    io.observe(canvas.value)
  }
  document.fonts?.ready.then(() => draw(performance.now()))
  if (!reduced) raf = requestAnimationFrame(loop)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  observer?.disconnect()
  io?.disconnect()
})
</script>

<template>
  <figure class="scope">
    <canvas
      ref="canvas"
      role="img"
      aria-label="Oscilloscope trace of an audio signal entering and leaving a processing block, divided into four blocks"
    />
  </figure>
</template>

<style scoped>
.scope {
  margin: 8px 0 0;
  width: 100%;
  border: 1px solid #2b3163;
  background:
    radial-gradient(120% 100% at 50% 0%, #10153a 0%, #070919 70%);
  box-shadow: 0 0 0 4px var(--vp-c-bg), 0 0 0 5px var(--vp-c-divider);
}
canvas {
  display: block;
  width: 100%;
  aspect-ratio: 16 / 11;
}
</style>
