// Builds the starter-project zips that tutorials offer for download.
//
// The tutorial Markdown stays the only source. A guide opts in with a comment at the top of
// the section that lists its files:
//
//   <!-- starter-zip: SynthDemo -->
//
// From that comment to the next "## " heading, every bold file name followed by a code fence
//
//   **`MainComponent.h`**
//
//   ```cpp
//   ...
//   ```
//
// becomes a file in <name>/ inside <name>.zip. The zip is written next to the Markdown
// (docs/tutorials/downloads/, so the link works on GitHub) and into site/public/tutorials/downloads/
// (so it works on the site). Timestamps are fixed so that rebuilding does not change the bytes.
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { deflateRawSync } from 'node:zlib'

const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = join(here, '..', '..')
const srcDir = join(repoRoot, 'docs', 'tutorials')
const outDirs = [join(srcDir, 'downloads'), join(here, '..', 'public', 'tutorials', 'downloads')]

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})
const crc32 = (buf) => {
  let c = 0xffffffff
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

// Minimal zip writer: deflate, UTF-8 names, fixed 2026-01-01 timestamp.
const makeZip = (files) => {
  const dosTime = 0
  const dosDate = ((2026 - 1980) << 9) | (1 << 5) | 1
  const local = []
  const central = []
  let offset = 0

  for (const { name, data } of files) {
    const nameBuf = Buffer.from(name, 'utf8')
    const packed = deflateRawSync(data, { level: 9 })
    const crc = crc32(data)

    const head = Buffer.alloc(30)
    head.writeUInt32LE(0x04034b50, 0)
    head.writeUInt16LE(20, 4)
    head.writeUInt16LE(0x0800, 6)            // UTF-8 names
    head.writeUInt16LE(8, 8)                 // deflate
    head.writeUInt16LE(dosTime, 10)
    head.writeUInt16LE(dosDate, 12)
    head.writeUInt32LE(crc, 14)
    head.writeUInt32LE(packed.length, 18)
    head.writeUInt32LE(data.length, 22)
    head.writeUInt16LE(nameBuf.length, 26)
    local.push(head, nameBuf, packed)

    const entry = Buffer.alloc(46)
    entry.writeUInt32LE(0x02014b50, 0)
    entry.writeUInt16LE(20, 4)
    entry.writeUInt16LE(20, 6)
    entry.writeUInt16LE(0x0800, 8)
    entry.writeUInt16LE(8, 10)
    entry.writeUInt16LE(dosTime, 12)
    entry.writeUInt16LE(dosDate, 14)
    entry.writeUInt32LE(crc, 16)
    entry.writeUInt32LE(packed.length, 20)
    entry.writeUInt32LE(data.length, 24)
    entry.writeUInt16LE(nameBuf.length, 28)
    entry.writeUInt32LE(0o100644 << 16 >>> 0, 38)   // Unix mode, read by unzip on macOS and Linux
    entry.writeUInt16LE(3 << 8 | 20, 4)             // made by Unix
    entry.writeUInt32LE(offset, 42)
    central.push(entry, nameBuf)

    offset += head.length + nameBuf.length + packed.length
  }

  const centralBuf = Buffer.concat(central)
  const end = Buffer.alloc(22)
  end.writeUInt32LE(0x06054b50, 0)
  end.writeUInt16LE(files.length, 8)
  end.writeUInt16LE(files.length, 10)
  end.writeUInt32LE(centralBuf.length, 12)
  end.writeUInt32LE(offset, 16)
  return Buffer.concat([...local, centralBuf, end])
}

for (const dir of outDirs) mkdirSync(dir, { recursive: true })

// Every file under dir (relative paths, sorted), without the example's own README.
const listFiles = (dir, prefix = '') =>
  readdirSync(join(dir, prefix), { withFileTypes: true })
    .sort((a, b) => (a.name < b.name ? -1 : 1))
    .flatMap((e) => {
      const rel = prefix ? `${prefix}/${e.name}` : e.name
      if (e.isDirectory()) return listFiles(dir, rel)
      return rel === 'README.md' ? [] : [rel]
    })

let count = 0
for (const file of readdirSync(srcDir).filter((f) => /^\d\d-.*\.md$/.test(f)).sort()) {
  const text = readFileSync(join(srcDir, file), 'utf8')

  for (const m of text.matchAll(/<!-- starter-zip: (\S+)(?: from (\S+))? -->/g)) {
    const name = m[1]
    const rest = text.slice(m.index + m[0].length)
    const section = rest.slice(0, rest.search(/^## /m) === -1 ? undefined : rest.search(/^## /m))

    const listed = [...section.matchAll(/^\*\*`([^`]+)`\*\*\n+```[a-z]*\n([\s\S]*?)\n```/gm)]
      .map(([, path, body]) => [path, Buffer.from(body + '\n', 'utf8')])

    const byPath = new Map()
    if (m[2]) {
      const folder = join(repoRoot, m[2])
      for (const rel of listFiles(folder)) byPath.set(rel, readFileSync(join(folder, rel)))
    }
    for (const [path, data] of listed) byPath.set(path, data)

    const files = [...byPath].map(([path, data]) => ({ name: `${name}/${path}`, data }))

    if (files.length === 0) throw new Error(`${file}: starter-zip "${name}" lists no files`)

    const zip = makeZip(files)
    for (const dir of outDirs) writeFileSync(join(dir, `${name}.zip`), zip)
    console.log(`Wrote ${name}.zip (${files.map((f) => f.name.split('/').pop()).join(', ')}) from ${file}`)
    count++
  }
}
console.log(`Wrote ${count} starter zip(s) to ${outDirs.map((d) => relative(repoRoot, d)).join(' and ')}`)
