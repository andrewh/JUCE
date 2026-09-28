<script setup lang="ts">
import { computed, ref } from 'vue'
import { withBase } from 'vitepress'
import data from '../../../data/modules.json'

type Mod = (typeof data.modules)[number]

const groupLabels: Record<string, string> = {
  foundation: 'Foundation',
  gui: 'Graphics & GUI',
  audio: 'Audio & MIDI',
  plugins: 'Plug-ins & hosting',
  services: 'Commercial services'
}

const mods = data.modules as Mod[]
const byId = Object.fromEntries(mods.map((m) => [m.id, m])) as Record<string, Mod>
const short = (id: string) => id.replace(/^juce_/, '')

// ---- Layout: one column per dependency layer, ordered to reduce edge crossings ----
const colW = 200
const rowH = 58
const nodeW = 178
const nodeH = 36
const padX = 20
const padY = 40

const layers: Mod[][] = []
for (const m of mods) (layers[m.layer] ??= []).push(m)

const order: Record<string, number> = {}
const groupRank = Object.keys(groupLabels)
layers[0].sort((a, b) => a.id.localeCompare(b.id)).forEach((m, i) => (order[m.id] = i))
for (let pass = 0; pass < 3; pass++) {
  for (let l = 1; l < layers.length; l++) {
    const mean = (m: Mod) => m.dependencies.reduce((s, d) => s + (order[d] ?? 0), 0) / Math.max(1, m.dependencies.length)
    layers[l].sort((a, b) => mean(a) - mean(b) || groupRank.indexOf(a.group) - groupRank.indexOf(b.group))
    layers[l].forEach((m, i) => (order[m.id] = i))
  }
}

const maxRows = Math.max(...layers.map((l) => l.length))
const width = padX * 2 + (layers.length - 1) * colW + nodeW
const height = padY + maxRows * rowH + 10

const pos: Record<string, { x: number; y: number }> = {}
layers.forEach((layer, l) => {
  const offset = ((maxRows - layer.length) * rowH) / 2
  layer.forEach((m, i) => (pos[m.id] = { x: padX + l * colW, y: padY + offset + i * rowH }))
})

const edges = mods.flatMap((m) => m.dependencies.filter((d) => byId[d]).map((d) => ({ from: m.id, to: d })))
const edgePath = (e: { from: string; to: string }) => {
  const a = pos[e.from]
  const b = pos[e.to]
  const x1 = a.x
  const y1 = a.y + nodeH / 2
  const x2 = b.x + nodeW
  const y2 = b.y + nodeH / 2
  const mid = (x1 + x2) / 2
  return `M${x1},${y1} C${mid},${y1} ${mid},${y2} ${x2},${y2}`
}

// ---- Interaction ----
const selected = ref<string | null>('juce_audio_processors')
const hidden = ref<Set<string>>(new Set())

const closure = (id: string, key: 'dependencies' | 'dependents') => {
  const out = new Set<string>()
  const visit = (x: string) => {
    for (const d of byId[x]?.[key] ?? []) if (!out.has(d)) out.add(d), visit(d)
  }
  visit(id)
  return out
}
const upstream = computed(() => (selected.value ? closure(selected.value, 'dependencies') : new Set<string>()))
const downstream = computed(() => (selected.value ? closure(selected.value, 'dependents') : new Set<string>()))

const role = (id: string) => {
  if (!selected.value) return 'normal'
  if (id === selected.value) return 'selected'
  if (upstream.value.has(id)) return 'upstream'
  if (downstream.value.has(id)) return 'downstream'
  return 'dim'
}
const edgeRole = (e: { from: string; to: string }) => {
  if (!selected.value) return 'normal'
  const s = selected.value
  const onUp = (e.from === s || upstream.value.has(e.from)) && upstream.value.has(e.to)
  const onDown = (e.to === s || downstream.value.has(e.to)) && downstream.value.has(e.from)
  return onUp ? 'upstream' : onDown ? 'downstream' : 'dim'
}
const visible = (id: string) => !hidden.value.has(byId[id].group)

const toggleGroup = (g: string) => {
  const next = new Set(hidden.value)
  next.has(g) ? next.delete(g) : next.add(g)
  hidden.value = next
}
const select = (id: string) => (selected.value = selected.value === id ? null : id)

const current = computed(() => (selected.value ? byId[selected.value] : null))
const sourceUrl = (id: string) => `https://github.com/andrewh/JUCE/tree/master/modules/${id}`
</script>

<template>
  <div class="mg">
    <div class="mg-legend" role="group" aria-label="Filter by module group">
      <button
        v-for="(label, g) in groupLabels"
        :key="g"
        :class="['mg-chip', `g-${g}`, { off: hidden.has(g) }]"
        :aria-pressed="!hidden.has(g)"
        @click="toggleGroup(g)"
      >
        <span class="swatch" />{{ label }}
      </button>
      <span class="mg-key"><i class="k-up" /> depends on <i class="k-down" /> used by</span>
    </div>

    <div class="mg-scroll">
      <svg :viewBox="`0 0 ${width} ${height}`" :style="{ minWidth: '860px' }" role="img" aria-label="JUCE module dependency graph">
        <text v-for="(layer, l) in layers" :key="`h${l}`" :x="padX + l * colW + nodeW / 2" y="18" class="mg-col">
          layer {{ l }}
        </text>
        <g class="edges">
          <path
            v-for="e in edges"
            v-show="visible(e.from) && visible(e.to)"
            :key="`${e.from}-${e.to}`"
            :d="edgePath(e)"
            :class="['edge', edgeRole(e)]"
          />
        </g>
        <g
          v-for="m in mods"
          v-show="visible(m.id)"
          :key="m.id"
          :transform="`translate(${pos[m.id].x},${pos[m.id].y})`"
          :class="['node', `g-${m.group}`, role(m.id)]"
          tabindex="0"
          role="button"
          :aria-label="`${m.id}: ${m.description}`"
          @click="select(m.id)"
          @keydown.enter.prevent="select(m.id)"
          @keydown.space.prevent="select(m.id)"
        >
          <title>{{ m.id }}: {{ m.description }}</title>
          <rect :width="nodeW" :height="nodeH" rx="8" />
          <text :x="nodeW / 2" :y="nodeH / 2 + 4" :class="{ long: short(m.id).length > 20 }">{{ short(m.id) }}</text>
        </g>
      </svg>
    </div>

    <div v-if="current" class="mg-detail">
      <div class="mg-detail-head">
        <span :class="['mg-dot', `g-${current.group}`]" />
        <code>{{ current.id }}</code>
        <span class="mg-group">{{ groupLabels[current.group] }} · layer {{ current.layer }}</span>
      </div>
      <p class="mg-name">{{ current.name }}</p>
      <p>{{ current.description }}</p>
      <dl>
        <dt>Depends on (direct)</dt>
        <dd>
          <template v-if="current.dependencies.length">
            <button v-for="d in current.dependencies" :key="d" class="mg-link" @click="selected = d">{{ d }}</button>
          </template>
          <em v-else>nothing: this is the root of the framework</em>
        </dd>
        <dt>Used by (direct)</dt>
        <dd>
          <template v-if="current.dependents.length">
            <button v-for="d in current.dependents" :key="d" class="mg-link" @click="selected = d">{{ d }}</button>
          </template>
          <em v-else>no other module: this sits at the top of its stack</em>
        </dd>
        <dt>Pulls in</dt>
        <dd>{{ upstream.size }} module{{ upstream.size === 1 ? '' : 's' }} in total (transitively)</dd>
        <dt v-if="current.osxFrameworks.length">Apple frameworks</dt>
        <dd v-if="current.osxFrameworks.length">{{ current.osxFrameworks.join(', ') }}</dd>
        <dt v-if="current.linuxPackages.length">Linux packages</dt>
        <dd v-if="current.linuxPackages.length">{{ current.linuxPackages.join(', ') }}</dd>
        <dt>Public headers</dt>
        <dd>{{ current.headerCount }}</dd>
      </dl>
      <p class="mg-links">
        <a :href="withBase(`/reference/modules#${current.id.replace(/_/g, '-')}`)">Read the module notes</a>
        ·
        <a :href="sourceUrl(current.id)" target="_blank" rel="noopener">Browse the source</a>
      </p>
    </div>
    <p v-else class="mg-hint">Select a module to trace its dependencies.</p>
  </div>
</template>

<style scoped>
.mg {
  --c-foundation: #64748b;
  --c-gui: #3b82f6;
  --c-audio: #10b981;
  --c-plugins: #f59e0b;
  --c-services: #a855f7;
  --c-up: #2563eb;
  --c-down: #ea580c;
  margin: 16px 0 24px;
}
.dark .mg {
  --c-up: #60a5fa;
  --c-down: #fb923c;
}
.mg-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-bottom: 12px;
}
.mg-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 999px;
  font-size: 13px;
  background: var(--vp-c-bg-soft);
  transition: opacity 0.2s;
}
.mg-chip.off {
  opacity: 0.4;
  text-decoration: line-through;
}
.swatch,
.mg-dot {
  width: 10px;
  height: 10px;
  border-radius: 3px;
  background: var(--c);
  display: inline-block;
}
.g-foundation { --c: var(--c-foundation); }
.g-gui { --c: var(--c-gui); }
.g-audio { --c: var(--c-audio); }
.g-plugins { --c: var(--c-plugins); }
.g-services { --c: var(--c-services); }
.mg-key {
  font-size: 13px;
  color: var(--vp-c-text-2);
  margin-left: auto;
}
.mg-key i {
  display: inline-block;
  width: 18px;
  height: 3px;
  vertical-align: middle;
  margin: 0 4px 0 10px;
}
.k-up { background: var(--c-up); }
.k-down { background: var(--c-down); }
.mg-scroll {
  overflow-x: auto;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--vp-c-bg-alt);
  padding: 8px;
}
svg {
  width: 100%;
  height: auto;
  display: block;
}
.mg-col {
  fill: var(--vp-c-text-3);
  font-size: 12px;
  text-anchor: middle;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.edge {
  fill: none;
  stroke: var(--vp-c-text-3);
  stroke-width: 1.2;
  opacity: 0.5;
  transition: opacity 0.2s, stroke 0.2s;
}
.edge.upstream { stroke: var(--c-up); stroke-width: 2.2; opacity: 1; }
.edge.downstream { stroke: var(--c-down); stroke-width: 2.2; opacity: 1; }
.edge.dim { opacity: 0.12; }
.node {
  cursor: pointer;
  outline: none;
  transition: opacity 0.2s;
}
.node rect {
  fill: var(--vp-c-bg);
  stroke: var(--c);
  stroke-width: 2;
}
.node text {
  fill: var(--vp-c-text-1);
  font-size: 13px;
  font-family: var(--vp-font-family-mono);
  text-anchor: middle;
  pointer-events: none;
}
.node text.long { font-size: 11px; }
.node:hover rect,
.node:focus-visible rect { stroke-width: 3.5; }
.node.selected rect { fill: var(--c); }
.node.selected text { fill: #fff; font-weight: 600; }
.node.upstream rect { stroke: var(--c-up); stroke-width: 3; }
.node.downstream rect { stroke: var(--c-down); stroke-width: 3; }
.node.dim { opacity: 0.3; }
.mg-detail {
  margin-top: 16px;
  padding: 16px 20px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
}
.mg-detail-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
.mg-group {
  color: var(--vp-c-text-2);
  font-size: 13px;
}
.mg-name {
  font-weight: 600;
  margin: 8px 0 0;
}
.mg-detail p { margin: 6px 0; }
dl {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 6px 16px;
  margin: 12px 0;
  font-size: 14px;
}
dt { color: var(--vp-c-text-2); }
dd { margin: 0; }
.mg-link {
  font-family: var(--vp-font-family-mono);
  font-size: 13px;
  color: var(--vp-c-brand-1);
  margin-right: 10px;
}
.mg-link:hover { text-decoration: underline; }
.mg-hint { color: var(--vp-c-text-2); }
@media (max-width: 640px) {
  dl { grid-template-columns: 1fr; }
  dt { margin-top: 6px; }
  .mg-key { margin-left: 0; }
}
</style>
