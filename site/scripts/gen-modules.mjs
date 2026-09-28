// Reads the JUCE module declarations from ../modules and writes data/modules.json.
// The module graph on the site is always built from the real source tree, so it
// stays accurate as the fork tracks upstream.
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const modulesDir = join(here, '..', '..', 'modules')
const outFile = join(here, '..', 'data', 'modules.json')

const groups = {
  foundation: ['juce_core', 'juce_events', 'juce_data_structures', 'juce_cryptography', 'juce_javascript'],
  gui: ['juce_graphics', 'juce_gui_basics', 'juce_gui_extra', 'juce_opengl', 'juce_animation', 'juce_video', 'juce_box2d'],
  audio: ['juce_audio_basics', 'juce_audio_devices', 'juce_audio_formats', 'juce_audio_utils', 'juce_dsp', 'juce_midi_ci', 'juce_osc'],
  plugins: ['juce_audio_processors_headless', 'juce_audio_processors', 'juce_audio_plugin_client'],
  services: ['juce_analytics', 'juce_product_unlocking']
}
const groupOf = (id) => Object.keys(groups).find((g) => groups[g].includes(id)) ?? 'services'

const splitList = (s) => (s ?? '').split(/[,\s]+/).map((x) => x.trim()).filter(Boolean)

const modules = readdirSync(modulesDir)
  .filter((d) => d.startsWith('juce_') && existsSync(join(modulesDir, d, `${d}.h`)))
  .sort()
  .map((id) => {
    const header = readFileSync(join(modulesDir, id, `${id}.h`), 'utf8').replace(/\r/g, '')
    const block = header.match(/BEGIN_JUCE_MODULE_DECLARATION([\s\S]*?)END_JUCE_MODULE_DECLARATION/)
    if (!block) throw new Error(`No module declaration in ${id}`)
    const fields = {}
    for (const line of block[1].split('\n')) {
      const m = line.match(/^\s*(\w+):\s*(.*)$/)
      if (m) fields[m[1]] = m[2].trim()
    }
    // Public headers are the module's own sub-directory includes, e.g. "buffers/x.h" or <id/buffers/x.h>
    const publicHeaders = [...header.matchAll(/^\s*#include\s+["<]([^">]+\.h)[">]/gm)]
      .map((m) => m[1].replace(`${id}/`, ''))
      .filter((h) => h.includes('/') && !h.startsWith('juce_') && !h.includes('native/'))
    return {
      id,
      name: fields.name ?? id,
      description: fields.description ?? '',
      dependencies: splitList(fields.dependencies),
      osxFrameworks: splitList(fields.OSXFrameworks),
      linuxPackages: splitList(fields.linuxPackages),
      group: groupOf(id),
      headerCount: publicHeaders.length
    }
  })

// Layer = length of the longest dependency chain down to a module with no dependencies.
const byId = Object.fromEntries(modules.map((m) => [m.id, m]))
const layerCache = {}
const layerOf = (id, seen = new Set()) => {
  if (id in layerCache) return layerCache[id]
  if (seen.has(id)) throw new Error(`Dependency cycle at ${id}`)
  seen.add(id)
  const deps = byId[id]?.dependencies ?? []
  return (layerCache[id] = deps.length ? 1 + Math.max(...deps.map((d) => layerOf(d, seen))) : 0)
}
for (const m of modules) {
  m.layer = layerOf(m.id)
  m.dependents = modules.filter((o) => o.dependencies.includes(m.id)).map((o) => o.id)
}

const version = (() => {
  const h = readFileSync(join(modulesDir, 'juce_core', 'system', 'juce_StandardHeader.h'), 'utf8')
  const get = (k) => h.match(new RegExp(`#define\\s+${k}\\s+(\\d+)`))[1]
  return `${get('JUCE_MAJOR_VERSION')}.${get('JUCE_MINOR_VERSION')}.${get('JUCE_BUILDNUMBER')}`
})()

writeFileSync(outFile, JSON.stringify({ version, modules }, null, 2) + '\n')
console.log(`Wrote ${modules.length} modules (JUCE ${version}) to ${outFile}`)
