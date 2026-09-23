/**
 * Regenerates the PWA icon renditions in `public/` from the single source of
 * truth, `assets/logo/source/psykl-icon.svg`.
 *
 * The delivered asset pack framed every rendition at ~54% coverage, which
 * reads as a small mark floating in whitespace once iOS and the browser add
 * their own padding on top. Each surface here gets the coverage that surface
 * actually wants, measured against the mark's true bounding box rather than
 * the source SVG's 1024 canvas.
 *
 * Renders through Chromium (already present for Playwright) so the geometry
 * matches what a browser will draw. Run: `node scripts/generate-icons.mjs`.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium } from '@playwright/test';

const HERE = dirname(fileURLToPath(import.meta.url));
const SOURCE = resolve(HERE, '../../../assets/logo/source/psykl-icon.svg');
const PUBLIC = resolve(HERE, '../public');

/** Brand ink, taken from the source SVG's fill. */
const INK = '#121212';
/** iOS home-screen icons must be opaque; Apple composites nothing behind them. */
const PAPER = '#ffffff';

const source = readFileSync(SOURCE, 'utf8');
const paths = [...source.matchAll(/d="([^"]*)"/g)].map((match) => match[1]);

/**
 * The mark is drawn as absolute-coordinate polygons (M/L/Z only), so its
 * bounding box is exactly the extent of its points — no curve flattening.
 */
function markBounds() {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const d of paths) {
    for (const [, rawX, rawY] of d.matchAll(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g)) {
      const x = Number.parseFloat(rawX);
      const y = Number.parseFloat(rawY);
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
  }
  // Square the box around the mark's centre so no rendition distorts it.
  const side = Math.max(maxX - minX, maxY - minY);
  return {
    x: (minX + maxX) / 2 - side / 2,
    y: (minY + maxY) / 2 - side / 2,
    side,
  };
}

const BOUNDS = markBounds();

/** An SVG cropped to the mark, optionally padded to a target coverage. */
function markSvg({ coverage, fill = INK, background = 'none', darkFill = null }) {
  const pad = (BOUNDS.side / coverage - BOUNDS.side) / 2;
  const round = (value) => Number(value.toFixed(2));
  const box = [BOUNDS.x - pad, BOUNDS.y - pad, BOUNDS.side + pad * 2, BOUNDS.side + pad * 2].map(round).join(' ');
  const style = darkFill
    ? `<style>.mark{fill:${fill}}@media (prefers-color-scheme:dark){.mark{fill:${darkFill}}}</style>`
    : '';
  const paper =
    background === 'none' ? '' : `<rect x="-9999" y="-9999" width="19998" height="19998" fill="${background}"/>`;
  // With a dark variant the fill comes from the stylesheet, so the paths must
  // not carry a fill attribute that pins them to one colour.
  const shapes = paths
    .map((d) => `<path class="mark" d="${d}"${darkFill ? '' : ` fill="${fill}"`} fill-rule="evenodd"/>`)
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${box}">${style}${paper}${shapes}</svg>`;
}

const PNG_TARGETS = [
  // iOS home screen. iOS rounds the corners itself; 82% keeps the mark clear
  // of the radius while filling far more of the tile than the pack's 54%.
  { file: 'apple-touch-icon.png', size: 180, coverage: 0.82, background: PAPER },
  // Android/Chrome `any` icons — no mask applied, so they can run close to the edge.
  { file: 'android-chrome-192x192.png', size: 192, coverage: 0.86, background: PAPER },
  { file: 'android-chrome-512x512.png', size: 512, coverage: 0.86, background: PAPER },
  // Maskable icons are cropped to a launcher-chosen shape. The guaranteed safe
  // zone is the centre 80% circle, so a square mark may occupy at most
  // 80% / sqrt(2) ≈ 56.5% of the width. This is a spec ceiling, not whitespace.
  { file: 'maskable-192x192.png', size: 192, coverage: 0.56, background: PAPER },
  { file: 'maskable-512x512.png', size: 512, coverage: 0.56, background: PAPER },
  // Tab favicons. These are not written out on their own — they exist only as
  // the frames inside favicon.ico, the fallback for browsers that ignore
  // favicon.svg. One file, not four, keeps the precache honest.
  { size: 16, coverage: 0.94 },
  { size: 32, coverage: 0.94 },
  { size: 48, coverage: 0.94 },
];

/** ICO entries may carry a whole PNG, which every browser still in use reads. */
function buildIco(entries) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(entries.length, 4);
  let offset = 6 + entries.length * 16;
  const directory = [];
  for (const { size, png } of entries) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0);
    entry.writeUInt8(size >= 256 ? 0 : size, 1);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(png.length, 8);
    entry.writeUInt32LE(offset, 12);
    directory.push(entry);
    offset += png.length;
  }
  return Buffer.concat([header, ...directory, ...entries.map((entry) => entry.png)]);
}

const browser = await chromium.launch();
const page = await browser.newPage();
const rendered = new Map();

for (const target of PNG_TARGETS) {
  const svg = markSvg({ coverage: target.coverage, background: target.background ?? 'none' });
  await page.setViewportSize({ width: target.size, height: target.size });
  await page.setContent(
    `<style>html,body{margin:0;padding:0;background:transparent}svg{display:block;width:${target.size}px;height:${target.size}px}</style>${svg}`,
  );
  const png = await page.screenshot({ omitBackground: !target.background });
  rendered.set(target.size, png);
  if (!target.file) continue;
  writeFileSync(resolve(PUBLIC, target.file), png);
  console.log(`${target.file} — ${target.size}px at ${Math.round(target.coverage * 100)}% coverage`);
}

writeFileSync(
  resolve(PUBLIC, 'favicon.ico'),
  buildIco([16, 32, 48].map((size) => ({ size, png: rendered.get(size) }))),
);
console.log('favicon.ico — 16/32/48');

// The one rendition that can follow the viewer's theme: browsers honour a
// prefers-color-scheme media query inside an SVG favicon.
writeFileSync(resolve(PUBLIC, 'favicon.svg'), markSvg({ coverage: 0.94, fill: INK, darkFill: '#ffffff' }));
writeFileSync(resolve(PUBLIC, 'safari-pinned-tab.svg'), markSvg({ coverage: 0.94, fill: '#000000' }));
console.log('favicon.svg, safari-pinned-tab.svg');

await browser.close();
