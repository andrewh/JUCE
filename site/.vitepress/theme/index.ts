import DefaultTheme from 'vitepress/theme'
import { h } from 'vue'
import type { Theme } from 'vitepress'
import ModuleGraph from './components/ModuleGraph.vue'
import ModuleTable from './components/ModuleTable.vue'
import LatencyChart from './components/LatencyChart.vue'
import SmoothingChart from './components/SmoothingChart.vue'
import ModuleSizeChart from './components/ModuleSizeChart.vue'
import CmajorPlayground from './components/CmajorPlayground.vue'
import HomeIntro from './components/HomeIntro.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  Layout: () => h(DefaultTheme.Layout, null, { 'home-features-before': () => h(HomeIntro) }),
  enhanceApp({ app }) {
    app.component('ModuleGraph', ModuleGraph)
    app.component('ModuleTable', ModuleTable)
    app.component('LatencyChart', LatencyChart)
    app.component('SmoothingChart', SmoothingChart)
    app.component('ModuleSizeChart', ModuleSizeChart)
    app.component('CmajorPlayground', CmajorPlayground)
  }
} satisfies Theme
