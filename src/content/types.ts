/**
 * Shared vocabulary for the species catalogue.
 *
 * The roster files under `roster/` hold the data; `species.ts` composes them and is
 * the module the rest of the game imports from.
 */

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';
export type Role = 'striker' | 'bulwark' | 'controller' | 'tender';
export type Biome = 'meadow' | 'rotwood' | 'canopy' | 'burrow' | 'water';

export interface Skill {
  name: string;
  /** Player-facing rules text. */
  text: string;
  /** Turns before it may be used again. 0 = every turn. */
  cooldown: number;
}

export interface BodyParams {
  /** Overall scale multiplier applied to the shared hexapod rig. */
  size: number;
  /** Abdomen length relative to thorax — beetles are stubby, mantids long. */
  abdomen: number;
  /** Abdomen width. */
  girth: number;
  /** Leg length relative to body. */
  legs: number;
  /** Antenna length. 0 hides them. */
  antennae: number;
  /** 0 = none, 1 = hardened elytra, 2 = membranous wings. */
  wings: 0 | 1 | 2;
  /** Extra vertical lift of the thorax off the ground. */
  stance: number;
  /** Raptorial forelegs (mantis). */
  raptorial?: boolean;
  /** Visible mandibles / jaws. */
  mandibles?: number;
}

export interface Palette {
  carapace: string;
  underside: string;
  accent: string;
  eye: string;
}

export interface BaseStats {
  hp: number;
  atk: number;
  def: number;
  spd: number;
}

export interface Species {
  id: string;
  /** Common name, shown everywhere. */
  name: string;
  /** Scientific name. */
  latin: string;
  rarity: Rarity;
  role: Role;
  biome: Biome;
  /** The real-world trait the kit is built on. Shown in the Codex. */
  fact: string;
  stats: BaseStats;
  skills: [Skill, Skill, Skill];
  body: BodyParams;
  palette: Palette;
}

export const RARITY_ORDER: Rarity[] = ['common', 'rare', 'epic', 'legendary'];

export const RARITY_COLOR: Record<Rarity, string> = {
  common: '#8b9a7a',
  rare: '#4a9bd4',
  epic: '#a06cd5',
  legendary: '#e8a13a',
};

export const BIOME_LABEL: Record<Biome, string> = {
  meadow: 'Meadow',
  rotwood: 'Rotwood',
  canopy: 'Canopy',
  burrow: 'Burrow',
  water: 'Still Water',
};

export const ROLE_LABEL: Record<Role, string> = {
  striker: 'Striker',
  bulwark: 'Bulwark',
  controller: 'Controller',
  tender: 'Tender',
};
