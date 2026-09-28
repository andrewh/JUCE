import DefaultTheme from 'vitepress/theme'
import { h } from 'vue'
import type { Theme } from 'vitepress'
import ModuleGraph from './components/ModuleGraph.vue'
import ModuleTable from './components/ModuleTable.vue'
import SignalScope from './components/SignalScope.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  Layout: () => h(DefaultTheme.Layout, null, { 'home-hero-image': () => h(SignalScope) }),
  enhanceApp({ app }) {
    app.component('ModuleGraph', ModuleGraph)
    app.component('ModuleTable', ModuleTable)
  }
} satisfies Theme
