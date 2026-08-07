/**
 * Attack species, second batch.
 *
 * Every skill is derived from a real, documented trait of the real animal.
 */

import type { Species } from '../types';

export const STRIKERS_2: Species[] = [
  {
    id: 'goliathus',
    name: 'Goliath Beetle',
    latin: 'Goliathus goliatus',
    rarity: 'legendary',
    role: 'striker',
    biome: 'canopy',
    fact:
      'Among the heaviest insects on Earth as a larva — heavier than the adult it becomes. Unusually for a ' +
      'flower beetle, those larvae need animal protein to develop, and will take meat.',
    stats: { hp: 1280, atk: 164, def: 130, spd: 68 },
    skills: [
      { name: 'Bulk', text: 'Attack one enemy. Damage scales with this unit\'s max HP.', cooldown: 0 },
      { name: 'Take Meat', text: 'Attack one enemy and heal for 50% of the damage dealt.', cooldown: 3 },
      { name: 'Heavier Then', text: 'Gain 20% max HP and 20% ATK for the rest of the battle. Stacks.', cooldown: 5 },
    ],
    body: { size: 1.4, abdomen: 1.15, girth: 1.4, legs: 0.85, antennae: 0.5, wings: 1, stance: 0.85 },
    palette: { carapace: '#3a3228', underside: '#e8e0cc', accent: '#a8987c', eye: '#100c08' },
  },
  {
    id: 'chalcosoma',
    name: 'Atlas Beetle',
    latin: 'Chalcosoma atlas',
    rarity: 'epic',
    role: 'striker',
    biome: 'canopy',
    fact:
      'The male carries three horns — two from the thorax, one from the head — and uses them as a set of ' +
      'pincers, closing them on a rival to lift and drop him. Males will fight until one stops moving.',
    stats: { hp: 1160, atk: 158, def: 122, spd: 76 },
    skills: [
      { name: 'Pincer', text: 'Attack one enemy twice at 60% damage each.', cooldown: 0 },
      { name: 'Lift and Drop', text: 'Attack one enemy and stun them for 1 turn.', cooldown: 3 },
      { name: 'Until One Stops', text: 'Attack one enemy repeatedly while both are above 50% HP, up to four hits.', cooldown: 5 },
    ],
    body: { size: 1.3, abdomen: 1.05, girth: 1.35, legs: 0.85, antennae: 0.45, wings: 1, stance: 0.85, mandibles: 1.4 },
    palette: { carapace: '#141218', underside: '#2e2a30', accent: '#5a5460', eye: '#0a0809' },
  },
  {
    id: 'allomyrina',
    name: 'Japanese Rhinoceros Beetle',
    latin: 'Allomyrina dichotoma',
    rarity: 'rare',
    role: 'striker',
    biome: 'rotwood',
    fact:
      'Wedges its forked head horn beneath an opponent and levers him off the branch. Strong enough that ' +
      'children in Japan have kept them as fighting pets for centuries.',
    stats: { hp: 1080, atk: 144, def: 116, spd: 84 },
    skills: [
      { name: 'Wedge', text: 'Attack one enemy and push them one place later in the turn order.', cooldown: 0 },
      { name: 'Lever Off', text: 'Attack one enemy. Double damage if they are slower than this unit.', cooldown: 3 },
      { name: 'Hold the Branch', text: 'Cannot be moved or stunned for 3 turns, and counter every attack.', cooldown: 4 },
    ],
    body: { size: 1.2, abdomen: 1.05, girth: 1.3, legs: 0.85, antennae: 0.45, wings: 1, stance: 0.8, mandibles: 1.2 },
    palette: { carapace: '#2a201a', underside: '#4a3a2a', accent: '#7d6244', eye: '#0d0906' },
  },
  {
    id: 'gryllus',
    name: 'Field Cricket',
    latin: 'Gryllus bimaculatus',
    rarity: 'common',
    role: 'striker',
    biome: 'meadow',
    fact:
      'Males fight over territory with mandibles and hind legs, and the winner immediately sings a ' +
      'distinct victory song. Losers stay submissive for hours afterwards and will not challenge again.',
    stats: { hp: 880, atk: 130, def: 86, spd: 122 },
    skills: [
      { name: 'Kick', text: 'Attack one enemy. +20% damage against anyone already damaged this turn.', cooldown: 0 },
      { name: 'Victory Song', text: 'If this unit killed last turn, the ally team gains +30% ATK for 2 turns.', cooldown: 3 },
      { name: 'Submission', text: 'One enemy loses 30% ATK for 3 turns and cannot use their ultimate.', cooldown: 4 },
    ],
    body: { size: 0.95, abdomen: 1.35, girth: 0.95, legs: 1.3, antennae: 1.5, wings: 1, stance: 1.0, mandibles: 0.9 },
    palette: { carapace: '#2a231c', underside: '#5a4c3a', accent: '#8a7048', eye: '#100c08' },
  },
  {
    id: 'crabro',
    name: 'European Hornet',
    latin: 'Vespa crabro',
    rarity: 'rare',
    role: 'striker',
    biome: 'rotwood',
    fact:
      'Hunts large insects on the wing, then butchers them in place — discarding wings, legs and head and ' +
      'carrying home only the protein-rich thorax muscle. It will hunt at night by moonlight.',
    stats: { hp: 920, atk: 150, def: 90, spd: 126 },
    skills: [
      { name: 'Butcher', text: 'Attack one enemy. Removes one of their buffs.', cooldown: 0 },
      { name: 'Take the Thorax', text: 'Attack one enemy and heal 35% of the damage dealt to the ally team.', cooldown: 3 },
      { name: 'Hunt by Moonlight', text: 'Cannot miss and ignores Blind for 3 turns. +25% critical chance.', cooldown: 4 },
    ],
    body: { size: 1.1, abdomen: 1.4, girth: 0.88, legs: 1.05, antennae: 0.7, wings: 2, stance: 1.0, mandibles: 1.1 },
    palette: { carapace: '#7d3a14', underside: '#e8b83c', accent: '#f0d068', eye: '#1a0e04' },
  },
  {
    id: 'vespula',
    name: 'German Yellowjacket',
    latin: 'Vespula germanica',
    rarity: 'common',
    role: 'striker',
    biome: 'meadow',
    fact:
      'Its sting is smooth, not barbed, so unlike a honeybee it can withdraw and sting again and again ' +
      'without harming itself. A disturbed nest will pursue an intruder a long way.',
    stats: { hp: 860, atk: 134, def: 82, spd: 130 },
    skills: [
      { name: 'Sting Again', text: 'Attack one enemy twice at 55% damage each.', cooldown: 0 },
      { name: 'Pursue', text: 'Attack the enemy with the lowest HP. If it kills, act again.', cooldown: 2 },
      { name: 'Nest Roused', text: 'Attack all enemies. Damage rises 20% for each ally below half HP.', cooldown: 4 },
    ],
    body: { size: 0.9, abdomen: 1.35, girth: 0.82, legs: 1.0, antennae: 0.65, wings: 2, stance: 1.0 },
    palette: { carapace: '#241c08', underside: '#f0d024', accent: '#f5e46c', eye: '#120e04' },
  },
  {
    id: 'solenopsis',
    name: 'Red Imported Fire Ant',
    latin: 'Solenopsis invicta',
    rarity: 'rare',
    role: 'striker',
    biome: 'burrow',
    fact:
      'Bites to anchor itself, then pivots and stings repeatedly in a ring. In floods the colony links legs ' +
      'and jaws into a living raft that floats for weeks without drowning.',
    stats: { hp: 900, atk: 138, def: 94, spd: 120 },
    skills: [
      { name: 'Anchor and Sting', text: 'Attack one enemy three times at 45% damage each.', cooldown: 0 },
      { name: 'Ring of Stings', text: 'Attack one enemy and Burn them for 3 turns.', cooldown: 3 },
      { name: 'Living Raft', text: 'Ally team cannot drop below 1 HP for 1 turn and is immune to drowning effects.', cooldown: 5 },
    ],
    body: { size: 0.7, abdomen: 1.2, girth: 0.85, legs: 1.05, antennae: 1.0, wings: 0, stance: 1.05, mandibles: 1.0 },
    palette: { carapace: '#b04a1c', underside: '#6b2a0e', accent: '#e87a34', eye: '#180800' },
  },
  {
    id: 'myrmecia',
    name: 'Bull Ant',
    latin: 'Myrmecia pyriformis',
    rarity: 'epic',
    role: 'striker',
    biome: 'burrow',
    fact:
      'Hunts by sight with unusually large eyes, will leap at a threat, and stings repeatedly while ' +
      'holding on with its jaws. It navigates by the dim light of dusk, when almost nothing else can see.',
    stats: { hp: 950, atk: 156, def: 96, spd: 128 },
    skills: [
      { name: 'Leap and Grip', text: 'Attack one enemy and prevent them dodging for 2 turns.', cooldown: 0 },
      { name: 'Sting While Held', text: 'Attack the same enemy this unit hit last turn for double damage.', cooldown: 3 },
      { name: 'See at Dusk', text: 'Ignore Blind and untargetable states for 3 turns, and strike first in the order.', cooldown: 4 },
    ],
    body: { size: 1.0, abdomen: 1.4, girth: 0.85, legs: 1.25, antennae: 1.0, wings: 0, stance: 1.2, mandibles: 1.5 },
    palette: { carapace: '#8a2c14', underside: '#2a1408', accent: '#c05a28', eye: '#e8d8b0' },
  },
  {
    id: 'dorylus',
    name: 'Driver Ant',
    latin: 'Dorylus nigricans',
    rarity: 'epic',
    role: 'striker',
    biome: 'canopy',
    fact:
      'Soldiers have shearing mandibles strong enough that their grip has been used to close wounds — the ' +
      'ant is made to bite across the cut, then its body is twisted off, leaving the jaws as a suture.',
    stats: { hp: 980, atk: 152, def: 108, spd: 104 },
    skills: [
      { name: 'Shear', text: 'Attack one enemy and apply Bleed for 2 turns.', cooldown: 0 },
      { name: 'Lock the Jaws', text: 'The Bleed on one enemy cannot be cleansed and doubles in strength.', cooldown: 3 },
      { name: 'Suture', text: 'If this unit dies, its damage is dealt to its killer and the ally team is healed 20%.', cooldown: 6 },
    ],
    body: { size: 0.9, abdomen: 1.25, girth: 0.95, legs: 1.1, antennae: 0.95, wings: 0, stance: 1.05, mandibles: 1.9 },
    palette: { carapace: '#4a2c14', underside: '#7d5028', accent: '#a86a2c', eye: '#160a03' },
  },
  {
    id: 'mantispa',
    name: 'Mantidfly',
    latin: 'Mantispa styriaca',
    rarity: 'epic',
    role: 'striker',
    biome: 'meadow',
    fact:
      'Not a mantis at all — a lacewing that evolved the same grasping forelegs independently. Its larva ' +
      'rides a spider until she builds an egg sac, then slips inside and eats the eggs one by one.',
    stats: { hp: 830, atk: 158, def: 76, spd: 130 },
    skills: [
      { name: 'False Mantis', text: 'Attack one enemy. Ignores 20% of DEF.', cooldown: 0 },
      { name: 'Ride Along', text: 'Attach to one enemy: this unit cannot be targeted while they live, and deals +40% damage to them.', cooldown: 4 },
      { name: 'Inside the Sac', text: 'Attack one enemy for heavy damage. Triple damage against anyone with a shield.', cooldown: 5 },
    ],
    body: {
      size: 1.0, abdomen: 1.5, girth: 0.68, legs: 1.25, antennae: 0.75, wings: 2, stance: 1.15, raptorial: true,
    },
    palette: { carapace: '#a8802c', underside: '#d8b45c', accent: '#6b4a18', eye: '#2a1c08' },
  },
  {
    id: 'lonomia',
    name: 'Assassin Caterpillar',
    latin: 'Lonomia obliqua',
    rarity: 'legendary',
    role: 'striker',
    biome: 'canopy',
    fact:
      'Its bristles inject a venom that destroys the blood\'s ability to clot. Brushing against a group of ' +
      'them can cause bleeding from every mucous membrane, and untreated it kills.',
    stats: { hp: 1050, atk: 160, def: 104, spd: 82 },
    skills: [
      { name: 'Bristles', text: 'Attack one enemy and apply a Bleed that stacks without limit.', cooldown: 0 },
      { name: 'No Clotting', text: 'One enemy cannot be healed or cleansed for 3 turns.', cooldown: 4 },
      { name: 'Haemorrhage', text: 'Every Bleed on the field triggers immediately, all at once.', cooldown: 5 },
    ],
    body: { size: 1.05, abdomen: 1.9, girth: 1.3, legs: 0.5, antennae: 0.25, wings: 0, stance: 0.55 },
    palette: { carapace: '#6b7a3c', underside: '#a8b46c', accent: '#c0392b', eye: '#1a1a0e' },
  },
  {
    id: 'dytiscus',
    name: 'Great Diving Beetle',
    latin: 'Dytiscus marginalis',
    rarity: 'rare',
    role: 'striker',
    biome: 'water',
    fact:
      'Carries its own air supply as a bubble trapped beneath its wing cases, refreshed at the surface. Its ' +
      'larva, the water tiger, pierces prey with hollow mandibles and drinks it dissolved.',
    stats: { hp: 990, atk: 140, def: 104, spd: 100 },
    skills: [
      { name: 'Hollow Jaws', text: 'Attack one enemy and heal for 30% of the damage dealt.', cooldown: 0 },
      { name: 'Air Bubble', text: 'Self. Immune to Poison, Burn and drowning for 3 turns, and cleanse them now.', cooldown: 3 },
      { name: 'Water Tiger', text: 'Attack one enemy and apply Dissolve, which grows 50% stronger each turn.', cooldown: 4 },
    ],
    body: { size: 1.05, abdomen: 1.1, girth: 1.3, legs: 1.1, antennae: 0.5, wings: 1, stance: 0.7, mandibles: 1.2 },
    palette: { carapace: '#2a3a24', underside: '#8a7a3c', accent: '#c8b45c', eye: '#0e1409' },
  },
  {
    id: 'notonecta',
    name: 'Common Backswimmer',
    latin: 'Notonecta glauca',
    rarity: 'common',
    role: 'striker',
    biome: 'water',
    fact:
      'Swims upside down just under the surface, rowing with hair-fringed hind legs, and reads the water\'s ' +
      'surface ripples to locate prey. It will stab a finger hard enough to be nicknamed the water bee.',
    stats: { hp: 870, atk: 132, def: 84, spd: 126 },
    skills: [
      { name: 'Stab', text: 'Attack one enemy. +25% damage if they acted this turn.', cooldown: 0 },
      { name: 'Read the Ripples', text: 'Reveal all enemies: they cannot become untargetable for 3 turns.', cooldown: 3 },
      { name: 'Upside Down', text: 'Dodge the next two attacks and counter each with a stab.', cooldown: 4 },
    ],
    body: { size: 0.85, abdomen: 1.25, girth: 1.0, legs: 1.35, antennae: 0.25, wings: 1, stance: 0.8 },
    palette: { carapace: '#8a7a4c', underside: '#3a3428', accent: '#c0b078', eye: '#8a2c1c' },
  },
  {
    id: 'nepa',
    name: 'Water Scorpion',
    latin: 'Nepa cinerea',
    rarity: 'rare',
    role: 'striker',
    biome: 'water',
    fact:
      'Not a scorpion — the "tail" is a breathing tube it holds up to the surface while it waits, motionless, ' +
      'in the silt. Prey is taken with raptorial forelegs that snap shut like a mantis\'s.',
    stats: { hp: 960, atk: 146, def: 110, spd: 82 },
    skills: [
      { name: 'Snap Shut', text: 'Attack one enemy and hold them: they cannot dodge for 2 turns.', cooldown: 0 },
      { name: 'Breathing Tube', text: 'Wait: skip this turn, then the next attack is a guaranteed critical hit.', cooldown: 2 },
      { name: 'Out of the Silt', text: 'Attack the enemy with the highest ATK for double damage. Cannot be countered.', cooldown: 4 },
    ],
    body: {
      size: 1.1, abdomen: 1.7, girth: 1.15, legs: 1.05, antennae: 0.2, wings: 0, stance: 0.65, raptorial: true,
    },
    palette: { carapace: '#5a4c3a', underside: '#7d6a4c', accent: '#3a3026', eye: '#140f09' },
  },
];
