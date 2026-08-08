/**
 * Local implementation of `Backend`, stored in localStorage.
 *
 * This exists so the game is fully playable before a Postgres instance exists.
 * Passwords are salted and hashed with PBKDF2 rather than stored in the clear —
 * not because localStorage is a security boundary (it is not), but so the flow
 * matches what the real backend will do and no plaintext secret is ever written.
 */

import { RARITY_ORDER, SPECIES, type Rarity } from '../content/species';
import {
  BackendError,
  EGG_CHANCE_LOSS,
  EGG_CHANCE_WIN,
  EGG_CHANCE_WIN_SECOND,
  type Backend,
  type Egg,
  type EggSource,
  type GameState,
  type HatchResult,
  type OwnedInsect,
  type Profile,
} from './types';

const K_USERS = 'cc:users';
const K_SESSION = 'cc:session';
const K_STATE = (userId: string) => `cc:state:${userId}`;

interface StoredUser {
  id: string;
  email: string;
  handle: string;
  salt: string;
  hash: string;
  createdAt: number;
}

interface StoredState {
  profile: Profile;
  nest: OwnedInsect[];
  eggs: Egg[];
  discovered: string[];
}

function read<T>(key: string, fallback: T): T {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
}

function id(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
}

function toHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function derive(password: string, saltHex: string): Promise<string> {
  const enc = new TextEncoder();
  const salt = Uint8Array.from(saltHex.match(/.{2}/g)!.map((h) => parseInt(h, 16)));
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 120_000, hash: 'SHA-256' },
    key,
    256,
  );
  return toHex(bits);
}

function newSalt(): string {
  return toHex(crypto.getRandomValues(new Uint8Array(16)).buffer);
}

function normaliseEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Default drop weights. Battles will pass their own once battles exist. */
const DEFAULT_WEIGHTS: Record<Rarity, number> = { common: 52, rare: 32, epic: 13, legendary: 3 };

/**
 * Picks which species an egg contains. This is the only random step in the loop —
 * the wait is gone, so the drop is where the interest lives.
 */
export function rollEggSpecies(weights: Record<Rarity, number> = DEFAULT_WEIGHTS): string {
  const total = RARITY_ORDER.reduce((sum, r) => sum + weights[r], 0);
  let roll = Math.random() * total;
  let rarity: Rarity = 'common';
  for (const r of RARITY_ORDER) {
    roll -= weights[r];
    if (roll <= 0) {
      rarity = r;
      break;
    }
  }
  const pool = SPECIES.filter((s) => s.rarity === rarity);
  const from = pool.length > 0 ? pool : SPECIES;
  return from[Math.floor(Math.random() * from.length)]!.id;
}

/**
 * A new egg does not know what is in it. The species is rolled when it is cracked, so
 * there is nothing to spoil and nothing stored to peek at.
 */
export function makeEgg(source: EggSource): Egg {
  return { id: id('egg'), speciesId: null, acquiredAt: Date.now(), source };
}

function makeInsect(speciesId: string): OwnedInsect {
  return {
    id: id('ins'),
    speciesId,
    level: 1,
    xp: 0,
    tier: 1,
    nickname: null,
    acquiredAt: Date.now(),
  };
}

/**
 * Five random insects, so a brand-new player can field a team and fight immediately.
 *
 * Distinct species on purpose — five copies of the same common would technically be a
 * legal team but a miserable first impression. Eggs are not granted here: they are a
 * battle reward, and the Hatchery says so when it is empty.
 */
function starterState(profile: Profile): StoredState {
  const picked = new Set<string>();
  while (picked.size < 5) picked.add(rollEggSpecies(STARTER_WEIGHTS));

  const starters = [...picked].map(makeInsect);
  return {
    profile,
    nest: starters,
    eggs: [],
    discovered: starters.map((i) => i.speciesId),
  };
}

/** Kinder than the battle table — a first team of five commons would be no fun. */
const STARTER_WEIGHTS: Record<Rarity, number> = { common: 40, rare: 38, epic: 19, legendary: 3 };

/**
 * Brings a saved game forward to the current shape.
 *
 * Accounts made before eggs became instant stored timed incubations under `hatchery`,
 * which would now read as `undefined` and crash on load. Those pending timers are
 * dropped — they no longer mean anything — and the colony is topped up to the five
 * insects every account is meant to start with, so an old save can still field a team.
 */
function migrate(raw: Partial<StoredState> & { hatchery?: unknown[] }): {
  state: StoredState;
  changed: boolean;
} {
  let changed = false;

  const nest = Array.isArray(raw.nest) ? [...raw.nest] : [];
  const eggs = Array.isArray(raw.eggs) ? raw.eggs : [];
  const discovered = Array.isArray(raw.discovered) ? [...raw.discovered] : [];

  if (!Array.isArray(raw.eggs)) changed = true;
  if ('hatchery' in raw) changed = true;

  const held = new Set(nest.map((i) => i.speciesId));
  while (nest.length < 5) {
    const id = rollEggSpecies(STARTER_WEIGHTS);
    if (held.has(id)) continue;
    held.add(id);
    const insect = makeInsect(id);
    nest.push(insect);
    if (!discovered.includes(id)) discovered.push(id);
    changed = true;
  }

  // A species removed from the roster would otherwise throw on every render.
  const known = new Set(SPECIES.map((s) => s.id));
  const cleanNest = nest.filter((i) => known.has(i.speciesId));
  const cleanEggs = eggs.filter((e) => e.speciesId === null || known.has(e.speciesId));
  const cleanDiscovered = discovered.filter((id) => known.has(id));
  if (cleanNest.length !== nest.length || cleanEggs.length !== eggs.length) changed = true;

  return {
    state: {
      profile: raw.profile as Profile,
      nest: cleanNest,
      eggs: cleanEggs,
      discovered: cleanDiscovered,
    },
    changed,
  };
}

export class LocalBackend implements Backend {
  private users(): Record<string, StoredUser> {
    return read<Record<string, StoredUser>>(K_USERS, {});
  }

  private requireSession(): StoredUser {
    const userId = localStorage.getItem(K_SESSION);
    if (!userId) throw new BackendError('Not signed in.');
    const user = Object.values(this.users()).find((u) => u.id === userId);
    if (!user) throw new BackendError('Session points at a user that no longer exists.');
    return user;
  }

  private state(userId: string): StoredState {
    const stored = localStorage.getItem(K_STATE(userId));
    if (!stored) throw new BackendError('No saved game for this account.');
    const parsed = JSON.parse(stored) as Partial<StoredState> & { hatchery?: unknown[] };
    const migrated = migrate(parsed);
    // Persist the migration so it runs once, not on every load.
    if (migrated.changed) this.save(userId, migrated.state);
    return migrated.state;
  }

  private save(userId: string, state: StoredState): void {
    write(K_STATE(userId), state);
  }

  async currentUser(): Promise<Profile | null> {
    const userId = localStorage.getItem(K_SESSION);
    if (!userId) return null;
    const user = Object.values(this.users()).find((u) => u.id === userId);
    if (!user) {
      localStorage.removeItem(K_SESSION);
      return null;
    }
    return this.state(user.id).profile;
  }

  /**
   * The no-login path: reuse this browser's player, or make one on first run.
   *
   * Registered in the same users map as a real account so every other method works
   * unchanged, but with an unguessable hash and no salt, so nobody can sign into it with
   * a password. When accounts come back, this becomes the thing you upgrade.
   */
  async ensureLocalPlayer(): Promise<Profile> {
    const existing = await this.currentUser();
    if (existing) return existing;

    const users = this.users();
    const device = Object.values(users).find((u) => u.email.endsWith('@device.local'));
    if (device) {
      localStorage.setItem(K_SESSION, device.id);
      return this.state(device.id).profile;
    }

    const id_ = id('usr');
    const user: StoredUser = {
      id: id_,
      email: `${id_}@device.local`,
      handle: 'Keeper',
      salt: '',
      hash: toHex(crypto.getRandomValues(new Uint8Array(32)).buffer),
      createdAt: Date.now(),
    };
    users[user.email] = user;
    write(K_USERS, users);

    const profile: Profile = {
      id: user.id,
      email: user.email,
      handle: user.handle,
      level: 1,
      xp: 0,
      motes: 150,
      createdAt: user.createdAt,
    };
    this.save(user.id, starterState(profile));
    localStorage.setItem(K_SESSION, user.id);
    return profile;
  }

  async signUp(email: string, password: string, handle: string): Promise<Profile> {
    const key = normaliseEmail(email);
    if (!key.includes('@')) throw new BackendError('That does not look like an email address.');
    if (password.length < 8) throw new BackendError('Password must be at least 8 characters.');
    const trimmedHandle = handle.trim();
    if (trimmedHandle.length < 3) throw new BackendError('Name must be at least 3 characters.');

    const users = this.users();
    if (users[key]) throw new BackendError('An account already exists for that email.');

    const salt = newSalt();
    const user: StoredUser = {
      id: id('usr'),
      email: key,
      handle: trimmedHandle,
      salt,
      hash: await derive(password, salt),
      createdAt: Date.now(),
    };
    users[key] = user;
    write(K_USERS, users);

    const profile: Profile = {
      id: user.id,
      email: key,
      handle: trimmedHandle,
      level: 1,
      xp: 0,
      motes: 150,
      createdAt: user.createdAt,
    };
    this.save(user.id, starterState(profile));
    localStorage.setItem(K_SESSION, user.id);
    return profile;
  }

  async signIn(email: string, password: string): Promise<Profile> {
    const key = normaliseEmail(email);
    const user = this.users()[key];
    // Same message either way so the form cannot be used to enumerate accounts.
    const rejected = new BackendError('Wrong email or password.');
    if (!user) throw rejected;
    if ((await derive(password, user.salt)) !== user.hash) throw rejected;

    localStorage.setItem(K_SESSION, user.id);
    if (!localStorage.getItem(K_STATE(user.id))) {
      this.save(
        user.id,
        starterState({
          id: user.id,
          email: user.email,
          handle: user.handle,
          level: 1,
          xp: 0,
          motes: 150,
          createdAt: user.createdAt,
        }),
      );
    }
    return this.state(user.id).profile;
  }

  async signOut(): Promise<void> {
    localStorage.removeItem(K_SESSION);
  }

  async loadState(): Promise<GameState> {
    const user = this.requireSession();
    const state = this.state(user.id);
    return {
      profile: state.profile,
      nest: state.nest,
      eggs: state.eggs,
      discovered: state.discovered,
    };
  }

  async hatch(eggId: string): Promise<HatchResult> {
    const user = this.requireSession();
    const state = this.state(user.id);
    const egg = state.eggs.find((e) => e.id === eggId);
    if (!egg) throw new BackendError('That egg is gone.');

    // This is the moment it is decided. Eggs saved before the change already know.
    const speciesId = egg.speciesId ?? rollEggSpecies();
    const insect = makeInsect(speciesId);
    const firstTime = !state.discovered.includes(speciesId);

    state.eggs = state.eggs.filter((e) => e.id !== eggId);
    state.nest.push(insect);
    if (firstTime) state.discovered.push(speciesId);

    state.profile = grantXp(state.profile, firstTime ? 60 : 25);
    this.save(user.id, state);
    return { insect, firstTime };
  }

  async recordBattle(result: { won: boolean; opponent: string }): Promise<{ eggs: Egg[]; xp: number }> {
    const user = this.requireSession();
    const state = this.state(user.id);

    // Losing still teaches you something, so it still pays a little XP.
    const xp = result.won ? 90 : 30;
    state.profile = grantXp(state.profile, xp);
    state.profile = { ...state.profile, motes: state.profile.motes + (result.won ? 40 : 10) };

    // An egg is a chance, not a wage — and a loss is still worth playing out.
    const eggs: Egg[] = [];
    if (Math.random() < (result.won ? EGG_CHANCE_WIN : EGG_CHANCE_LOSS)) {
      eggs.push(makeEgg('battle'));
      // The second egg is rolled only when the first landed, so a win can pay twice.
      if (result.won && Math.random() < EGG_CHANCE_WIN_SECOND) {
        eggs.push(makeEgg('battle'));
      }
    }
    state.eggs.push(...eggs);

    this.save(user.id, state);
    return { eggs, xp };
  }

  async renameInsect(insectId: string, nickname: string | null): Promise<OwnedInsect> {
    const user = this.requireSession();
    const state = this.state(user.id);
    const insect = state.nest.find((i) => i.id === insectId);
    if (!insect) throw new BackendError('No such insect in your nest.');
    const trimmed = nickname?.trim() ?? '';
    insect.nickname = trimmed.length > 0 ? trimmed.slice(0, 24) : null;
    this.save(user.id, state);
    return insect;
  }
}

export function grantXp(profile: Profile, amount: number): Profile {
  let { level, xp } = profile;
  xp += amount;
  let need = xpForLevelLocal(level);
  while (xp >= need) {
    xp -= need;
    level += 1;
    need = xpForLevelLocal(level);
  }
  return { ...profile, level, xp };
}

function xpForLevelLocal(level: number): number {
  return Math.round(120 * Math.pow(level, 1.35));
}
