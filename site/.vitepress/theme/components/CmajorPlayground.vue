<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref } from 'vue'

const props = defineProps<{
  /** Ids of the patches to offer; all of them when omitted. */
  only?: string[]
  /** Show the table of parameters as a JUCE host would see them. */
  hostView?: boolean
}>()

// A live Cmajor playground. The Cmajor compiler is itself built to WebAssembly, so the page
// compiles the source in the browser and runs it in an AudioWorklet. The compiler and the
// patch-view helpers are loaded on demand from cmajor.dev (served with open CORS headers),
// so nothing is bundled and the page costs nothing until the first Build.
const API = 'https://cmajor.dev/cmaj_api/'
const EXAMPLES = 'https://cmajor.dev/assets/ExampleSource/'

interface Sample {
  id: string
  label: string
  note: string
  source?: string
  url?: string
}

const SINE_GAIN = `// The same idea as the JUCE gain plug-in example: one parameter, scaled in decibels.
// Cmajor parameters appear as sliders in the view below, like a JUCE generic editor.
processor SineGain
{
    output stream float out;

    input value float frequency [[ name: "Frequency", min: 50, max: 2000, init: 440, unit: "Hz" ]];
    input value float gain      [[ name: "Gain",      min: -60, max: 0,    init: -24, unit: "dB" ]];

    float phase;

    void main()
    {
        loop
        {
            out <- std::levels::dBtoGain (gain) * sin (phase);
            phase = addModulo2Pi (phase, float (frequency * twoPi * processor.period));
            advance();
        }
    }
}
`

const HELLO = `processor HelloWorld
{
    output stream float out;

    // A note and a duration for our melody
    struct Note
    {
        int pitch, length;

        void play() const
        {
            let numFrames  = this.length * framesPerQuarterNote;
            let frequency  = std::notes::noteToFrequency (this.pitch);
            let phaseDelta = float (frequency * processor.period * twoPi);

            loop (numFrames)
            {
                out <- volume * sin (phase);
                phase = addModulo2Pi (phase, phaseDelta);
                advance();
            }
        }
    }

    // The entry point, called by the system
    void main()
    {
        let melody = Note[] ( (79, 1), (77, 1), (69, 2), (71, 2),
                              (76, 1), (74, 1), (65, 2), (67, 2),
                              (74, 1), (72, 1), (64, 2), (67, 2),
                              (72, 4) );

        for (wrap<melody.size> i)
            melody[i].play();
    }

    let volume = 0.15f;
    let framesPerQuarterNote = int (processor.frequency / 7);

    float phase;
}
`

const SAMPLES: Sample[] = [
  { id: 'sinegain', label: 'Sine with gain (editable)', note: 'A sine oscillator with frequency and gain parameters.', source: SINE_GAIN },
  { id: 'hello', label: 'Hello World melody (editable)', note: 'The classic Cmajor starter, a short melody.', source: HELLO },
  { id: 'tremolo', label: 'Tremolo (hosted)', note: 'An effect with its own GUI.', url: `${EXAMPLES}Tremolo/Tremolo.cmajorpatch` },
  { id: 'ringmod', label: 'Ring modulator (hosted)', note: 'Effect patch.', url: `${EXAMPLES}RingMod/RingMod.cmajorpatch` },
  { id: '808', label: '808 drum machine (hosted)', note: 'A multi-file instrument.', url: `${EXAMPLES}808/808.cmajorpatch` },
  { id: 'epiano', label: 'Electric piano (hosted)', note: 'Click the on-screen keyboard to play.', url: `${EXAMPLES}ElectricPiano/ElectricPiano.cmajorpatch` },
  { id: 'zita', label: 'Zita reverb (hosted)', note: 'A larger effect patch.', url: `${EXAMPLES}ZitaReverb/ZitaReverb.cmajorpatch` }
]

const choices = computed(() => (props.only?.length ? SAMPLES.filter((s) => props.only!.includes(s.id)) : SAMPLES))

const selectedId = ref(choices.value[0].id)
const source = ref(choices.value[0].source ?? '')
const status = ref<'idle' | 'building' | 'running' | 'error'>('idle')
const message = ref('')
const version = ref('')
const viewHost = ref<HTMLElement | null>(null)

// What the bridge's Parameter class (cmaj_JUCEPlugin.h) would report to a host for one
// patch parameter. The defaults mirror PatchParameterProperties in cmaj_PatchHelpers.h.
interface HostParam {
  id: string
  name: string
  label: string
  min: number
  max: number
  defaultValue: number
  value: number
}
const hostParams = ref<HostParam[]>([])
const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const normalise = (p: HostParam, v: number) => (p.max === p.min ? 0 : clamp01((v - p.min) / (p.max - p.min)))
const fmt = (v: number) => (Math.abs(v) >= 100 ? v.toFixed(0) : v.toFixed(3).replace(/\.?0+$/, ''))

const selected = computed(() => choices.value.find((s) => s.id === selectedId.value)!)
const editable = computed(() => selected.value.source !== undefined)

let audioContext: AudioContext | null = null
let run = 0

function pick() {
  const s = selected.value
  if (s.source !== undefined) source.value = s.source
}

async function stop() {
  run++
  const ctx = audioContext
  audioContext = null
  if (viewHost.value) viewHost.value.replaceChildren()
  hostParams.value = []
  try {
    await ctx?.close()
  } catch {
    /* already closed */
  }
  status.value = 'idle'
  message.value = ''
}

function watchParameters(connection: any, mine: number) {
  hostParams.value = []
  connection.addStatusListener((st: any) => {
    if (mine !== run) return
    const rows: HostParam[] = []
    for (const e of st?.details?.inputs ?? []) {
      const a = e.annotation ?? {}
      if (e.endpointType !== 'value' || a.hidden) continue
      const min = Number(a.min ?? 0)
      const max = Number(a.max ?? 1)
      const init = Number(a.init ?? min)
      const row = reactive<HostParam>({
        id: String(e.endpointID),
        name: String(a.name ?? e.endpointID),
        label: String(a.unit ?? ''),
        min,
        max,
        defaultValue: init,
        value: init
      })
      connection.addParameterListener(row.id, (v: number) => {
        if (mine === run) row.value = v
      })
      connection.requestParameterValue(row.id)
      rows.push(row)
    }
    hostParams.value = rows
  })
  connection.requestStatusUpdate()
}

function describe(e: any): string {
  if (e?.message) return e.message
  if (e?.messages) return typeof e.messages === 'string' ? e.messages : JSON.stringify(e.messages)
  return typeof e === 'string' ? e : JSON.stringify(e)
}

async function build() {
  await stop()
  const mine = run
  status.value = 'building'
  message.value = 'Loading the compiler…'

  try {
    const [{ default: CmajorCompiler }, { createPatchViewHolder }] = await Promise.all([
      import(/* @vite-ignore */ `${API}cmaj-embedded-compiler.js`),
      import(/* @vite-ignore */ `${API}cmaj-patch-view.js`)
    ])

    const ctx = new AudioContext()
    await ctx.suspend()
    audioContext = ctx

    const compiler = new CmajorCompiler()
    const s = selected.value

    if (s.url) {
      const parts = s.url.split('/')
      const manifestPath = parts.pop() as string
      compiler.setManifestURL(new URL(parts.join('/') + '/'), manifestPath)
    } else {
      const manifest = {
        CmajorVersion: 1,
        ID: 'dev.juce-notes.playground',
        version: '1.0',
        name: 'Playground',
        manufacturer: 'Learning JUCE',
        description: 'Edited on the Learning JUCE playground',
        category: 'generator',
        isInstrument: false,
        source: 'playground.cmajor'
      }
      compiler.addSourceFile('playground.cmajorpatch', JSON.stringify(manifest))
      compiler.addSourceFile('playground.cmajor', source.value)
    }

    message.value = 'Compiling…'
    const connection = await compiler.createAudioWorkletNodePatchConnection(ctx, 'cmaj-worklet-processor')
    version.value = compiler.CmajorVersion
    if (mine !== run) return

    if (props.hostView) watchParameters(connection, mine)

    const view = await createPatchViewHolder(connection)
    if (mine !== run) return
    viewHost.value?.replaceChildren(...(view ? [view] : []))

    await connection.connectDefaultAudioAndMIDI(ctx)
    await ctx.resume()
    status.value = 'running'
    message.value = ''
  } catch (e) {
    if (mine !== run) return
    status.value = 'error'
    message.value = describe(e)
  }
}

onBeforeUnmount(() => {
  run++
  audioContext?.close().catch(() => {})
})
</script>

<template>
  <div class="cmaj">
    <div class="bar">
      <label>
        <span>Patch</span>
        <select v-model="selectedId" @change="pick">
          <option v-for="s in choices" :key="s.id" :value="s.id">{{ s.label }}</option>
        </select>
      </label>
      <button class="go" :disabled="status === 'building'" @click="build">
        {{ status === 'running' ? 'Rebuild' : 'Build and play' }}
      </button>
      <button :disabled="status !== 'running'" @click="stop">Stop</button>
    </div>

    <p class="note">{{ selected.note }}<template v-if="!editable"> The source loads from cmajor.dev, so it is not editable here.</template></p>

    <textarea
      v-if="editable"
      v-model="source"
      class="editor"
      spellcheck="false"
      autocapitalize="off"
      autocomplete="off"
      aria-label="Cmajor source"
    ></textarea>

    <div class="status" :data-state="status" role="status" aria-live="polite">
      <template v-if="status === 'building'">{{ message }}</template>
      <template v-else-if="status === 'running'">Running{{ version ? ` (Cmajor ${version})` : '' }}. Audio is live.</template>
      <pre v-else-if="status === 'error'">{{ message }}</pre>
      <template v-else>Press “Build and play”. The first build downloads the compiler (about 28 MB, then cached by the browser).</template>
    </div>

    <div ref="viewHost" class="view"></div>

    <div v-if="hostView && hostParams.length" class="host">
      <p class="note">
        What a JUCE host sees. Each row is one <code>Parameter</code> object from the bridge. Hosts only ever use the
        0 to 1 value, and the bridge converts to and from the patch's own range.
      </p>
      <table>
        <thead>
          <tr>
            <th>getParameterID()</th>
            <th>getName()</th>
            <th>getLabel()</th>
            <th>getDefaultValue()</th>
            <th>getValue()</th>
            <th>getText()</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in hostParams" :key="p.id">
            <td><code>{{ p.id }}</code></td>
            <td>{{ p.name }}</td>
            <td>{{ p.label || '(none)' }}</td>
            <td>{{ fmt(normalise(p, p.defaultValue)) }}</td>
            <td>{{ fmt(normalise(p, p.value)) }}</td>
            <td>{{ fmt(p.value) }} {{ p.label }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.cmaj {
  margin: 1.5rem 0;
}
.bar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: end;
}
label {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.85rem;
  color: var(--vp-c-text-2);
}
select,
button {
  font: inherit;
  padding: 0.4rem 0.75rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  cursor: pointer;
}
button.go {
  background: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-white);
}
button:disabled {
  opacity: 0.5;
  cursor: default;
}
.note {
  margin: 0.75rem 0 0.5rem;
  color: var(--vp-c-text-2);
  font-size: 0.9rem;
}
.editor {
  width: 100%;
  min-height: 18rem;
  box-sizing: border-box;
  padding: 0.75rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  font-family: var(--vp-font-family-mono);
  font-size: 0.85rem;
  line-height: 1.5;
  tab-size: 4;
  white-space: pre;
  overflow: auto;
  resize: vertical;
}
.status {
  margin-top: 0.75rem;
  font-size: 0.9rem;
  color: var(--vp-c-text-2);
}
.status[data-state='error'] pre {
  margin: 0;
  padding: 0.75rem;
  overflow: auto;
  border-radius: 6px;
  background: var(--vp-c-danger-soft);
  color: var(--vp-c-text-1);
  white-space: pre-wrap;
  font-size: 0.8rem;
}
.view {
  margin-top: 1rem;
  overflow: auto;
}
.host {
  margin-top: 1rem;
  overflow-x: auto;
}
.host table {
  display: table;
  width: 100%;
  font-size: 0.8rem;
}
.host th,
.host td {
  padding: 0.3rem 0.6rem;
  white-space: nowrap;
}
.host th {
  font-family: var(--vp-font-family-mono);
  font-weight: 500;
  text-align: left;
}
</style>
