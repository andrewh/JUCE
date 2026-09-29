import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'
import data from '../data/modules.json'
import footnote from 'markdown-it-footnote'
import { apiLinks } from './apiLinks'

// GitHub Pages serves a project site from /<repo>/. Override with SITE_BASE=/ for a custom domain.
const base = process.env.SITE_BASE ?? '/JUCE/'

export default withMermaid(
  defineConfig({
    base,
    lang: 'en-GB',
    title: 'Learning JUCE',
    description: 'A field guide to the JUCE C++ framework: what it is, how the parts fit together, and where it came from.',
    cleanUrls: false,
    lastUpdated: true,
    srcExclude: ['README.md'],
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
      theme: { light: 'github-dark', dark: 'tokyo-night' },
      config: (md) => {
        md.use(footnote)
        apiLinks(md, base)
      }
    },
    themeConfig: {
      logo: '/favicon.svg',
      nav: [
        { text: 'Guide', link: '/guide/what-is-juce', activeMatch: '/guide/' },
        { text: 'Module map', link: '/reference/module-map' },
        { text: 'Glossary', link: '/reference/glossary' },
        { text: 'API reference', link: '/api/index.html', target: '_self' },
        { text: 'History', link: '/guide/history' },
        { text: 'Changelog', link: '/changelog' },
        { text: `JUCE ${data.version}`, link: 'https://github.com/andrewh/JUCE' }
      ],
      sidebar: [
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
            { text: 'Changelog', link: '/changelog' },
            { text: 'About this site', link: '/about' }
          ]
        }
      ],
      outline: { level: [2, 3] },
      search: { provider: 'local' },
      socialLinks: [{ icon: 'github', link: 'https://github.com/andrewh/JUCE' }],
      editLink: {
        pattern: 'https://github.com/andrewh/JUCE/edit/master/site/:path',
        text: 'Edit this page'
      },
      footer: {
        message: 'Personal study notes on JUCE. Not affiliated with or endorsed by the JUCE team.',
        copyright: 'JUCE is Copyright © Raw Material Software Limited. The JUCE modules are dual-licensed under AGPLv3 and the commercial JUCE licence; examples are ISC and bundled third-party code keeps its own licence. See <a href="https://github.com/andrewh/JUCE/blob/master/LICENSE.md">LICENSE.md</a>.'
      }
    }
  }),
  {
    mermaid: { securityLevel: 'loose', fontFamily: 'IBM Plex Sans, system-ui, sans-serif' }
  }
)
