<script setup lang="ts">
import { withBase } from 'vitepress'
import SignalScope from './SignalScope.vue'
</script>

<template>
  <header class="home-intro">
    <div class="home-intro-text">
      <p class="eyebrow">A field guide to the JUCE C++ framework</p>
      <h1>Learning JUCE</h1>
      <p class="lede">
        <a href="https://juce.com">JUCE</a> is how a lot of audio software gets written: plug-ins, hosts,
        and standalone apps in C++ that build for every major platform. It is a big codebase with its own
        vocabulary. This site is a map of it.
      </p>
      <p>
        It is written from reading the source, and every claim cites the file or page it came from. Module
        diagrams are generated from the module headers, so they follow the code. Where a chart is computed
        from a formula rather than measured, the caption says so.
      </p>
      <ul class="purposes">
        <li><strong>Get oriented.</strong> What JUCE is for, and the five ideas behind it.</li>
        <li><strong>See how it fits together.</strong> Layers, threads, and how a plug-in is called.</li>
        <li><strong>Learn by doing.</strong> Tutorials and a staged learning path.</li>
      </ul>
      <p class="actions">
        <a class="btn brand" :href="withBase('/guide/what-is-juce')">What is JUCE?</a>
        <a class="btn alt" :href="withBase('/reference/module-map')">Module map</a>
        <a class="btn alt" :href="withBase('/tutorials/')">Tutorials</a>
      </p>
    </div>
    <div class="home-intro-scope">
      <SignalScope />
      <p class="scope-caption">
        <strong>What this shows:</strong> one call to <code>processBlock()</code>. A signal enters the audio
        thread in fixed-size blocks (blue) and leaves processed (pink), here with a gentle low-pass that
        softens the fastest wiggles. The signal is synthetic and the 48 kHz and 512-sample figures are typical
        values, not measurements. See <a :href="withBase('/guide/core-concepts#threads')">the audio thread</a>.
      </p>
    </div>
  </header>
</template>

<style scoped>
.home-intro {
  max-width: 1152px;
  margin: 0 auto;
  padding: calc(var(--vp-nav-height) + 40px) 24px 16px;
  display: flex;
  flex-direction: column;
  gap: 32px;
}
.eyebrow {
  margin: 0 0 12px;
  font-family: var(--jl-display);
  font-size: 12px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--jl-peak) !important;
}
.home-intro h1 {
  font-size: clamp(38px, 6vw, 56px);
  line-height: 1.1;
  margin: 0 0 20px;
  border: 0;
  padding: 0;
  font-family: var(--jl-display);
  letter-spacing: -0.02em;
  color: var(--vp-c-brand-1);
}
.home-intro p {
  margin: 0 0 14px;
  font-size: 16.5px;
  color: var(--vp-c-text-2);
  line-height: 1.65;
}
.home-intro .lede { font-size: 19px; line-height: 1.55; color: var(--vp-c-text-1); }
.purposes { margin: 0 0 20px; padding: 0; list-style: none; display: grid; gap: 8px; }
.purposes li { font-size: 16px; line-height: 1.5; color: var(--vp-c-text-2); padding-left: 14px; border-left: 3px solid var(--jl-peak); }
.purposes strong { color: var(--vp-c-text-1); }
.actions { display: flex; flex-wrap: wrap; gap: 10px; }
.btn {
  display: inline-block;
  padding: 9px 18px;
  font-size: 15px;
  font-weight: 600;
  border: 1px solid var(--vp-c-border);
  color: var(--vp-c-text-1);
  text-decoration: none;
}
.btn:hover { background: var(--vp-c-brand-soft); }
.btn.brand { background: var(--vp-button-brand-bg); color: var(--vp-button-brand-text); border-color: transparent; box-shadow: 4px 4px 0 var(--jl-peak); }
.btn.brand:hover { background: var(--vp-button-brand-hover-bg); }
.scope-caption { margin: 14px 0 0 !important; font-size: 14px !important; line-height: 1.6 !important; }
@media (min-width: 900px) {
  .home-intro { flex-direction: row; align-items: center; gap: 48px; }
  .home-intro-text { flex: 1.15 1 0; }
  .home-intro-scope { flex: 1 1 0; }
}
</style>
