/**
 * The founding sixteen species.
 *
 * Every skill is derived from a real, documented trait of the real animal.
 */

import type { Species } from '../types';

export const CORE: Species[] = [
  {
    id: 'bombardier',
    name: 'Bombardier Beetle',
    latin: 'Brachinus crepitans',
    rarity: 'epic',
    role: 'striker',
    biome: 'rotwood',
    fact:
      'Mixes hydrogen peroxide with hydroquinone in a reinforced chamber and sprays the result at roughly 100 °C, ' +
      'in pulses of up to 500 per second, aimed by a swivelling abdomen tip.',
    stats: { hp: 880, atk: 152, def: 74, spd: 96 },
    skills: [
      { name: 'Scalding Jet', text: 'Attack one enemy. Applies Burn for 2 turns.', cooldown: 0 },
      { name: 'Pulse Volley', text: 'Five rapid hits split among random enemies.', cooldown: 3 },
      { name: 'Chemical Chamber', text: 'AoE. Burns all enemies and lowers their DEF by 25% for 2 turns.', cooldown: 4 },
    ],
    body: { size: 0.9, abdomen: 1.05, girth: 1.15, legs: 0.8, antennae: 0.7, wings: 1, stance: 0.9 },
    palette: { carapace: '#2b2118', underside: '#c8641f', accent: '#f0932b', eye: '#0d0906' },
  },
  {
    id: 'bulletant',
    name: 'Bullet Ant',
    latin: 'Paraponera clavata',
    rarity: 'rare',
    role: 'controller',
    biome: 'canopy',
    fact:
      'Tops the Schmidt sting pain index at 4.0+ — described as pure, intense, brilliant pain. ' +
      'The venom, poneratoxin, blocks voltage-gated sodium channels, so victims seize and cannot move.',
    stats: { hp: 820, atk: 128, def: 88, spd: 104 },
    skills: [
      { name: 'Poneratoxin', text: 'Attack one enemy. 60% chance to Stun for 1 turn.', cooldown: 0 },
      { name: 'Waves of Pain', text: 'Damage over 3 turns that cannot be cleansed.', cooldown: 3 },
      { name: 'Column Discipline', text: 'Ally team gains +20% ATK for 2 turns.', cooldown: 4 },
    ],
    body: { size: 0.78, abdomen: 1.2, girth: 0.85, legs: 1.05, antennae: 1.0, wings: 0, stance: 1.1, mandibles: 0.9 },
    palette: { carapace: '#5b3a24', underside: '#3a2416', accent: '#a8642c', eye: '#120a05' },
  },
  {
    id: 'morosa',
    name: 'Common Stick Insect',
    latin: 'Carausius morosus',
    rarity: 'common',
    role: 'tender',
    biome: 'canopy',
    fact:
      'Reproduces by parthenogenesis — populations are almost entirely female and lay viable eggs without mating. ' +
      'Holds a rigid twig posture for hours and sways to match moving foliage.',
    stats: { hp: 940, atk: 88, def: 96, spd: 88 },
    skills: [
      { name: 'Twig Strike', text: 'Attack one enemy. Ignores 15% of DEF.', cooldown: 0 },
      { name: 'Stillness', text: 'One ally gains +40% Evasion for 2 turns.', cooldown: 3 },
      { name: 'Parthenogenesis', text: 'Revive one fallen ally at 30% HP.', cooldown: 6 },
    ],
    body: { size: 1.25, abdomen: 2.4, girth: 0.42, legs: 1.9, antennae: 0.8, wings: 0, stance: 1.3 },
    palette: { carapace: '#7d8a4f', underside: '#5c6638', accent: '#a8b566', eye: '#1a1a10' },
  },
  {
    id: 'mantis',
    name: 'European Mantis',
    latin: 'Mantis religiosa',
    rarity: 'epic',
    role: 'striker',
    biome: 'meadow',
    fact:
      'Strikes with raptorial forelegs in under 100 milliseconds — faster than the prey can react. ' +
      'Spined tibiae snap shut like a trap and hold prey while it is eaten alive, head first.',
    stats: { hp: 800, atk: 168, def: 70, spd: 112 },
    skills: [
      { name: 'Raptorial Snap', text: 'Attack one enemy. +30% damage if they are below 50% HP.', cooldown: 0 },
      { name: 'Ambush', text: 'Guaranteed critical hit. Ignores shields.', cooldown: 3 },
      { name: 'Head First', text: 'Execute: kills any enemy below 20% HP outright.', cooldown: 5 },
    ],
    body: {
      size: 1.1, abdomen: 1.7, girth: 0.6, legs: 1.4, antennae: 0.9, wings: 2, stance: 1.2, raptorial: true,
    },
    palette: { carapace: '#8fa956', underside: '#c9d98a', accent: '#5e7332', eye: '#e8e4c0' },
  },
  {
    id: 'taurus',
    name: 'Taurus Dung Beetle',
    latin: 'Onthophagus taurus',
    rarity: 'rare',
    role: 'bulwark',
    biome: 'burrow',
    fact:
      'The strongest animal on Earth relative to its mass: a male braced in a tunnel has resisted a pull of ' +
      'about 1,141 times his own body weight rather than give ground.',
    stats: { hp: 1240, atk: 92, def: 148, spd: 74 },
    skills: [
      { name: 'Horn Shove', text: 'Attack one enemy and push them one place later in the turn order.', cooldown: 0 },
      { name: 'Braced', text: 'Self. Take 60% less damage for 2 turns.', cooldown: 3 },
      { name: 'Tunnel Wall', text: 'Ally team gains a shield equal to 20% of this unit\'s max HP.', cooldown: 4 },
    ],
    body: { size: 0.85, abdomen: 0.95, girth: 1.35, legs: 0.72, antennae: 0.5, wings: 1, stance: 0.7, mandibles: 0.6 },
    palette: { carapace: '#1b1a1e', underside: '#33302c', accent: '#6b5b3e', eye: '#0a0a0c' },
  },
  {
    id: 'pepsis',
    name: 'Tarantula Hawk',
    latin: 'Pepsis grossa',
    rarity: 'legendary',
    role: 'controller',
    biome: 'burrow',
    fact:
      'Paralyses a tarantula several times its size with a precise sting, drags the still-living spider into a burrow, ' +
      'and lays a single egg on it. The larva eats the host from the inside, saving the vital organs for last.',
    stats: { hp: 900, atk: 158, def: 82, spd: 128 },
    skills: [
      { name: 'Precise Sting', text: 'Attack one enemy. Blocks their healing for 2 turns.', cooldown: 0 },
      { name: 'Paralysis', text: 'One enemy cannot act for 2 turns. Ignores Stun resistance once per battle.', cooldown: 4 },
      { name: 'Living Host', text: 'Attach a parasite to one enemy: it takes damage every turn and feeds 50% of it to this unit.', cooldown: 5 },
    ],
    body: { size: 1.05, abdomen: 1.5, girth: 0.78, legs: 1.3, antennae: 0.85, wings: 2, stance: 1.15 },
    palette: { carapace: '#141018', underside: '#241a26', accent: '#e2622a', eye: '#1d1420' },
  },
  {
    id: 'anax',
    name: 'Emperor Dragonfly',
    latin: 'Anax imperator',
    rarity: 'epic',
    role: 'striker',
    biome: 'water',
    fact:
      'Around 95% of hunts end in a kill. Nearly spherical compound eyes of some 30,000 facets give almost 360° vision, ' +
      'and it intercepts prey on a predicted course rather than chasing it.',
    stats: { hp: 780, atk: 146, def: 66, spd: 152 },
    skills: [
      { name: 'Intercept', text: 'Attack one enemy. Cannot miss.', cooldown: 0 },
      { name: 'Hawking', text: 'Attack twice. Each hit that kills grants an extra turn.', cooldown: 3 },
      { name: 'Compound Sight', text: 'Ally team gains +30% Accuracy and immunity to Blind for 3 turns.', cooldown: 4 },
    ],
    body: { size: 1.2, abdomen: 2.6, girth: 0.5, legs: 0.85, antennae: 0.2, wings: 2, stance: 1.0 },
    palette: { carapace: '#1e6f8c', underside: '#8fd4e0', accent: '#39c6d6', eye: '#2a2f24' },
  },
  {
    id: 'lethocerus',
    name: 'Giant Water Bug',
    latin: 'Lethocerus deyrollei',
    rarity: 'rare',
    role: 'striker',
    biome: 'water',
    fact:
      'Nicknamed the toe-biter. Pierces prey with a short rostrum, injects digestive enzymes that liquefy tissue from ' +
      'the inside, then drinks the result. Takes fish, frogs and snakes far larger than itself.',
    stats: { hp: 960, atk: 140, def: 92, spd: 84 },
    skills: [
      { name: 'Rostrum', text: 'Attack one enemy. Applies Dissolve for 2 turns (damage over time, scales with target max HP).', cooldown: 0 },
      { name: 'Liquefy', text: 'Damage one enemy and heal this unit for 40% of the damage dealt.', cooldown: 3 },
      { name: 'Punch Above', text: 'Attack one enemy. Damage scales with how much max HP they have over this unit.', cooldown: 4 },
    ],
    body: { size: 1.0, abdomen: 1.15, girth: 1.25, legs: 1.0, antennae: 0.25, wings: 1, stance: 0.75 },
    palette: { carapace: '#5a4a32', underside: '#8c7a52', accent: '#3f3520', eye: '#12100a' },
  },
  {
    id: 'odontomachus',
    name: 'Trap-Jaw Ant',
    latin: 'Odontomachus bauri',
    rarity: 'epic',
    role: 'controller',
    biome: 'rotwood',
    fact:
      'Its mandibles close at up to 230 km/h in 0.13 milliseconds — among the fastest movements ever recorded in an animal. ' +
      'Fired against the ground, the same snap launches the ant clear of danger.',
    stats: { hp: 840, atk: 150, def: 86, spd: 140 },
    skills: [
      { name: 'Snap', text: 'Attack one enemy. Always strikes first in the turn order.', cooldown: 0 },
      { name: 'Escape Jump', text: 'Self. Dodge the next two attacks and gain +40% SPD for 2 turns.', cooldown: 3 },
      { name: 'Latch Reset', text: 'Reset the cooldowns of all ally skills by 1 turn.', cooldown: 5 },
    ],
    body: { size: 0.8, abdomen: 1.15, girth: 0.8, legs: 1.1, antennae: 1.05, wings: 0, stance: 1.05, mandibles: 1.6 },
    palette: { carapace: '#7a4322', underside: '#4a2a15', accent: '#c98b45', eye: '#1a0f07' },
  },
  {
    id: 'phloeodes',
    name: 'Ironclad Beetle',
    latin: 'Phloeodes diabolicus',
    rarity: 'legendary',
    role: 'bulwark',
    biome: 'rotwood',
    fact:
      'Survives being run over by a car. Its elytra are joined by an interlocking jigsaw suture of layered protein and ' +
      'chitin that fractures gradually instead of snapping, withstanding some 39,000 times its own body weight.',
    stats: { hp: 1420, atk: 84, def: 176, spd: 66 },
    skills: [
      { name: 'Grind', text: 'Attack one enemy. Damage scales with this unit\'s DEF, not ATK.', cooldown: 0 },
      { name: 'Jigsaw Suture', text: 'Self. Damage taken this turn is spread over the next 3 turns instead.', cooldown: 4 },
      { name: 'Unkillable', text: 'Ally team cannot drop below 1 HP for 1 turn.', cooldown: 6 },
    ],
    body: { size: 0.95, abdomen: 1.0, girth: 1.45, legs: 0.62, antennae: 0.4, wings: 1, stance: 0.55 },
    palette: { carapace: '#3a352e', underside: '#4d463b', accent: '#8a8070', eye: '#100e0b' },
  },
  {
    id: 'magicicada',
    name: 'Periodical Cicada',
    latin: 'Magicicada septendecim',
    rarity: 'rare',
    role: 'striker',
    biome: 'canopy',
    fact:
      'Spends 17 years underground and emerges in a single synchronised brood so vast that predators cannot eat them all. ' +
      'A chorus reaches about 100 decibels — loud enough to be painful at close range.',
    stats: { hp: 880, atk: 134, def: 78, spd: 92 },
    skills: [
      { name: 'Tymbal', text: 'Attack one enemy. Lowers their Accuracy by 20% for 2 turns.', cooldown: 0 },
      { name: 'Chorus', text: 'AoE. Damage rises by 25% for each turn this unit has been on the field.', cooldown: 4 },
      { name: 'Seventeen Years', text: 'Charges for 3 turns, then deals massive AoE damage. Once per battle.', cooldown: 8 },
    ],
    body: { size: 0.95, abdomen: 1.25, girth: 1.05, legs: 0.85, antennae: 0.3, wings: 2, stance: 0.85 },
    palette: { carapace: '#2f2a26', underside: '#7d6a4a', accent: '#c2a45c', eye: '#c0392b' },
  },
  {
    id: 'idolomantis',
    name: "Devil's Flower Mantis",
    latin: 'Idolomantis diabolica',
    rarity: 'legendary',
    role: 'controller',
    biome: 'meadow',
    fact:
      'Performs a deimatic display: rears up and throws open its forelegs and wings to flash white, red and black ' +
      'patterning, doubling its apparent size to startle a predator into hesitating.',
    stats: { hp: 920, atk: 156, def: 90, spd: 118 },
    skills: [
      { name: 'Flower Strike', text: 'Attack one enemy. Steals one buff.', cooldown: 0 },
      { name: 'Deimatic Display', text: 'All enemies are Feared for 1 turn: they cannot use skills on cooldown.', cooldown: 4 },
      { name: 'False Bloom', text: 'This unit cannot be targeted for 2 turns. Enemies that attack are Stunned.', cooldown: 5 },
    ],
    body: {
      size: 1.15, abdomen: 1.6, girth: 0.75, legs: 1.35, antennae: 0.95, wings: 2, stance: 1.25, raptorial: true,
    },
    palette: { carapace: '#4a3b52', underside: '#e8dcc0', accent: '#c0392b', eye: '#f2ead2' },
  },
  {
    id: 'atropos',
    name: "Death's-head Hawkmoth",
    latin: 'Acherontia atropos',
    rarity: 'epic',
    role: 'tender',
    biome: 'meadow',
    fact:
      'Raids beehives for honey, chemically masked so the colony does not recognise it as an intruder. ' +
      'Squeaks by forcing air through its pharynx when disturbed, and carries a skull-like marking on its thorax.',
    stats: { hp: 1000, atk: 108, def: 94, spd: 106 },
    skills: [
      { name: 'Proboscis', text: 'Attack one enemy and heal the weakest ally for 30% of the damage.', cooldown: 0 },
      { name: 'Hive Raid', text: 'Steal all buffs from one enemy and give them to the ally team.', cooldown: 4 },
      { name: 'Squeak', text: 'Cleanse all debuffs from the ally team and heal them by 20%.', cooldown: 5 },
    ],
    body: { size: 1.1, abdomen: 1.35, girth: 1.1, legs: 0.8, antennae: 0.75, wings: 2, stance: 0.9 },
    palette: { carapace: '#4a3a2c', underside: '#c9a227', accent: '#e8e0cc', eye: '#0f0b07' },
  },
  {
    id: 'apis',
    name: 'Honey Bee',
    latin: 'Apis mellifera',
    rarity: 'common',
    role: 'tender',
    biome: 'meadow',
    fact:
      'The barbed sting tears free of the bee along with part of her abdomen, killing her, while the venom sac keeps ' +
      'pumping and releases alarm pheromone that calls in the rest of the hive.',
    stats: { hp: 860, atk: 104, def: 84, spd: 110 },
    skills: [
      { name: 'Forage', text: 'Attack one enemy and heal the ally team by 10%.', cooldown: 0 },
      { name: 'Waggle Dance', text: 'Ally team gains +25% SPD for 2 turns.', cooldown: 3 },
      { name: 'Alarm Pheromone', text: 'This unit dies. The ally team gains +50% ATK for 3 turns and full HP.', cooldown: 7 },
    ],
    body: { size: 0.8, abdomen: 1.1, girth: 1.0, legs: 0.85, antennae: 0.7, wings: 2, stance: 0.9 },
    palette: { carapace: '#3a2c18', underside: '#e0a92b', accent: '#f5c542', eye: '#141008' },
  },
  {
    id: 'ctenocephalides',
    name: 'Cat Flea',
    latin: 'Ctenocephalides felis',
    rarity: 'common',
    role: 'striker',
    biome: 'burrow',
    fact:
      'Jumps around 100 times its body length using resilin pads that store and release energy far faster than muscle, ' +
      'accelerating at over 100 g. It launches from its toes, not its knees.',
    stats: { hp: 720, atk: 120, def: 62, spd: 158 },
    skills: [
      { name: 'Bite', text: 'Attack one enemy. +20% damage if this unit acts first.', cooldown: 0 },
      { name: 'Resilin Leap', text: 'Attack the enemy with the lowest HP. Extra turn if it kills.', cooldown: 2 },
      { name: 'Infestation', text: 'Attack all enemies and apply a stacking bleed.', cooldown: 4 },
    ],
    body: { size: 0.6, abdomen: 0.9, girth: 1.05, legs: 1.25, antennae: 0.35, wings: 0, stance: 0.8 },
    palette: { carapace: '#6b3f22', underside: '#8a5a2e', accent: '#33200f', eye: '#0d0703' },
  },
  {
    id: 'formicaruf',
    name: 'Red Wood Ant',
    latin: 'Formica rufa',
    rarity: 'common',
    role: 'bulwark',
    biome: 'rotwood',
    fact:
      'Sprays formic acid from its abdomen in a jet up to several times its body length. A disturbed nest of hundreds of ' +
      'thousands fires at once, and the mound is warmed by the colony itself.',
    stats: { hp: 1080, atk: 96, def: 126, spd: 82 },
    skills: [
      { name: 'Formic Spray', text: 'Attack one enemy. Lowers their ATK by 15% for 2 turns.', cooldown: 0 },
      { name: 'Mound', text: 'Taunt all enemies for 1 turn and gain +50% DEF.', cooldown: 3 },
      { name: 'Nest Alarm', text: 'Every ally attacks the enemy that last dealt damage.', cooldown: 5 },
    ],
    body: { size: 0.75, abdomen: 1.15, girth: 0.9, legs: 1.0, antennae: 1.0, wings: 0, stance: 1.0, mandibles: 0.8 },
    palette: { carapace: '#8a3a1e', underside: '#4a1f0d', accent: '#c25a2c', eye: '#150800' },
  },
];

