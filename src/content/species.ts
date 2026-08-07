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

import { CORE } from './roster/core';
import { STRIKERS } from './roster/strikers';
import { STRIKERS_2 } from './roster/strikers2';
import { CONTROLLERS, TENDERS } from './roster/support';
import type { Rarity, Role, Species } from './types';

export * from './types';

export const SPECIES: Species[] = [...CORE, ...STRIKERS, ...STRIKERS_2, ...TENDERS, ...CONTROLLERS];

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
const duplicates = SPECIES.map((s) => s.id).filter((id, i, all) => all.indexOf(id) !== i);
if (duplicates.length > 0) {
  throw new Error(`Duplicate species ids in the roster: ${[...new Set(duplicates)].join(', ')}`);
}
