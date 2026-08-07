/**
 * Normalises every downloaded photo to the same square, so the cards can show them
 * whole instead of cropping a landscape shot into a portrait slot.
 *
 * Run with:  node scripts/normalise-photos.mjs
 *
 * The photos arrive at wildly different aspect ratios — 620x383, 465x620, 620x515 — and
 * a fixed-aspect card with object-fit: cover then cuts the subject in half. Cropping to
 * the largest centred square first means the UI never has to crop again. Wikipedia lead
 * images almost always centre the animal, so a centred crop is the right default.
 */
import { readdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const DIR = path.join(process.cwd(), 'public', 'insects');
const SIZE = 480;

const sips = (args) => execFileSync('/usr/bin/sips', args, { stdio: ['ignore', 'pipe', 'pipe'] });
const dims = (file) => {
  const out = sips(['-g', 'pixelWidth', '-g', 'pixelHeight', file]).toString();
  return {
    w: Number(/pixelWidth: (\d+)/.exec(out)?.[1] ?? 0),
    h: Number(/pixelHeight: (\d+)/.exec(out)?.[1] ?? 0),
  };
};

const files = (await readdir(DIR)).filter((f) => f.endsWith('.jpg'));
let done = 0;
for (const name of files) {
  const file = path.join(DIR, name);
  const { w, h } = dims(file);
  if (!w || !h) { console.log(`  skip ${name} — unreadable`); continue; }
  const side = Math.min(w, h);
  // Crop to the centred square, then scale that square to a uniform size.
  sips(['-c', String(side), String(side), file, '--out', file]);
  sips(['-z', String(SIZE), String(SIZE), '-s', 'formatOptions', '72', file, '--out', file]);
  done++;
}
console.log(`normalised ${done} of ${files.length} to ${SIZE}x${SIZE}`);
