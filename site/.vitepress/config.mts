import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'
import data from '../data/modules.json'

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
    head: [['link', { rel: 'icon', href: `${base}favicon.svg`, type: 'image/svg+xml' }]],
    markdown: { lineNumbers: false },
    themeConfig: {
      logo: '/favicon.svg',
      nav: [
        { text: 'Guide', link: '/guide/what-is-juce', activeMatch: '/guide/' },
        { text: 'Module map', link: '/reference/module-map' },
        { text: 'Glossary', link: '/reference/glossary' },
        { text: 'History', link: '/guide/history' },
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
        copyright: 'JUCE is © Raw Material Software Limited, licensed under AGPLv3 or a commercial licence.'
      }
    }
  }),
  {
    mermaid: { securityLevel: 'loose' }
  }
)
