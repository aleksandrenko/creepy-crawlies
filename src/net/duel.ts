/**
 * The duel protocol: lockstep over a `PeerLink`.
 *
 * Only moves cross the wire. Both peers run the same deterministic engine on the same
 * teams and the same seed, so both arrive at the same state — and after every move they
 * compare `stateHash`, which turns any divergence into an immediate, visible failure
 * instead of two players quietly seeing different battles.
 *
 * The seed is agreed by commit-and-reveal: each side hashes a secret, both hashes are
 * exchanged first, and only then are the secrets revealed. Neither player can pick a seed
 * that suits their team, because neither knows the other's half while committing.
 */

import {
  applyMove,
  createBattle,
  stateHash,
  type BattleState,
  type Move,
  type Side,
  type TeamMember,
} from '../battle/engine';
import { PeerLink, type PeerRole } from './peer';

type Message =
  | { type: 'hello'; handle: string; team: TeamMember[]; commit: string }
  | { type: 'reveal'; secret: number }
  | { type: 'move'; move: Move; hash: string }
  | { type: 'resign' };

export type DuelPhase = 'connecting' | 'handshake' | 'battle' | 'over';

export interface DuelEvents {
  onPhase(phase: DuelPhase): void;
  /** Fired whenever the battle state changes and the UI should redraw. */
  onState(state: BattleState): void;
  /** The battle ended: `won` is from the local player's point of view. */
  onFinished(result: { won: boolean | null; reason: string }): void;
  onError(message: string): void;
  onOpponent(handle: string): void;
}

async function sha256(value: number): Promise<string> {
  const bytes = new Uint8Array(new Uint32Array([value >>> 0]).buffer);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export class Duel {
  private readonly secret = crypto.getRandomValues(new Uint32Array(1))[0]!;
  private commit = '';

  private theirTeam: TeamMember[] | null = null;
  private theirCommit: string | null = null;
  private theirSecret: number | null = null;
  private theirHandle = 'Opponent';
  private helloSent = false;
  private revealed = false;

  private state: BattleState | null = null;
  private phase: DuelPhase = 'connecting';

  /** The host is always side 'a', so both peers agree on sides without negotiating. */
  readonly mySide: Side;

  constructor(
    private readonly link: PeerLink,
    private readonly role: PeerRole,
    private readonly myHandle: string,
    private readonly myTeam: TeamMember[],
    private readonly events: DuelEvents,
  ) {
    this.mySide = role === 'host' ? 'a' : 'b';
  }

  get battle(): BattleState | null {
    return this.state;
  }

  get opponentHandle(): string {
    return this.theirHandle;
  }

  /** Call once the data channel is open. */
  async start(): Promise<void> {
    this.setPhase('handshake');
    this.commit = await sha256(this.secret);
    this.sendHello();
    // Their hello can arrive while we were still hashing, in which case nothing has
    // driven the reveal yet.
    this.maybeReveal();
  }

  /**
   * Never sends before the commitment exists. The peer's hello can land in the same tick
   * the channel opens, and a hello carrying an empty commit would be rejected — correctly —
   * as a peer that revealed without committing.
   */
  private sendHello(): void {
    if (this.helloSent || !this.commit) return;
    this.helloSent = true;
    this.link.send({ type: 'hello', handle: this.myHandle, team: this.myTeam, commit: this.commit } satisfies Message);
  }

  private setPhase(phase: DuelPhase): void {
    this.phase = phase;
    this.events.onPhase(phase);
  }

  async handle(raw: unknown): Promise<void> {
    const message = raw as Message;
    if (!message || typeof message.type !== 'string') return;

    switch (message.type) {
      case 'hello': {
        if (!Array.isArray(message.team) || message.team.length === 0) {
          this.events.onError('The other player sent an invalid team.');
          return;
        }
        this.theirTeam = message.team.slice(0, 3);
        this.theirCommit = message.commit;
        this.theirHandle = String(message.handle || 'Opponent').slice(0, 24);
        this.events.onOpponent(this.theirHandle);
        // Our own hello may have gone out before theirs arrived; either order works.
        this.sendHello();
        this.maybeReveal();
        return;
      }

      case 'reveal': {
        if (this.theirCommit === null) {
          this.events.onError('The other player revealed a seed before committing to one.');
          return;
        }
        if ((await sha256(message.secret)) !== this.theirCommit) {
          this.events.onError('The other player changed their seed after committing. Battle abandoned.');
          this.finish(null, 'The seed commitment did not match.');
          return;
        }
        this.theirSecret = message.secret >>> 0;
        this.maybeBegin();
        return;
      }

      case 'move': {
        if (!this.state || this.phase !== 'battle') return;
        const active = this.state.units.find((u) => u.id === this.state!.activeUnitId);
        if (!active || active.side === this.mySide) {
          // Not their turn to move; ignoring keeps a confused peer from corrupting us.
          return;
        }
        this.state = applyMove(this.state, message.move);
        if (message.hash && message.hash !== stateHash(this.state)) {
          this.events.onError('The two games have gone out of step. Battle abandoned.');
          this.finish(null, 'Desync detected — the peers computed different states.');
          return;
        }
        this.events.onState(this.state);
        this.checkOver();
        return;
      }

      case 'resign': {
        this.finish(true, `${this.theirHandle} resigned.`);
        return;
      }
    }
  }

  private maybeReveal(): void {
    if (this.revealed || this.theirCommit === null || !this.commit) return;
    this.revealed = true;
    this.link.send({ type: 'reveal', secret: this.secret } satisfies Message);
    this.maybeBegin();
  }

  private maybeBegin(): void {
    if (this.state || !this.theirTeam || this.theirSecret === null) return;
    // Neither side controls the result: both halves are mixed together.
    const seed = (this.secret ^ this.theirSecret) >>> 0;
    const teamA = this.role === 'host' ? this.myTeam : this.theirTeam;
    const teamB = this.role === 'host' ? this.theirTeam : this.myTeam;

    this.state = createBattle(teamA.slice(0, 3), teamB.slice(0, 3), seed);
    this.setPhase('battle');
    this.events.onState(this.state);
  }

  /** True when the unit to act belongs to the local player. */
  get myTurn(): boolean {
    if (!this.state?.activeUnitId) return false;
    return this.state.units.find((u) => u.id === this.state!.activeUnitId)?.side === this.mySide;
  }

  submit(move: Move): void {
    if (!this.state || !this.myTurn) return;
    this.state = applyMove(this.state, move);
    this.link.send({ type: 'move', move, hash: stateHash(this.state) } satisfies Message);
    this.events.onState(this.state);
    this.checkOver();
  }

  resign(): void {
    this.link.send({ type: 'resign' } satisfies Message);
    this.finish(false, 'You resigned.');
  }

  private checkOver(): void {
    const winner = this.state?.winner;
    if (!winner) return;
    if (winner === 'draw') this.finish(null, 'A draw — both teams still standing when time ran out.');
    else this.finish(winner === this.mySide, winner === this.mySide ? 'You won the duel.' : `${this.theirHandle} won the duel.`);
  }

  private finish(won: boolean | null, reason: string): void {
    if (this.phase === 'over') return;
    this.setPhase('over');
    this.events.onFinished({ won, reason });
  }
}

