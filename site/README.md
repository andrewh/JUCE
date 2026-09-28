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
