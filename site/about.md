# About this site

**A personal study project: notes on JUCE, written while learning it and kept in a fork of the JUCE repository.** It is unofficial and not affiliated with or endorsed by the JUCE team. The authoritative docs are at [docs.juce.com](https://docs.juce.com) and in the headers themselves.

## How it's built

| Piece | Choice |
| --- | --- |
| Generator | [VitePress](https://vitepress.dev) (Vue + Vite) |
| Diagrams | [Mermaid](https://mermaid.js.org) via `vitepress-plugin-mermaid`, plus a custom Vue component for the module map |
| Search | VitePress built-in local search (no external service) |
| Data | `site/scripts/gen-modules.mjs` parses the module declarations in `modules/*/juce_*.h` into `site/data/modules.json` on every build |
| Tutorials | `site/scripts/gen-tutorials.mjs` turns the Markdown in `docs/tutorials/` into the pages under `site/tutorials/` on every build |
| Hosting | GitHub Pages, deployed by the `site_pages.yml` workflow, which also generates the Doxygen API reference |

## Layout in the repository

```
JUCE/
├── site/                   ← source of this site (edit here)
│   ├── .vitepress/         ← config, theme, Vue components
│   ├── guide/ reference/   ← Markdown pages
│   ├── data/modules.json   ← generated from ../modules
│   ├── tutorials/          ← generated from ../docs/tutorials (git-ignored)
│   └── scripts/            ← gen-modules.mjs, publish.mjs
└── docs/                   ← committed static copy of the site, beside upstream's docs
    ├── index.html, assets/, guide/, reference/ … (generated)
    ├── .nojekyll, .site-manifest.json            (generated)
    └── CMake API.md, doxygen/ …                  (upstream JUCE, untouched)
    └── tutorials/*.md                            (source of the Tutorials pages)
```

`docs/` is shared with upstream JUCE's own documentation. The published site comes from the `site_pages.yml` workflow, which builds `site/` and the API reference on every push to `master` that touches the site. The static copy in `docs/` (without the API reference) is refreshed by hand. The deploy script writes a manifest of the files it generates, removes only those on the next deploy, and refuses to overwrite anything it didn't create. Upstream merges stay clean.

## Workflow

```sh
cd site
npm install          # once
npm run dev          # live preview at http://localhost:5173/JUCE/
npm run deploy       # regenerate data, build, refresh the static copy in ../docs
git add -A ../docs . && git commit -m "Update docs site"
```

Publishing happens in CI: in the GitHub repository settings, set **Pages → Build and deployment → Source** to **GitHub Actions**. To preview the API reference locally, run `npm run api` before `npm run build`.

## Sources and accuracy

- Claims carry numbered footnotes that link to a file in this repository or a public web page. Each page ends with a **Sources** section.
- Version and feature claims cite `CHANGE_LIST.md` and `BREAKING_CHANGES.md`. Release dates come from this fork's git history, which begins in January 2025, so earlier dates are approximate or omitted.
- Company history (Tracktion, ROLI, PACE) cites public write-ups, with retrieval dates. Where no source was found, the page says so instead of guessing.
- Some web sources were read only as search-result summaries and are marked as such in the footnote.
- The [Tutorials](./tutorials/) are condensed adaptations of the ISC-licensed JUCE tutorials, credited on each page and in the [attribution notice](./tutorials/notice). They are the tutorial authors' teaching material shortened and updated, so they do not carry the numbered footnotes of the other pages. Their code was checked against the JUCE 9.0.3 headers and syntax-checked with a compiler, but not run. Guides 15 to 17 (Box2D physics and music) are original to this repository and have no juce.com source. Their example apps in [`examples/Box2DMusic`](https://github.com/andrewh/JUCE/tree/master/examples/Box2DMusic) and [`examples/Box2DAudioV3`](https://github.com/andrewh/JUCE/tree/master/examples/Box2DAudioV3) were built on Linux and run under a virtual display with the physics and audio engines tested offline, but nobody has listened to them yet, and the claims about Box2D v3 come from its v3.1.1 headers and documentation.
- General audio-programming terms and rules of thumb (real-time rules, sample rate, denormals) are not individually sourced, and the pages say when a statement is this site's own reading.
- Corrections are welcome. See the [changelog](./changelog) for what has been fixed so far.
