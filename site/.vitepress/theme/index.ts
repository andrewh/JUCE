import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import ModuleGraph from './components/ModuleGraph.vue'
import ModuleTable from './components/ModuleTable.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('ModuleGraph', ModuleGraph)
    app.component('ModuleTable', ModuleTable)
  }
} satisfies Theme
