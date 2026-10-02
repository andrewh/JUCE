import { defineConfig } from 'vitepress'
import { flexoki } from './flexoki'
import { withMermaid } from 'vitepress-plugin-mermaid'
import data from '../data/modules.json'
import tutorials from '../data/tutorials.json'
import examples from '../data/examples.json'
import footnote from 'markdown-it-footnote'
import { apiLinks } from './apiLinks'

// GitHub Pages serves a project site from /<repo>/. Override with SITE_BASE=/ for a custom domain.
const base = process.env.SITE_BASE ?? '/JUCE/'

export default withMermaid(
  defineConfig({
    base,
    lang: 'en-GB',
    title: 'Learning JUCE',
    description: 'A personal field guide to the JUCE C++ framework: what it is, how the modules relate, and where it came from.',
    cleanUrls: false,
    lastUpdated: true,
    srcExclude: ['README.md'],
    // Mermaid imports fastdom, a CommonJS package. The dev server only converts it to an ES module
    // when it is pre-bundled; otherwise every page fails to load. https://vite.dev/config/dep-optimization-options#optimizedeps-include
    vite: {
      optimizeDeps: {
        include: ['mermaid > fastdom', 'mermaid > fastdom/extensions/fastdom-promised.js']
      }
    },
    head: [
      ['link', { rel: 'icon', href: `${base}favicon.svg`, type: 'image/svg+xml' }],
      ['link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }],
      ['link', { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }],
      [
        'link',
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:ital,wght@0,400;0,500;0,600;1,400&family=JetBrains+Mono:wght@400;500&family=Martian+Mono:wdth,wght@75..112,300..800&display=swap'
        }
      ]
    ],
    markdown: {
      lineNumbers: false,
      theme: { light: flexoki as any, dark: flexoki as any },
      config: (md) => {
        md.use(footnote)
        apiLinks(md, base)
      }
    },
    themeConfig: {
      logo: '/favicon.svg',
      nav: [
        { text: 'Guide', link: '/guide/what-is-juce', activeMatch: '/guide/' },
        { text: 'Tutorials', link: '/tutorials/', activeMatch: '/tutorials/' },
        { text: 'Examples', link: '/examples/', activeMatch: '/examples/' },
        { text: 'Playground', link: '/playground' },
        { text: 'Module map', link: '/reference/module-map' },
        { text: 'Glossary', link: '/reference/glossary' },
        { text: 'API reference', link: '/api/index.html', target: '_self' },
        { text: 'History', link: '/guide/history' },
        { text: 'Changelog', link: '/changelog' },
        { text: `JUCE ${data.version}`, link: 'https://github.com/juce-framework/JUCE' }
      ],
      sidebar: {
        '/tutorials/': [
          {
            text: 'Tutorials',
            items: [
              { text: 'Overview', link: '/tutorials/' },
              ...tutorials.guides.map((g) => ({ text: g.label, link: `/tutorials/${g.slug}` })),
              { text: 'Attribution', link: '/tutorials/notice' }
            ]
          }
        ],
        '/examples/': [
          { text: 'Examples', items: [{ text: 'Overview', link: '/examples/' }] },
          ...examples.groups
        ],
        '/': [
          {
            text: 'Understand',
            items: [
              { text: 'What is JUCE?', link: '/guide/what-is-juce' },
              { text: 'Architecture', link: '/guide/architecture' },
              { text: 'Core concepts', link: '/guide/core-concepts' },
              { text: 'Anatomy of a plug-in', link: '/guide/plugin-anatomy' },
              { text: 'Build systems', link: '/guide/build-systems' },
              { text: 'History', link: '/guide/history' }
            ]
          },
          {
            text: 'Reference',
            items: [
              { text: 'Module map', link: '/reference/module-map' },
              { text: 'Modules', link: '/reference/modules' },
              { text: 'Glossary', link: '/reference/glossary' }
            ]
          },
          {
            text: 'Learn',
            items: [
              { text: 'Learning path', link: '/guide/learning-path' },
              { text: 'Tutorials', link: '/tutorials/' },
              { text: 'Example browser', link: '/examples/' },
              { text: 'Audio playground', link: '/playground' },
              { text: 'Changelog', link: '/changelog' },
              { text: 'About this site', link: '/about' }
            ]
          }
        ]
      },
      outline: { level: [2, 3] },
      search: { provider: 'local' },
      socialLinks: [{ icon: 'github', link: 'https://github.com/juce-framework/JUCE' }],
      editLink: {
        pattern: 'https://github.com/andrewh/JUCE/edit/master/site/:path',
        text: 'Edit this page'
      },
      footer: {
        message: 'Personal study notes on JUCE. Not affiliated with or endorsed by the JUCE team.',
        copyright: 'JUCE is dual-licensed under AGPLv3 and a commercial licence; see <a href="https://github.com/juce-framework/JUCE/blob/master/LICENSE.md">LICENSE.md</a> for the details and third-party terms.'
      }
    }
  }),
  {
    mermaid: { securityLevel: 'loose', fontFamily: 'IBM Plex Sans, system-ui, sans-serif' }
  }
)
