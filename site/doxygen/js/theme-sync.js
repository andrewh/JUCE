// Follows the VitePress site's light/dark choice. VitePress stores it in
// localStorage under 'vitepress-theme-appearance' ('dark', 'light' or 'auto').
(function () {
  var key = 'vitepress-theme-appearance';
  var root = document.documentElement;
  function stored() { try { return localStorage.getItem(key) || 'auto'; } catch (e) { return 'auto'; } }
  function apply() {
    var v = stored();
    var dark = v === 'dark' || (v !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    root.classList.toggle('dark', dark);
  }
  apply();
  document.addEventListener('DOMContentLoaded', function () {
    var b = document.getElementById('theme-toggle');
    if (!b) return;
    b.addEventListener('click', function () {
      var dark = !root.classList.contains('dark');
      try { localStorage.setItem(key, dark ? 'dark' : 'light'); } catch (e) {}
      apply();
    });
  });
})();
