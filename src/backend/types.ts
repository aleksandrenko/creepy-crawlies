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

  /**
   * Returns the player stored on this machine, creating one on first run.
   *
   * Login is switched off for now, so the game opens straight into whatever this browser
   * already has. `signUp`/`signIn` stay on the interface because accounts come back the
   * moment there is a server to hold them — see [[auth.ts]], still on disk and unwired.
   */
  ensureLocalPlayer(): Promise<Profile>;

  signUp(email: string, password: string, handle: string): Promise<Profile>;
  signIn(email: string, password: string): Promise<Profile>;
  signOut(): Promise<void>;

  loadState(): Promise<GameState>;

  /** Crack an egg you hold. Immediate — the insect lands in the Nest. */
  hatch(eggId: string): Promise<HatchResult>;

  renameInsect(insectId: string, nickname: string | null): Promise<OwnedInsect>;

  /**
   * Records a finished battle: awards XP, and rolls for egg drops. Returns whatever
   * dropped so the outcome screen can announce it — a win can yield two.
   */
  recordBattle(result: { won: boolean; opponent: string }): Promise<{ eggs: Egg[]; xp: number }>;
}

/** How many eggs the Hatchery shows in its hollows at once. Holding more is fine. */
export const HATCHERY_HOLLOWS = 4;

/**
 * Odds of eggs dropping after a battle.
 *
 * A win almost always pays, and sometimes pays twice, so the reward feels generous without
 * ever being guaranteed — there is still a roll to lose. A loss pays rarely, enough that a
 * bad run is not wasted, not enough to make losing a strategy.
 */
export const EGG_CHANCE_WIN = 0.85;
/** Chance of a second egg, rolled only if the first one landed. */
export const EGG_CHANCE_WIN_SECOND = 0.3;
export const EGG_CHANCE_LOSS = 0.2;

/** XP needed to leave the given profile level. */
export function xpForLevel(level: number): number {
  return Math.round(120 * Math.pow(level, 1.35));
}
