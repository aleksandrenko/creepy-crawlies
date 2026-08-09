/**
 * Shows who hit whom, loudly.
 *
 * The first version of this was too quiet to read: a thin line for a quarter of a second.
 * Everything here is deliberately overstated instead — the attacker lunges, the rest of the
 * field dims so only the two involved are lit, a thick bolt travels between them, and the
 * target is flashed and shaken. Purely presentational: it reads a move that already
 * happened and never influences the engine.
 */

import { el } from './dom';

export type StrikeKind = 'hit' | 'heal' | 'buff' | 'debuff';

const COLOUR: Record<StrikeKind, string> = {
  hit: '#ff5a3c',
  heal: '#6fe08a',
  buff: '#ffd24a',
  debuff: '#c46cf0',
};

/** How long the bolt takes to cross the field. Slow enough to follow by eye. */
const TRAVEL = 420;

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

/**
 * The element standing for a unit.
 *
 * Two shapes exist: the card fallback's `.fighter`, and the 3D arena's floating name plate.
 * Damage numbers and flashes attach to whichever is present, so neither path needs its own
 * copy of this file.
 */
function fighterEl(host: HTMLElement, unitId: string): HTMLElement | null {
  return host.querySelector<HTMLElement>(
    `.fighter[data-unit="${unitId}"], .arena3d__label[data-unit="${unitId}"]`,
  );
}

function centreOf(host: HTMLElement, unitId: string): { x: number; y: number } | null {
  const node = fighterEl(host, unitId);
  if (!node) return null;
  const box = node.getBoundingClientRect();
  const frame = host.getBoundingClientRect();
  return { x: box.left - frame.left + box.width / 2, y: box.top - frame.top + box.height / 2 };
}

/**
 * Dims every fighter except the two taking part, so the eye is pulled to the exchange.
 * Without this a hit on a six-card field is easy to miss entirely.
 */
function spotlight(host: HTMLElement, ids: string[]): void {
  host.classList.add('is-striking');
  for (const node of host.querySelectorAll<HTMLElement>('.fighter')) {
    node.classList.toggle('is-lit', ids.includes(node.dataset.unit ?? ''));
  }
  window.clearTimeout(Number(host.dataset.spotlightTimer ?? 0));
  const timer = window.setTimeout(() => {
    host.classList.remove('is-striking');
    for (const node of host.querySelectorAll<HTMLElement>('.fighter.is-lit')) {
      node.classList.remove('is-lit');
    }
  }, TRAVEL + 620);
  host.dataset.spotlightTimer = String(timer);
}

export function showStrike(
  host: HTMLElement,
  fromId: string,
  toId: string,
  kind: StrikeKind,
): void {
  const from = centreOf(host, fromId);
  const to = centreOf(host, toId);
  if (!from || !to) return;

  spotlight(host, [fromId, toId]);

  const svg = overlay(host);
  const colour = COLOUR[kind];

  // Bow the line perpendicular to its own direction so it reads as travelling, and so two
  // simultaneous bolts do not collapse into one straight line.
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  const bow = Math.min(90, len * 0.22);
  const midX = (from.x + to.x) / 2 - (dy / len) * bow;
  const midY = (from.y + to.y) / 2 + (dx / len) * bow;
  const d = `M ${from.x} ${from.y} Q ${midX} ${midY} ${to.x} ${to.y}`;

  // Two strokes: a wide soft one for the glow, a bright thin one on top.
  const halo = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  halo.setAttribute('d', d);
  halo.setAttribute('class', `strike strike--halo strike--${kind}`);
  halo.setAttribute('stroke', colour);
  svg.appendChild(halo);

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', d);
  path.setAttribute('class', `strike strike--core strike--${kind}`);
  path.setAttribute('stroke', colour);
  svg.appendChild(path);

  // Dash the whole length, then animate the offset — the line draws itself on.
  for (const line of [halo, path]) {
    const length = line.getTotalLength();
    line.style.strokeDasharray = `${length}`;
    line.style.strokeDashoffset = `${length}`;
    line.getBoundingClientRect(); // force layout so the transition actually runs
    line.style.strokeDashoffset = '0';
  }

  lunge(host, fromId, dx, dy, len);

  // The travelling head, with a soft trail behind it.
  const trail = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  trail.setAttribute('r', '16');
  trail.setAttribute('class', 'strike-trail');
  trail.setAttribute('fill', colour);
  svg.appendChild(trail);

  const head = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  head.setAttribute('r', '8');
  head.setAttribute('class', 'strike-head');
  head.setAttribute('fill', '#fff');
  head.setAttribute('stroke', colour);
  svg.appendChild(head);

  const total = path.getTotalLength();
  const started = performance.now();
  function fly(now: number): void {
    const t = Math.min(1, (now - started) / TRAVEL);
    // Ease out, so the bolt lands rather than arriving at constant speed.
    const eased = 1 - (1 - t) * (1 - t);
    const p = path.getPointAtLength(total * eased);
    head.setAttribute('cx', String(p.x));
    head.setAttribute('cy', String(p.y));
    trail.setAttribute('cx', String(p.x));
    trail.setAttribute('cy', String(p.y));
    if (t < 1) requestAnimationFrame(fly);
    else {
      head.remove();
      trail.remove();
      impact(host, toId, kind);
    }
  }
  requestAnimationFrame(fly);

  setTimeout(() => {
    halo.classList.add('is-fading');
    path.classList.add('is-fading');
    setTimeout(() => {
      halo.remove();
      path.remove();
    }, 320);
  }, TRAVEL + 160);
}

/** The attacker leans into the blow, a short distance toward its target. */
function lunge(host: HTMLElement, fromId: string, dx: number, dy: number, len: number): void {
  const node = fighterEl(host, fromId);
  if (!node) return;
  const reach = 16;
  node.style.setProperty('--lunge-x', `${(dx / len) * reach}px`);
  node.style.setProperty('--lunge-y', `${(dy / len) * reach}px`);
  node.classList.remove('is-lunging');
  void node.offsetWidth;
  node.classList.add('is-lunging');
  setTimeout(() => node.classList.remove('is-lunging'), 460);
}

/** The receiving end: a colour flash over the card, a hard shake, and an expanding ring. */
function impact(host: HTMLElement, unitId: string, kind: StrikeKind): void {
  const node = fighterEl(host, unitId);
  if (!node) return;

  node.classList.remove('is-struck', 'is-mended');
  // Reading offsetWidth restarts the animation even if the class was just removed.
  void node.offsetWidth;
  node.classList.add(kind === 'heal' || kind === 'buff' ? 'is-mended' : 'is-struck');
  setTimeout(() => node.classList.remove('is-struck', 'is-mended'), 560);

  const flash = el(`<span class="impact-flash impact-flash--${kind}"></span>`);
  node.appendChild(flash);
  setTimeout(() => flash.remove(), 420);

  for (const delay of [0, 90]) {
    setTimeout(() => {
      const ring = el(`<span class="impact impact--${kind}"></span>`);
      node.appendChild(ring);
      setTimeout(() => ring.remove(), 640);
    }, delay);
  }

  if (kind === 'hit') {
    host.classList.remove('is-jolted');
    void host.offsetWidth;
    host.classList.add('is-jolted');
    setTimeout(() => host.classList.remove('is-jolted'), 220);
  }
}

/** Floating number over a fighter: damage, healing, or a miss. */
export function floatNumber(host: HTMLElement, unitId: string, text: string, kind: StrikeKind): void {
  const node = fighterEl(host, unitId);
  if (!node) return;
  const chip = el(`<span class="float-num float-num--${kind}">${text}</span>`);
  // Spread repeats sideways so a five-hit skill does not stack five labels on one spot.
  const spread = node.querySelectorAll('.float-num').length;
  chip.style.setProperty('--nudge', `${(spread % 3) * 20 - 20}px`);
  node.appendChild(chip);
  setTimeout(() => chip.remove(), 1100);
}

/** Marks the unit about to act, so the turn order is visible before anything happens. */
export function markActor(host: HTMLElement, unitId: string | null): void {
  for (const node of host.querySelectorAll<HTMLElement>('.fighter.is-acting')) {
    node.classList.remove('is-acting');
  }
  if (!unitId) return;
  fighterEl(host, unitId)?.classList.add('is-acting');
}

/**
 * Says in words what just happened, above the field.
 *
 * The animation carries the drama but not the detail; this carries the detail. Together
 * they mean you can follow a battle without reading the log at the bottom.
 */
export function announceStrike(host: HTMLElement, text: string, kind: StrikeKind): void {
  const slot = host.querySelector<HTMLElement>('.arena__callout');
  if (!slot) return;
  slot.textContent = text;
  slot.className = `arena__callout is-shown arena__callout--${kind}`;
  window.clearTimeout(Number(slot.dataset.timer ?? 0));
  const timer = window.setTimeout(() => slot.classList.remove('is-shown'), 1700);
  slot.dataset.timer = String(timer);
}
