/**
 * The one place that decides how an insect is drawn.
 *
 * Right now it renders the procedural SVG in `silhouette.ts`. A LivingCard module is
 * being written separately to replace it, and later that may become 3D. Every screen
 * goes through here precisely so that swap touches this file and nothing else —
 * do not call `insectSvg` directly from a screen.
 */

import type { Species } from '../content/species';
import { insectSvg } from './silhouette';

export interface CreatureOptions {
  /**
   * Draw the shape only, with no colour — used for undiscovered Codex entries.
   * A replacement renderer must honour this or locked entries will leak their species.
   */
  silhouette?: boolean;
  /** Where it is being shown. A richer renderer can use this to pick a level of detail. */
  context?: 'card' | 'detail' | 'reveal' | 'egg';
}

/** Returns markup for the creature's visual, sized to fill its container. */
export function creatureVisual(species: Species, opts: CreatureOptions = {}): string {
  return insectSvg(species.body, species.palette, { silhouette: opts.silhouette === true });
}
