// Generates lightweight, deterministic SVG artwork so the showcase has zero binary assets
// and a tiny, fast LCP image. In production these would be AEM Assets / Dynamic Media renditions.
import { writeFileSync, mkdirSync } from 'node:fs';

const OUT = new URL('../public/images/', import.meta.url);
mkdirSync(OUT, { recursive: true });

const rng = (seed) => () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;

const themes = {
  hero: ['#1b1033', '#ff5a7a', '#ffb347', 1600, 900],
  'offer-weekend': ['#0f2027', '#2c5364', '#f7b733', 1200, 800],
  'offer-encore': ['#1f1c2c', '#928dab', '#ffd194', 1200, 800],
  'offer-supper': ['#200122', '#6f0000', '#ff9a44', 1200, 800],
  'room-skyline': ['#0b132b', '#3a506b', '#5bc0be', 1200, 800],
  'room-platinum': ['#1a1a2e', '#16213e', '#e94560', 1200, 800],
  'room-stage': ['#2b1055', '#7597de', '#f5af19', 1200, 800],
  'room-penthouse': ['#141e30', '#243b55', '#f9d423', 1200, 800],
  'venue-amp': ['#12002b', '#ff0080', '#7928ca', 1200, 800],
  'venue-smoke': ['#1c0f0a', '#b33a1b', '#ffb347', 1200, 800],
  'venue-noodle': ['#0a1f1c', '#0f9b8e', '#ffd166', 1200, 800],
  'venue-sunrise': ['#3d2c4d', '#ff9a8b', '#ffe29f', 1200, 800],
};

for (const [name, [top, mid, glow, w, h]] of Object.entries(themes)) {
  const r = rng([...name].reduce((a, c) => a + c.charCodeAt(0), 7));
  let towers = '';
  for (let layer = 0; layer < 3; layer += 1) {
    const base = h * (0.62 + layer * 0.12);
    const opacity = 0.35 + layer * 0.3;
    let x = -20;
    while (x < w) {
      const bw = 40 + r() * 90;
      const bh = 60 + r() * (h * 0.32) * (1 - layer * 0.2);
      towers += `<rect x="${x.toFixed(0)}" y="${(base - bh).toFixed(0)}" width="${bw.toFixed(0)}" height="${(h - base + bh).toFixed(0)}" fill="#05030d" opacity="${opacity.toFixed(2)}"/>`;
      for (let i = 0; i < 6; i += 1) {
        if (r() > 0.55)
          towers += `<rect x="${(x + 6 + r() * (bw - 14)).toFixed(0)}" y="${(base - bh + 10 + r() * (bh - 20)).toFixed(0)}" width="5" height="7" fill="${glow}" opacity="${(0.5 + r() * 0.5).toFixed(2)}"/>`;
      }
      x += bw + 4 + r() * 10;
    }
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-hidden="true"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="0.7" stop-color="${mid}"/><stop offset="1" stop-color="${glow}"/></linearGradient><radialGradient id="s"><stop offset="0" stop-color="${glow}" stop-opacity=".95"/><stop offset="1" stop-color="${glow}" stop-opacity="0"/></radialGradient></defs><rect width="${w}" height="${h}" fill="url(#g)"/><circle cx="${w * 0.72}" cy="${h * 0.42}" r="${h * 0.28}" fill="url(#s)"/>${towers}</svg>`;
  writeFileSync(new URL(`${name}.svg`, OUT), svg);
}
console.log(`generated ${Object.keys(themes).length} images`);
