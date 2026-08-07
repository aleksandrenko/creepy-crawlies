/**
 * Shows who hit whom.
 *
 * Without this the battle is a log and some numbers changing — you cannot see the action.
 * A bolt is drawn from attacker to target on an SVG overlay, the target is shaken, and the
 * damage floats off it. Purely presentational: it reads the move that already happened and
 * never influences the engine.
 */

import { el } from './dom';

export type StrikeKind = 'hit' | 'heal' | 'buff' | 'debuff';

const COLOUR: Record<StrikeKind, string> = {
  hit: '#e8563a',
  heal: '#7fd48a',
  buff: '#e8c14a',
  debuff: '#b06cd5',
};

/** One overlay for the whole arena, sitting above the fighters but below the sheets. */
function overlay(host: HTMLElement): SVGSVGElement {
  const found = host.querySelector<SVGSVGElement>('.strike-layer');
  if (found) return found;
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.classList.add('strike-layer');
  svg.setAttribute('aria-hidden', 'true');
  host.appendChild(svg);
  return svg;
}

function centreOf(host: HTMLElement, unitId: string): { x: number; y: number } | null {
  const node = host.querySelector<HTMLElement>(`.fighter[data-unit="${unitId}"]`);
  if (!node) return null;
  const box = node.getBoundingClientRect();
  const frame = host.getBoundingClientRect();
  return { x: box.left - frame.left + box.width / 2, y: box.top - frame.top + box.height / 2 };
}

/**
 * Draws the bolt. Bowed rather than straight so a hit reads as travelling across the field
 * instead of as a static line, and so two simultaneous bolts do not overlap into one.
 */
export function showStrike(
  host: HTMLElement,
  fromId: string,
  toId: string,
  kind: StrikeKind,
): void {
  const from = centreOf(host, fromId);
  const to = centreOf(host, toId);
  if (!from || !to) return;

  const svg = overlay(host);
  const colour = COLOUR[kind];

  // Bow the line perpendicular to its own direction, scaled to its length.
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  const bow = Math.min(60, len * 0.18);
  const midX = (from.x + to.x) / 2 - (dy / len) * bow;
  const midY = (from.y + to.y) / 2 + (dx / len) * bow;

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', `M ${from.x} ${from.y} Q ${midX} ${midY} ${to.x} ${to.y}`);
  path.setAttribute('class', `strike strike--${kind}`);
  path.setAttribute('stroke', colour);
  svg.appendChild(path);

  // Dash the whole length, then animate the offset — the line draws itself on.
  const length = path.getTotalLength();
  path.style.strokeDasharray = `${length}`;
  path.style.strokeDashoffset = `${length}`;
  path.getBoundingClientRect(); // force layout so the transition actually runs
  path.style.strokeDashoffset = '0';

  const head = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  head.setAttribute('r', '5');
  head.setAttribute('class', 'strike-head');
  head.setAttribute('fill', colour);
  svg.appendChild(head);

  const started = performance.now();
  const travel = 260;
  function fly(now: number): void {
    const t = Math.min(1, (now - started) / travel);
    const p = path.getPointAtLength(length * t);
    head.setAttribute('cx', String(p.x));
    head.setAttribute('cy', String(p.y));
    if (t < 1) requestAnimationFrame(fly);
    else {
      head.remove();
      impact(host, toId, kind);
    }
  }
  requestAnimationFrame(fly);

  setTimeout(() => {
    path.classList.add('is-fading');
    setTimeout(() => path.remove(), 260);
  }, travel + 90);
}

/** The receiving end: a flash, a shake, and a ring. */
function impact(host: HTMLElement, unitId: string, kind: StrikeKind): void {
  const node = host.querySelector<HTMLElement>(`.fighter[data-unit="${unitId}"]`);
  if (!node) return;

  node.classList.remove('is-struck', 'is-mended');
  // Reading offsetWidth restarts the animation even if the class was just removed.
  void node.offsetWidth;
  node.classList.add(kind === 'heal' || kind === 'buff' ? 'is-mended' : 'is-struck');
  setTimeout(() => node.classList.remove('is-struck', 'is-mended'), 460);

  const ring = el(`<span class="impact impact--${kind}"></span>`);
  node.appendChild(ring);
  setTimeout(() => ring.remove(), 620);
}

/** Floating number over a fighter: damage, healing, or a miss. */
export function floatNumber(host: HTMLElement, unitId: string, text: string, kind: StrikeKind): void {
  const node = host.querySelector<HTMLElement>(`.fighter[data-unit="${unitId}"]`);
  if (!node) return;
  const chip = el(`<span class="float-num float-num--${kind}">${text}</span>`);
  // Spread repeats sideways so a five-hit skill does not stack five labels on one spot.
  const spread = node.querySelectorAll('.float-num').length;
  chip.style.setProperty('--nudge', `${(spread % 3) * 16 - 16}px`);
  node.appendChild(chip);
  setTimeout(() => chip.remove(), 1000);
}

/** Marks the unit about to act, so the turn order is visible before anything happens. */
export function markActor(host: HTMLElement, unitId: string | null): void {
  for (const node of host.querySelectorAll<HTMLElement>('.fighter.is-acting')) {
    node.classList.remove('is-acting');
  }
  if (!unitId) return;
  host.querySelector<HTMLElement>(`.fighter[data-unit="${unitId}"]`)?.classList.add('is-acting');
}
