// Links `ClassName` code spans in the markdown to their Doxygen reference pages.
//
// The class index comes from data/juce.tag, the tag file Doxygen writes (see
// doxygen/Doxyfile, or run `npm run api`). If the file is missing, for example
// before Doxygen has been run, nothing is linked and the build carries on.
//
// What gets linked, inside inline code spans only:
//   `String`, `juce::String`     a class or struct
//   `ci::Device`                 a class reached through a namespace alias
//   `ValueTree::Listener`        a nested class
//   `Timer::callAfterDelay()`    a member (first overload if there are several)
// A bare name is only linked when it matches exactly one class, so ambiguous
// names such as `Device` are left alone. Code inside fenced blocks is never touched.
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type MarkdownIt from 'markdown-it'

const here = dirname(fileURLToPath(import.meta.url))
const tagFile = join(here, '..', 'data', 'juce.tag')

// Namespace aliases declared in the module headers (for example `namespace ci = midi_ci;`).
const aliases: Record<string, string> = { ci: 'midi_ci' }

interface Entry { file: string; members: Map<string, string> }

function load(): { exact: Map<string, Entry>; bySuffix: Map<string, Entry[]> } {
  const exact = new Map<string, Entry>()
  const bySuffix = new Map<string, Entry[]>()
  if (!existsSync(tagFile)) return { exact, bySuffix }

  const xml = readFileSync(tagFile, 'utf8')
  const compound = /<compound kind="(?:class|struct)">([\s\S]*?)<\/compound>/g
  for (const m of xml.matchAll(compound)) {
    const body = m[1]
    const name = body.match(/<name>([^<]+)<\/name>/)?.[1]
    const file = body.match(/<filename>([^<]+)<\/filename>/)?.[1]
    if (!name || !file) continue
    const members = new Map<string, string>()
    for (const mem of body.matchAll(/<member kind="(?:function|variable|typedef|enumeration)"[^>]*>([\s\S]*?)<\/member>/g)) {
      const mname = mem[1].match(/<name>([^<]+)<\/name>/)?.[1]
      const anchor = mem[1].match(/<anchor>([^<]+)<\/anchor>/)?.[1]
      const anchorFile = mem[1].match(/<anchorfile>([^<]+)<\/anchorfile>/)?.[1] ?? file
      if (mname && anchor && !members.has(mname)) members.set(mname, `${anchorFile}#${anchor}`)
    }
    const entry = { file, members }
    const short = name.replace(/^juce::/, '')
    exact.set(short, entry)
    // Index every trailing part of the qualified name, so `Listener` style lookups can be tried.
    const parts = short.split('::')
    for (let i = 1; i < parts.length; i++) {
      const key = parts.slice(i).join('::')
      bySuffix.set(key, [...(bySuffix.get(key) ?? []), entry])
    }
  }
  return { exact, bySuffix }
}

const index = load()
const codeSpan = /^(?:juce::)?([A-Za-z_]\w*(?:::[A-Za-z_~]\w*)*)(?:\(\))?$/

function resolve(text: string): string | undefined {
  const m = text.match(codeSpan)
  if (!m) return undefined
  const parts = m[1].split('::').map((p, i) => (i === 0 ? aliases[p] ?? p : p))

  // Try the whole thing as a class, then everything but the last part as a class plus a member.
  for (const cut of [parts.length, parts.length - 1]) {
    if (cut < 1) continue
    const cls = parts.slice(0, cut).join('::')
    const entry = index.exact.get(cls) ?? (() => {
      const found = index.bySuffix.get(cls)
      return found?.length === 1 ? found[0] : undefined
    })()
    if (!entry) continue
    if (cut === parts.length) return entry.file
    return entry.members.get(parts[parts.length - 1]) ?? entry.file
  }
  return undefined
}

export function apiLinks(md: MarkdownIt, base: string) {
  if (!index.exact.size) return
  const prefix = `${base.replace(/\/?$/, '/')}api/`

  md.core.ruler.push('api_links', (state) => {
    for (const block of state.tokens) {
      if (block.type !== 'inline' || !block.children) continue
      const out: typeof block.children = []
      let inLink = 0
      for (const t of block.children) {
        if (t.type === 'link_open') inLink++
        if (t.type === 'link_close') inLink--
        const href = t.type === 'code_inline' && !inLink ? resolve(t.content) : undefined
        if (!href) { out.push(t); continue }

        const open = new state.Token('link_open', 'a', 1)
        // A target keeps VitePress's client router from trying to load the API page as one of its own.
        open.attrs = [['href', prefix + href], ['target', '_self'], ['class', 'api-link']]
        out.push(open, t, new state.Token('link_close', 'a', -1))
      }
      block.children = out
    }
  })
}
