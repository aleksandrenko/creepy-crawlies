/**
 * Real photographs of the real animals, and the credit each one legally requires.
 *
 * `public/insects/` holds one freely licensed photo per species, fetched by
 * `scripts/fetch-photos.mjs`. Five species have no usable photo — either nothing on
 * Wikipedia or a licence we cannot redistribute — and they fall back to the procedural
 * drawing, which is why every caller has to cope with `null`.
 *
 * The credits are not decoration: most of these are CC BY or CC BY-SA, which require
 * naming the author. `photoCredit()` feeds the line the Codex shows.
 */

import credits from '../../public/insects/credits.json';

export interface PhotoCredit {
  latin: string;
  author: string;
  license: string;
  licenseUrl: string;
  source: string;
}

const CREDITS = credits as Record<string, PhotoCredit>;

export function hasPhoto(speciesId: string): boolean {
  return speciesId in CREDITS;
}

export function photoCredit(speciesId: string): PhotoCredit | null {
  return CREDITS[speciesId] ?? null;
}

/** Vite rewrites BASE_URL for GitHub Pages, where the site is served from a subpath. */
export function photoUrl(speciesId: string): string {
  return `${import.meta.env.BASE_URL}insects/${speciesId}.jpg`;
}

const cache = new Map<string, Promise<HTMLImageElement | null>>();

/**
 * Loads a species photo, or resolves to null if there is not one.
 *
 * Resolving null rather than rejecting keeps the call sites simple: a missing photo is an
 * expected outcome, not an error. Kept `crossOrigin`-free because the images are served
 * from our own origin, so the canvas stays untainted and `getImageData` keeps working.
 */
export function loadPhoto(speciesId: string): Promise<HTMLImageElement | null> {
  if (!hasPhoto(speciesId)) return Promise.resolve(null);

  const cached = cache.get(speciesId);
  if (cached) return cached;

  const pending = new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = photoUrl(speciesId);
  });

  cache.set(speciesId, pending);
  return pending;
}

export function creditLine(speciesId: string): string | null {
  const c = photoCredit(speciesId);
  if (!c) return null;
  return `Photo: ${c.author} · ${c.license}`;
}
