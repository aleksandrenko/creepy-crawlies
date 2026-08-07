/**
 * The code exchange that stands in for a signalling server.
 *
 * One player hosts and gets an invite code; the other pastes it and returns an answer
 * code; the host pastes that back. Two copy-pastes over any chat app, and the browsers
 * are talking directly. Clunky, and honest about being clunky — the alternative is a
 * server.
 */

import type { GameState } from '../backend';
import type { Move, TeamMember } from '../battle/engine';
import { Duel } from '../net/duel';
import { PeerLink } from '../net/peer';
import type { BattleController } from './battleScreen';
import { el, qs } from './dom';
import { openPanel, toast } from './panel';
import { pickTeam } from './teamPicker';

export function startDuel(
  state: GameState,
  onBattle: (controller: BattleController) => void,
): void {
  pickTeam(state, { title: 'Duel a Friend', confirmLabel: 'Next: connect' }, (team, closePicker) => {
    closePicker();
    openConnect(state, team, onBattle);
  });
}

function openConnect(
  state: GameState,
  team: TeamMember[],
  onBattle: (controller: BattleController) => void,
): void {
  const panel = openPanel({
    title: 'Connect to your friend',
    subtitle: 'One of you hosts, the other joins',
    wide: true,
    onClose: () => {
      // Only tear the link down if a battle never started.
      if (!handedOff) link?.close();
    },
  });

  let link: PeerLink | null = null;
  let handedOff = false;

  const body = el(`
    <div class="lobby">
      <p class="notice notice--quiet">
        There is no server. You exchange two codes over any chat app, then your browsers talk
        directly. Home internet almost always works; mobile data often does not.
      </p>
      <div class="lobby__choice">
        <button class="btn btn--primary lobby__host" type="button">Host the duel</button>
        <button class="btn btn--ghost lobby__join" type="button">Join with a code</button>
      </div>
      <div class="lobby__stage"></div>
    </div>
  `);

  const stage = qs(body, '.lobby__stage');

  qs(body, '.lobby__host').addEventListener('click', () => void hostFlow());
  qs(body, '.lobby__join').addEventListener('click', () => joinFlow());

  function makeLink(role: 'host' | 'guest'): PeerLink {
    const duelRef: { current: Duel | null } = { current: null };

    const created = new PeerLink({
      onOpen: () => {
        void duelRef.current?.start();
      },
      onMessage: (data) => void duelRef.current?.handle(data),
      onFailed: (reason) => toast(reason, 'error'),
      onClosed: (reason) => toast(reason, 'info'),
    });

    const duel = new Duel(created, role, state.profile.handle, team, {
      onPhase: (phase) => {
        if (phase === 'battle' && !handedOff) {
          handedOff = true;
          panel.close();
          onBattle(duelController(duel, created));
        }
      },
      onState: () => notify(),
      onFinished: (result) => finish(result),
      onError: (message) => toast(message, 'error'),
      onOpponent: (handle) => setStatus(`Connected to ${handle}. Setting up the battle…`),
    });
    duelRef.current = duel;
    return created;
  }

  // Wiring between the Duel and the controller handed to the battle screen.
  let listeners: (() => void)[] = [];
  let settle: ((r: { won: boolean | null; reason: string }) => void) | null = null;
  const done = new Promise<{ won: boolean | null; reason: string }>((resolve) => {
    settle = resolve;
  });
  const notify = () => listeners.forEach((l) => l());
  const finish = (result: { won: boolean | null; reason: string }) => settle?.(result);

  function duelController(duel: Duel, peer: PeerLink): BattleController {
    return {
      mySide: duel.mySide,
      get opponentName() {
        return duel.opponentHandle;
      },
      state: () => duel.battle,
      isMyTurn: () => duel.myTurn && !duel.battle?.winner,
      submit: (move: Move) => duel.submit(move),
      resign: () => duel.resign(),
      subscribe: (listener) => {
        listeners.push(listener);
      },
      finished: () => done,
      dispose: () => {
        listeners = [];
        peer.close();
      },
    };
  }

  function setStatus(text: string): void {
    const status = stage.querySelector('.lobby__status');
    if (status) status.textContent = text;
  }

  async function hostFlow(): Promise<void> {
    stage.replaceChildren(
      el(`
        <div class="lobby__panel">
          <h3 class="lobby__heading">Step 1 — send this invite code</h3>
          <p class="lobby__status">Preparing…</p>
          <textarea class="lobby__code" readonly rows="4"></textarea>
          <button class="btn btn--ghost lobby__copy" type="button">Copy invite code</button>
          <h3 class="lobby__heading">Step 2 — paste the answer code they send back</h3>
          <textarea class="lobby__answer" rows="4" placeholder="CC1-A-…"></textarea>
          <button class="btn btn--primary lobby__accept" type="button">Connect</button>
        </div>
      `),
    );

    link = makeLink('host');
    try {
      const code = await link.createInvite();
      qs<HTMLTextAreaElement>(stage, '.lobby__code').value = code;
      setStatus('Send this to your friend, then wait for their answer code.');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Could not prepare an invite.');
      return;
    }

    qs(stage, '.lobby__copy').addEventListener('click', () => {
      void navigator.clipboard.writeText(qs<HTMLTextAreaElement>(stage, '.lobby__code').value);
      toast('Invite code copied.', 'good');
    });

    qs(stage, '.lobby__accept').addEventListener('click', async () => {
      const answer = qs<HTMLTextAreaElement>(stage, '.lobby__answer').value.trim();
      if (!answer) return;
      try {
        await link!.completeInvite(answer);
        setStatus('Connecting…');
      } catch (err) {
        toast(err instanceof Error ? err.message : 'That answer code did not work.', 'error');
      }
    });
  }

  function joinFlow(): void {
    stage.replaceChildren(
      el(`
        <div class="lobby__panel">
          <h3 class="lobby__heading">Step 1 — paste your friend's invite code</h3>
          <textarea class="lobby__invite" rows="4" placeholder="CC1-O-…"></textarea>
          <button class="btn btn--primary lobby__make" type="button">Generate answer code</button>
          <p class="lobby__status"></p>
          <h3 class="lobby__heading">Step 2 — send this answer code back</h3>
          <textarea class="lobby__code" readonly rows="4"></textarea>
          <button class="btn btn--ghost lobby__copy" type="button">Copy answer code</button>
        </div>
      `),
    );

    link = makeLink('guest');

    qs(stage, '.lobby__make').addEventListener('click', async () => {
      const invite = qs<HTMLTextAreaElement>(stage, '.lobby__invite').value.trim();
      if (!invite) return;
      try {
        const answer = await link!.acceptInvite(invite);
        qs<HTMLTextAreaElement>(stage, '.lobby__code').value = answer;
        setStatus('Send this back to them. The battle starts as soon as they paste it in.');
      } catch (err) {
        toast(err instanceof Error ? err.message : 'That invite code did not work.', 'error');
      }
    });

    qs(stage, '.lobby__copy').addEventListener('click', () => {
      void navigator.clipboard.writeText(qs<HTMLTextAreaElement>(stage, '.lobby__code').value);
      toast('Answer code copied.', 'good');
    });
  }

  panel.body.appendChild(body);
}
