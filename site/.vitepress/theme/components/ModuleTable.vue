<script setup lang="ts">
import data from '../../../data/modules.json'

const props = defineProps<{ group?: string }>()
const rows = data.modules
  .filter((m) => !props.group || m.group === props.group)
  .sort((a, b) => a.layer - b.layer || a.id.localeCompare(b.id))
</script>

<template>
  <table class="module-table">
    <thead>
      <tr><th>Module</th><th>Purpose (from its header)</th><th>Direct dependencies</th></tr>
    </thead>
    <tbody>
      <tr v-for="m in rows" :key="m.id">
        <td><a :href="`#${m.id.replace(/_/g, '-')}`"><code>{{ m.id }}</code></a></td>
        <td>{{ m.description }}</td>
        <td>
          <span v-if="!m.dependencies.length">—</span>
          <code v-for="d in m.dependencies" :key="d" class="dep">{{ d.replace(/^juce_/, '') }}</code>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<style scoped>
.dep { margin-right: 4px; white-space: nowrap; }
</style>
