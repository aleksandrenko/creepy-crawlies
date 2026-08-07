/**
 * Turns a species into the two textures a living card needs: the painted artwork, and a
 * depth map telling the shader what is near and what is far.
 *
 * The insect art is vector, so we get the depth map for free — the SVG's own alpha *is* a
 * perfect subject mask. Blur it, sit it on a mid-grey background, and the parallax has
 * something correct to work with. A photographic card would instead ship a baked depth map
 * (Depth Anything V2 or similar); `createLivingCard` does not care which it gets.
 */

import { RARITY_COLOR, type Species } from '../content/species';
import { insectSvg } from './silhouette';

const CARD_W = 512;
const CARD_H = 768;
const DEPTH_W = 128;
const DEPTH_H = 192;

/** Depth of the backdrop (~0.35). The shader pivots around 0.40, so this reads as "behind". */
const BACKDROP_DEPTH = '#595959';

export interface CardArt {
  art: HTMLCanvasElement;
  depth: HTMLCanvasElement;
}

function canvas2d(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  if (!ctx) throw new Error('2D canvas unavailable');
  return [c, ctx];
}

/** An SVG <img> needs intrinsic dimensions before a canvas will draw it reliably. */
function rasterise(svg: string, w: number, h: number): Promise<HTMLImageElement> {
  const sized = svg.replace('<svg ', `<svg width="${w}" height="${h}" `);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not rasterise insect SVG'));
    // A data URI stays same-origin, so the canvas is never tainted and getImageData works.
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(sized)}`;
  });
}

/** Backdrop the insect can parallax against — without one there is no depth to see. */
function paintBackdrop(ctx: CanvasRenderingContext2D, rarity: string): void {
  const glow = ctx.createRadialGradient(
    CARD_W * 0.5, CARD_H * 0.42, CARD_W * 0.05,
    CARD_W * 0.5, CARD_H * 0.5, CARD_H * 0.72,
  );
  glow.addColorStop(0, rarity);
  glow.addColorStop(0.45, '#1b2028');
  glow.addColorStop(1, '#0a0c10');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  // Speckle: high-frequency detail so parallax has texture to bite on.
  for (let i = 0; i < 1400; i++) {
    const x = Math.random() * CARD_W;
    const y = Math.random() * CARD_H;
    ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.05})`;
    ctx.fillRect(x, y, 1.5, 1.5);
  }

  const vignette = ctx.createRadialGradient(
    CARD_W * 0.5, CARD_H * 0.5, CARD_H * 0.25,
    CARD_W * 0.5, CARD_H * 0.5, CARD_H * 0.72,
  );
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(0,0,0,0.72)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, CARD_W, CARD_H);
}

/**
 * Paint one species into a living-card texture pair.
 *
 * `silhouette` matches the Codex's locked state — an undiscovered species still gets the
 * motion, just without the colours.
 */
export async function paintSpeciesCard(
  species: Species,
  opts: { silhouette?: boolean } = {},
): Promise<CardArt> {
  const locked = opts.silhouette === true;
  const rarity = RARITY_COLOR[species.rarity];

  const insetW = CARD_W * 0.82;
  const insetH = insetW * 1.5; // the insect viewBox is 100x150
  const insetX = (CARD_W - insetW) / 2;
  const insetY = CARD_H * 0.46 - insetH / 2;

  const coloured = await rasterise(insectSvg(species.body, species.palette), insetW, insetH);

  // --- artwork -----------------------------------------------------------
  const [art, actx] = canvas2d(CARD_W, CARD_H);
  paintBackdrop(actx, locked ? '#20242c' : rarity);

  if (locked) {
    // Draw the shape only, filled flat, so the outline still parallaxes.
    const [mask, mctx] = canvas2d(CARD_W, CARD_H);
    mctx.drawImage(coloured, insetX, insetY, insetW, insetH);
    mctx.globalCompositeOperation = 'source-in';
    mctx.fillStyle = '#05070a';
    mctx.fillRect(0, 0, CARD_W, CARD_H);
    actx.globalAlpha = 0.9;
    actx.drawImage(mask, 0, 0);
    actx.globalAlpha = 1;
  } else {
    actx.drawImage(coloured, insetX, insetY, insetW, insetH);
  }

  // --- depth map ---------------------------------------------------------
  // White where the insect is, mid-grey everywhere else, then softened so the
  // displacement does not tear along the silhouette.
  const [subject, sctx] = canvas2d(DEPTH_W, DEPTH_H);
  const dScale = DEPTH_W / CARD_W;
  sctx.drawImage(coloured, insetX * dScale, insetY * dScale, insetW * dScale, insetH * dScale);
  sctx.globalCompositeOperation = 'source-in';
  sctx.fillStyle = '#ffffff';
  sctx.fillRect(0, 0, DEPTH_W, DEPTH_H);

  const [depth, dctx] = canvas2d(DEPTH_W, DEPTH_H);
  dctx.fillStyle = BACKDROP_DEPTH;
  dctx.fillRect(0, 0, DEPTH_W, DEPTH_H);

  // A gentle centre bias, so even the backdrop has a little bowl-shaped depth.
  const bias = dctx.createRadialGradient(
    DEPTH_W * 0.5, DEPTH_H * 0.46, 0,
    DEPTH_W * 0.5, DEPTH_H * 0.5, DEPTH_H * 0.6,
  );
  bias.addColorStop(0, 'rgba(255,255,255,0.28)');
  bias.addColorStop(1, 'rgba(255,255,255,0)');
  dctx.fillStyle = bias;
  dctx.fillRect(0, 0, DEPTH_W, DEPTH_H);

  dctx.filter = 'blur(3px)'; // no-op on engines without canvas filters; still renders
  dctx.drawImage(subject, 0, 0);
  dctx.filter = 'none';

  return { art, depth };
}
