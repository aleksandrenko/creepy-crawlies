/**
 * A glyph and a colour for every skill, derived from what the skill actually does.
 *
 * There are 354 skills, so unique art per skill is not on the table. Instead the icon is
 * chosen from the compiled mechanic: a flame means it burns, a shield means it shields, a
 * skull means it can execute. That makes the icon informative rather than decorative — you
 * can read a kit at a glance without opening a single tooltip.
 *
 * The mapping is ordered most-distinctive-first, because a skill often does several things
 * and the icon should show the one that matters.
 */

import type { Mechanic } from '../battle/mechanics';

export type IconKind =
  | 'revive'
  | 'execute'
  | 'heal'
  | 'shield'
  | 'cleanse'
  | 'strip'
  | 'stun'
  | 'dot'
  | 'aoe'
  | 'multihit'
  | 'drain'
  | 'buff'
  | 'debuff'
  | 'evade'
  | 'strike';

/** Broad family, used for the ring colour so categories are separable at a distance. */
export type IconFamily = 'damage' | 'heal' | 'buff' | 'debuff';

export const ICON_FAMILY: Record<IconKind, IconFamily> = {
  revive: 'heal',
  heal: 'heal',
  drain: 'heal',
  shield: 'buff',
  buff: 'buff',
  cleanse: 'buff',
  evade: 'buff',
  strip: 'debuff',
  stun: 'debuff',
  debuff: 'debuff',
  dot: 'debuff',
  execute: 'damage',
  aoe: 'damage',
  multihit: 'damage',
  strike: 'damage',
};

const DOT_KINDS = new Set(['burn', 'bleed', 'poison', 'dissolve']);
const STOP_KINDS = new Set(['stun', 'sleep', 'fear', 'doom']);
const DOWN_KINDS = new Set(['atkDown', 'defDown', 'spdDown', 'accDown', 'healBlock', 'noDodge']);
const HIDE_KINDS = new Set(['dodgeUp', 'untargetable', 'damageCut']);

export function iconFor(mechanic: Mechanic): IconKind {
  const applies = mechanic.applies ?? [];
  const self = mechanic.selfApplies ?? [];
  const all = [...applies, ...self];
  const has = (set: Set<string>) => all.some((s) => set.has(s.kind));

  if (mechanic.revive) return 'revive';
  if (mechanic.executeBelow) return 'execute';
  if (mechanic.shield) return 'shield';
  if (mechanic.heal) return 'heal';
  if (mechanic.drain) return 'drain';
  if (mechanic.cleanse) return 'cleanse';
  if (mechanic.strip) return 'strip';
  if (has(STOP_KINDS)) return 'stun';
  if (has(DOT_KINDS)) return 'dot';
  if (mechanic.target === 'allEnemies') return 'aoe';
  if (mechanic.hits > 1) return 'multihit';
  if (has(HIDE_KINDS)) return 'evade';
  if (has(DOWN_KINDS)) return 'debuff';
  // A pure buff only counts once damage has been ruled out, or every attack that also
  // buffs would show as a buff.
  if (mechanic.power === 0 && all.length > 0) return 'buff';
  if (all.some((s) => !DOWN_KINDS.has(s.kind) && !DOT_KINDS.has(s.kind)) && mechanic.power === 0) return 'buff';
  return 'strike';
}

/** Short human label for the icon, shown in the tooltip so the glyph is never a guess. */
export const ICON_LABEL: Record<IconKind, string> = {
  revive: 'Revive',
  execute: 'Execute',
  heal: 'Heal',
  shield: 'Shield',
  cleanse: 'Cleanse',
  strip: 'Strip buffs',
  stun: 'Disable',
  dot: 'Damage over time',
  aoe: 'Hits everyone',
  multihit: 'Multiple hits',
  drain: 'Drain',
  buff: 'Buff',
  debuff: 'Weaken',
  evade: 'Evasion',
  strike: 'Attack',
};

/**
 * The glyphs. Stroke-based on a 24x24 grid, using `currentColor`, so one set works at any
 * size and picks up the family colour without a second copy.
 */
const GLYPH: Record<IconKind, string> = {
  // A fang, for a plain hit.
  strike: '<path d="M6 4c2 5 3 9 6 16 3-7 4-11 6-16-4 1.6-8 1.6-12 0Z"/>',
  // Three slashes.
  multihit: '<path d="M4 18 12 5"/><path d="M9 19 17 6"/><path d="M14 20 22 7"/>',
  // Burst from a centre.
  aoe: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>',
  // Skull.
  execute:
    '<path d="M12 3c4.4 0 7 3 7 7 0 2.4-1 3.6-2 4.4V17a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-2.6C6 13.6 5 12.4 5 10c0-4 2.6-7 7-7Z"/>' +
    '<circle cx="9.5" cy="10.5" r="1.4" fill="currentColor" stroke="none"/>' +
    '<circle cx="14.5" cy="10.5" r="1.4" fill="currentColor" stroke="none"/>',
  // Flame, for burn/bleed/poison/dissolve.
  dot: '<path d="M12 21c3.9 0 6-2.5 6-5.5 0-4-3-5.5-3-9.5-2 1.5-3 3.5-3 5.5C11 9 9.5 7.5 9 5.5 7.5 8 6 10.5 6 15.5 6 18.5 8.1 21 12 21Z"/>',
  // A star, for stun and other "cannot act".
  stun: '<path d="M12 2.5 14.6 9h6.9l-5.6 4 2.1 6.6-6-4.2-6 4.2L8.1 13 2.5 9h6.9Z"/>',
  // Cross for healing.
  heal: '<path d="M12 5v14M5 12h14"/><circle cx="12" cy="12" r="9.2" stroke-opacity="0.45"/>',
  // Up arrow into a circle: something returned.
  revive:
    '<path d="M12 20V6"/><path d="M7.5 10.5 12 6l4.5 4.5"/>' +
    '<path d="M4 15a8 8 0 0 0 16 0" stroke-opacity="0.5"/>',
  shield: '<path d="M12 3 20 6v6c0 4.4-3.3 7.7-8 9-4.7-1.3-8-4.6-8-9V6Z"/>',
  // Sparkles being swept away.
  cleanse:
    '<path d="M7 21 17 5"/><path d="M13 3.5l1.4 2.6 2.6 1.4-2.6 1.4L13 11.5l-1.4-2.6L9 7.5l2.6-1.4Z"/>' +
    '<path d="M18.5 13l.9 1.6 1.6.9-1.6.9-.9 1.6-.9-1.6-1.6-.9 1.6-.9Z"/>',
  // A hand pulling something off.
  strip: '<path d="M5 12h9"/><path d="M10 7l-5 5 5 5"/><path d="M17 4v16" stroke-opacity="0.55"/>',
  // Two arrows, one in one out.
  drain: '<path d="M4 8h9l-3-3M20 16h-9l3 3"/><circle cx="12" cy="12" r="9.2" stroke-opacity="0.35"/>',
  buff: '<path d="M12 20V7"/><path d="M6.5 12.5 12 7l5.5 5.5"/><path d="M6 4h12" stroke-opacity="0.6"/>',
  debuff: '<path d="M12 4v13"/><path d="M17.5 11.5 12 17l-5.5-5.5"/><path d="M6 20h12" stroke-opacity="0.6"/>',
  // An eye with a line through it.
  evade:
    '<path d="M2.5 12S6 6.5 12 6.5 21.5 12 21.5 12S18 17.5 12 17.5 2.5 12 2.5 12Z"/>' +
    '<circle cx="12" cy="12" r="2.6"/><path d="M4 20 20 4"/>',
};

export function iconSvg(kind: IconKind): string {
  return (
    `<svg class="skill-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" ` +
    `stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">` +
    `${GLYPH[kind]}</svg>`
  );
}
