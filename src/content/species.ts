/**
 * The species catalogue — the game's static content, and the public entry point for it.
 *
 * The data lives in `roster/`, split by role so the files stay readable as the roster
 * grows. Everything the rest of the game needs is re-exported from here, so screens
 * only ever import from `content/species`.
 *
 * Every skill in the roster is derived from a real, documented trait of the real
 * animal. `fact` is the trait; the skills are that trait expressed as game rules.
 * Keep it that way when adding species: it is the whole point of the game.
 */

import { ACTIVE_SPECIES } from './roster/active';
import { CORE } from './roster/core';
import { STRIKERS } from './roster/strikers';
import { STRIKERS_2 } from './roster/strikers2';
import { STRIKERS_3 } from './roster/strikers3';
import { CONTROLLERS, TENDERS } from './roster/support';
import { CONTROLLERS_2, TENDERS_2 } from './roster/support2';
import type { Rarity, Role, Species } from './types';

export * from './types';

/** Everything written, active or not. Tooling — the photo fetcher — wants all of it. */
export const ALL_SPECIES: Species[] = [
  ...CORE,
  ...STRIKERS,
  ...STRIKERS_2,
  ...STRIKERS_3,
  ...TENDERS,
  ...TENDERS_2,
  ...CONTROLLERS,
  ...CONTROLLERS_2,
];

/**
 * The species in play, in the order `active.ts` lists them.
 *
 * Ordered by the list rather than by file, so the Codex reads as a deliberate roster.
 */
export const SPECIES: Species[] = ACTIVE_SPECIES.map((id) => {
  const found = ALL_SPECIES.find((s) => s.id === id);
  if (!found) throw new Error(`active.ts names a species that does not exist: ${id}`);
  return found;
});

export const SPECIES_BY_ID = new Map(SPECIES.map((s) => [s.id, s]));

export function getSpecies(id: string): Species {
  const s = SPECIES_BY_ID.get(id);
  if (!s) throw new Error(`Unknown species: ${id}`);
  return s;
}

export function speciesByRole(role: Role): Species[] {
  return SPECIES.filter((s) => s.role === role);
}

export function speciesByRarity(rarity: Rarity): Species[] {
  return SPECIES.filter((s) => s.rarity === rarity);
}

// Two ids must never collide: the Codex keys off them and so does every saved insect.
const duplicates = ALL_SPECIES.map((s) => s.id).filter((id, i, all) => all.indexOf(id) !== i);
if (duplicates.length > 0) {
  throw new Error(`Duplicate species ids in the roster: ${[...new Set(duplicates)].join(', ')}`);
}
