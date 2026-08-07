/**
 * The battle engine.
 *
 * Strictly deterministic: same initial state plus same list of moves always produces the
 * same result, on any machine. That is what makes P2P lockstep possible — the peers send
 * each other only the moves, run this identical code, and compare `stateHash()` each turn
 * to catch any divergence. Nothing in here may read the clock, `Math.random`, the DOM, or
 * anything else outside its arguments.
 */

import { compiled, DEBUFFS, type Mechanic, type StatusKind, type StatusSpec } from './mechanics';

export interface Status {
  kind: StatusKind;
  turns: number;
  magnitude: number;
  /** Shields carry an absorbing pool rather than a percentage. */
  pool?: number;
}

export interface Unit {
  /** Stable across both peers: `${side}${slot}`. */
  id: string;
  side: Side;
  slot: number;
  speciesId: string;
  level: number;
  name: string;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  spd: number;
  statuses: Status[];
  /** Remaining cooldown per skill index. */
  cooldowns: [number, number, number];
  /** Set when this unit has already acted in the current round. */
  acted: boolean;
}

export type Side = 'a' | 'b';

export interface Move {
  /** Which unit acts. Must match the unit whose turn it is. */
  unitId: string;
  skill: 0 | 1 | 2;
  /** Target unit id. Ignored for skills that pick their own targets. */
  targetId: string | null;
}

/** One visible consequence of a move, for the UI to draw. Never read by the engine. */
export interface StrikeFx {
  unitId: string;
  /** Damage or healing. Zero for a pure status change. */
  amount: number;
  kind: 'hit' | 'heal' | 'buff' | 'debuff' | 'miss';
}

export interface LogEntry {
  round: number;
  text: string;
  /** Units whose HP changed, for the UI to flash. */
  touched: string[];
  /** Who acted, so the UI can draw the strike from the right place. */
  actorId: string | null;
  /** What the move did, structured — the UI must not have to parse `text`. */
  fx: StrikeFx[];
}

export interface BattleState {
  round: number;
  units: Unit[];
  /** Whose turn it is. Null once the battle is over. */
  activeUnitId: string | null;
  winner: Side | 'draw' | null;
  log: LogEntry[];
  /** Advanced on every roll, so the sequence is reproducible. */
  rngCursor: number;
  seed: number;
}

export interface TeamMember {
  speciesId: string;
  level: number;
  nickname?: string | null;
}

// ── deterministic randomness ─────────────────────────────────────────────────

/**
 * Indexed PRNG. Every roll is a pure function of (seed, cursor), so replaying the same
 * move list reproduces every roll — no hidden generator state to get out of step.
 */
function roll(seed: number, cursor: number): number {
  let t = (seed + cursor * 0x6d2b79f5) >>> 0;
  t = Math.imul(t ^ (t >>> 15), 1 | t);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function next(state: BattleState): number {
  return roll(state.seed, state.rngCursor++);
}

// ── setup ────────────────────────────────────────────────────────────────────

/** Stat growth per level. Flat and predictable so team-building stays legible. */
function scaleStat(base: number, level: number): number {
  return Math.round(base * (1 + (level - 1) * 0.08));
}

function makeUnit(member: TeamMember, side: Side, slot: number): Unit {
  const species = compiled(member.speciesId);
  const level = Math.max(1, member.level);
  const maxHp = scaleStat(species.stats.hp, level);
  return {
    id: `${side}${slot}`,
    side,
    slot,
    speciesId: species.id,
    level,
    name: member.nickname?.trim() || species.name,
    hp: maxHp,
    maxHp,
    atk: scaleStat(species.stats.atk, level),
    def: scaleStat(species.stats.def, level),
    spd: scaleStat(species.stats.spd, level),
    statuses: [],
    cooldowns: [0, 0, 0],
    acted: false,
  };
}

export function createBattle(teamA: TeamMember[], teamB: TeamMember[], seed: number): BattleState {
  const units = [
    ...teamA.slice(0, 3).map((m, i) => makeUnit(m, 'a', i)),
    ...teamB.slice(0, 3).map((m, i) => makeUnit(m, 'b', i)),
  ];
  const state: BattleState = {
    round: 1,
    units,
    activeUnitId: null,
    winner: null,
    log: [],
    rngCursor: 0,
    seed: seed >>> 0,
  };
  state.activeUnitId = nextActor(state)?.id ?? null;
  return state;
}

// ── stats and statuses ───────────────────────────────────────────────────────

function magnitudeOf(unit: Unit, kind: StatusKind): number {
  return unit.statuses.filter((s) => s.kind === kind).reduce((sum, s) => sum + s.magnitude, 0);
}

function has(unit: Unit, kind: StatusKind): boolean {
  return unit.statuses.some((s) => s.kind === kind);
}

function effAtk(unit: Unit): number {
  const mod = 1 + magnitudeOf(unit, 'atkUp') / 100 - magnitudeOf(unit, 'atkDown') / 100;
  return Math.max(1, unit.atk * Math.max(0.2, mod));
}

function effDef(unit: Unit): number {
  const mod = 1 + magnitudeOf(unit, 'defUp') / 100 - magnitudeOf(unit, 'defDown') / 100;
  return Math.max(1, unit.def * Math.max(0.2, mod));
}

export function effSpd(unit: Unit): number {
  const mod = 1 + magnitudeOf(unit, 'spdUp') / 100 - magnitudeOf(unit, 'spdDown') / 100;
  return Math.max(1, unit.spd * Math.max(0.2, mod));
}

const alive = (u: Unit) => u.hp > 0;

/**
 * Turn order: fastest first, ties broken by unit id so both peers agree. Recomputed each
 * round, so a speed buff applied this round is felt next round.
 */
function nextActor(state: BattleState): Unit | undefined {
  const waiting = state.units.filter((u) => alive(u) && !u.acted);
  if (waiting.length === 0) return undefined;
  return waiting.sort((x, y) => effSpd(y) - effSpd(x) || x.id.localeCompare(y.id))[0];
}

function enemiesOf(state: BattleState, unit: Unit): Unit[] {
  return state.units.filter((u) => u.side !== unit.side && alive(u));
}

function alliesOf(state: BattleState, unit: Unit): Unit[] {
  return state.units.filter((u) => u.side === unit.side && alive(u));
}

/** A taunting enemy must be hit; an untargetable one cannot be, unless it is the only one. */
export function legalTargets(state: BattleState, actor: Unit, mechanic: Mechanic): Unit[] {
  switch (mechanic.target) {
    case 'self':
      return [actor];
    case 'oneAlly':
    case 'allAllies':
    case 'lowestAlly':
      return alliesOf(state, actor);
    case 'fallenAlly':
      return state.units.filter((u) => u.side === actor.side && !alive(u));
    default: {
      const foes = enemiesOf(state, actor);
      const taunting = foes.filter((u) => has(u, 'taunt'));
      if (taunting.length > 0) return taunting;
      const visible = foes.filter((u) => !has(u, 'untargetable'));
      return visible.length > 0 ? visible : foes;
    }
  }
}

function resolveTargets(state: BattleState, actor: Unit, mechanic: Mechanic, chosen: string | null): Unit[] {
  const pool = legalTargets(state, actor, mechanic);
  if (pool.length === 0) return [];

  switch (mechanic.target) {
    case 'allEnemies':
    case 'allAllies':
      return pool;
    case 'self':
      return [actor];
    case 'lowestAlly':
    case 'lowestEnemy':
      return [pool.slice().sort((x, y) => x.hp / x.maxHp - y.hp / y.maxHp || x.id.localeCompare(y.id))[0]!];
    case 'fastestEnemy':
      return [pool.slice().sort((x, y) => effSpd(y) - effSpd(x) || x.id.localeCompare(y.id))[0]!];
    case 'strongestEnemy':
      return [pool.slice().sort((x, y) => effAtk(y) - effAtk(x) || x.id.localeCompare(y.id))[0]!];
    default: {
      const picked = chosen ? pool.find((u) => u.id === chosen) : undefined;
      // Falling back to the first legal target keeps both peers in step if a client
      // sends a target that has since died.
      return [picked ?? pool[0]!];
    }
  }
}

function applyStatus(unit: Unit, spec: StatusSpec, caster: Unit): void {
  if (spec.kind === 'shield') {
    unit.statuses.push({ ...spec, pool: Math.round(caster.maxHp * (spec.magnitude / 100)) });
    return;
  }
  const existing = unit.statuses.find((s) => s.kind === spec.kind);
  // Refresh rather than stack, except for the effects whose text says they stack.
  if (existing && spec.kind !== 'bleed' && spec.kind !== 'atkUp' && spec.kind !== 'defUp') {
    existing.turns = Math.max(existing.turns, spec.turns);
    existing.magnitude = Math.max(existing.magnitude, spec.magnitude);
    return;
  }
  unit.statuses.push({ ...spec });
}

function healUnit(unit: Unit, amount: number): number {
  if (has(unit, 'healBlock') || !alive(unit)) return 0;
  const amp = 1 + magnitudeOf(unit, 'healUp') / 100;
  const healed = Math.min(unit.maxHp - unit.hp, Math.round(amount * amp));
  unit.hp += healed;
  return healed;
}

function damageUnit(unit: Unit, raw: number): number {
  let remaining = Math.max(1, Math.round(raw));

  // Shields absorb first, oldest one down.
  for (const s of unit.statuses.filter((x) => x.kind === 'shield')) {
    if (remaining <= 0) break;
    const absorbed = Math.min(s.pool ?? 0, remaining);
    s.pool = (s.pool ?? 0) - absorbed;
    remaining -= absorbed;
  }
  unit.statuses = unit.statuses.filter((s) => s.kind !== 'shield' || (s.pool ?? 0) > 0);

  const cut = Math.min(80, magnitudeOf(unit, 'damageCut')) / 100;
  remaining = Math.round(remaining * (1 - cut));

  unit.hp -= remaining;
  if (unit.hp <= 0 && has(unit, 'unkillable')) unit.hp = 1;
  if (unit.hp < 0) unit.hp = 0;
  // Damage wakes a sleeper.
  if (remaining > 0) unit.statuses = unit.statuses.filter((s) => s.kind !== 'sleep');
  return remaining;
}

/**
 * Tuned so a straight hit takes roughly a fifth of a same-level target's health: three
 * units a side then resolve in about eight to fourteen rounds. Lower than this and
 * battles ran to the stalemate cap; much higher and healers stop mattering.
 */
const DAMAGE_SCALE = 2.1;

/** Standard mitigation curve: DEF has diminishing returns, never full immunity. */
function mitigate(attack: number, def: number): number {
  return attack * (300 / (300 + def)) * DAMAGE_SCALE;
}

// ── the turn ─────────────────────────────────────────────────────────────────

export function activeUnit(state: BattleState): Unit | null {
  return state.units.find((u) => u.id === state.activeUnitId) ?? null;
}

export function skillReady(unit: Unit, index: 0 | 1 | 2): boolean {
  return unit.cooldowns[index] === 0;
}

/**
 * Applies one move and advances to the next actor. Returns the new state; the input is
 * mutated in place, so callers that need history should clone first.
 */
export function applyMove(state: BattleState, move: Move): BattleState {
  if (state.winner) return state;
  const actor = activeUnit(state);
  if (!actor || actor.id !== move.unitId) return state;

  const species = compiled(actor.speciesId);
  const touched: string[] = [];
  const parts: string[] = [];
  const fx: StrikeFx[] = [];

  if (!skillReady(actor, move.skill)) {
    // Illegal move: fall back to skill 0, which never has a cooldown. Both peers do the
    // same thing, so a buggy or hostile client cannot desync the battle this way.
    move = { ...move, skill: 0 };
  }

  const chosenSkill = species.skills[move.skill];
  const chosenMechanic = chosenSkill.mechanic;
  const targets = resolveTargets(state, actor, chosenMechanic, move.targetId);

  parts.push(`${actor.name} used ${chosenSkill.name}`);

  let dealtTotal = 0;

  for (const target of targets) {
    // Revive is the only thing that legitimately acts on a fallen unit.
    if (chosenMechanic.revive && !alive(target)) {
      target.hp = Math.max(1, Math.round(target.maxHp * chosenMechanic.revive));
      target.statuses = [];
      target.cooldowns = [0, 0, 0];
      touched.push(target.id);
      fx.push({ unitId: target.id, amount: 0, kind: 'heal' });
      parts.push(`revived ${target.name}`);
      continue;
    }
    if (!alive(target)) continue;

    // --- damage ---
    if (chosenMechanic.power > 0 && chosenMechanic.hits > 0) {
      for (let hit = 0; hit < chosenMechanic.hits; hit++) {
        const dodgeChance = chosenMechanic.cannotMiss || has(target, 'noDodge')
          ? 0
          : Math.min(0.5, magnitudeOf(target, 'dodgeUp') / 100 + magnitudeOf(actor, 'accDown') / 200);
        if (dodgeChance > 0 && next(state) < dodgeChance) {
          fx.push({ unitId: target.id, amount: 0, kind: 'miss' });
          parts.push(`${target.name} dodged`);
          continue;
        }

        const source = chosenMechanic.defScale ? effDef(actor) : effAtk(actor);
        const pierce = 1 - (chosenMechanic.ignoreDef ?? 0);
        const base = mitigate(source * chosenMechanic.power, effDef(target) * pierce);
        const variance = 0.92 + next(state) * 0.16;
        const crit = chosenMechanic.alwaysCrit || next(state) < 0.15 + magnitudeOf(actor, 'critUp') / 100;
        const dealt = damageUnit(target, base * variance * (crit ? 1.6 : 1));
        dealtTotal += dealt;
        touched.push(target.id);
        fx.push({ unitId: target.id, amount: dealt, kind: 'hit' });
        parts.push(`${crit ? 'crit ' : ''}${dealt} to ${target.name}`);
      }

      if (chosenMechanic.executeBelow && alive(target) && target.hp / target.maxHp <= chosenMechanic.executeBelow) {
        target.hp = 0;
        parts.push(`executed ${target.name}`);
      }
    }

    // --- healing, shielding, cleansing, stripping ---
    if (chosenMechanic.heal) {
      const healed = healUnit(target, target.maxHp * chosenMechanic.heal);
      if (healed > 0) {
        touched.push(target.id);
        fx.push({ unitId: target.id, amount: healed, kind: 'heal' });
        parts.push(`healed ${target.name} ${healed}`);
      }
    }
    if (chosenMechanic.shield) {
      applyStatus(target, { kind: 'shield', turns: 3, magnitude: chosenMechanic.shield * 100 }, actor);
      fx.push({ unitId: target.id, amount: 0, kind: 'buff' });
      parts.push(`shielded ${target.name}`);
    }
    if (chosenMechanic.cleanse) {
      const before = target.statuses.length;
      target.statuses = chosenMechanic.cleanse === 'all'
        ? target.statuses.filter((s) => !DEBUFFS.has(s.kind))
        : dropFirst(target.statuses, (s) => DEBUFFS.has(s.kind));
      if (target.statuses.length !== before) parts.push(`cleansed ${target.name}`);
    }
    if (chosenMechanic.strip) {
      const before = target.statuses.length;
      target.statuses = chosenMechanic.strip === 'all'
        ? target.statuses.filter((s) => DEBUFFS.has(s.kind))
        : dropFirst(target.statuses, (s) => !DEBUFFS.has(s.kind));
      if (target.statuses.length !== before) parts.push(`stripped ${target.name}`);
    }
    for (const spec of chosenMechanic.applies ?? []) {
      applyStatus(target, spec, actor);
      fx.push({ unitId: target.id, amount: 0, kind: DEBUFFS.has(spec.kind) ? 'debuff' : 'buff' });
      parts.push(`${spec.kind} on ${target.name}`);
    }
  }

  if (chosenMechanic.drain && dealtTotal > 0) {
    const healed = healUnit(actor, dealtTotal * chosenMechanic.drain);
    if (healed > 0) {
      touched.push(actor.id);
      fx.push({ unitId: actor.id, amount: healed, kind: 'heal' });
      parts.push(`drained ${healed}`);
    }
  }
  for (const spec of chosenMechanic.selfApplies ?? []) {
    applyStatus(actor, spec, actor);
    fx.push({ unitId: actor.id, amount: 0, kind: DEBUFFS.has(spec.kind) ? 'debuff' : 'buff' });
    parts.push(`${spec.kind} on self`);
  }

  actor.cooldowns[move.skill] = chosenSkill.cooldown;
  actor.acted = true;

  state.log.push({
    round: state.round,
    text: parts.join(' · '),
    touched: [...new Set(touched)],
    actorId: actor.id,
    fx,
  });

  endOfTurn(state, actor);
  advance(state);
  return state;
}

function dropFirst(list: Status[], match: (s: Status) => boolean): Status[] {
  const i = list.findIndex(match);
  if (i < 0) return list;
  return [...list.slice(0, i), ...list.slice(i + 1)];
}

/** Damage-over-time, regeneration and doom tick on the acting unit at the end of its turn. */
function endOfTurn(state: BattleState, unit: Unit): void {
  if (!alive(unit)) return;
  const notes: string[] = [];

  for (const s of unit.statuses) {
    switch (s.kind) {
      case 'burn':
      case 'bleed':
      case 'poison':
      case 'dissolve': {
        const dealt = damageUnit(unit, unit.maxHp * (s.magnitude / 100));
        notes.push(`${s.kind} ${dealt}`);
        break;
      }
      case 'regen': {
        const healed = healUnit(unit, unit.maxHp * (s.magnitude / 100));
        if (healed > 0) notes.push(`regen ${healed}`);
        break;
      }
      case 'doom':
        if (s.turns <= 1) {
          unit.hp = 0;
          notes.push('doom');
        }
        break;
    }
  }

  for (const s of unit.statuses) s.turns -= 1;
  unit.statuses = unit.statuses.filter((s) => s.turns > 0 || (s.kind === 'shield' && (s.pool ?? 0) > 0));

  if (notes.length > 0) {
    state.log.push({
      round: state.round,
      text: `${unit.name}: ${notes.join(', ')}`,
      touched: [unit.id],
      actorId: null,
      fx: [],
    });
  }
}

/** Moves to the next actor, skipping anyone who cannot act, and ends the round or battle. */
function advance(state: BattleState): void {
  for (;;) {
    const aliveA = state.units.some((u) => u.side === 'a' && alive(u));
    const aliveB = state.units.some((u) => u.side === 'b' && alive(u));
    if (!aliveA || !aliveB) {
      state.winner = aliveA && !aliveB ? 'a' : aliveB && !aliveA ? 'b' : 'draw';
      state.activeUnitId = null;
      return;
    }

    let actor = nextActor(state);
    if (!actor) {
      // Round over.
      state.round += 1;
      for (const u of state.units) u.acted = false;
      // A 30-round battle is a stalemate; call it rather than looping forever.
      if (state.round > 30) {
        const hpA = totalHp(state, 'a');
        const hpB = totalHp(state, 'b');
        state.winner = hpA === hpB ? 'draw' : hpA > hpB ? 'a' : 'b';
        state.activeUnitId = null;
        return;
      }
      actor = nextActor(state);
      if (!actor) {
        state.winner = 'draw';
        state.activeUnitId = null;
        return;
      }
    }

    // Stunned, asleep or doomed-out units lose their turn but still tick down.
    if (has(actor, 'stun') || has(actor, 'sleep')) {
      state.log.push({
        round: state.round,
        text: `${actor.name} cannot act (${has(actor, 'stun') ? 'stunned' : 'asleep'})`,
        touched: [],
        actorId: actor.id,
        fx: [],
      });
      actor.acted = true;
      endOfTurn(state, actor);
      continue;
    }

    for (let i = 0; i < 3; i++) {
      const cd = actor.cooldowns[i as 0 | 1 | 2];
      if (cd > 0) actor.cooldowns[i as 0 | 1 | 2] = cd - 1;
    }

    state.activeUnitId = actor.id;
    return;
  }
}

function totalHp(state: BattleState, side: Side): number {
  return state.units.filter((u) => u.side === side).reduce((sum, u) => sum + Math.max(0, u.hp), 0);
}

/**
 * A cheap fingerprint of everything that matters. The peers exchange this after each move;
 * a mismatch means the two simulations have diverged and the battle can no longer be trusted.
 */
export function stateHash(state: BattleState): string {
  const parts = [state.round, state.rngCursor, state.winner ?? '-', state.activeUnitId ?? '-'];
  for (const u of state.units.slice().sort((x, y) => x.id.localeCompare(y.id))) {
    parts.push(
      u.id,
      u.hp,
      u.cooldowns.join(''),
      u.statuses
        .map((s) => `${s.kind}:${s.turns}:${s.magnitude}:${s.pool ?? 0}`)
        .sort()
        .join(','),
    );
  }
  const text = parts.join('|');
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < text.length; i++) {
    h1 = Math.imul(h1 ^ text.charCodeAt(i), 16777619) >>> 0;
    h2 = Math.imul(h2 + text.charCodeAt(i) * (i + 1), 2246822519) >>> 0;
  }
  return `${h1.toString(16)}${h2.toString(16)}`;
}

export function clone(state: BattleState): BattleState {
  return JSON.parse(JSON.stringify(state)) as BattleState;
}
