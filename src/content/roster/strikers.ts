/**
 * Attack species.
 *
 * Every skill is derived from a real, documented trait of the real animal. `fact` is
 * the trait; the skills are that trait expressed as game rules. Keep it that way when
 * adding species — it is the whole point of the game.
 */

import type { Species } from '../types';

export const STRIKERS: Species[] = [
  {
    id: 'mandarinia',
    name: 'Asian Giant Hornet',
    latin: 'Vespa mandarinia',
    rarity: 'legendary',
    role: 'striker',
    biome: 'canopy',
    fact:
      'A raiding party of a few dozen can destroy a honeybee colony of thousands, decapitating ' +
      'workers with their mandibles at roughly forty a minute and then carrying off the brood.',
    stats: { hp: 950, atk: 174, def: 84, spd: 134 },
    skills: [
      { name: 'Shear', text: 'Attack one enemy. Ignores 20% of DEF.', cooldown: 0 },
      { name: 'Slaughter Phase', text: 'Attack all enemies. Kills outright any below 15% HP.', cooldown: 4 },
      { name: 'Raid the Brood', text: 'Attack one enemy three times. Each hit steals 10% of their max HP as a shield.', cooldown: 5 },
    ],
    body: { size: 1.15, abdomen: 1.45, girth: 0.9, legs: 1.1, antennae: 0.7, wings: 2, stance: 1.05, mandibles: 1.2 },
    palette: { carapace: '#3a2a14', underside: '#e0a92b', accent: '#f5c542', eye: '#1a1207' },
  },
  {
    id: 'eciton',
    name: 'Army Ant',
    latin: 'Eciton burchellii',
    rarity: 'epic',
    role: 'striker',
    biome: 'canopy',
    fact:
      'Raids in columns of up to two hundred thousand workers with no fixed nest, linking their own ' +
      'bodies into living bridges so the swarm behind them never has to slow down.',
    stats: { hp: 830, atk: 142, def: 78, spd: 128 },
    skills: [
      { name: 'Column', text: 'Attack one enemy. Damage rises 15% for each living ally.', cooldown: 0 },
      { name: 'Swarm Raid', text: 'Six hits split at random among all enemies.', cooldown: 3 },
      { name: 'Living Bridge', text: 'Ally team ignores turn-order penalties and cannot be slowed for 3 turns.', cooldown: 5 },
    ],
    body: { size: 0.75, abdomen: 1.2, girth: 0.82, legs: 1.1, antennae: 1.0, wings: 0, stance: 1.05, mandibles: 1.3 },
    palette: { carapace: '#6b3a1c', underside: '#3d2010', accent: '#b5762f', eye: '#140a04' },
  },
  {
    id: 'myrmeleon',
    name: 'Antlion Larva',
    latin: 'Myrmeleon formicarius',
    rarity: 'rare',
    role: 'striker',
    biome: 'burrow',
    fact:
      'Digs a conical pit in loose sand and waits buried at the bottom. When prey slips on the walls ' +
      'it flicks sand upward to collapse the slope and drag the victim down to its jaws.',
    stats: { hp: 890, atk: 138, def: 96, spd: 76 },
    skills: [
      { name: 'Pit Jaws', text: 'Attack one enemy. +25% damage if they are Slowed.', cooldown: 0 },
      { name: 'Collapse the Slope', text: 'Slow one enemy heavily and pull them to the end of the turn order.', cooldown: 3 },
      { name: 'Buried Ambush', text: 'This unit cannot be targeted for 1 turn, then strikes the last enemy to act for double damage.', cooldown: 5 },
    ],
    body: { size: 0.9, abdomen: 1.15, girth: 1.2, legs: 0.7, antennae: 0.3, wings: 0, stance: 0.6, mandibles: 1.8 },
    palette: { carapace: '#8a7550', underside: '#5d4c30', accent: '#c0a878', eye: '#100c06' },
  },
  {
    id: 'platymeris',
    name: 'White-spotted Assassin Bug',
    latin: 'Platymeris biguttatus',
    rarity: 'epic',
    role: 'striker',
    biome: 'rotwood',
    fact:
      'Spits venomous saliva up to thirty centimetres, aimed at the eyes. The same enzymes injected ' +
      'through its beak dissolve muscle from the inside, so it drinks prey rather than chewing it.',
    stats: { hp: 820, atk: 156, def: 80, spd: 116 },
    skills: [
      { name: 'Beak', text: 'Attack one enemy. Applies Dissolve for 2 turns.', cooldown: 0 },
      { name: 'Venom Spit', text: 'Blinds one enemy for 2 turns: their attacks may miss entirely.', cooldown: 3 },
      { name: 'Drink Deep', text: 'Attack one enemy. Heals this unit for 60% of the damage dealt.', cooldown: 4 },
    ],
    body: { size: 1.0, abdomen: 1.3, girth: 1.0, legs: 1.15, antennae: 0.85, wings: 1, stance: 1.0 },
    palette: { carapace: '#171418', underside: '#2b2430', accent: '#e8e2d4', eye: '#c0392b' },
  },
  {
    id: 'titanus',
    name: 'Titan Beetle',
    latin: 'Titanus giganteus',
    rarity: 'legendary',
    role: 'striker',
    biome: 'rotwood',
    fact:
      'One of the largest insects alive, and its mandibles can snap a wooden pencil in half or cut ' +
      'into a finger. It hisses in warning before it bites.',
    stats: { hp: 1180, atk: 168, def: 118, spd: 72 },
    skills: [
      { name: 'Snap', text: 'Attack one enemy. Cannot be blocked by shields.', cooldown: 0 },
      { name: 'Warning Hiss', text: 'All enemies lose 20% ATK for 2 turns and cannot Taunt this unit.', cooldown: 3 },
      { name: 'Sever', text: 'Attack one enemy for heavy damage and stop them healing for 3 turns.', cooldown: 4 },
    ],
    body: { size: 1.35, abdomen: 1.1, girth: 1.3, legs: 0.85, antennae: 1.1, wings: 1, stance: 0.85, mandibles: 1.5 },
    palette: { carapace: '#6b5238', underside: '#4a3826', accent: '#8f7550', eye: '#140e08' },
  },
  {
    id: 'hercules',
    name: 'Hercules Beetle',
    latin: 'Dynastes hercules',
    rarity: 'epic',
    role: 'striker',
    biome: 'rotwood',
    fact:
      'Males fight over females by sliding their enormous thoracic horn under a rival, lifting him ' +
      'clear of the branch and throwing him off. They can carry many hundreds of times their own mass.',
    stats: { hp: 1140, atk: 152, def: 126, spd: 78 },
    skills: [
      { name: 'Horn Lift', text: 'Attack one enemy and push them to the end of the turn order.', cooldown: 0 },
      { name: 'Throw Clear', text: 'Attack one enemy. If it kills, this unit acts again immediately.', cooldown: 3 },
      { name: 'Overpower', text: 'Damage scales with the target\'s DEF instead of ignoring it.', cooldown: 4 },
    ],
    body: { size: 1.3, abdomen: 1.05, girth: 1.35, legs: 0.8, antennae: 0.45, wings: 1, stance: 0.8, mandibles: 0.7 },
    palette: { carapace: '#3a3226', underside: '#b9a460', accent: '#d8c47e', eye: '#0e0b07' },
  },
  {
    id: 'lucanus',
    name: 'European Stag Beetle',
    latin: 'Lucanus cervus',
    rarity: 'rare',
    role: 'striker',
    biome: 'rotwood',
    fact:
      'Males wrestle with antler-like mandibles, grappling for a grip and then flipping the loser off ' +
      'the branch. The jaws are for leverage against rivals, not for feeding.',
    stats: { hp: 1020, atk: 140, def: 112, spd: 86 },
    skills: [
      { name: 'Grapple', text: 'Attack one enemy and prevent them switching targets next turn.', cooldown: 0 },
      { name: 'Flip', text: 'Attack one enemy and stun them for 1 turn if their DEF is lower than this unit\'s.', cooldown: 3 },
      { name: 'Locked Antlers', text: 'This unit and one enemy both take no damage from anyone else for 1 turn.', cooldown: 5 },
    ],
    body: { size: 1.15, abdomen: 1.1, girth: 1.15, legs: 0.9, antennae: 0.5, wings: 1, stance: 0.85, mandibles: 2.0 },
    palette: { carapace: '#2e241c', underside: '#4a3626', accent: '#7d4a22', eye: '#0d0906' },
  },
  {
    id: 'promachus',
    name: 'Robber Fly',
    latin: 'Promachus rufipes',
    rarity: 'epic',
    role: 'striker',
    biome: 'meadow',
    fact:
      'Takes prey in mid-air, including wasps and other flies, then drives a stiff proboscis between ' +
      'the thoracic plates and injects neurotoxic saliva that stops the victim moving almost at once.',
    stats: { hp: 790, atk: 162, def: 68, spd: 146 },
    skills: [
      { name: 'Intercept', text: 'Attack one enemy. Ignores 25% of DEF.', cooldown: 0 },
      { name: 'Between the Plates', text: 'Guaranteed critical hit that also Stuns for 1 turn.', cooldown: 4 },
      { name: 'Take on the Wing', text: 'Attack the fastest enemy and steal 30% of their SPD for 2 turns.', cooldown: 4 },
    ],
    body: { size: 1.05, abdomen: 1.55, girth: 0.72, legs: 1.3, antennae: 0.35, wings: 2, stance: 1.15 },
    palette: { carapace: '#4a4038', underside: '#8a7a60', accent: '#b5462c', eye: '#2b6b4a' },
  },
  {
    id: 'cicindela',
    name: 'Green Tiger Beetle',
    latin: 'Cicindela campestris',
    rarity: 'rare',
    role: 'striker',
    biome: 'meadow',
    fact:
      'Runs so fast, relative to its size, that its eyes cannot gather enough light to form an image — ' +
      'it goes briefly blind mid-chase and has to stop, re-aim, and sprint again.',
    stats: { hp: 800, atk: 148, def: 74, spd: 156 },
    skills: [
      { name: 'Sprint', text: 'Attack one enemy. +30% damage if this unit acts first this turn.', cooldown: 0 },
      { name: 'Blind Charge', text: 'Attack twice at +50% damage, but this unit cannot act next turn.', cooldown: 3 },
      { name: 'Re-aim', text: 'Cleanse Blind from the ally team and gain +40% Accuracy for 2 turns.', cooldown: 4 },
    ],
    body: { size: 0.85, abdomen: 1.15, girth: 0.95, legs: 1.35, antennae: 0.8, wings: 1, stance: 1.2, mandibles: 1.1 },
    palette: { carapace: '#2f7a45', underside: '#c8a24a', accent: '#7fd46a', eye: '#141a10' },
  },
  {
    id: 'deinacrida',
    name: 'Giant Weta',
    latin: 'Deinacrida heteracantha',
    rarity: 'epic',
    role: 'striker',
    biome: 'canopy',
    fact:
      'Among the heaviest insects ever recorded — a gravid female can outweigh a sparrow. Threatened, ' +
      'it rears back and rakes the air with hind legs lined in hard spines.',
    stats: { hp: 1210, atk: 150, def: 108, spd: 70 },
    skills: [
      { name: 'Spined Kick', text: 'Attack one enemy. Applies Bleed for 2 turns.', cooldown: 0 },
      { name: 'Rear and Rake', text: 'Attack all enemies in front. Bleeds anyone already Bleeding twice as hard.', cooldown: 4 },
      { name: 'Dead Weight', text: 'Take 50% less damage this turn and counter every attacker.', cooldown: 5 },
    ],
    body: { size: 1.35, abdomen: 1.5, girth: 1.2, legs: 1.4, antennae: 1.5, wings: 0, stance: 1.0 },
    palette: { carapace: '#7d5a2c', underside: '#4a3418', accent: '#a8813c', eye: '#120c05' },
  },
  {
    id: 'corydalus',
    name: 'Eastern Dobsonfly',
    latin: 'Corydalus cornutus',
    rarity: 'rare',
    role: 'striker',
    biome: 'water',
    fact:
      'The male carries mandibles longer than his own head, used only to hold a female. The larva, a ' +
      'hellgrammite, spends years underwater as a predator and can draw blood from a careless hand.',
    stats: { hp: 900, atk: 144, def: 82, spd: 108 },
    skills: [
      { name: 'Hellgrammite', text: 'Attack one enemy. Applies Bleed for 3 turns.', cooldown: 0 },
      { name: 'Hold Fast', text: 'One enemy cannot act or be healed for 1 turn.', cooldown: 3 },
      { name: 'Years in the Current', text: 'Gain +15% ATK permanently each time this skill is used.', cooldown: 4 },
    ],
    body: { size: 1.2, abdomen: 1.7, girth: 0.8, legs: 1.0, antennae: 1.0, wings: 2, stance: 0.95, mandibles: 2.2 },
    palette: { carapace: '#5a4c3a', underside: '#8f8068', accent: '#d8cdb4', eye: '#161009' },
  },
  {
    id: 'dasymutilla',
    name: 'Velvet Ant',
    latin: 'Dasymutilla occidentalis',
    rarity: 'epic',
    role: 'striker',
    biome: 'meadow',
    fact:
      'Not an ant but a wingless wasp, nicknamed the cow killer for a sting placed near the top of the ' +
      'pain scale. Its cuticle is so hard that entomologists struggle to pin it, and it squeaks when handled.',
    stats: { hp: 940, atk: 154, def: 118, spd: 112 },
    skills: [
      { name: 'Cow Killer', text: 'Attack one enemy. 40% chance to Stun for 1 turn.', cooldown: 0 },
      { name: 'Hard Cuticle', text: 'Self. Immune to critical hits and take 40% less damage for 2 turns.', cooldown: 3 },
      { name: 'Squeak', text: 'All enemies lose 25% Accuracy for 2 turns.', cooldown: 4 },
    ],
    body: { size: 0.9, abdomen: 1.3, girth: 1.0, legs: 1.1, antennae: 0.9, wings: 0, stance: 1.1 },
    palette: { carapace: '#1a1210', underside: '#c0392b', accent: '#e2622a', eye: '#0c0705' },
  },
  {
    id: 'ocypus',
    name: "Devil's Coach Horse",
    latin: 'Ocypus olens',
    rarity: 'common',
    role: 'striker',
    biome: 'rotwood',
    fact:
      'Cornered, it curls its abdomen up over its back like a scorpion, opens its jaws wide, and ' +
      'releases a foul secretion from glands at the tip. The bluff is backed by a genuinely hard bite.',
    stats: { hp: 850, atk: 132, def: 88, spd: 118 },
    skills: [
      { name: 'Hard Bite', text: 'Attack one enemy. +20% damage against Feared targets.', cooldown: 0 },
      { name: 'Scorpion Bluff', text: 'Fear all enemies for 1 turn: they cannot use skills on cooldown.', cooldown: 3 },
      { name: 'Foul Glands', text: 'AoE damage that lowers enemy ATK by 20% for 2 turns.', cooldown: 4 },
    ],
    body: { size: 0.95, abdomen: 1.9, girth: 0.62, legs: 1.05, antennae: 0.85, wings: 1, stance: 0.9, mandibles: 1.2 },
    palette: { carapace: '#16130f', underside: '#2e2820', accent: '#6b5f45', eye: '#080605' },
  },
  {
    id: 'gryllotalpa',
    name: 'Mole Cricket',
    latin: 'Gryllotalpa gryllotalpa',
    rarity: 'common',
    role: 'striker',
    biome: 'burrow',
    fact:
      'Digs with shovel-shaped forelimbs and sings from a burrow shaped like a double horn, which ' +
      'amplifies the call loudly enough to be heard hundreds of metres away.',
    stats: { hp: 960, atk: 128, def: 100, spd: 82 },
    skills: [
      { name: 'Shovel Strike', text: 'Attack one enemy from below. Cannot be dodged.', cooldown: 0 },
      { name: 'Burrow', text: 'This unit cannot be targeted for 1 turn and its next attack is a critical hit.', cooldown: 3 },
      { name: 'Burrow Horn', text: 'AoE damage that also Slows every enemy for 2 turns.', cooldown: 4 },
    ],
    body: { size: 1.0, abdomen: 1.3, girth: 1.15, legs: 0.85, antennae: 0.7, wings: 1, stance: 0.65, mandibles: 0.8 },
    palette: { carapace: '#6b5236', underside: '#8f7a58', accent: '#453322', eye: '#120d07' },
  },
  {
    id: 'aeshna',
    name: 'Hawker Nymph',
    latin: 'Aeshna cyanea',
    rarity: 'rare',
    role: 'striker',
    biome: 'water',
    fact:
      'Its lower lip is a folded, hinged harpoon. It fires the whole apparatus out in around twenty-five ' +
      'milliseconds, hooks the prey on two palps, and pulls it straight back into the jaws.',
    stats: { hp: 870, atk: 146, def: 90, spd: 122 },
    skills: [
      { name: 'Labial Strike', text: 'Attack one enemy. Cannot miss.', cooldown: 0 },
      { name: 'Harpoon', text: 'Pull the furthest enemy to the front and attack them at +40% damage.', cooldown: 3 },
      { name: 'Sit and Wait', text: 'Skip this turn to guarantee critical hits for the next two turns.', cooldown: 4 },
    ],
    body: { size: 1.0, abdomen: 1.5, girth: 0.9, legs: 1.0, antennae: 0.25, wings: 0, stance: 0.75, mandibles: 1.0 },
    palette: { carapace: '#4a5a3c', underside: '#6b7a52', accent: '#2e3a26', eye: '#1a2016' },
  },
];
