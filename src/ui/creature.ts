/**
 * The one place that decides how an insect is drawn.
 *
 * A real photograph whenever we hold one we are allowed to ship, and the procedural
 * drawing in `silhouette.ts` for the handful of species where we do not. Every screen goes
 * through here so that swap — and the animated `livingCard` treatment — touches this file
 * and not each screen in turn. Do not call `insectSvg` or build an `<img>` directly.
 */

import type { Species } from '../content/species';
import { escapeHtml } from './dom';
import { hasPhoto, photoUrl } from './photos';
import { insectSvg } from './silhouette';

export interface CreatureOptions {
  /**
   * Draw the shape only, with no colour — used for undiscovered Codex entries.
   * A replacement renderer must honour this or locked entries leak their species.
   */
  silhouette?: boolean;
  /** Where it is being shown. A richer renderer can use this to pick a level of detail. */
  context?: 'card' | 'detail' | 'reveal' | 'egg';
}

/** Returns markup for the creature's visual, sized to fill its container. */
export function creatureVisual(species: Species, opts: CreatureOptions = {}): string {
  const locked = opts.silhouette === true;

  if (hasPhoto(species.id)) {
    // `loading="lazy"` matters: the Codex shows 68 of these at once.
    return (
      `<img class="creature-photo${locked ? ' is-locked' : ''}" ` +
      `src="${photoUrl(species.id)}" alt="${escapeHtml(locked ? 'Undiscovered species' : species.name)}" ` +
      `loading="lazy" decoding="async" draggable="false" />`
    );
  }

  return insectSvg(species.body, species.palette, { silhouette: locked });
}

/** True when this species falls back to the drawing, so callers can style accordingly. */
export function isDrawn(species: Species): boolean {
  return !hasPhoto(species.id);
}
