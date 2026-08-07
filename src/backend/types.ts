/**
 * The only contract the game talks to.
 *
 * `local.ts` implements this against localStorage so the game is playable with no
 * server. `supabase.ts` will implement the same shape against Postgres + Auth +
 * Realtime. Nothing outside this folder may import a concrete implementation.
 */

export interface Profile {
  id: string;
  email: string;
  handle: string;
  level: number;
  /** XP earned inside the current level. */
  xp: number;
  motes: number;
  createdAt: number;
}

export interface OwnedInsect {
  id: string;
  speciesId: string;
  level: number;
  xp: number;
  /** Awakening tier, 1-6, shown as pips. */
  tier: number;
  nickname: string | null;
  acquiredAt: number;
}

/**
 * An egg you already hold. It is for one known species — you can see what is inside
 * before you crack it — and it hatches the moment you ask. No timers.
 *
 * Eggs are a battle reward: which species drops is the random part, not the wait.
 */
export interface Egg {
  id: string;
  speciesId: string;
  acquiredAt: number;
  /** Where it came from, so the Hatchery can say so. */
  source: EggSource;
}

export type EggSource = 'battle' | 'found';

export const EGG_SOURCE_LABEL: Record<EggSource, string> = {
  battle: 'Won in battle',
  found: 'Found in the clearing',
};

/** Everything the client needs after a successful sign-in. */
export interface GameState {
  profile: Profile;
  nest: OwnedInsect[];
  eggs: Egg[];
  /** Species ids the player has ever owned — drives Codex discovery. */
  discovered: string[];
}

export interface HatchResult {
  insect: OwnedInsect;
  firstTime: boolean;
}

export class BackendError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BackendError';
  }
}

export interface Backend {
  /** Resolves to the signed-in session, or null. Called once at boot. */
  currentUser(): Promise<Profile | null>;
  signUp(email: string, password: string, handle: string): Promise<Profile>;
  signIn(email: string, password: string): Promise<Profile>;
  signOut(): Promise<void>;

  loadState(): Promise<GameState>;

  /** Crack an egg you hold. Immediate — the insect lands in the Nest. */
  hatch(eggId: string): Promise<HatchResult>;

  renameInsect(insectId: string, nickname: string | null): Promise<OwnedInsect>;

  /**
   * Records a finished battle: awards XP, and on a win drops one egg of a random species.
   * Returns the egg so the outcome screen can announce it.
   */
  recordBattle(result: { won: boolean; opponent: string }): Promise<{ egg: Egg | null; xp: number }>;
}

/** How many eggs the Hatchery shows in its hollows at once. Holding more is fine. */
export const HATCHERY_HOLLOWS = 4;

/** XP needed to leave the given profile level. */
export function xpForLevel(level: number): number {
  return Math.round(120 * Math.pow(level, 1.35));
}
