<script setup lang="ts">
import { withBase } from 'vitepress'
import SignalScope from './SignalScope.vue'
</script>

<template>
  <header class="home-intro">
    <div class="home-intro-text">
      <h1>Learning JUCE</h1>
      <p>
        A personal field guide to <a href="https://juce.com">JUCE</a>, the C++ framework for audio
        applications and plug-ins. It is written from reading the source, and every claim cites the
        file or page it came from.
      </p>
      <p>
        Start with <a :href="withBase('/guide/what-is-juce')">What is JUCE?</a>, or go straight to the
        <a :href="withBase('/reference/module-map')">module map</a>.
      </p>
    </div>
    <div class="home-intro-scope"><SignalScope /></div>
  </header>
</template>

<style scoped>
.home-intro {
  max-width: 1152px;
  margin: 0 auto;
  padding: calc(var(--vp-nav-height) + 32px) 24px 8px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.home-intro h1 {
  font-size: 32px;
  line-height: 1.2;
  margin: 0 0 12px;
  color: var(--vp-c-brand-1);
}
.home-intro p {
  margin: 0 0 8px;
  color: var(--vp-c-text-2);
  line-height: 1.6;
}
@media (min-width: 768px) {
  .home-intro { flex-direction: row; align-items: center; }
  .home-intro-text { flex: 1 1 0; max-width: 520px; }
  .home-intro-scope { flex: 1.1 1 0; }
}
</style>
