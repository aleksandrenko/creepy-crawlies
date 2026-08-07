/**
 * Support species, second batch: tenders (healing and buffs) and controllers (debuffs).
 *
 * Every skill is derived from a real, documented trait of the real animal.
 */

import type { Species } from '../types';

export const TENDERS_2: Species[] = [
  {
    id: 'apiscerana',
    name: 'Asian Honey Bee',
    latin: 'Apis cerana',
    rarity: 'rare',
    role: 'tender',
    biome: 'canopy',
    fact:
      'Defends against giant hornets by balling them — hundreds of workers pile on and vibrate until the ' +
      'hornet cooks at a temperature the bees themselves can just survive.',
    stats: { hp: 1020, atk: 88, def: 108, spd: 112 },
    skills: [
      { name: 'Guard Sting', text: 'Attack one enemy and shield the weakest ally for 12% of their max HP.', cooldown: 0 },
      { name: 'Heat Ball', text: 'All enemies Burn for 3 turns. The ally team is immune to Burn while it lasts.', cooldown: 4 },
      { name: 'Hold the Line', text: 'Ally team gains +25% DEF and regenerates 10% a turn for 3 turns.', cooldown: 5 },
    ],
    body: { size: 0.78, abdomen: 1.1, girth: 1.0, legs: 0.85, antennae: 0.7, wings: 2, stance: 0.9 },
    palette: { carapace: '#2e2418', underside: '#d8a83c', accent: '#f0cc74', eye: '#120e08' },
  },
  {
    id: 'atta',
    name: 'Leafcutter Ant',
    latin: 'Atta cephalotes',
    rarity: 'epic',
    role: 'tender',
    biome: 'canopy',
    fact:
      'Does not eat leaves. It farms a fungus on them underground, weeds out competing moulds by hand, and ' +
      'doses the garden with antibiotic bacteria it grows on its own body.',
    stats: { hp: 1080, atk: 90, def: 116, spd: 100 },
    skills: [
      { name: 'Cut and Carry', text: 'Attack one enemy and heal the weakest ally by 15%.', cooldown: 0 },
      { name: 'Antibiotic Dose', text: 'Cleanse Poison, Burn and Bleed from the ally team and heal 15%.', cooldown: 3 },
      { name: 'Fungus Garden', text: 'Ally team regenerates 14% a turn for 4 turns.', cooldown: 5 },
    ],
    body: { size: 0.88, abdomen: 1.2, girth: 0.9, legs: 1.1, antennae: 1.0, wings: 0, stance: 1.1, mandibles: 1.5 },
    palette: { carapace: '#8a4a24', underside: '#5a2e14', accent: '#7fa855', eye: '#180a04' },
  },
  {
    id: 'apismellifera2',
    name: 'Nurse Bee',
    latin: 'Apis mellifera nutrix',
    rarity: 'common',
    role: 'tender',
    biome: 'meadow',
    fact:
      'For her first days she secretes royal jelly from head glands and feeds every larva in the nest, ' +
      'checking each cell over a thousand times a day before she is old enough to forage.',
    stats: { hp: 1000, atk: 78, def: 104, spd: 100 },
    skills: [
      { name: 'Tend', text: 'Heal the weakest ally by 22%.', cooldown: 0 },
      { name: 'Royal Jelly', text: 'One ally gains +35% ATK and +20% DEF for 3 turns.', cooldown: 3 },
      { name: 'Thousand Checks', text: 'Heal the ally team by 25% and cleanse two debuffs each.', cooldown: 4 },
    ],
    body: { size: 0.78, abdomen: 1.1, girth: 1.05, legs: 0.82, antennae: 0.68, wings: 2, stance: 0.88 },
    palette: { carapace: '#3a2c18', underside: '#f0dc9c', accent: '#f5e8c0', eye: '#140f08' },
  },
  {
    id: 'formicafusca',
    name: 'Silky Ant',
    latin: 'Formica fusca',
    rarity: 'common',
    role: 'tender',
    biome: 'meadow',
    fact:
      'Carries its injured nestmates home rather than leaving them, and workers that detect fungal ' +
      'infection in the brood will remove and isolate the affected pupae.',
    stats: { hp: 1040, atk: 82, def: 112, spd: 96 },
    skills: [
      { name: 'Carry Home', text: 'Heal the weakest ally by 20% and cleanse one debuff.', cooldown: 0 },
      { name: 'Isolate the Infection', text: 'Remove all damage-over-time effects from the ally team.', cooldown: 3 },
      { name: 'None Left Behind', text: 'Revive one fallen ally at 35% HP.', cooldown: 6 },
    ],
    body: { size: 0.8, abdomen: 1.2, girth: 0.85, legs: 1.05, antennae: 1.0, wings: 0, stance: 1.05 },
    palette: { carapace: '#2a2620', underside: '#4a443a', accent: '#8a8070', eye: '#0e0c0a' },
  },
  {
    id: 'anthidium',
    name: 'Wool Carder Bee',
    latin: 'Anthidium manicatum',
    rarity: 'rare',
    role: 'tender',
    biome: 'meadow',
    fact:
      'Scrapes fibres off hairy leaves and packs the fluff into her nest as insulation. The male patrols ' +
      'the patch and rams other bees out of it with spikes on his abdomen.',
    stats: { hp: 1000, atk: 92, def: 120, spd: 104 },
    skills: [
      { name: 'Ram', text: 'Attack one enemy and push them later in the turn order.', cooldown: 0 },
      { name: 'Card the Wool', text: 'Shield the ally team for 22% of this unit\'s max HP.', cooldown: 3 },
      { name: 'Patrol the Patch', text: 'Enemies that attack allies take 25% of the damage back for 3 turns.', cooldown: 4 },
    ],
    body: { size: 0.85, abdomen: 1.2, girth: 1.1, legs: 0.9, antennae: 0.7, wings: 2, stance: 0.9 },
    palette: { carapace: '#2e2a20', underside: '#e0c884', accent: '#f0e4c0', eye: '#12100a' },
  },
  {
    id: 'chrysoperla',
    name: 'Green Lacewing',
    latin: 'Chrysoperla carnea',
    rarity: 'common',
    role: 'tender',
    biome: 'meadow',
    fact:
      'Lays each egg on the end of a thin silk stalk so ants cannot reach it and the first larva to hatch ' +
      'cannot eat its siblings. Adults hear bat sonar and drop out of the air.',
    stats: { hp: 940, atk: 84, def: 96, spd: 118 },
    skills: [
      { name: 'Silk Stalk', text: 'Shield one ally for 18% of their max HP.', cooldown: 0 },
      { name: 'Out of the Air', text: 'One ally dodges the next two attacks.', cooldown: 3 },
      { name: 'Hatch Apart', text: 'Ally team cannot be hit by area attacks for 2 turns.', cooldown: 5 },
    ],
    body: { size: 0.85, abdomen: 1.45, girth: 0.7, legs: 0.95, antennae: 1.3, wings: 2, stance: 0.95 },
    palette: { carapace: '#9cd47a', underside: '#c8e8a8', accent: '#5a8a3c', eye: '#c8a24a' },
  },
  {
    id: 'trigona',
    name: 'Resin Bee',
    latin: 'Trigona spinipes',
    rarity: 'common',
    role: 'tender',
    biome: 'canopy',
    fact:
      'Builds a nest entrance like a trumpet of sticky resin, guarded day and night. Intruders are glued ' +
      'to it and cannot pull free.',
    stats: { hp: 980, atk: 86, def: 118, spd: 98 },
    skills: [
      { name: 'Resin Dab', text: 'Attack one enemy and root them for 2 turns.', cooldown: 0 },
      { name: 'Trumpet Guard', text: 'Ally team gains +25% DEF for 3 turns.', cooldown: 3 },
      { name: 'Glued Fast', text: 'All enemies cannot dodge or flee for 3 turns.', cooldown: 4 },
    ],
    body: { size: 0.7, abdomen: 1.05, girth: 1.0, legs: 0.85, antennae: 0.65, wings: 2, stance: 0.85 },
    palette: { carapace: '#26221c', underside: '#4a4038', accent: '#a8875c', eye: '#100e0a' },
  },
  {
    id: 'cataglyphis',
    name: 'Silver Desert Ant',
    latin: 'Cataglyphis bombycina',
    rarity: 'epic',
    role: 'tender',
    biome: 'burrow',
    fact:
      'Forages at sand temperatures above sixty degrees, survives it with triangular hairs that reflect ' +
      'sunlight and radiate heat, and navigates home by counting its own steps and reading polarised sky.',
    stats: { hp: 1010, atk: 94, def: 110, spd: 128 },
    skills: [
      { name: 'Sun Dash', text: 'Attack one enemy and gain +15% SPD for 2 turns.', cooldown: 0 },
      { name: 'Silver Hairs', text: 'Ally team becomes immune to Burn and heals 18%.', cooldown: 3 },
      { name: 'Count the Steps', text: 'Ally team\'s cooldowns all drop by 1, and they gain +20% Accuracy.', cooldown: 5 },
    ],
    body: { size: 0.82, abdomen: 1.2, girth: 0.82, legs: 1.35, antennae: 1.0, wings: 0, stance: 1.3 },
    palette: { carapace: '#d8d4c8', underside: '#f0ece0', accent: '#a89c84', eye: '#2a2620' },
  },
  {
    id: 'bombushypnorum',
    name: 'Tree Bumblebee',
    latin: 'Bombus hypnorum',
    rarity: 'common',
    role: 'tender',
    biome: 'canopy',
    fact:
      'Detects the faint electric field a flower carries and reads from it whether another bee has already ' +
      'emptied it — the field changes when a bee lands and takes minutes to recover.',
    stats: { hp: 980, atk: 86, def: 100, spd: 108 },
    skills: [
      { name: 'Read the Field', text: 'Attack one enemy and reveal them for 3 turns.', cooldown: 0 },
      { name: 'Already Emptied', text: 'Strip one buff from every enemy.', cooldown: 3 },
      { name: 'Warm Nest', text: 'Heal the ally team 20% and grant +15% ATK for 3 turns.', cooldown: 4 },
    ],
    body: { size: 0.95, abdomen: 1.2, girth: 1.3, legs: 0.85, antennae: 0.7, wings: 2, stance: 0.9 },
    palette: { carapace: '#a8642c', underside: '#2a2018', accent: '#f0e8dc', eye: '#120c08' },
  },
  {
    id: 'sphecius',
    name: 'Cicada Killer',
    latin: 'Sphecius speciosus',
    rarity: 'rare',
    role: 'tender',
    biome: 'burrow',
    fact:
      'Paralyses a cicada twice her weight and hauls it up a tree to glide down to her burrow, because she ' +
      'cannot carry it in level flight. She chooses the cicada\'s sex to decide her own egg\'s.',
    stats: { hp: 1030, atk: 96, def: 106, spd: 110 },
    skills: [
      { name: 'Haul', text: 'Attack one enemy and pull them to the front of the field.', cooldown: 0 },
      { name: 'Glide Home', text: 'Move one ally to the front of the turn order and heal it 20%.', cooldown: 3 },
      { name: 'Choose the Brood', text: 'Reset one ally\'s cooldowns entirely.', cooldown: 5 },
    ],
    body: { size: 1.05, abdomen: 1.5, girth: 0.85, legs: 1.1, antennae: 0.75, wings: 2, stance: 1.05 },
    palette: { carapace: '#3a2c14', underside: '#e0b040', accent: '#8a6a24', eye: '#1a1206' },
  },
  {
    id: 'dolichovespula',
    name: 'Bald-faced Hornet',
    latin: 'Dolichovespula maculata',
    rarity: 'rare',
    role: 'tender',
    biome: 'canopy',
    fact:
      'Builds a grey paper sphere the size of a football, with layered insulating walls and a single ' +
      'guarded entrance, and adds a new outer layer as the colony grows through summer.',
    stats: { hp: 1060, atk: 94, def: 122, spd: 102 },
    skills: [
      { name: 'Guard the Door', text: 'Attack one enemy and gain +20% DEF for 2 turns.', cooldown: 0 },
      { name: 'Layered Walls', text: 'Ally team gains a shield that refreshes each turn for 3 turns.', cooldown: 4 },
      { name: 'Grow the Nest', text: 'Ally team gains +10% max HP for the rest of the battle. Stacks.', cooldown: 5 },
    ],
    body: { size: 1.0, abdomen: 1.35, girth: 0.9, legs: 1.0, antennae: 0.7, wings: 2, stance: 1.0 },
    palette: { carapace: '#1e1c1a', underside: '#e8e4dc', accent: '#f0ece4', eye: '#0c0b0a' },
  },
  {
    id: 'pieris',
    name: 'Cabbage White',
    latin: 'Pieris rapae',
    rarity: 'common',
    role: 'tender',
    biome: 'meadow',
    fact:
      'Tastes with its feet to check a leaf before laying, and sees ultraviolet patterns on wings that look ' +
      'plain white to us — two males in the same meadow are unmistakable to each other.',
    stats: { hp: 930, atk: 78, def: 98, spd: 116 },
    skills: [
      { name: 'Taste the Ground', text: 'Heal the weakest ally 18% and reveal one enemy.', cooldown: 0 },
      { name: 'Ultraviolet Sight', text: 'Ally team ignores Blind and untargetable states for 3 turns.', cooldown: 3 },
      { name: 'Plain to You', text: 'One ally becomes untargetable for 2 turns while still able to act.', cooldown: 5 },
    ],
    body: { size: 0.95, abdomen: 1.15, girth: 0.9, legs: 0.8, antennae: 1.0, wings: 2, stance: 0.85 },
    palette: { carapace: '#e8e4d8', underside: '#f5f2e8', accent: '#3a3830', eye: '#2a2620' },
  },
];

export const CONTROLLERS_2: Species[] = [
  {
    id: 'xenos',
    name: 'Twisted-wing Parasite',
    latin: 'Xenos vesparum',
    rarity: 'legendary',
    role: 'controller',
    biome: 'meadow',
    fact:
      'The female never leaves her host: she lives inside a wasp with only her head protruding, and the ' +
      'infected wasp abandons its own colony and gathers where the parasites can mate.',
    stats: { hp: 890, atk: 112, def: 90, spd: 124 },
    skills: [
      { name: 'Bore In', text: 'Attack one enemy and attach to them.', cooldown: 0 },
      { name: 'Abandon the Colony', text: 'One enemy stops benefiting from any ally buff for 3 turns.', cooldown: 4 },
      { name: 'Never Leave', text: 'While attached, the host takes damage each turn and this unit cannot be targeted.', cooldown: 5 },
    ],
    body: { size: 0.62, abdomen: 1.1, girth: 0.85, legs: 0.8, antennae: 0.9, wings: 2, stance: 0.85 },
    palette: { carapace: '#3a2f3a', underside: '#5a4a5a', accent: '#c8a24a', eye: '#1a141a' },
  },
  {
    id: 'ophiocordyceps',
    name: 'Zombie-ant Carrier',
    latin: 'Camponotus leonardi',
    rarity: 'epic',
    role: 'controller',
    biome: 'canopy',
    fact:
      'Infected by Ophiocordyceps fungus, the ant climbs to a precise height, bites down on a leaf vein and ' +
      'locks its jaws there permanently while the fungus fruits from the back of its head.',
    stats: { hp: 960, atk: 106, def: 100, spd: 96 },
    skills: [
      { name: 'Locked Jaws', text: 'Attack one enemy. They cannot change targets for 2 turns.', cooldown: 0 },
      { name: 'Climb to Height', text: 'One enemy is Doomed: after 3 turns they fall unless cleansed.', cooldown: 5 },
      { name: 'Fruiting Body', text: 'When a Doomed enemy dies, all their allies are Poisoned for 3 turns.', cooldown: 4 },
    ],
    body: { size: 0.88, abdomen: 1.25, girth: 0.88, legs: 1.1, antennae: 1.0, wings: 0, stance: 1.05, mandibles: 1.2 },
    palette: { carapace: '#3a3028', underside: '#6b5a48', accent: '#c8c0a0', eye: '#141008' },
  },
  {
    id: 'apocephalus',
    name: 'Bee-decapitating Fly',
    latin: 'Apocephalus borealis',
    rarity: 'rare',
    role: 'controller',
    biome: 'meadow',
    fact:
      'Lays eggs in a living honey bee. The bee abandons the hive at night, flies toward lights in circles, ' +
      'and dies; the larvae emerge from the neck joint a few days later.',
    stats: { hp: 900, atk: 108, def: 88, spd: 130 },
    skills: [
      { name: 'Inject', text: 'Attack one enemy and lower their Accuracy by 20% for 2 turns.', cooldown: 0 },
      { name: 'Flight of the Lost', text: 'One enemy attacks a random target instead of choosing for 2 turns.', cooldown: 4 },
      { name: 'Neck Joint', text: 'Mark one enemy: they take 40% more damage from every source for 3 turns.', cooldown: 4 },
    ],
    body: { size: 0.6, abdomen: 1.1, girth: 0.85, legs: 0.85, antennae: 0.3, wings: 2, stance: 0.95 },
    palette: { carapace: '#2e2a26', underside: '#5a544c', accent: '#8a8478', eye: '#7d2a1c' },
  },
  {
    id: 'anophelesgambiae',
    name: 'Malaria Mosquito',
    latin: 'Anopheles gambiae',
    rarity: 'epic',
    role: 'controller',
    biome: 'water',
    fact:
      'Finds a host by carbon dioxide and skin scent from many metres away, and her saliva both numbs the ' +
      'bite and stops the blood clotting. She carries the parasite that has killed more people than any other.',
    stats: { hp: 870, atk: 114, def: 84, spd: 138 },
    skills: [
      { name: 'Numbed Bite', text: 'Attack one enemy. They do not notice: no counter, no dodge.', cooldown: 0 },
      { name: 'Carry the Fever', text: 'Poison one enemy for 4 turns. The Poison spreads on their death.', cooldown: 4 },
      { name: 'Follow the Scent', text: 'Attack the weakest enemy and drain 15% of their max HP to the team.', cooldown: 3 },
    ],
    body: { size: 0.62, abdomen: 1.4, girth: 0.6, legs: 1.4, antennae: 1.1, wings: 2, stance: 1.15 },
    palette: { carapace: '#4a4238', underside: '#6b6154', accent: '#2a2620', eye: '#1a1610' },
  },
  {
    id: 'pulex',
    name: 'Human Flea',
    latin: 'Pulex irritans',
    rarity: 'common',
    role: 'controller',
    biome: 'burrow',
    fact:
      'Flattened side to side so it slides between hairs, with backward-pointing bristles that make it ' +
      'almost impossible to pull out against the grain. It can survive months between meals.',
    stats: { hp: 840, atk: 100, def: 90, spd: 140 },
    skills: [
      { name: 'Backward Bristles', text: 'Attack one enemy and root them for 2 turns.', cooldown: 0 },
      { name: 'Between the Hairs', text: 'This unit cannot be targeted for 2 turns.', cooldown: 3 },
      { name: 'Months Without', text: 'Drain 10% max HP a turn from one enemy for 3 turns, healing this unit.', cooldown: 4 },
    ],
    body: { size: 0.55, abdomen: 0.95, girth: 0.7, legs: 1.3, antennae: 0.4, wings: 0, stance: 0.85 },
    palette: { carapace: '#5a3a22', underside: '#7d5230', accent: '#2a1a0e', eye: '#0e0704' },
  },
  {
    id: 'trialeurodes',
    name: 'Greenhouse Whitefly',
    latin: 'Trialeurodes vaporariorum',
    rarity: 'common',
    role: 'controller',
    biome: 'canopy',
    fact:
      'Coats itself in white wax dust that sheds insecticide, and its honeydew grows a black mould over the ' +
      'leaf that starves the plant of light long after the flies have moved on.',
    stats: { hp: 860, atk: 96, def: 96, spd: 122 },
    skills: [
      { name: 'Wax Dust', text: 'Attack one enemy and lower their Accuracy by 20% for 2 turns.', cooldown: 0 },
      { name: 'Sooty Mould', text: 'All enemies lose 25% ATK for 3 turns.', cooldown: 3 },
      { name: 'Sheds Everything', text: 'This unit becomes immune to debuffs for 3 turns.', cooldown: 4 },
    ],
    body: { size: 0.55, abdomen: 1.0, girth: 0.85, legs: 0.8, antennae: 0.7, wings: 2, stance: 0.85 },
    palette: { carapace: '#f0ece4', underside: '#f5f2ec', accent: '#c0bcb0', eye: '#3a3630' },
  },
  {
    id: 'lygus',
    name: 'Tarnished Plant Bug',
    latin: 'Lygus lineolaris',
    rarity: 'common',
    role: 'controller',
    biome: 'meadow',
    fact:
      'Injects an enzyme that dissolves plant tissue ahead of its beak, so the wound keeps spreading and ' +
      'deforming after it has fed. A few bites can ruin a whole flower head.',
    stats: { hp: 910, atk: 104, def: 94, spd: 112 },
    skills: [
      { name: 'Enzyme Jab', text: 'Attack one enemy and apply Dissolve for 2 turns.', cooldown: 0 },
      { name: 'Spreading Wound', text: 'Dissolve on one enemy grows 50% stronger each turn for 3 turns.', cooldown: 3 },
      { name: 'Deform', text: 'One enemy loses 30% ATK and 30% DEF for 3 turns.', cooldown: 4 },
    ],
    body: { size: 0.75, abdomen: 1.1, girth: 1.15, legs: 0.95, antennae: 0.95, wings: 1, stance: 0.8 },
    palette: { carapace: '#8a7050', underside: '#a89070', accent: '#5a4630', eye: '#1a140c' },
  },
  {
    id: 'diaphorina',
    name: 'Asian Citrus Psyllid',
    latin: 'Diaphorina citri',
    rarity: 'rare',
    role: 'controller',
    biome: 'canopy',
    fact:
      'Feeds head-down at a forty-five degree angle and passes a bacterium that clogs a tree\'s vascular ' +
      'system. The tree keeps making fruit for years, all of it bitter and green.',
    stats: { hp: 880, atk: 102, def: 92, spd: 126 },
    skills: [
      { name: 'Clog', text: 'Attack one enemy and block their healing for 2 turns.', cooldown: 0 },
      { name: 'Bitter Fruit', text: 'One enemy\'s buffs give half their effect for 3 turns.', cooldown: 3 },
      { name: 'Years of It', text: 'All enemies cannot be healed above 70% HP for 3 turns.', cooldown: 5 },
    ],
    body: { size: 0.58, abdomen: 1.05, girth: 0.8, legs: 0.9, antennae: 0.95, wings: 2, stance: 0.9 },
    palette: { carapace: '#8a7a48', underside: '#b0a068', accent: '#3a3218', eye: '#c0392b' },
  },
  {
    id: 'thrips',
    name: 'Western Flower Thrips',
    latin: 'Frankliniella occidentalis',
    rarity: 'common',
    role: 'controller',
    biome: 'meadow',
    fact:
      'Rasps the surface of a petal and drinks what leaks out, leaving silver scarring. It is small enough ' +
      'to slip through insect netting and reproduces without males when it needs to.',
    stats: { hp: 830, atk: 98, def: 86, spd: 134 },
    skills: [
      { name: 'Rasp', text: 'Attack one enemy and lower their DEF by 15% for 2 turns.', cooldown: 0 },
      { name: 'Through the Netting', text: 'Attack one enemy. Ignores shields entirely.', cooldown: 3 },
      { name: 'Silver Scarring', text: 'All enemies lose 20% DEF for 3 turns; it cannot be cleansed.', cooldown: 4 },
    ],
    body: { size: 0.5, abdomen: 1.2, girth: 0.55, legs: 0.85, antennae: 0.8, wings: 2, stance: 0.8 },
    palette: { carapace: '#c8b878', underside: '#e0d4a0', accent: '#8a7c48', eye: '#2a2410' },
  },
  {
    id: 'melittobia',
    name: 'Brood Parasite Wasp',
    latin: 'Melittobia acasta',
    rarity: 'rare',
    role: 'controller',
    biome: 'burrow',
    fact:
      'A single female can produce hundreds of daughters inside one host cell, and the first males to ' +
      'emerge are blind, wingless, and spend their whole lives killing each other in the dark.',
    stats: { hp: 900, atk: 106, def: 96, spd: 118 },
    skills: [
      { name: 'Lay In', text: 'Attack one enemy and Poison them for 2 turns.', cooldown: 0 },
      { name: 'Hundreds of Daughters', text: 'Poison spreads from any poisoned enemy to their allies.', cooldown: 4 },
      { name: 'Blind Brothers', text: 'Two random enemies attack each other this turn.', cooldown: 5 },
    ],
    body: { size: 0.52, abdomen: 1.05, girth: 0.8, legs: 0.85, antennae: 0.85, wings: 2, stance: 0.88 },
    palette: { carapace: '#2a2418', underside: '#4a4030', accent: '#8a7a50', eye: '#100c06' },
  },
];
