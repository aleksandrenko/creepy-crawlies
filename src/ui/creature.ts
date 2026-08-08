/**
 * The one place that decides how an insect is drawn.
 *
 * Two representations, and the player picks: the photograph, or the parametric 3D rig.
 * Every screen goes through here, so the switch is global and no screen needs to know it
 * happened. Do not call `insectSvg`, `mountInsect3d` or build an `<img>` from a screen.
 *
 * The markup path returns a *string*, because that is how the screens build their DOM. 3D
 * needs a real element with a lifecycle, so in model mode this emits a placeholder slot and
 * `installCreatureHydration()` fills it in as it appears — which keeps every screen's code
 * untouched and, just as importantly, disposes the WebGL view when the slot is removed.
 */

import type { Species } from '../content/species';
import { getSpecies } from '../content/species';
import { displayMode } from './displayMode';
import { escapeHtml } from './dom';
import { insect3dByKey, insectPortrait, is3dSupported, mountInsect3d, type Insect3dHandle } from './insect3d';
import { hasPhoto, photoUrl } from './photos';
import { insectSvg } from './silhouette';

/** Where the visual is being shown. Grids get a still; everything else gets live motion. */
export type CreatureContext = 'grid' | 'detail' | 'reveal' | 'egg' | 'battle';

export interface CreatureOptions {
  /**
   * Draw the shape only, with no colour — used for undiscovered Codex entries.
   * A replacement renderer must honour this or locked entries leak their species.
   */
  silhouette?: boolean;
  context?: CreatureContext;
  /** Lets battle address a specific mounted view later, to make it lunge. */
  key?: string;
}

const LIVE_CONTEXTS = new Set<CreatureContext>(['detail', 'reveal', 'battle']);

/**
 * Returns markup for the creature's visual, sized to fill its container.
 *
 * Always wrapped in a `.creature` element carrying the species and options, which is what
 * lets `refreshCreatures()` swap every visual on the page in place when the player flips the
 * display mode — without every screen having to expose a re-render hook.
 */
export function creatureVisual(species: Species, opts: CreatureOptions = {}): string {
  const locked = opts.silhouette === true;
  const context = opts.context ?? 'grid';
  return (
    `<span class="creature" data-species="${escapeHtml(species.id)}" data-context="${context}"` +
    `${locked ? ' data-locked="1"' : ''}${opts.key ? ` data-key="${escapeHtml(opts.key)}"` : ''}>` +
    inner(species, { ...opts, context }) +
    `</span>`
  );
}

function inner(species: Species, opts: CreatureOptions): string {
  const locked = opts.silhouette === true;
  const context = opts.context ?? 'grid';

  if (displayMode() === 'model' && is3dSupported()) {
    // A locked entry must not reveal its shape in 3D either, so it keeps the flat drawing.
    if (locked) return insectSvg(species.body, species.palette, { silhouette: true });

    if (LIVE_CONTEXTS.has(context)) {
      return (
        `<span class="creature-slot" data-species="${escapeHtml(species.id)}" ` +
        `data-context="${context}"${opts.key ? ` data-key="${escapeHtml(opts.key)}"` : ''}></span>`
      );
    }

    // Grids: one cached still per species rather than 118 live contexts.
    const still = insectPortrait(species);
    if (still) {
      return (
        `<img class="creature-photo creature-photo--model" src="${still}" ` +
        `alt="${escapeHtml(species.name)}" draggable="false" />`
      );
    }
  }

  if (hasPhoto(species.id)) {
    // `loading="lazy"` matters: the Codex shows 118 of these at once.
    return (
      `<img class="creature-photo${locked ? ' is-locked' : ''}" ` +
      `src="${photoUrl(species.id)}" alt="${escapeHtml(locked ? 'Undiscovered species' : species.name)}" ` +
      `loading="lazy" decoding="async" draggable="false" />`
    );
  }

  return insectSvg(species.body, species.palette, { silhouette: locked });
}

/**
 * Redraws every creature visual on the page for the current mode.
 *
 * Reads the options back off the wrapper rather than asking screens to re-render, so a
 * screen that was written before the 3D mode existed still switches correctly.
 */
export function refreshCreatures(root: ParentNode = document): void {
  for (const wrapper of root.querySelectorAll<HTMLElement>('.creature')) {
    const id = wrapper.dataset.species;
    if (!id) continue;
    let species: Species;
    try {
      species = getSpecies(id);
    } catch {
      continue;
    }
    // Tear down a live view before replacing the markup, or its WebGL view leaks.
    drain(wrapper);
    wrapper.innerHTML = inner(species, {
      silhouette: wrapper.dataset.locked === '1',
      context: (wrapper.dataset.context as CreatureContext) ?? 'grid',
      key: wrapper.dataset.key,
    });
    for (const slot of wrapper.querySelectorAll<HTMLElement>('.creature-slot')) fill(slot);
  }
}

/** True when this species falls back to the drawing, so callers can style accordingly. */
export function isDrawn(species: Species): boolean {
  return !hasPhoto(species.id);
}

/** Battle asks for this by unit id, to make the attacker lunge. */
export function creatureView(key: string): Insect3dHandle | undefined {
  return insect3dByKey(key);
}

// ── hydration ─────────────────────────────────────────────────────────────────

const mounted = new WeakMap<HTMLElement, Insect3dHandle>();

const SIZE: Record<CreatureContext, number> = {
  grid: 192,
  detail: 384,
  reveal: 384,
  egg: 256,
  battle: 320,
};

function fill(slot: HTMLElement): void {
  if (mounted.has(slot)) return;
  const id = slot.dataset.species;
  if (!id) return;

  let species: Species;
  try {
    species = getSpecies(id);
  } catch {
    return;
  }

  const context = (slot.dataset.context as CreatureContext) ?? 'detail';
  const handle = mountInsect3d(species, SIZE[context] ?? 256, slot.dataset.key);
  if (!handle) {
    // No WebGL after all — fall back rather than leave an empty box.
    slot.innerHTML = creatureVisual(species, { context });
    return;
  }
  slot.replaceChildren(handle.el);
  mounted.set(slot, handle);
}

function drain(node: Node): void {
  if (!(node instanceof HTMLElement)) return;
  const slots = node.classList?.contains('creature-slot')
    ? [node]
    : [...node.querySelectorAll<HTMLElement>('.creature-slot')];
  for (const slot of slots) {
    const handle = mounted.get(slot);
    if (handle) {
      handle.dispose();
      mounted.delete(slot);
    }
  }
}

let installed = false;

/**
 * Watches the document for creature slots appearing and disappearing.
 *
 * A global observer rather than a call in every screen: the screens build their DOM from
 * strings, so there is no single moment they could all be told to hydrate, and forgetting
 * one would leak a WebGL view rather than fail loudly.
 */
export function installCreatureHydration(): void {
  if (installed) return;
  installed = true;

  const sweep = (root: ParentNode) => {
    for (const slot of root.querySelectorAll<HTMLElement>('.creature-slot')) fill(slot);
  };

  new MutationObserver((records) => {
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (!(node instanceof HTMLElement)) continue;
        if (node.classList.contains('creature-slot')) fill(node);
        else sweep(node);
      }
      for (const node of record.removedNodes) drain(node);
    }
  }).observe(document.body, { childList: true, subtree: true });

  sweep(document);
}
