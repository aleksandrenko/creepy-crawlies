/**
 * Support species: tenders (healing and buffs) and controllers (debuffs).
 *
 * Two tenders can revive — the termite queen, whose colony is rebuilt around her egg
 * output, and the silkworm moth, whose whole life history is death and re-emergence
 * from a cocoon. Two controllers heal, both by feeding: the bed bug on blood and the
 * aphid by handing back honeydew.
 *
 * Every skill is derived from a real, documented trait of the real animal.
 */

import type { Species } from '../types';

export const TENDERS: Species[] = [
  {
    id: 'myrmecocystus',
    name: 'Honeypot Ant',
    latin: 'Myrmecocystus mexicanus',
    rarity: 'epic',
    role: 'tender',
    biome: 'burrow',
    fact:
      'Some workers become living larders: they hang from the nest ceiling with abdomens swollen to the ' +
      'size of a grape, and regurgitate stored liquid on demand to feed the rest of the colony through drought.',
    stats: { hp: 1150, atk: 78, def: 108, spd: 84 },
    skills: [
      { name: 'Ration', text: 'Attack one enemy and heal the weakest ally by 20%.', cooldown: 0 },
      { name: 'Living Larder', text: 'Heal the ally team by 30% and grant a regeneration for 3 turns.', cooldown: 4 },
      { name: 'Through the Drought', text: 'For 3 turns all healing on the ally team is 50% stronger.', cooldown: 5 },
    ],
    body: { size: 0.9, abdomen: 1.5, girth: 1.5, legs: 1.0, antennae: 0.95, wings: 0, stance: 1.0 },
    palette: { carapace: '#8a5a2c', underside: '#e8c46a', accent: '#f0d894', eye: '#160d05' },
  },
  {
    id: 'macrotermes',
    name: 'Termite Queen',
    latin: 'Macrotermes bellicosus',
    rarity: 'legendary',
    role: 'tender',
    biome: 'burrow',
    fact:
      'She can lay in the order of thirty thousand eggs a day and live for decades — far longer than any ' +
      'other insect. The entire mound is built around keeping her alive, because everything in it comes from her.',
    stats: { hp: 1320, atk: 66, def: 122, spd: 62 },
    skills: [
      { name: 'Royal Pheromone', text: 'Heal the ally team by 15% and cleanse one debuff each.', cooldown: 0 },
      { name: 'Brood Chamber', text: 'Revive one fallen ally at 50% HP.', cooldown: 6 },
      { name: 'The Mound Endures', text: 'For 2 turns, the first ally to fall is revived instantly at 25% HP.', cooldown: 7 },
    ],
    body: { size: 1.4, abdomen: 2.8, girth: 1.7, legs: 0.55, antennae: 0.6, wings: 0, stance: 0.5 },
    palette: { carapace: '#d8c4a0', underside: '#f0e4cc', accent: '#a8875c', eye: '#3a2c1c' },
  },
  {
    id: 'bombyx',
    name: 'Silkworm Moth',
    latin: 'Bombyx mori',
    rarity: 'epic',
    role: 'tender',
    biome: 'canopy',
    fact:
      'The caterpillar spins a single unbroken filament — up to about nine hundred metres of it — into a ' +
      'cocoon, dissolves almost its entire body inside, and re-emerges as something structurally different.',
    stats: { hp: 1080, atk: 74, def: 112, spd: 92 },
    skills: [
      { name: 'Filament', text: 'Attack one enemy and shield the weakest ally for 15% of their max HP.', cooldown: 0 },
      { name: 'Cocoon', text: 'Revive one fallen ally at 40% HP with a shield for 2 turns.', cooldown: 6 },
      { name: 'Metamorphosis', text: 'One ally is removed from the field for 1 turn, then returns fully healed and cleansed.', cooldown: 6 },
    ],
    body: { size: 1.1, abdomen: 1.3, girth: 1.25, legs: 0.72, antennae: 1.2, wings: 2, stance: 0.8 },
    palette: { carapace: '#e8e0cc', underside: '#f5f0e0', accent: '#c8b48c', eye: '#2a2118' },
  },
  {
    id: 'bombus',
    name: 'Buff-tailed Bumblebee',
    latin: 'Bombus terrestris',
    rarity: 'rare',
    role: 'tender',
    biome: 'meadow',
    fact:
      'Uncouples her flight muscles from her wings and shivers them to generate heat, warming her own ' +
      'thorax and the brood well above the outside air so the colony can work on cold mornings.',
    stats: { hp: 1000, atk: 88, def: 96, spd: 106 },
    skills: [
      { name: 'Forage', text: 'Attack one enemy and heal the ally team by 8%.', cooldown: 0 },
      { name: 'Shiver', text: 'Ally team gains +25% ATK and +20% SPD for 3 turns.', cooldown: 4 },
      { name: 'Warm the Brood', text: 'Ally team regenerates 12% HP a turn for 3 turns and cannot be Frozen or Slowed.', cooldown: 5 },
    ],
    body: { size: 1.0, abdomen: 1.2, girth: 1.35, legs: 0.85, antennae: 0.7, wings: 2, stance: 0.9 },
    palette: { carapace: '#241c14', underside: '#e8d090', accent: '#f5e4b0', eye: '#120c07' },
  },
  {
    id: 'tetragonula',
    name: 'Sugarbag Bee',
    latin: 'Tetragonula carbonaria',
    rarity: 'rare',
    role: 'tender',
    biome: 'canopy',
    fact:
      'Stingless. It builds its brood comb as a precise ascending spiral, stores honey in wax pots, and ' +
      'seals every crack in the hive with propolis — a resin mix that is antimicrobial as well as structural.',
    stats: { hp: 1040, atk: 80, def: 118, spd: 98 },
    skills: [
      { name: 'Resin Dab', text: 'Attack one enemy and shield one ally for 12% of their max HP.', cooldown: 0 },
      { name: 'Propolis Seal', text: 'Ally team gains a shield worth 25% of this unit\'s max HP for 3 turns.', cooldown: 4 },
      { name: 'Spiral Comb', text: 'Each ally is healed 10% per living ally, and gains +15% DEF for 3 turns.', cooldown: 5 },
    ],
    body: { size: 0.72, abdomen: 1.05, girth: 1.05, legs: 0.8, antennae: 0.65, wings: 2, stance: 0.85 },
    palette: { carapace: '#2e2620', underside: '#c8a45c', accent: '#e0c888', eye: '#100c08' },
  },
  {
    id: 'coccinella',
    name: 'Seven-spot Ladybird',
    latin: 'Coccinella septempunctata',
    rarity: 'common',
    role: 'tender',
    biome: 'meadow',
    fact:
      'Threatened, it bleeds on purpose: alkaloid-laden haemolymph seeps from its leg joints, foul enough ' +
      'that a bird spits it out. The red-and-black pattern is an honest advertisement of how bad it tastes.',
    stats: { hp: 980, atk: 82, def: 124, spd: 96 },
    skills: [
      { name: 'Nip', text: 'Attack one enemy and cleanse one debuff from an ally.', cooldown: 0 },
      { name: 'Reflex Bleed', text: 'Cleanse all debuffs from the ally team.', cooldown: 3 },
      { name: 'Warning Colours', text: 'Ally team gains +30% DEF for 3 turns, and enemies that attack them lose 15% ATK.', cooldown: 5 },
    ],
    body: { size: 0.78, abdomen: 1.0, girth: 1.4, legs: 0.7, antennae: 0.45, wings: 1, stance: 0.72 },
    palette: { carapace: '#c0392b', underside: '#1a1410', accent: '#f0e8dc', eye: '#0e0a07' },
  },
  {
    id: 'lampyris',
    name: 'Common Glow-worm',
    latin: 'Lampyris noctiluca',
    rarity: 'rare',
    role: 'tender',
    biome: 'meadow',
    fact:
      'The wingless female climbs a stem and switches on a green light made by luciferase — a chemical ' +
      'reaction so efficient that almost none of the energy is lost as heat. She holds it for hours to be found.',
    stats: { hp: 940, atk: 84, def: 100, spd: 104 },
    skills: [
      { name: 'Cold Light', text: 'Attack one enemy and reveal them: they cannot become untargetable.', cooldown: 0 },
      { name: 'Signal', text: 'Ally team gains +35% Accuracy and +20% critical chance for 3 turns.', cooldown: 4 },
      { name: 'Hold the Glow', text: 'Heal the ally team 12% a turn for 3 turns. Enemies cannot hide or dodge.', cooldown: 5 },
    ],
    body: { size: 0.88, abdomen: 1.6, girth: 0.85, legs: 0.95, antennae: 0.7, wings: 0, stance: 0.85 },
    palette: { carapace: '#4a4436', underside: '#b8e07a', accent: '#d8f5a0', eye: '#141208' },
  },
  {
    id: 'oecophylla',
    name: 'Weaver Ant',
    latin: 'Oecophylla smaragdina',
    rarity: 'epic',
    role: 'tender',
    biome: 'canopy',
    fact:
      'Workers form living chains to haul two leaf edges together, then hold them while other workers ' +
      'squeeze silk out of their own larvae and use them as tubes of glue to stitch the nest shut.',
    stats: { hp: 1060, atk: 92, def: 110, spd: 112 },
    skills: [
      { name: 'Stitch', text: 'Attack one enemy and shield the ally with the lowest HP for 18% of their max HP.', cooldown: 0 },
      { name: 'Living Chain', text: 'For 3 turns, damage to any ally is split evenly across the whole team.', cooldown: 4 },
      { name: 'Sew Shut', text: 'One enemy is bound: they cannot act or be healed for 1 turn.', cooldown: 5 },
    ],
    body: { size: 0.82, abdomen: 1.25, girth: 0.8, legs: 1.2, antennae: 1.05, wings: 0, stance: 1.15, mandibles: 1.1 },
    palette: { carapace: '#a86a24', underside: '#d89a4c', accent: '#7fa855', eye: '#1a0f04' },
  },
  {
    id: 'camponotus',
    name: 'Carpenter Ant',
    latin: 'Camponotus ligniperda',
    rarity: 'common',
    role: 'tender',
    biome: 'rotwood',
    fact:
      'Food moves through the colony by trophallaxis — mouth to mouth. A worker who has fed will pass ' +
      'liquid to a nestmate who has not, so a single meal ends up shared across dozens of individuals.',
    stats: { hp: 1020, atk: 86, def: 106, spd: 92 },
    skills: [
      { name: 'Gnaw', text: 'Attack one enemy. +15% damage against Bulwarks.', cooldown: 0 },
      { name: 'Trophallaxis', text: 'Move 25% of the healthiest ally\'s current HP to the weakest ally.', cooldown: 3 },
      { name: 'Share the Meal', text: 'Even out the HP percentages of the whole ally team, then heal all by 10%.', cooldown: 5 },
    ],
    body: { size: 0.85, abdomen: 1.2, girth: 0.9, legs: 1.05, antennae: 1.0, wings: 0, stance: 1.05, mandibles: 1.0 },
    palette: { carapace: '#2e2118', underside: '#5a4230', accent: '#8a6a44', eye: '#0f0a06' },
  },
  {
    id: 'osmia',
    name: 'Red Mason Bee',
    latin: 'Osmia bicornis',
    rarity: 'common',
    role: 'tender',
    biome: 'meadow',
    fact:
      'A solitary bee that walls each egg into its own mud chamber with a food store, then seals the ' +
      'tunnel behind it. Every larva develops alone, sealed in, safe from the neighbours.',
    stats: { hp: 960, atk: 80, def: 116, spd: 100 },
    skills: [
      { name: 'Mud Dab', text: 'Attack one enemy and give one ally +20% DEF for 2 turns.', cooldown: 0 },
      { name: 'Seal the Cell', text: 'One ally becomes immune to all damage and debuffs for 1 turn.', cooldown: 4 },
      { name: 'Provision', text: 'One ally is fully healed and cleansed, but cannot act next turn.', cooldown: 5 },
    ],
    body: { size: 0.82, abdomen: 1.1, girth: 1.15, legs: 0.85, antennae: 0.75, wings: 2, stance: 0.88 },
    palette: { carapace: '#6b3a1e', underside: '#c88a52', accent: '#8a5a30', eye: '#140a05' },
  },
  {
    id: 'episyrphus',
    name: 'Marmalade Hoverfly',
    latin: 'Episyrphus balteatus',
    rarity: 'rare',
    role: 'tender',
    biome: 'meadow',
    fact:
      'Wears a wasp\'s yellow-and-black warning pattern without owning a sting — a bluff good enough that ' +
      'birds leave it alone. It can also hold a hover perfectly still in mid-air.',
    stats: { hp: 900, atk: 86, def: 92, spd: 128 },
    skills: [
      { name: 'Hover Strike', text: 'Attack one enemy. Cannot be countered.', cooldown: 0 },
      { name: 'Mimicry', text: 'Copy every buff currently on the strongest enemy onto this unit.', cooldown: 4 },
      { name: 'Empty Threat', text: 'Enemies target this unit for 2 turns, and it takes 60% less damage while they do.', cooldown: 5 },
    ],
    body: { size: 0.85, abdomen: 1.35, girth: 0.9, legs: 0.9, antennae: 0.3, wings: 2, stance: 0.95 },
    palette: { carapace: '#2a2418', underside: '#f0c040', accent: '#f5dc84', eye: '#8a3a20' },
  },
  {
    id: 'galleria',
    name: 'Wax Moth Larva',
    latin: 'Galleria mellonella',
    rarity: 'rare',
    role: 'tender',
    biome: 'rotwood',
    fact:
      'Digests beeswax, which almost nothing else can, using gut enzymes that also break down ' +
      'polyethylene — it will eat a plastic bag and metabolise it.',
    stats: { hp: 1100, atk: 78, def: 104, spd: 88 },
    skills: [
      { name: 'Chew Through', text: 'Attack one enemy and strip one buff from them.', cooldown: 0 },
      { name: 'Digest', text: 'Consume all debuffs on the ally team and heal 8% per debuff removed.', cooldown: 3 },
      { name: 'Break It Down', text: 'Strip every buff and shield from all enemies.', cooldown: 5 },
    ],
    body: { size: 0.95, abdomen: 1.8, girth: 1.25, legs: 0.55, antennae: 0.35, wings: 0, stance: 0.55 },
    palette: { carapace: '#e0d0a8', underside: '#f0e4c8', accent: '#a89060', eye: '#2a2016' },
  },
  {
    id: 'polistes',
    name: 'European Paper Wasp',
    latin: 'Polistes dominula',
    rarity: 'common',
    role: 'tender',
    biome: 'meadow',
    fact:
      'Chews wood fibre into pulp and builds an open comb of hexagonal paper cells from it. Several ' +
      'foundresses will start a nest together, and if the dominant one dies another simply takes over.',
    stats: { hp: 970, atk: 90, def: 100, spd: 108 },
    skills: [
      { name: 'Sting', text: 'Attack one enemy and shield this unit for 10% of its max HP.', cooldown: 0 },
      { name: 'Paper Comb', text: 'Rebuild all ally shields to 20% of each ally\'s max HP.', cooldown: 3 },
      { name: 'Next Foundress', text: 'When an ally falls this turn, the team gains +30% ATK for 3 turns.', cooldown: 5 },
    ],
    body: { size: 0.92, abdomen: 1.45, girth: 0.78, legs: 1.05, antennae: 0.7, wings: 2, stance: 1.0 },
    palette: { carapace: '#2e2410', underside: '#e8c440', accent: '#c89020', eye: '#120e05' },
  },
];

export const CONTROLLERS: Species[] = [
  {
    id: 'ampulex',
    name: 'Jewel Wasp',
    latin: 'Ampulex compressa',
    rarity: 'legendary',
    role: 'controller',
    biome: 'rotwood',
    fact:
      'Stings a cockroach twice: once to briefly paralyse the front legs, then precisely into two spots ' +
      'inside the brain that remove the escape reflex. The roach then walks, docile, wherever she leads it.',
    stats: { hp: 900, atk: 128, def: 92, spd: 132 },
    skills: [
      { name: 'First Sting', text: 'Attack one enemy and Slow them heavily for 2 turns.', cooldown: 0 },
      { name: 'Into the Brain', text: 'One enemy loses control for 1 turn: they attack their own team instead.', cooldown: 5 },
      { name: 'Walk It Home', text: 'Drag one enemy to the front of the field. They cannot be healed or shielded for 3 turns.', cooldown: 4 },
    ],
    body: { size: 0.98, abdomen: 1.35, girth: 0.82, legs: 1.15, antennae: 0.85, wings: 2, stance: 1.1 },
    palette: { carapace: '#1a6b5a', underside: '#2fa88c', accent: '#c0392b', eye: '#0c1a16' },
  },
  {
    id: 'cimex',
    name: 'Bed Bug',
    latin: 'Cimex lectularius',
    rarity: 'rare',
    role: 'controller',
    biome: 'burrow',
    fact:
      'Its saliva carries both an anaesthetic and an anticoagulant, so the host does not wake and the ' +
      'wound keeps flowing. It can feed for ten minutes on someone who never notices, then go months without another meal.',
    stats: { hp: 980, atk: 112, def: 96, spd: 100 },
    skills: [
      { name: 'Painless Bite', text: 'Attack one enemy without waking them: sleeping targets stay asleep.', cooldown: 0 },
      { name: 'Anaesthetic', text: 'One enemy sleeps for 2 turns. It breaks early only on a critical hit.', cooldown: 4 },
      { name: 'Long Feed', text: 'Drain 20% of one enemy\'s max HP over 2 turns and heal the ally team by the same amount.', cooldown: 4 },
    ],
    body: { size: 0.7, abdomen: 1.0, girth: 1.5, legs: 0.85, antennae: 0.6, wings: 0, stance: 0.55 },
    palette: { carapace: '#8a4a2c', underside: '#b06840', accent: '#5a2c16', eye: '#160a04' },
  },
  {
    id: 'acyrthosiphon',
    name: 'Pea Aphid',
    latin: 'Acyrthosiphon pisum',
    rarity: 'common',
    role: 'controller',
    biome: 'meadow',
    fact:
      'Taps a plant\'s pressurised sap so the plant does the pumping, and excretes the surplus as ' +
      'honeydew. Ants farm it for that honeydew, guarding it and carrying it to fresh stems.',
    stats: { hp: 890, atk: 96, def: 88, spd: 104 },
    skills: [
      { name: 'Stylet', text: 'Attack one enemy and lower their ATK by 15% for 2 turns.', cooldown: 0 },
      { name: 'Honeydew', text: 'Heal the ally team by 18% and grant them +10% DEF for 2 turns.', cooldown: 3 },
      { name: 'Tap the Pressure', text: 'Drain 12% max HP a turn from all enemies for 2 turns, healing the ally team for half.', cooldown: 5 },
    ],
    body: { size: 0.62, abdomen: 1.3, girth: 1.35, legs: 0.9, antennae: 1.1, wings: 0, stance: 0.8 },
    palette: { carapace: '#8fc46a', underside: '#c0e094', accent: '#5a8a3c', eye: '#141a0e' },
  },
  {
    id: 'halyomorpha',
    name: 'Marmorated Stink Bug',
    latin: 'Halyomorpha halys',
    rarity: 'common',
    role: 'controller',
    biome: 'canopy',
    fact:
      'Sprays a mix of aldehydes from glands on its thorax when disturbed. The smell clings to whatever ' +
      'touched it, and predators that have met one once tend not to try again.',
    stats: { hp: 1000, atk: 100, def: 112, spd: 86 },
    skills: [
      { name: 'Foul Jab', text: 'Attack one enemy and lower their Accuracy by 15% for 2 turns.', cooldown: 0 },
      { name: 'Spray', text: 'All enemies lose 25% ATK and 20% Accuracy for 3 turns.', cooldown: 4 },
      { name: 'It Clings', text: 'Debuffs this unit applies cannot be cleansed for 3 turns.', cooldown: 5 },
    ],
    body: { size: 0.95, abdomen: 1.05, girth: 1.55, legs: 0.9, antennae: 0.9, wings: 1, stance: 0.7 },
    palette: { carapace: '#6b5a44', underside: '#8f8068', accent: '#3f3428', eye: '#120e0a' },
  },
  {
    id: 'lytta',
    name: 'Spanish Fly',
    latin: 'Lytta vesicatoria',
    rarity: 'epic',
    role: 'controller',
    biome: 'meadow',
    fact:
      'Bleeds cantharidin when threatened — a compound that raises blisters on skin at trace amounts and ' +
      'is lethal in doses smaller than a grain of rice. Nothing that has tasted it comes back.',
    stats: { hp: 920, atk: 134, def: 90, spd: 114 },
    skills: [
      { name: 'Cantharidin', text: 'Attack one enemy and Poison them for 3 turns.', cooldown: 0 },
      { name: 'Blister', text: 'One enemy loses 35% DEF for 3 turns and takes 50% more damage from Poison.', cooldown: 3 },
      { name: 'Trace Dose', text: 'Poison all enemies. Poison on this field cannot be cleansed for 2 turns.', cooldown: 5 },
    ],
    body: { size: 0.9, abdomen: 1.35, girth: 0.95, legs: 1.0, antennae: 0.95, wings: 1, stance: 0.9 },
    palette: { carapace: '#2f8a5a', underside: '#4fc48a', accent: '#1a5a38', eye: '#0c1a12' },
  },
  {
    id: 'pediculus',
    name: 'Head Louse',
    latin: 'Pediculus humanus capitis',
    rarity: 'common',
    role: 'controller',
    biome: 'burrow',
    fact:
      'Each foot ends in a claw sized to close exactly around one hair shaft, and its eggs are cemented ' +
      'on with a glue that does not dissolve. Once it has a grip, brushing does not remove it.',
    stats: { hp: 860, atk: 98, def: 92, spd: 118 },
    skills: [
      { name: 'Clamp', text: 'Attack one enemy and root them: they cannot be moved in the turn order for 2 turns.', cooldown: 0 },
      { name: 'Cement', text: 'One enemy cannot cleanse debuffs or gain shields for 3 turns.', cooldown: 3 },
      { name: 'Infest', text: 'Apply Clamp to all enemies and drain 8% of their SPD to the ally team.', cooldown: 4 },
    ],
    body: { size: 0.58, abdomen: 1.15, girth: 1.3, legs: 1.0, antennae: 0.55, wings: 0, stance: 0.6 },
    palette: { carapace: '#c8a884', underside: '#e0c8a8', accent: '#8a6c48', eye: '#241a10' },
  },
  {
    id: 'pseudacteon',
    name: 'Ant-decapitating Fly',
    latin: 'Pseudacteon tricuspis',
    rarity: 'epic',
    role: 'controller',
    biome: 'meadow',
    fact:
      'Lays a single egg inside a fire ant\'s thorax in flight. The larva migrates into the head, consumes ' +
      'it from within, and releases an enzyme that detaches the head entirely — then pupates inside it.',
    stats: { hp: 840, atk: 120, def: 84, spd: 140 },
    skills: [
      { name: 'Dart In', text: 'Attack one enemy. Cannot be dodged or countered.', cooldown: 0 },
      { name: 'Lay the Egg', text: 'Mark one enemy. After 3 turns they die outright unless the mark is cleansed.', cooldown: 5 },
      { name: 'Pupate', text: 'If a marked enemy dies, this unit gains +40% ATK and SPD for the rest of the battle.', cooldown: 6 },
    ],
    body: { size: 0.6, abdomen: 1.1, girth: 0.85, legs: 0.9, antennae: 0.35, wings: 2, stance: 1.05 },
    palette: { carapace: '#3a3028', underside: '#6b5c48', accent: '#a89478', eye: '#8a2c1c' },
  },
  {
    id: 'dermatobia',
    name: 'Human Bot Fly',
    latin: 'Dermatobia hominis',
    rarity: 'rare',
    role: 'controller',
    biome: 'canopy',
    fact:
      'Does not bite. It glues its eggs to a biting fly, and the larva transfers when that fly feeds, ' +
      'burrowing in and keeping one breathing pore open at the surface while it grows under the skin.',
    stats: { hp: 930, atk: 108, def: 96, spd: 106 },
    skills: [
      { name: 'Hitch a Ride', text: 'Attack one enemy. The damage is dealt again next turn.', cooldown: 0 },
      { name: 'Under the Skin', text: 'One enemy takes damage every turn, and 100% of any healing they receive goes to this unit instead.', cooldown: 4 },
      { name: 'Breathing Pore', text: 'This unit cannot be targeted while any enemy carries Under the Skin.', cooldown: 5 },
    ],
    body: { size: 0.9, abdomen: 1.25, girth: 1.1, legs: 0.9, antennae: 0.35, wings: 2, stance: 0.9 },
    palette: { carapace: '#3a4450', underside: '#6b7888', accent: '#c8a24a', eye: '#8a3428' },
  },
  {
    id: 'glossina',
    name: 'Tsetse Fly',
    latin: 'Glossina morsitans',
    rarity: 'epic',
    role: 'controller',
    biome: 'water',
    fact:
      'Carries trypanosomes that cause sleeping sickness — the parasite crosses into the brain and wrecks ' +
      'the sleep cycle, so victims doze by day and cannot sleep at night. Unusually, she bears live young one at a time.',
    stats: { hp: 910, atk: 116, def: 88, spd: 124 },
    skills: [
      { name: 'Proboscis', text: 'Attack one enemy and lower their SPD by 20% for 2 turns.', cooldown: 0 },
      { name: 'Sleeping Sickness', text: 'One enemy sleeps for 2 turns and wakes with 30% less SPD.', cooldown: 4 },
      { name: 'Broken Clock', text: 'All enemies have their turn order scrambled and lose 25% SPD for 3 turns.', cooldown: 5 },
    ],
    body: { size: 0.82, abdomen: 1.2, girth: 1.0, legs: 0.9, antennae: 0.3, wings: 2, stance: 0.88 },
    palette: { carapace: '#5a4c3c', underside: '#8a7860', accent: '#3a3028', eye: '#2a1810' },
  },
  {
    id: 'andricus',
    name: 'Oak Gall Wasp',
    latin: 'Andricus kollari',
    rarity: 'rare',
    role: 'controller',
    biome: 'canopy',
    fact:
      'Its larva secretes chemicals that hijack an oak\'s own growth machinery, making the tree build a ' +
      'hard woody gall around it — shelter and food, grown at the host\'s expense and to the wasp\'s design.',
    stats: { hp: 950, atk: 104, def: 104, spd: 110 },
    skills: [
      { name: 'Induce', text: 'Attack one enemy and convert one of their buffs into a debuff.', cooldown: 0 },
      { name: 'Grow the Gall', text: 'One enemy\'s DEF is turned against them: they take damage each turn equal to 8% of their own DEF.', cooldown: 4 },
      { name: "Host's Expense", text: 'For 3 turns, every buff an enemy gains also heals the ally team by 6%.', cooldown: 5 },
    ],
    body: { size: 0.68, abdomen: 1.15, girth: 0.9, legs: 0.95, antennae: 0.85, wings: 2, stance: 0.95 },
    palette: { carapace: '#4a2c18', underside: '#8a6038', accent: '#c89050', eye: '#160c05' },
  },
];
