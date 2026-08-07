/**
 * The "where do we fight" chooser, and the small profile sheet.
 *
 * Skirmish runs locally against the AI. A duel runs peer-to-peer with no server of ours
 * in the middle — see `net/peer.ts` for what that costs.
 */

import { backend, type GameState } from '../backend';
import type { TeamMember } from '../battle/engine';
import { getSpecies, RARITY_ORDER, SPECIES } from '../content/species';
import { announceReward, mountBattle, skirmishController, type BattleController } from './battleScreen';
import { el, escapeHtml, qs } from './dom';
import { startDuel } from './duelLobby';
import { openPanel, toast } from './panel';
import { pickTeam } from './teamPicker';

interface Destination {
  id: 'duel' | 'skirmish' | 'ladder';
  name: string;
  blurb: string;
  detail: string;
  kind: 'pvp' | 'pve';
  ready: boolean;
}

const DESTINATIONS: Destination[] = [
  {
    id: 'duel',
    name: 'Duel a Friend',
    blurb: 'Live 3v3 against another player, turn by turn.',
    detail:
      'No server involved: you swap two codes over any chat app and your browsers connect directly. ' +
      'Both sides simulate the battle and check each other every turn.',
    kind: 'pvp',
    ready: true,
  },
  {
    id: 'skirmish',
    name: 'Skirmish',
    blurb: 'Practice 3v3 against a wild swarm.',
    detail: 'The same rules and the same engine, with the other side played by the AI. Win to earn an egg.',
    kind: 'pve',
    ready: true,
  },
  {
    id: 'ladder',
    name: 'The Ladder',
    blurb: 'Ranked duels against anyone online.',
    detail: 'Needs matchmaking, which needs a server. Not built yet.',
    kind: 'pvp',
    ready: false,
  },
];

export function openBattleMenu(
  state: GameState,
  refresh: () => Promise<void>,
): void {
  const panel = openPanel({ title: 'Battle', subtitle: 'Pick where to fight', wide: true });
  const body = el(`<div class="battles"></div>`);

  if (state.nest.length < 3) {
    body.appendChild(
      el(
        `<p class="notice">A team takes 3 insects and you have ${state.nest.length}. ` +
          `Hatch ${3 - state.nest.length} more in the Hatchery first.</p>`,
      ),
    );
  }

  for (const dest of DESTINATIONS) {
    const node = el(`
      <button class="destination${dest.ready ? '' : ' is-unbuilt'}" type="button" data-kind="${dest.kind}">
        <span class="destination__head">
          <span class="destination__name">${escapeHtml(dest.name)}</span>
          <span class="destination__kind">${dest.kind === 'pvp' ? 'Player vs player' : 'Player vs AI'}</span>
        </span>
        <span class="destination__blurb">${escapeHtml(dest.blurb)}</span>
        <span class="destination__detail">${escapeHtml(dest.detail)}</span>
        ${dest.ready ? '' : '<span class="destination__stamp">Not built yet</span>'}
      </button>
    `);

    node.addEventListener('click', () => {
      if (!dest.ready) {
        toast('The ladder needs matchmaking on a server. Not built yet.', 'info');
        return;
      }
      if (state.nest.length < 3) {
        toast('You need 3 insects to field a team.', 'error');
        return;
      }
      panel.close();
      if (dest.id === 'skirmish') launchSkirmish(state, refresh);
      else startDuel(state, (controller) => launch(controller, refresh));
    });

    body.appendChild(node);
  }

  panel.body.appendChild(body);
}

function launch(controller: BattleController, refresh: () => Promise<void>): void {
  mountBattle(controller, async (result) => {
    await refresh();
    void result;
  });
}

function launchSkirmish(state: GameState, refresh: () => Promise<void>): void {
  pickTeam(state, { title: 'Skirmish', confirmLabel: 'Start the skirmish' }, (team, close) => {
    close();
    const foes = wildTeam(team);
    // The seed only has to be unpredictable, not agreed with anyone.
    const seed = crypto.getRandomValues(new Uint32Array(1))[0]!;
    const controller = skirmishController(team, foes, seed);

    mountBattle(controller, async () => {
      await refresh();
    });

    void controller.finished().then(async (result) => {
      if (result.won === null) return;
      const reward = await backend.recordBattle({ won: result.won, opponent: 'Wild swarm' });
      announceReward(`+${reward.xp} XP`);
      if (reward.egg) {
        announceReward(`Egg found: ${getSpecies(reward.egg.speciesId).name} — hatch it in the Hatchery`);
      }
      await refresh();
    });
  });
}

/**
 * Builds an opponent roughly matched to the player's team: same team size, levels within
 * one of theirs, and a rarity spread near their own so a starter team is not thrown at
 * three legendaries.
 */
function wildTeam(playerTeam: TeamMember[]): TeamMember[] {
  const avgLevel = Math.max(
    1,
    Math.round(playerTeam.reduce((sum, m) => sum + m.level, 0) / playerTeam.length),
  );
  const cap = Math.max(
    ...playerTeam.map((m) => RARITY_ORDER.indexOf(getSpecies(m.speciesId).rarity)),
  );

  const pool = SPECIES.filter((s) => RARITY_ORDER.indexOf(s.rarity) <= cap);
  const chosen: TeamMember[] = [];
  const used = new Set<string>();

  while (chosen.length < playerTeam.length) {
    const pick = pool[Math.floor(Math.random() * pool.length)]!;
    if (used.has(pick.id)) continue;
    used.add(pick.id);
    chosen.push({
      speciesId: pick.id,
      level: Math.max(1, avgLevel + (Math.random() < 0.5 ? -1 : 0)),
    });
  }
  return chosen;
}

/** Small profile sheet, opened from the HUD block. */
export function openProfile(state: GameState, onSignOut: () => void): void {
  const panel = openPanel({ title: state.profile.handle, subtitle: state.profile.email });
  const { profile } = state;

  const body = el(`
    <div class="detail">
      <dl class="stats stats--wide">
        <div><dt>Level</dt><dd>${profile.level}</dd></div>
        <div><dt>Motes</dt><dd>${profile.motes.toLocaleString('en-GB')}</dd></div>
        <div><dt>Colony</dt><dd>${state.nest.length}</dd></div>
        <div><dt>Discovered</dt><dd>${state.discovered.length}</dd></div>
      </dl>
      <p class="detail__fact">
        Joined ${new Date(profile.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}.
      </p>
      <p class="notice notice--quiet">
        This account lives in this browser only. Duels work across two computers without a
        server, but your colony does not travel with you — that needs a database.
      </p>
      <button class="btn btn--ghost" type="button">Sign out</button>
    </div>
  `);

  qs(body, 'button').addEventListener('click', () => {
    panel.close();
    onSignOut();
  });

  panel.body.appendChild(body);
}
