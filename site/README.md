# Learning JUCE: docs site source

A personal study site about the JUCE framework, built with VitePress and
published to GitHub Pages from `../docs`.

```sh
npm install      # once
npm run dev      # live preview at http://localhost:5173/JUCE/
npm run deploy   # regenerate module data, build, copy into ../docs
```

- `scripts/gen-modules.mjs` parses `../modules/*/juce_*.h` into `data/modules.json`.
- `scripts/publish.mjs` copies the build into `../docs` and only touches files it
  created (tracked in `docs/.site-manifest.json`), leaving upstream JUCE docs alone.
- Set `SITE_BASE=/` when building for a custom domain.

GitHub Pages settings: Deploy from a branch, `master`, folder `/docs`.

## API reference (Doxygen)

The site embeds JUCE's Doxygen output at `/api/`, restyled to match the theme.

```
npm run api      # doxygen doxygen/Doxyfile -> public/api/ and data/juce.tag
```

- `doxygen/Doxyfile` inherits `../docs/doxygen/Doxyfile` and overrides output paths, header, footer and CSS. Styling lives in `doxygen/css/site-api.css`; `doxygen/js/theme-sync.js` follows the site's light/dark toggle.
- `.vitepress/apiLinks.ts` reads `data/juce.tag` and turns class names in inline code (`` `String` ``, `` `ci::Device` ``, `` `Timer::callAfterDelay()` ``) into links. Ambiguous bare names are left unlinked. With no tag file, nothing is linked and the build still works.
- Run `npm run api` before `npm run build` or `npm run deploy`. `public/api/` and `data/juce.tag` are git-ignored, but `deploy` copies `api/` into `../docs`, roughly 150 MB.
- Needs Doxygen and Graphviz (`dot`). JUCE's own Doxyfile targets 1.14; 1.9.8 works and only warns about newer tags.
