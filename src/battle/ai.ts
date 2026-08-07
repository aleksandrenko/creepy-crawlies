/**
 * Picks a move for a unit the local player does not control.
 *
 * Deterministic, like the engine: it reads only the state, so both peers would choose the
 * same move for the same position. Used for the AI skirmish, and as the fallback if a
 * remote player's move never arrives.
 */

import {
  activeUnit,
  effSpd,
  legalTargets,
  skillReady,
  type BattleState,
  type Move,
  type Unit,
} from './engine';
import { compiled, DEBUFFS } from './mechanics';

/** Targets these skills pick for themselves, so the AI need only score them once. */
const SELF_TARGETING = new Set([
  'self', 'allEnemies', 'allAllies', 'lowestAlly', 'lowestEnemy',
  'fastestEnemy', 'strongestEnemy', 'fallenAlly',
]);

export function chooseMove(state: BattleState): Move | null {
  const actor = activeUnit(state);
  if (!actor) return null;

  const species = compiled(actor.speciesId);
  let best: { move: Move; score: number } | null = null;

  for (const index of [0, 1, 2] as const) {
    if (!skillReady(actor, index)) continue;
    const mechanic = species.skills[index].mechanic;
    const pool = legalTargets(state, actor, mechanic);
    if (pool.length === 0) continue;

    const candidates = SELF_TARGETING.has(mechanic.target) ? [pool[0]!] : pool;

    for (const target of candidates) {
      const score = rate(state, actor, index, target);
      if (!best || score > best.score) {
        best = { move: { unitId: actor.id, skill: index, targetId: target.id }, score };
      }
    }
  }

  if (best) return best.move;

  // Skill 0 never has a cooldown, so there is always something legal to do.
  const fallback = legalTargets(state, actor, species.skills[0].mechanic)[0];
  return { unitId: actor.id, skill: 0, targetId: fallback?.id ?? null };
}

function rate(state: BattleState, actor: Unit, index: 0 | 1 | 2, target: Unit): number {
  const species = compiled(actor.speciesId);
  const m = species.skills[index].mechanic;
  let score = 0;

  // Damage, weighted so finishing something off beats chipping at a full-health unit.
  if (m.power > 0) {
    const rough = actor.atk * m.power * Math.max(1, m.hits);
    score += rough * 0.02;
    if (m.target === 'allEnemies') score += rough * 0.02 * (countEnemies(state, actor) - 1);
    if (target.hp < rough) score += 60;
    if (m.executeBelow && target.hp / target.maxHp <= m.executeBelow) score += 120;
  }

  // Healing and reviving are only worth it when someone actually needs it.
  if (m.revive) {
    const fallen = state.units.some((u) => u.side === actor.side && u.hp <= 0);
    score += fallen ? 200 : -100;
  }
  if (m.heal) {
    const worst = state.units
      .filter((u) => u.side === actor.side && u.hp > 0)
      .reduce((low, u) => Math.min(low, u.hp / u.maxHp), 1);
    score += worst < 0.6 ? (1 - worst) * 90 : -25;
  }
  if (m.shield) score += 20;

  // Statuses: do not waste them on something the target already has.
  for (const spec of m.applies ?? []) {
    const already = target.statuses.some((s) => s.kind === spec.kind);
    const value = spec.kind === 'stun' || spec.kind === 'sleep' || spec.kind === 'doom' ? 55 : 18;
    score += already ? -8 : value;
  }
  for (const spec of m.selfApplies ?? []) {
    score += actor.statuses.some((s) => s.kind === spec.kind) ? -8 : 16;
  }
  if (m.cleanse) {
    const debuffed = state.units.some(
      (u) => u.side === actor.side && u.hp > 0 && u.statuses.some((s) => DEBUFFS.has(s.kind)),
    );
    score += debuffed ? 45 : -40;
  }
  if (m.strip) {
    score += target.statuses.some((s) => !DEBUFFS.has(s.kind)) ? 40 : -30;
  }

  // Prefer hitting the squishiest reachable enemy, all else equal.
  if (m.power > 0 && target.side !== actor.side) {
    score += (1 - target.hp / target.maxHp) * 25;
    score += Math.max(0, 160 - effSpd(target)) * 0.05;
  }

  // Nudge toward using the big cooldowns rather than hoarding them.
  score += species.skills[index].cooldown * 3;
  return score;
}

function countEnemies(state: BattleState, actor: Unit): number {
  return state.units.filter((u) => u.side !== actor.side && u.hp > 0).length;
}
