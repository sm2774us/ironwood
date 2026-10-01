/* global localStorage, document */
// Apply the stored theme before first paint to avoid a flash (CLS/FOUC).
// A same-origin file rather than an inline script, so the CSP can stay script-src 'self'.
try {
  var t = JSON.parse(localStorage.getItem('ironwood-ui') || '{}').state;
  if (t && t.theme === 'light') document.documentElement.classList.remove('dark');
} catch {
  /* storage unavailable: keep the default theme */
}
