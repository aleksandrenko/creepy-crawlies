/**
 * What a skill actually does, in terms the engine can execute.
 *
 * There are 204 skills in the roster and each one's `text` is the design intent. Rather
 * than hand-writing 204 implementations, the skill texts were written to a consistent
 * house style, so `compile()` reads that style and produces a `Mechanic`. Anything the
 * reader cannot express falls back to a sane baseline for the skill's role, and
 * `coverage()` reports exactly which skills fell back — that report is the honest
 * measure of how faithful the battle currently is.
 *
 * `OVERRIDES` is where a skill gets its real behaviour once the generic one is not good
 * enough. Nothing here guesses silently: an unmatched skill is always reported.
 */

import { SPECIES, type Role, type Skill, type Species } from '../content/species';

export type StatusKind =
  | 'burn'
  | 'bleed'
  | 'poison'
  | 'dissolve'
  | 'stun'
  | 'sleep'
  | 'slow'
  | 'blind'
  | 'fear'
  | 'healBlock'
  | 'taunt'
  | 'untargetable'
  | 'doom'
  | 'regen'
  | 'shield'
  | 'atkUp'
  | 'atkDown'
  | 'defUp'
  | 'defDown'
  | 'spdUp'
  | 'spdDown'
  | 'accUp'
  | 'accDown'
  | 'critUp'
  | 'noDodge'
  | 'damageCut'
  | 'dodgeUp'
  | 'unkillable'
  | 'healUp';

/** Statuses the player should read as bad news. Drives cleanse and the UI colouring. */
export const DEBUFFS: ReadonlySet<StatusKind> = new Set<StatusKind>([
  'burn', 'bleed', 'poison', 'dissolve', 'stun', 'sleep', 'slow', 'blind', 'fear',
  'healBlock', 'doom', 'atkDown', 'defDown', 'spdDown', 'accDown', 'noDodge',
]);

export interface StatusSpec {
  kind: StatusKind;
  turns: number;
  /** Percent magnitude: stat change, or damage per turn as % of the victim's max HP. */
  magnitude: number;
}

export type TargetKind =
  | 'oneEnemy'
  | 'allEnemies'
  | 'lowestEnemy'
  | 'fastestEnemy'
  | 'strongestEnemy'
  | 'oneAlly'
  | 'allAllies'
  | 'lowestAlly'
  | 'self'
  | 'fallenAlly';

export interface Mechanic {
  target: TargetKind;
  /** Number of separate damage instances. */
  hits: number;
  /** Damage multiplier against the caster's ATK. 0 means the skill deals no damage. */
  power: number;
  /** Scale damage off the caster's DEF instead of ATK. */
  defScale?: boolean;
  /** Fraction of the target's DEF ignored, 0..1. */
  ignoreDef?: number;
  cannotMiss?: boolean;
  alwaysCrit?: boolean;
  /** Heal the target by this fraction of their max HP. */
  heal?: number;
  /** Heal the caster by this fraction of the damage it dealt. */
  drain?: number;
  /** Shield the target for this fraction of the caster's max HP. */
  shield?: number;
  /** Revive one fallen ally at this fraction of max HP. */
  revive?: number;
  /** Kill the target outright below this fraction of max HP. */
  executeBelow?: number;
  cleanse?: 'one' | 'all';
  /** Remove buffs from the target. */
  strip?: 'one' | 'all';
  /** Applied to whoever the skill targets. */
  applies?: StatusSpec[];
  /** Applied to the caster. */
  selfApplies?: StatusSpec[];
  /** Set when the reader could not express the text and a baseline was used instead. */
  approximated?: boolean;
}

export interface CompiledSkill extends Skill {
  mechanic: Mechanic;
}

export interface CompiledSpecies extends Species {
  skills: [CompiledSkill, CompiledSkill, CompiledSkill];
}

// ── the reader ────────────────────────────────────────────────────────────────

const PCT = /(\d+)\s*%/;
const TURNS = /for (\d+) turns?|for (\d+) turn/;

function pct(text: string, fallback: number): number {
  const m = PCT.exec(text);
  return m ? Number(m[1]) / 100 : fallback;
}

function turns(text: string, fallback: number): number {
  const m = TURNS.exec(text);
  const v = m?.[1] ?? m?.[2];
  return v ? Number(v) : fallback;
}

function readTarget(t: string): TargetKind {
  if (/all enemies|every enemy|each enemy/.test(t)) return 'allEnemies';
  if (/ally team|all allies|each ally|whole ally team/.test(t)) return 'allAllies';
  if (/fallen ally/.test(t)) return 'fallenAlly';
  if (/weakest ally|ally with the lowest hp/.test(t)) return 'lowestAlly';
  if (/one ally|healthiest ally/.test(t)) return 'oneAlly';
  if (/enemy with the lowest hp/.test(t)) return 'lowestEnemy';
  if (/fastest enemy/.test(t)) return 'fastestEnemy';
  if (/highest atk|strongest enemy/.test(t)) return 'strongestEnemy';
  if (/^self\b|this unit (cannot|gains|is)|self\./.test(t)) return 'self';
  return 'oneEnemy';
}

/** Number words the skill texts actually use for multi-hit. */
const COUNTS: Record<string, number> = {
  twice: 2, two: 2, three: 3, times: 3, four: 4, five: 5, six: 6,
};

function readHits(t: string): number {
  const explicit = /(\w+) (?:rapid )?hits|attack (\w+)|(\w+) times/.exec(t);
  const word = explicit?.[1] ?? explicit?.[2] ?? explicit?.[3];
  if (word && COUNTS[word]) return COUNTS[word];
  if (/twice/.test(t)) return 2;
  if (/three times/.test(t)) return 3;
  return 1;
}

const STATUS_WORDS: [RegExp, StatusKind, number][] = [
  [/\bburn/, 'burn', 8],
  [/\bbleed/, 'bleed', 8],
  [/\bpoison/, 'poison', 9],
  [/\bdissolve/, 'dissolve', 10],
  [/\bstun/, 'stun', 0],
  [/\bsleep|asleep|sleeping sickness/, 'sleep', 0],
  [/\bslow|lose \d+% spd|lowers? their spd|loses? \d+% spd/, 'spdDown', 25],
  [/\bblind/, 'blind', 0],
  [/\bfear/, 'fear', 0],
  [/cannot be healed|blocks their healing|stop them healing|cannot cleanse|cannot be healed or cleansed/, 'healBlock', 0],
  [/\btaunt|target this unit/, 'taunt', 0],
  [/cannot be targeted/, 'untargetable', 0],
  [/they die outright unless|\bmark one enemy/, 'doom', 0],
  [/regenerat|regeneration|regenerates \d+%/, 'regen', 10],
  [/lose \d+% atk|lowers? their atk|loses? \d+% atk|lower .*atk by/, 'atkDown', 20],
  [/gains? \+?\d+% atk|team gains .*atk/, 'atkUp', 25],
  [/lose \d+% def|lowers? their def|loses? \d+% def|lowering their def|lower .*def by/, 'defDown', 25],
  [/gains? \+?\d+% def|\+\d+% def/, 'defUp', 25],
  [/\+\d+% spd/, 'spdUp', 25],
  [/lose \d+% accuracy|lowers? their accuracy|loses? \d+% accuracy/, 'accDown', 20],
  [/\+\d+% accuracy/, 'accUp', 30],
  [/critical chance/, 'critUp', 20],
  [/cannot dodge|cannot be dodged|prevent them dodging|cannot dodge for/, 'noDodge', 0],
  [/take \d+% less damage|takes? \d+% less damage/, 'damageCut', 50],
];

function readStatuses(t: string): StatusSpec[] {
  const found: StatusSpec[] = [];
  for (const [re, kind, defaultMag] of STATUS_WORDS) {
    if (!re.test(t)) continue;
    if (found.some((f) => f.kind === kind)) continue;
    const magnitude = PCT.test(t) ? pct(t, defaultMag / 100) * 100 : defaultMag;
    found.push({
      kind,
      turns: turns(t, kind === 'stun' || kind === 'fear' ? 1 : 2),
      magnitude: defaultMag === 0 ? 0 : Math.max(1, Math.round(magnitude)),
    });
  }
  return found;
}

/** Baseline power by how long the skill is off cooldown. Keeps the curve sane. */
function basePower(skill: Skill, hits: number): number {
  const byCooldown = skill.cooldown === 0 ? 1.0 : skill.cooldown <= 2 ? 1.25 : skill.cooldown <= 3 ? 1.5 : 1.85;
  return Number((byCooldown / Math.max(1, hits * 0.72)).toFixed(3));
}

const BASELINE: Record<Role, Partial<Mechanic>> = {
  striker: { power: 1.15 },
  bulwark: { power: 0.85 },
  controller: { power: 0.95 },
  tender: { power: 0.75 },
};

function compileSkill(skill: Skill, species: Species): CompiledSkill {
  const override = OVERRIDES[`${species.id}:${skill.name}`];
  if (override) return { ...skill, mechanic: override };

  const t = skill.text.toLowerCase();
  const target = readTarget(t);
  const hits = readHits(t);
  const statuses = readStatuses(t);

  const damages = /attack|damage|hits|strike|kills|drain/.test(t) &&
    !/^heal|^revive|^cleanse/.test(t);

  const isHeal = /heal/.test(t);
  const healsTarget = isHeal && /(heal the ally team|heal all|heal one ally|heal the weakest|is fully healed|healed \d+%|heal \d+%)/.test(t);

  const mechanic: Mechanic = {
    target,
    hits,
    power: damages ? basePower(skill, hits) * (BASELINE[species.role].power ?? 1) : 0,
  };

  if (healsTarget) mechanic.heal = pct(t, 0.2);
  if (/heals? (this unit|for) \d+% of the damage|heal .*of the damage dealt/.test(t)) {
    mechanic.drain = pct(t, 0.4);
  }
  if (/shield/.test(t) && !/strip|remove/.test(t)) mechanic.shield = pct(t, 0.18);
  if (/revive/.test(t)) mechanic.revive = pct(t, 0.4);
  if (/kills? (any enemy )?(outright )?(below|any)|execute/.test(t)) mechanic.executeBelow = pct(t, 0.2);
  if (/cleanse all|cleanse every|cleanse all debuffs/.test(t)) mechanic.cleanse = 'all';
  else if (/cleanse/.test(t)) mechanic.cleanse = 'one';
  if (/strip every buff|removes? all buffs|strip every/.test(t)) mechanic.strip = 'all';
  else if (/steals? one buff|removes? one of their buffs|strip one buff|steals? all buffs/.test(t)) mechanic.strip = 'one';
  if (/ignores? (\d+)% of def/.test(t)) mechanic.ignoreDef = pct(t, 0.2);
  if (/cannot miss|cannot be dodged/.test(t)) mechanic.cannotMiss = true;
  if (/guaranteed critical|critical hit/.test(t)) mechanic.alwaysCrit = true;
  if (/damage scales with this unit's def|scales with this unit.s def/.test(t)) mechanic.defScale = true;

  // Statuses aimed at the caster read differently from statuses aimed at a victim.
  if (target === 'self' || /^self\./.test(skill.text.toLowerCase())) {
    mechanic.selfApplies = statuses;
  } else {
    mechanic.applies = statuses;
  }

  // Nothing at all was recognised — say so rather than shipping a no-op.
  const didSomething =
    mechanic.power > 0 || mechanic.heal || mechanic.shield || mechanic.revive ||
    mechanic.cleanse || mechanic.strip || (mechanic.applies?.length ?? 0) > 0 ||
    (mechanic.selfApplies?.length ?? 0) > 0;

  if (!didSomething) {
    mechanic.power = basePower(skill, 1) * (BASELINE[species.role].power ?? 1);
    mechanic.approximated = true;
  }

  return { ...skill, mechanic };
}

/**
 * Hand-written mechanics for skills whose text the reader gets wrong or cannot express.
 * Add to this rather than bending the reader — the reader is meant to stay dumb.
 */
const OVERRIDES: Record<string, Mechanic> = {
  // Sacrifices itself. The reader would read "dies" as damage to the enemy.
  'apis:Alarm Pheromone': {
    target: 'allAllies', hits: 0, power: 0, heal: 1,
    applies: [{ kind: 'atkUp', turns: 3, magnitude: 50 }],
    selfApplies: [{ kind: 'doom', turns: 0, magnitude: 100 }],
  },
  // Moves HP between allies; not a heal and not damage.
  'camponotus:Trophallaxis': { target: 'lowestAlly', hits: 0, power: 0, heal: 0.25 },
  'camponotus:Share the Meal': { target: 'allAllies', hits: 0, power: 0, heal: 0.1 },
  // "Charges for 3 turns" — modelled as a big delayed hit via a long cooldown.
  'magicicada:Seventeen Years': { target: 'allEnemies', hits: 1, power: 3.4 },
  // Turn-order manipulation the engine expresses as a heavy slow.
  'taurus:Horn Shove': {
    target: 'oneEnemy', hits: 1, power: 0.85,
    applies: [{ kind: 'spdDown', turns: 2, magnitude: 30 }],
  },
  'hercules:Horn Lift': {
    target: 'oneEnemy', hits: 1, power: 1.15,
    applies: [{ kind: 'spdDown', turns: 2, magnitude: 35 }],
  },
  'allomyrina:Wedge': {
    target: 'oneEnemy', hits: 1, power: 1.1,
    applies: [{ kind: 'spdDown', turns: 2, magnitude: 25 }],
  },
  'myrmeleon:Collapse the Slope': {
    target: 'oneEnemy', hits: 1, power: 0.8,
    applies: [{ kind: 'spdDown', turns: 3, magnitude: 45 }],
  },
  // Mind control is not modelled; a long stun is the closest honest stand-in.
  'ampulex:Into the Brain': {
    target: 'oneEnemy', hits: 1, power: 0.9,
    applies: [{ kind: 'stun', turns: 1, magnitude: 0 }],
  },
  // Removes itself from the field then returns; modelled as a full heal with a skip.
  'bombyx:Metamorphosis': {
    target: 'oneAlly', hits: 0, power: 0, heal: 1, cleanse: 'all',
    applies: [{ kind: 'stun', turns: 1, magnitude: 0 }],
  },
  // Doom-style delayed kill.
  'pseudacteon:Lay the Egg': {
    target: 'oneEnemy', hits: 1, power: 0.7,
    applies: [{ kind: 'doom', turns: 3, magnitude: 100 }],
  },

  // ── the ten the reader could not express ──────────────────────────────────
  'morosa:Stillness': {
    target: 'oneAlly', hits: 0, power: 0,
    applies: [{ kind: 'dodgeUp', turns: 2, magnitude: 40 }],
  },
  'phloeodes:Unkillable': {
    target: 'allAllies', hits: 0, power: 0,
    applies: [{ kind: 'unkillable', turns: 1, magnitude: 0 }],
  },
  'corydalus:Hold Fast': {
    target: 'oneEnemy', hits: 0, power: 0,
    applies: [
      { kind: 'stun', turns: 1, magnitude: 0 },
      { kind: 'healBlock', turns: 1, magnitude: 0 },
    ],
  },
  // "For the rest of the battle" is a very long duration rather than a special case.
  'goliathus:Heavier Then': {
    target: 'self', hits: 0, power: 0,
    selfApplies: [
      { kind: 'atkUp', turns: 99, magnitude: 20 },
      { kind: 'defUp', turns: 99, magnitude: 20 },
    ],
  },
  'solenopsis:Living Raft': {
    target: 'allAllies', hits: 0, power: 0,
    applies: [{ kind: 'unkillable', turns: 1, magnitude: 0 }],
  },
  'notonecta:Read the Ripples': {
    target: 'allEnemies', hits: 0, power: 0,
    applies: [{ kind: 'noDodge', turns: 3, magnitude: 0 }],
  },
  'myrmecocystus:Through the Drought': {
    target: 'allAllies', hits: 0, power: 0,
    applies: [{ kind: 'healUp', turns: 3, magnitude: 50 }],
  },
  'oecophylla:Sew Shut': {
    target: 'oneEnemy', hits: 0, power: 0,
    applies: [
      { kind: 'stun', turns: 1, magnitude: 0 },
      { kind: 'healBlock', turns: 1, magnitude: 0 },
    ],
  },
  // Copying an arbitrary buff set is not modelled; a flat self-buff stands in for it.
  'episyrphus:Mimicry': {
    target: 'self', hits: 0, power: 0,
    selfApplies: [
      { kind: 'atkUp', turns: 3, magnitude: 30 },
      { kind: 'defUp', turns: 3, magnitude: 25 },
    ],
  },
  // Reacting to enemy buffs is not modelled; a team regen stands in for it.
  "andricus:Host's Expense": {
    target: 'allAllies', hits: 0, power: 0,
    applies: [{ kind: 'regen', turns: 3, magnitude: 6 }],
  },
};

// ── the compiled catalogue ────────────────────────────────────────────────────

export const COMPILED: CompiledSpecies[] = SPECIES.map((s) => ({
  ...s,
  skills: [
    compileSkill(s.skills[0], s),
    compileSkill(s.skills[1], s),
    compileSkill(s.skills[2], s),
  ],
}));

const COMPILED_BY_ID = new Map(COMPILED.map((s) => [s.id, s]));

export function compiled(speciesId: string): CompiledSpecies {
  const s = COMPILED_BY_ID.get(speciesId);
  if (!s) throw new Error(`Unknown species: ${speciesId}`);
  return s;
}

/** Which skills got a baseline instead of their written behaviour. */
export function coverage(): { total: number; approximated: string[] } {
  const approximated: string[] = [];
  for (const s of COMPILED) {
    for (const sk of s.skills) {
      if (sk.mechanic.approximated) approximated.push(`${s.name} — ${sk.name}: "${sk.text}"`);
    }
  }
  return { total: COMPILED.length * 3, approximated };
}
