/**
 * Attack species, third batch.
 *
 * Every skill is derived from a real, documented trait of the real animal.
 */

import type { Species } from '../types';

export const STRIKERS_3: Species[] = [
  {
    id: 'anoplophora',
    name: 'Citrus Longhorn Beetle',
    latin: 'Anoplophora chinensis',
    rarity: 'rare',
    role: 'striker',
    biome: 'canopy',
    fact:
      'Its larvae tunnel through living hardwood for two years, hollowing a trunk from the inside until ' +
      'the tree snaps in a storm. Antennae longer than its own body sweep the bark ahead of it.',
    stats: { hp: 1010, atk: 142, def: 104, spd: 88 },
    skills: [
      { name: 'Bore', text: 'Attack one enemy. Lowers their DEF by 20% for 3 turns.', cooldown: 0 },
      { name: 'Hollow Out', text: 'Attack one enemy. Damage rises 30% for each turn they have been Bored.', cooldown: 3 },
      { name: 'Until It Snaps', text: 'Attack one enemy for heavy damage. Double damage if their DEF is halved.', cooldown: 4 },
    ],
    body: { size: 1.2, abdomen: 1.5, girth: 0.95, legs: 1.0, antennae: 2.2, wings: 1, stance: 0.9, mandibles: 1.3 },
    palette: { carapace: '#1a1a1e', underside: '#3a3a42', accent: '#e8e8f0', eye: '#0a0a0c' },
  },
  {
    id: 'megasoma',
    name: 'Elephant Beetle',
    latin: 'Megasoma elephas',
    rarity: 'epic',
    role: 'striker',
    biome: 'rotwood',
    fact:
      'Covered in fine yellow hairs that shed rain and hide the black shell beneath. Males use a long ' +
      'thoracic horn to lever rivals off a sap flow, and can carry loads a hundred times their mass.',
    stats: { hp: 1220, atk: 154, def: 128, spd: 70 },
    skills: [
      { name: 'Lever', text: 'Attack one enemy and lower their SPD by 30% for 2 turns.', cooldown: 0 },
      { name: 'Hold the Sap', text: 'Taunt all enemies for 2 turns and gain +40% DEF.', cooldown: 3 },
      { name: 'Hundredfold', text: 'Attack one enemy. Damage scales with this unit\'s DEF, not ATK.', cooldown: 4 },
    ],
    body: { size: 1.35, abdomen: 1.1, girth: 1.4, legs: 0.82, antennae: 0.4, wings: 1, stance: 0.82 },
    palette: { carapace: '#8a7a4c', underside: '#2e2620', accent: '#c8b478', eye: '#0e0b07' },
  },
  {
    id: 'pachyrhynchus',
    name: 'Jewel Weevil',
    latin: 'Pachyrhynchus congestus',
    rarity: 'rare',
    role: 'striker',
    biome: 'canopy',
    fact:
      'Its colours are not pigment but light: scales built as photonic crystals bend specific wavelengths ' +
      'back at the viewer. The cuticle is so hard that a bird\'s beak often cannot crack it.',
    stats: { hp: 1060, atk: 126, def: 138, spd: 84 },
    skills: [
      { name: 'Hard Shell', text: 'Attack one enemy and gain +15% DEF for 2 turns.', cooldown: 0 },
      { name: 'Photonic Flare', text: 'Blind all enemies for 2 turns.', cooldown: 3 },
      { name: 'Uncrackable', text: 'Immune to critical hits and take 50% less damage for 3 turns.', cooldown: 4 },
    ],
    body: { size: 0.88, abdomen: 1.15, girth: 1.3, legs: 0.75, antennae: 0.6, wings: 1, stance: 0.78 },
    palette: { carapace: '#1a2a52', underside: '#0e1630', accent: '#3fd4e0', eye: '#080c18' },
  },
  {
    id: 'phasmahopla',
    name: 'Giant Prickly Stick Insect',
    latin: 'Extatosoma tiaratum',
    rarity: 'rare',
    role: 'striker',
    biome: 'canopy',
    fact:
      'Curls its abdomen over its back to imitate a scorpion, and its newly hatched young mimic the ' +
      'aggressive ants that would otherwise eat them, right down to the running gait.',
    stats: { hp: 1090, atk: 130, def: 110, spd: 92 },
    skills: [
      { name: 'Thorn Kick', text: 'Attack one enemy. Applies Bleed for 2 turns.', cooldown: 0 },
      { name: 'False Scorpion', text: 'Fear all enemies for 1 turn and gain +30% Evasion for 2.', cooldown: 3 },
      { name: 'Ant Mimicry', text: 'This unit cannot be targeted for 2 turns.', cooldown: 5 },
    ],
    body: { size: 1.25, abdomen: 1.9, girth: 0.85, legs: 1.5, antennae: 0.6, wings: 0, stance: 1.15 },
    palette: { carapace: '#8a6a3c', underside: '#5a4426', accent: '#b89052', eye: '#1a1208' },
  },
  {
    id: 'belostoma',
    name: 'Water Bug Father',
    latin: 'Belostoma flumineum',
    rarity: 'common',
    role: 'striker',
    biome: 'water',
    fact:
      'The female glues her eggs onto the male\'s back and leaves. He carries them for weeks, fanning them ' +
      'with his legs to keep them oxygenated, and hunts with the whole clutch still attached.',
    stats: { hp: 1000, atk: 128, def: 112, spd: 86 },
    skills: [
      { name: 'Pierce', text: 'Attack one enemy and heal for 25% of the damage dealt.', cooldown: 0 },
      { name: 'Carry the Clutch', text: 'Gain a shield worth 25% of max HP; while it holds, +25% ATK.', cooldown: 3 },
      { name: 'Fan and Guard', text: 'Ally team gains +20% DEF for 3 turns and cleanses one debuff.', cooldown: 4 },
    ],
    body: { size: 0.98, abdomen: 1.2, girth: 1.3, legs: 1.05, antennae: 0.22, wings: 1, stance: 0.7 },
    palette: { carapace: '#6b5c40', underside: '#8f7f60', accent: '#463a26', eye: '#141008' },
  },
  {
    id: 'pepsisformosa',
    name: 'Blue Tarantula Hawk',
    latin: 'Pepsis formosa',
    rarity: 'epic',
    role: 'striker',
    biome: 'burrow',
    fact:
      'Grapples a tarantula on open ground, wrestling it onto its back to reach the soft joint where the ' +
      'legs meet the body. One sting there and the spider is limp within seconds.',
    stats: { hp: 900, atk: 160, def: 88, spd: 132 },
    skills: [
      { name: 'Find the Joint', text: 'Attack one enemy. Ignores 30% of DEF.', cooldown: 0 },
      { name: 'Wrestle Over', text: 'Attack one enemy and Stun them for 1 turn.', cooldown: 3 },
      { name: 'Limp in Seconds', text: 'Attack one enemy. If it does not kill, they lose 50% SPD for 3 turns.', cooldown: 4 },
    ],
    body: { size: 1.05, abdomen: 1.45, girth: 0.78, legs: 1.3, antennae: 0.8, wings: 2, stance: 1.15 },
    palette: { carapace: '#1c1a3a', underside: '#2e2a52', accent: '#e8622a', eye: '#14122a' },
  },
  {
    id: 'sphodromantis',
    name: 'African Mantis',
    latin: 'Sphodromantis lineola',
    rarity: 'rare',
    role: 'striker',
    biome: 'meadow',
    fact:
      'Judges distance with true stereo vision — the only insect group known to do so — turning its head ' +
      'to triangulate before it strikes, and it will only fire when the range is exact.',
    stats: { hp: 900, atk: 152, def: 84, spd: 118 },
    skills: [
      { name: 'Measured Strike', text: 'Attack one enemy. Cannot miss.', cooldown: 0 },
      { name: 'Triangulate', text: 'Gain +40% critical chance and +25% Accuracy for 3 turns.', cooldown: 3 },
      { name: 'Exact Range', text: 'Guaranteed critical hit that ignores 25% of DEF.', cooldown: 4 },
    ],
    body: {
      size: 1.12, abdomen: 1.6, girth: 0.65, legs: 1.35, antennae: 0.9, wings: 2, stance: 1.2, raptorial: true,
    },
    palette: { carapace: '#6b8a42', underside: '#a8c470', accent: '#42582a', eye: '#e8e4c0' },
  },
  {
    id: 'macrotermessoldier',
    name: 'Termite Soldier',
    latin: 'Macrotermes natalensis',
    rarity: 'common',
    role: 'striker',
    biome: 'burrow',
    fact:
      'Its head is a snapping tool and nothing else — it cannot feed itself and is hand-fed by workers. ' +
      'Some castes rupture their own bodies to seal a breach in the mound with glue.',
    stats: { hp: 940, atk: 134, def: 118, spd: 80 },
    skills: [
      { name: 'Snap', text: 'Attack one enemy. Ignores 15% of DEF.', cooldown: 0 },
      { name: 'Seal the Breach', text: 'Shield the ally team for 20% of this unit\'s max HP.', cooldown: 3 },
      { name: 'Autothysis', text: 'This unit dies and deals heavy damage to all enemies.', cooldown: 6 },
    ],
    body: { size: 0.8, abdomen: 1.25, girth: 1.0, legs: 0.9, antennae: 0.75, wings: 0, stance: 0.85, mandibles: 1.7 },
    palette: { carapace: '#c8a878', underside: '#e0cca8', accent: '#8a6a44', eye: '#2a2016' },
  },
  {
    id: 'euchroma',
    name: 'Giant Metallic Ceiba Borer',
    latin: 'Euchroma gigantea',
    rarity: 'epic',
    role: 'striker',
    biome: 'rotwood',
    fact:
      'Its iridescent elytra have been used as jewellery for centuries and survive intact for decades. ' +
      'Some relatives of this family sense forest fires from tens of kilometres away and fly toward them.',
    stats: { hp: 1120, atk: 148, def: 122, spd: 82 },
    skills: [
      { name: 'Bore In', text: 'Attack one enemy and Burn them for 2 turns.', cooldown: 0 },
      { name: 'Toward the Fire', text: 'Attack the enemy with the highest ATK. +50% damage if they are Burning.', cooldown: 3 },
      { name: 'Enduring Shell', text: 'Damage taken is halved for 3 turns and cannot be increased.', cooldown: 4 },
    ],
    body: { size: 1.25, abdomen: 1.3, girth: 1.15, legs: 0.85, antennae: 0.5, wings: 1, stance: 0.85 },
    palette: { carapace: '#2f6b3a', underside: '#c8a24a', accent: '#4fd48a', eye: '#0e1a10' },
  },
  {
    id: 'scolopendrina',
    name: 'House Centipede Hunter',
    latin: 'Scutigera coleoptrata',
    rarity: 'rare',
    role: 'striker',
    biome: 'burrow',
    fact:
      'Not an insect but a myriapod, and the fastest thing on a wall — it runs at over forty centimetres a ' +
      'second on fifteen pairs of legs, catching two or three prey at once and holding them while it eats.',
    stats: { hp: 880, atk: 144, def: 82, spd: 152 },
    skills: [
      { name: 'Lasso Legs', text: 'Attack two enemies at 70% damage each.', cooldown: 0 },
      { name: 'Wall Run', text: 'Gain +50% SPD and dodge the next attack.', cooldown: 2 },
      { name: 'Hold Them All', text: 'Attack all enemies and prevent them dodging for 2 turns.', cooldown: 4 },
    ],
    body: { size: 1.15, abdomen: 2.2, girth: 0.5, legs: 1.8, antennae: 1.6, wings: 0, stance: 1.0 },
    palette: { carapace: '#c8a060', underside: '#8a6a3c', accent: '#3a2c18', eye: '#140e06' },
  },
  {
    id: 'harpegnathos',
    name: 'Jumping Ant',
    latin: 'Harpegnathos saltator',
    rarity: 'epic',
    role: 'striker',
    biome: 'rotwood',
    fact:
      'Hunts by sight and leaps on its prey. When the queen dies, ordinary workers duel with their antennae ' +
      'for weeks; the winners become egg-layers and their brains physically shrink.',
    stats: { hp: 930, atk: 150, def: 94, spd: 138 },
    skills: [
      { name: 'Pounce', text: 'Attack one enemy. +25% damage if this unit acts first.', cooldown: 0 },
      { name: 'Antennal Duel', text: 'Attack one enemy. Steals 20% of their ATK for 3 turns.', cooldown: 3 },
      { name: 'Become the Queen', text: 'Gain +40% ATK permanently, but lose 20% max HP.', cooldown: 5 },
    ],
    body: { size: 0.95, abdomen: 1.35, girth: 0.82, legs: 1.3, antennae: 1.2, wings: 0, stance: 1.2, mandibles: 1.6 },
    palette: { carapace: '#2a2018', underside: '#5a4630', accent: '#c8a24a', eye: '#e8dcb0' },
  },
  {
    id: 'gigantiops',
    name: 'Big-eyed Ant',
    latin: 'Gigantiops destructor',
    rarity: 'rare',
    role: 'striker',
    biome: 'canopy',
    fact:
      'Has the largest eyes of any ant, covering most of its head, and navigates by memorising the shape of ' +
      'the canopy above it. It jumps between leaves rather than following a trail.',
    stats: { hp: 870, atk: 138, def: 86, spd: 146 },
    skills: [
      { name: 'Leap Strike', text: 'Attack one enemy. Cannot be countered.', cooldown: 0 },
      { name: 'Read the Canopy', text: 'Gain +35% Evasion and immunity to Blind for 3 turns.', cooldown: 3 },
      { name: 'No Trail', text: 'Attack the enemy with the lowest DEF twice.', cooldown: 3 },
    ],
    body: { size: 0.85, abdomen: 1.25, girth: 0.8, legs: 1.35, antennae: 1.1, wings: 0, stance: 1.25 },
    palette: { carapace: '#3a2f24', underside: '#6b5a44', accent: '#a89478', eye: '#f0e8d0' },
  },
  {
    id: 'anisoptera',
    name: 'Globe Skimmer',
    latin: 'Pantala flavescens',
    rarity: 'epic',
    role: 'striker',
    biome: 'water',
    fact:
      'Crosses open ocean on monsoon winds — a single generation covers thousands of kilometres, the ' +
      'longest migration of any insect, gliding to save energy rather than beating its wings.',
    stats: { hp: 820, atk: 150, def: 72, spd: 158 },
    skills: [
      { name: 'Skim', text: 'Attack one enemy. Cannot miss and cannot be dodged.', cooldown: 0 },
      { name: 'Ride the Monsoon', text: 'Ally team gains +30% SPD for 3 turns.', cooldown: 3 },
      { name: 'Thousand Kilometres', text: 'Attack every enemy once, in turn-order sequence.', cooldown: 4 },
    ],
    body: { size: 1.15, abdomen: 2.3, girth: 0.48, legs: 0.8, antennae: 0.2, wings: 2, stance: 1.0 },
    palette: { carapace: '#c8a24a', underside: '#e8d488', accent: '#8a6a2c', eye: '#3a2f18' },
  },
  {
    id: 'periplaneta',
    name: 'American Cockroach',
    latin: 'Periplaneta americana',
    rarity: 'common',
    role: 'striker',
    biome: 'burrow',
    fact:
      'Runs at fifty body lengths a second, and its escape reflex fires from hairs on the abdomen that ' +
      'detect air movement — it is moving before a swatting hand has travelled a centimetre.',
    stats: { hp: 950, atk: 124, def: 96, spd: 150 },
    skills: [
      { name: 'Scuttle', text: 'Attack one enemy. +20% damage if this unit is faster than them.', cooldown: 0 },
      { name: 'Escape Reflex', text: 'Dodge the next two attacks automatically.', cooldown: 3 },
      { name: 'Survive Anything', text: 'Cleanse all debuffs from this unit and heal 40%.', cooldown: 4 },
    ],
    body: { size: 0.95, abdomen: 1.35, girth: 1.2, legs: 1.25, antennae: 1.8, wings: 1, stance: 0.68 },
    palette: { carapace: '#6b4224', underside: '#8f5c30', accent: '#3a2010', eye: '#1a0e05' },
  },
  {
    id: 'chrysina',
    name: 'Golden Scarab',
    latin: 'Chrysina resplendens',
    rarity: 'legendary',
    role: 'striker',
    biome: 'canopy',
    fact:
      'Looks like polished gold because its shell is a stack of chitin layers acting as a near-perfect ' +
      'mirror — one of very few natural structures that reflects circularly polarised light.',
    stats: { hp: 1150, atk: 162, def: 140, spd: 92 },
    skills: [
      { name: 'Mirror Strike', text: 'Attack one enemy and reflect 25% of the next damage taken.', cooldown: 0 },
      { name: 'Polarised Glare', text: 'All enemies lose 30% Accuracy for 3 turns.', cooldown: 3 },
      { name: 'Gilded', text: 'For 2 turns, all damage aimed at this unit is returned to its sender.', cooldown: 5 },
    ],
    body: { size: 1.1, abdomen: 1.1, girth: 1.3, legs: 0.8, antennae: 0.5, wings: 1, stance: 0.82 },
    palette: { carapace: '#e8c44a', underside: '#f5e08a', accent: '#a87c1c', eye: '#2a2008' },
  },
  {
    id: 'stagmomantis',
    name: 'Carolina Mantis',
    latin: 'Stagmomantis carolina',
    rarity: 'common',
    role: 'striker',
    biome: 'meadow',
    fact:
      'Females eat the male after mating often enough that it measurably improves the eggs, and hunt from ' +
      'a still, swaying pose that mimics a leaf in wind until the moment they fire.',
    stats: { hp: 860, atk: 140, def: 78, spd: 114 },
    skills: [
      { name: 'Snatch', text: 'Attack one enemy. +25% damage from full HP.', cooldown: 0 },
      { name: 'Sway', text: 'Gain +35% Evasion for 2 turns.', cooldown: 3 },
      { name: 'Consume', text: 'Attack one enemy. If it kills, heal fully and gain +25% ATK.', cooldown: 4 },
    ],
    body: {
      size: 1.0, abdomen: 1.55, girth: 0.7, legs: 1.3, antennae: 0.85, wings: 2, stance: 1.15, raptorial: true,
    },
    palette: { carapace: '#7d8a5c', underside: '#b0bc8a', accent: '#5a6640', eye: '#e0dcb8' },
  },
  {
    id: 'cerambyx',
    name: 'Great Capricorn Beetle',
    latin: 'Cerambyx cerdo',
    rarity: 'rare',
    role: 'striker',
    biome: 'rotwood',
    fact:
      'Its larvae spend up to five years cutting galleries through living oak, and the tunnels they leave ' +
      'become homes for dozens of other species. Adults fight over sap at dusk.',
    stats: { hp: 1080, atk: 140, def: 116, spd: 86 },
    skills: [
      { name: 'Gallery Cut', text: 'Attack one enemy. Applies Bleed for 2 turns.', cooldown: 0 },
      { name: 'Five Years', text: 'Gain +12% ATK and DEF every turn this battle. Stacks.', cooldown: 4 },
      { name: 'Dusk Duel', text: 'Attack the enemy with the highest ATK twice.', cooldown: 3 },
    ],
    body: { size: 1.25, abdomen: 1.45, girth: 1.0, legs: 0.9, antennae: 2.0, wings: 1, stance: 0.88, mandibles: 1.4 },
    palette: { carapace: '#2a231c', underside: '#4a3c2c', accent: '#8a6a44', eye: '#0e0a06' },
  },
  {
    id: 'sirex',
    name: 'Wood Wasp',
    latin: 'Sirex noctilio',
    rarity: 'common',
    role: 'striker',
    biome: 'rotwood',
    fact:
      'Drills through solid pine with a needle ovipositor and injects a toxic mucus along with a fungus. ' +
      'The mucus wilts the tree, the fungus rots it, and her larvae eat the result.',
    stats: { hp: 920, atk: 130, def: 92, spd: 104 },
    skills: [
      { name: 'Drill', text: 'Attack one enemy. Ignores 25% of DEF.', cooldown: 0 },
      { name: 'Toxic Mucus', text: 'Poison one enemy for 3 turns and lower their DEF by 20%.', cooldown: 3 },
      { name: 'Sow the Rot', text: 'All enemies take Poison that grows 40% stronger each turn.', cooldown: 5 },
    ],
    body: { size: 1.0, abdomen: 1.65, girth: 0.75, legs: 0.95, antennae: 0.9, wings: 2, stance: 0.95 },
    palette: { carapace: '#1e1c22', underside: '#c8a24a', accent: '#5a4a2c', eye: '#0c0a0e' },
  },
  {
    id: 'megachile',
    name: "Wallace's Giant Bee",
    latin: 'Megachile pluto',
    rarity: 'legendary',
    role: 'striker',
    biome: 'canopy',
    fact:
      'The largest bee known, with a wingspan the width of a hand. She nests inside occupied termite ' +
      'mounds, sealing off her own chamber with resin she carries in enormous jaws.',
    stats: { hp: 1080, atk: 158, def: 112, spd: 108 },
    skills: [
      { name: 'Great Jaws', text: 'Attack one enemy. Ignores shields.', cooldown: 0 },
      { name: 'Resin Seal', text: 'Gain a shield worth 35% of max HP and immunity to debuffs for 2 turns.', cooldown: 4 },
      { name: 'Nest in the Enemy', text: 'Attack one enemy and take 25% of their ATK for 3 turns.', cooldown: 4 },
    ],
    body: { size: 1.35, abdomen: 1.4, girth: 1.15, legs: 0.95, antennae: 0.7, wings: 2, stance: 0.95, mandibles: 1.8 },
    palette: { carapace: '#1a1410', underside: '#3a2c1e', accent: '#8a6a3c', eye: '#0c0806' },
  },
  {
    id: 'polyergus',
    name: 'Amazon Slave-maker Ant',
    latin: 'Polyergus rufescens',
    rarity: 'epic',
    role: 'striker',
    biome: 'burrow',
    fact:
      'Cannot feed itself or raise its own brood. It raids other ants\' nests, kills the defenders with ' +
      'sabre-shaped mandibles, and carries off the pupae to be raised as its workforce.',
    stats: { hp: 900, atk: 156, def: 92, spd: 130 },
    skills: [
      { name: 'Sabre Jaws', text: 'Attack one enemy. Ignores 20% of DEF.', cooldown: 0 },
      { name: 'Raid', text: 'Attack all enemies and steal one buff from each.', cooldown: 4 },
      { name: 'Carry Off the Brood', text: 'Attack one enemy. Their next skill is used by this unit instead.', cooldown: 5 },
    ],
    body: { size: 0.9, abdomen: 1.3, girth: 0.85, legs: 1.2, antennae: 1.0, wings: 0, stance: 1.15, mandibles: 1.9 },
    palette: { carapace: '#a83a1c', underside: '#6b2410', accent: '#d86a34', eye: '#1a0800' },
  },
  {
    id: 'tabanus',
    name: 'Horse Fly',
    latin: 'Tabanus sudeticus',
    rarity: 'common',
    role: 'striker',
    biome: 'meadow',
    fact:
      'Cuts rather than pierces: scissor-like mouthparts slice the skin open and she laps from the pool. ' +
      'The wound keeps bleeding long after she has gone, and she will return to the same one.',
    stats: { hp: 900, atk: 132, def: 88, spd: 128 },
    skills: [
      { name: 'Scissor Bite', text: 'Attack one enemy. Applies Bleed for 3 turns.', cooldown: 0 },
      { name: 'Return to the Wound', text: 'Attack a Bleeding enemy for double damage.', cooldown: 3 },
      { name: 'Keep It Open', text: 'Bleeds on all enemies cannot be cleansed for 3 turns.', cooldown: 4 },
    ],
    body: { size: 0.95, abdomen: 1.3, girth: 1.05, legs: 0.9, antennae: 0.25, wings: 2, stance: 0.9 },
    palette: { carapace: '#4a4038', underside: '#7d6c58', accent: '#2a241e', eye: '#2f6b52' },
  },
  {
    id: 'oecanthus',
    name: 'Tree Cricket',
    latin: 'Oecanthus fultoni',
    rarity: 'common',
    role: 'striker',
    biome: 'canopy',
    fact:
      'Chews a hole in a leaf and sings through it, using the leaf as a baffle that doubles the volume. ' +
      'Its chirp rate tracks temperature so precisely you can read the air from the count.',
    stats: { hp: 850, atk: 126, def: 84, spd: 132 },
    skills: [
      { name: 'Chirp Strike', text: 'Attack one enemy and lower their Accuracy by 15% for 2 turns.', cooldown: 0 },
      { name: 'Leaf Baffle', text: 'Double the effect of this unit\'s next skill.', cooldown: 3 },
      { name: 'Thermometer Song', text: 'Ally team gains +20% SPD and +20% Accuracy for 3 turns.', cooldown: 4 },
    ],
    body: { size: 0.82, abdomen: 1.3, girth: 0.8, legs: 1.25, antennae: 1.7, wings: 2, stance: 1.05 },
    palette: { carapace: '#b8d48a', underside: '#d8e8b0', accent: '#7d9c54', eye: '#2a3418' },
  },
  {
    id: 'phyllium',
    name: 'Walking Leaf',
    latin: 'Phyllium giganteum',
    rarity: 'rare',
    role: 'striker',
    biome: 'canopy',
    fact:
      'Copies a leaf down to the vein pattern, the brown edges of decay, and the holes where something has ' +
      'eaten it. It rocks in the breeze to complete the effect and will not break the pose.',
    stats: { hp: 1000, atk: 122, def: 126, spd: 90 },
    skills: [
      { name: 'Leaf Edge', text: 'Attack one enemy. +30% damage if this unit has not been hit yet.', cooldown: 0 },
      { name: 'Hold the Pose', text: 'This unit cannot be targeted for 2 turns.', cooldown: 4 },
      { name: 'Vein Perfect', text: 'Copy the highest ATK on the field for 3 turns.', cooldown: 5 },
    ],
    body: { size: 1.05, abdomen: 1.35, girth: 1.5, legs: 1.15, antennae: 0.5, wings: 1, stance: 1.0 },
    palette: { carapace: '#7da84c', underside: '#a8c870', accent: '#5a7a30', eye: '#1e2a14' },
  },
  {
    id: 'copris',
    name: 'Horned Dung Beetle',
    latin: 'Copris lunaris',
    rarity: 'common',
    role: 'striker',
    biome: 'burrow',
    fact:
      'A pair excavate a nursery chamber together and stay with the brood — unusual for a beetle — with ' +
      'the female repairing the brood balls and cleaning off mould for weeks.',
    stats: { hp: 1090, atk: 122, def: 130, spd: 76 },
    skills: [
      { name: 'Horn Dig', text: 'Attack one enemy and lower their SPD by 20% for 2 turns.', cooldown: 0 },
      { name: 'Nursery Chamber', text: 'Shield the two weakest allies for 20% of their max HP.', cooldown: 3 },
      { name: 'Tend the Brood', text: 'Ally team is cleansed and healed 20%.', cooldown: 5 },
    ],
    body: { size: 0.95, abdomen: 1.0, girth: 1.4, legs: 0.7, antennae: 0.45, wings: 1, stance: 0.68, mandibles: 0.6 },
    palette: { carapace: '#1e1c1a', underside: '#3a3632', accent: '#6b5c44', eye: '#0a0908' },
  },
  {
    id: 'zophobas',
    name: 'Superworm Beetle',
    latin: 'Zophobas morio',
    rarity: 'common',
    role: 'striker',
    biome: 'rotwood',
    fact:
      'Its gut bacteria break down polystyrene, and the larvae will chew through packing foam and pass it ' +
      'as compost. Crowded, they turn on each other without hesitation.',
    stats: { hp: 990, atk: 128, def: 104, spd: 96 },
    skills: [
      { name: 'Chew', text: 'Attack one enemy and remove one shield.', cooldown: 0 },
      { name: 'Break It Down', text: 'Strip all buffs and shields from one enemy.', cooldown: 3 },
      { name: 'Turn on Each Other', text: 'One enemy attacks their own ally this turn.', cooldown: 5 },
    ],
    body: { size: 0.9, abdomen: 1.55, girth: 1.1, legs: 0.8, antennae: 0.55, wings: 1, stance: 0.65 },
    palette: { carapace: '#26221c', underside: '#c8a878', accent: '#5a4a34', eye: '#0c0a07' },
  },
  {
    id: 'anthia',
    name: 'Sun Beetle',
    latin: 'Anthia sexguttata',
    rarity: 'rare',
    role: 'striker',
    biome: 'burrow',
    fact:
      'Runs down prey across open sand in daylight and sprays formic acid accurately at the face of ' +
      'anything that corners it. The spray can blind a small vertebrate.',
    stats: { hp: 950, atk: 144, def: 100, spd: 124 },
    skills: [
      { name: 'Run Down', text: 'Attack one enemy. +25% damage against slower targets.', cooldown: 0 },
      { name: 'Acid Spray', text: 'Blind one enemy for 3 turns and lower their ATK by 20%.', cooldown: 3 },
      { name: 'Open Ground', text: 'Attack all enemies. +40% damage against Blinded targets.', cooldown: 4 },
    ],
    body: { size: 1.05, abdomen: 1.3, girth: 1.0, legs: 1.2, antennae: 0.8, wings: 1, stance: 1.05, mandibles: 1.2 },
    palette: { carapace: '#16151a', underside: '#2e2c34', accent: '#f0ece0', eye: '#0a090c' },
  },
  {
    id: 'thermonectus',
    name: 'Sunburst Diving Beetle',
    latin: 'Thermonectus marmoratus',
    rarity: 'rare',
    role: 'striker',
    biome: 'water',
    fact:
      'Its larva has bifocal eyes — two retinas per eye at different focal depths — letting it switch focus ' +
      'mid-lunge to strike mosquito larvae it is chasing through open water.',
    stats: { hp: 920, atk: 142, def: 96, spd: 126 },
    skills: [
      { name: 'Bifocal Lunge', text: 'Attack one enemy. Cannot miss.', cooldown: 0 },
      { name: 'Switch Focus', text: 'Attack a second enemy immediately at 70% damage.', cooldown: 3 },
      { name: 'Open Water Hunt', text: 'Attack the two lowest-HP enemies. Kills grant an extra turn.', cooldown: 4 },
    ],
    body: { size: 0.9, abdomen: 1.15, girth: 1.25, legs: 1.15, antennae: 0.35, wings: 1, stance: 0.72 },
    palette: { carapace: '#26221a', underside: '#f0c84a', accent: '#f5dc84', eye: '#100e08' },
  },
  {
    id: 'brachypelmaphid',
    name: 'Assassin Bug Nymph',
    latin: 'Reduvius personatus',
    rarity: 'common',
    role: 'striker',
    biome: 'burrow',
    fact:
      'The nymph glues dust and the husks of its own victims onto its back until it looks like a moving ' +
      'ball of lint, then walks openly among the prey it is hunting.',
    stats: { hp: 890, atk: 134, def: 92, spd: 118 },
    skills: [
      { name: 'Beak Jab', text: 'Attack one enemy. Applies Dissolve for 2 turns.', cooldown: 0 },
      { name: 'Masked in Husks', text: 'This unit cannot be targeted until it attacks.', cooldown: 3 },
      { name: 'Walk Among Them', text: 'Attack all enemies. +50% damage while masked.', cooldown: 4 },
    ],
    body: { size: 0.85, abdomen: 1.25, girth: 1.15, legs: 1.1, antennae: 0.9, wings: 1, stance: 0.9 },
    palette: { carapace: '#5a5248', underside: '#7d746a', accent: '#3a352e', eye: '#141210' },
  },
];
