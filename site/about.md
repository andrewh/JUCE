# About this site

**A personal study project: documentation of JUCE, written while learning it, living in a fork of the JUCE repository.** It is unofficial and not affiliated with or endorsed by the JUCE team. The authoritative docs are at [docs.juce.com](https://docs.juce.com) and in the headers themselves.

## How it's built

| Piece | Choice |
| --- | --- |
| Generator | [VitePress](https://vitepress.dev) (Vue + Vite) |
| Diagrams | [Mermaid](https://mermaid.js.org) via `vitepress-plugin-mermaid`, plus a custom Vue component for the module map |
| Search | VitePress built-in local search (no external service) |
| Data | `site/scripts/gen-modules.mjs` parses the module declarations in `modules/*/juce_*.h` into `site/data/modules.json` on every build |
| Hosting | GitHub Pages, serving the pre-built files in `docs/` (no GitHub Actions) |

## Layout in the repository

```
JUCE/
├── site/                   ← source of this site (edit here)
│   ├── .vitepress/         ← config, theme, Vue components
│   ├── guide/ reference/   ← Markdown pages
│   ├── data/modules.json   ← generated from ../modules
│   └── scripts/            ← gen-modules.mjs, publish.mjs
└── docs/                   ← what GitHub Pages serves
    ├── index.html, assets/, guide/, reference/ … (generated)
    ├── .nojekyll, .site-manifest.json            (generated)
    └── CMake API.md, doxygen/ …                  (upstream JUCE, untouched)
```

`docs/` is shared with upstream JUCE's own documentation. The deploy script writes a manifest of the files it generates, removes only those on the next deploy, and refuses to overwrite anything it didn't create. Upstream merges stay clean.

## Workflow

```sh
cd site
npm install          # once
npm run dev          # live preview at http://localhost:5173/JUCE/
npm run deploy       # regenerate data, build, copy into ../docs
git add -A ../docs . && git commit -m "Update docs site"
```

Then, in the GitHub repository settings: **Pages → Build and deployment → Deploy from a branch → `master` / `/docs`**.

## Sources and accuracy

- Claims carry numbered footnotes that link to a file in this repository or a public web page. Each page ends with a **Sources** section.
- Version and feature claims cite `CHANGE_LIST.md` and `BREAKING_CHANGES.md`. Release dates come from this fork's git history, which begins in January 2025, so earlier dates are approximate or omitted.
- Company history (Tracktion, ROLI, PACE) cites public write-ups, with retrieval dates. Where no source was found, the page says so instead of guessing.
- Some web sources were read only as search-result summaries and are marked as such in the footnote.
- General audio-programming terms and rules of thumb (real-time rules, sample rate, denormals) are not individually sourced, and the pages say when a statement is this site's own reading.
- Corrections are welcome. See the [changelog](./changelog) for what has been fixed so far.
