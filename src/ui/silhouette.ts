/**
 * Draws a top-down insect from the same `BodyParams` the 3D rig will use.
 *
 * This is deliberately the same data source as the future parametric 3D rig, so a
 * species defined once shows up correctly in cards now and in the scene later.
 */

import type { BodyParams, Palette } from '../content/species';

const VIEW_W = 100;
const VIEW_H = 150;
const CX = VIEW_W / 2;

interface Segment {
  cy: number;
  rx: number;
  ry: number;
}

function layout(body: BodyParams) {
  const s = body.size;
  const head: Segment = { cy: 30, rx: 7.5 * s, ry: 6.6 * s };
  const thorax: Segment = { cy: 50, rx: 9.5 * s * (0.75 + body.girth * 0.3), ry: 12 * s };
  const abdomenLen = 20 * s * body.abdomen;
  const abdomen: Segment = {
    cy: thorax.cy + thorax.ry + abdomenLen * 0.55,
    rx: 9 * s * body.girth,
    ry: abdomenLen * 0.62,
  };
  return { head, thorax, abdomen, s };
}

/** One leg: out from the thorax, elbowed, then back down to a foot. */
function leg(
  originY: number,
  side: 1 | -1,
  reach: number,
  sweep: number,
  thickness: number,
): string {
  const x0 = CX + side * 4;
  const kneeX = CX + side * reach;
  const kneeY = originY + sweep * 0.35;
  const footX = CX + side * reach * 0.82;
  const footY = originY + sweep;
  return (
    `<path d="M ${x0} ${originY} Q ${kneeX} ${kneeY - 3} ${kneeX} ${kneeY} ` +
    `Q ${kneeX + side * 1.5} ${(kneeY + footY) / 2} ${footX} ${footY}" ` +
    `stroke-width="${thickness.toFixed(2)}" />`
  );
}

/** Mantis-style folded foreleg: forward, up, then a hooked tibia back toward the head. */
function raptorial(originY: number, side: 1 | -1, s: number): string {
  const femurX = CX + side * 13 * s;
  const femurY = originY - 9 * s;
  const tibiaX = CX + side * 6 * s;
  const tibiaY = originY - 19 * s;
  return (
    `<path d="M ${CX + side * 4} ${originY} L ${femurX} ${femurY} L ${tibiaX} ${tibiaY}" ` +
    `stroke-width="${(2.6 * s).toFixed(2)}" stroke-linejoin="round" />`
  );
}

export function insectSvg(body: BodyParams, palette: Palette, opts: { silhouette?: boolean } = {}): string {
  const { head, thorax, abdomen, s } = layout(body);
  const flat = opts.silhouette === true;

  const carapace = flat ? 'currentColor' : palette.carapace;
  const underside = flat ? 'currentColor' : palette.underside;
  const accent = flat ? 'currentColor' : palette.accent;
  const eye = flat ? 'currentColor' : palette.eye;

  const parts: string[] = [];

  // --- legs, behind the body ---
  const legReach = 16 * s * body.legs;
  const legRows = [thorax.cy - thorax.ry * 0.55, thorax.cy, thorax.cy + thorax.ry * 0.6];
  const sweeps = [-7 * s, 5 * s, 15 * s];
  const legGroup: string[] = [];
  for (let i = 0; i < 3; i++) {
    // A mantis's first pair are the raptorial forelegs, not walking legs.
    if (i === 0 && body.raptorial) continue;
    for (const side of [1, -1] as const) {
      legGroup.push(leg(legRows[i]!, side, legReach * (i === 2 ? 1.15 : 1), sweeps[i]!, 2.1 * s));
    }
  }
  parts.push(
    `<g fill="none" stroke="${carapace}" stroke-linecap="round" opacity="0.95">${legGroup.join('')}</g>`,
  );

  // --- wings, over the abdomen ---
  if (body.wings === 2) {
    for (const side of [1, -1] as const) {
      parts.push(
        `<ellipse cx="${CX + side * abdomen.rx * 0.85}" cy="${abdomen.cy - abdomen.ry * 0.15}" ` +
          `rx="${(abdomen.rx * 0.78).toFixed(1)}" ry="${(abdomen.ry * 1.02).toFixed(1)}" ` +
          `transform="rotate(${side * 12} ${CX} ${abdomen.cy})" ` +
          `fill="${accent}" opacity="0.3" stroke="${accent}" stroke-width="0.7" stroke-opacity="0.6" />`,
      );
    }
  }

  // --- abdomen ---
  parts.push(
    `<ellipse cx="${CX}" cy="${abdomen.cy.toFixed(1)}" rx="${abdomen.rx.toFixed(1)}" ry="${abdomen.ry.toFixed(1)}" fill="${underside}" />`,
  );
  if (body.wings === 1) {
    // Hardened elytra: a seam down the middle of the abdomen.
    parts.push(
      `<ellipse cx="${CX}" cy="${abdomen.cy.toFixed(1)}" rx="${abdomen.rx.toFixed(1)}" ry="${abdomen.ry.toFixed(1)}" fill="${carapace}" />`,
      `<line x1="${CX}" y1="${(abdomen.cy - abdomen.ry * 0.92).toFixed(1)}" x2="${CX}" y2="${(abdomen.cy + abdomen.ry * 0.9).toFixed(1)}" stroke="${underside}" stroke-width="1.1" opacity="0.8" />`,
    );
  } else {
    // Soft abdomen: banded segments.
    const bands = 4;
    for (let i = 1; i < bands; i++) {
      const y = abdomen.cy - abdomen.ry + (abdomen.ry * 2 * i) / bands;
      const w = abdomen.rx * Math.sqrt(1 - Math.pow((y - abdomen.cy) / abdomen.ry, 2)) * 0.95;
      parts.push(
        `<line x1="${(CX - w).toFixed(1)}" y1="${y.toFixed(1)}" x2="${(CX + w).toFixed(1)}" y2="${y.toFixed(1)}" stroke="${carapace}" stroke-width="1.1" opacity="0.55" />`,
      );
    }
  }

  // --- thorax ---
  parts.push(
    `<ellipse cx="${CX}" cy="${thorax.cy.toFixed(1)}" rx="${thorax.rx.toFixed(1)}" ry="${thorax.ry.toFixed(1)}" fill="${carapace}" />`,
    `<ellipse cx="${CX}" cy="${(thorax.cy - thorax.ry * 0.15).toFixed(1)}" rx="${(thorax.rx * 0.45).toFixed(1)}" ry="${(thorax.ry * 0.5).toFixed(1)}" fill="${accent}" opacity="0.35" />`,
  );

  // --- raptorial forelegs, in front of the thorax ---
  if (body.raptorial) {
    parts.push(
      `<g fill="none" stroke="${carapace}" stroke-linecap="round">` +
        raptorial(thorax.cy - thorax.ry * 0.5, 1, s) +
        raptorial(thorax.cy - thorax.ry * 0.5, -1, s) +
        `</g>`,
    );
  }

  // --- head ---
  parts.push(
    `<ellipse cx="${CX}" cy="${head.cy.toFixed(1)}" rx="${head.rx.toFixed(1)}" ry="${head.ry.toFixed(1)}" fill="${carapace}" />`,
  );
  for (const side of [1, -1] as const) {
    parts.push(
      `<ellipse cx="${(CX + side * head.rx * 0.55).toFixed(1)}" cy="${(head.cy - head.ry * 0.2).toFixed(1)}" ` +
        `rx="${(head.rx * 0.36).toFixed(1)}" ry="${(head.ry * 0.42).toFixed(1)}" fill="${eye}" />`,
    );
  }

  // --- mandibles ---
  if (body.mandibles) {
    const m = body.mandibles * s;
    for (const side of [1, -1] as const) {
      parts.push(
        `<path d="M ${CX + side * head.rx * 0.5} ${head.cy - head.ry * 0.7} ` +
          `Q ${CX + side * head.rx * 0.9} ${head.cy - head.ry - 5 * m} ${CX + side * 1.5} ${head.cy - head.ry - 7 * m}" ` +
          `fill="none" stroke="${carapace}" stroke-width="${(2.2 * m).toFixed(2)}" stroke-linecap="round" />`,
      );
    }
  }

  // --- antennae ---
  if (body.antennae > 0) {
    const len = 20 * s * body.antennae;
    for (const side of [1, -1] as const) {
      parts.push(
        `<path d="M ${CX + side * head.rx * 0.5} ${head.cy - head.ry * 0.6} ` +
          `Q ${CX + side * (head.rx + len * 0.5)} ${head.cy - len * 0.55} ` +
          `${CX + side * (head.rx * 0.6 + len * 0.5)} ${head.cy - len}" ` +
          `fill="none" stroke="${carapace}" stroke-width="${(1.5 * s).toFixed(2)}" stroke-linecap="round" />`,
      );
    }
  }

  return (
    `<svg class="insect" viewBox="0 0 ${VIEW_W} ${VIEW_H}" xmlns="http://www.w3.org/2000/svg" ` +
    `aria-hidden="true" preserveAspectRatio="xMidYMid meet">${parts.join('')}</svg>`
  );
}
