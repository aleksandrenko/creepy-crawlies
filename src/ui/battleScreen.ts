/**
 * The battle screen. Full-screen, above the Bastion.
 *
 * It knows nothing about where the opponent's moves come from — a `BattleController`
 * supplies them, so the same screen drives the AI skirmish and a P2P duel.
 */

import { chooseMove } from '../battle/ai';
import {
  activeUnit,
  applyMove,
  createBattle,
  legalTargets,
  skillReady,
  type BattleState,
  type Move,
  type Side,
  type TeamMember,
  type Unit,
} from '../battle/engine';
import { compiled, DEBUFFS, type StatusKind } from '../battle/mechanics';
import { getSpecies } from '../content/species';
import { creatureVisual } from './creature';
import { el, escapeHtml, qs } from './dom';

export interface BattleController {
  readonly mySide: Side;
  readonly opponentName: string;
  state(): BattleState | null;
  isMyTurn(): boolean;
  submit(move: Move): void;
  resign(): void;
  /** Called by the controller whenever the state changed. */
  subscribe(listener: () => void): void;
  /** Resolves when the battle is decided. */
  finished(): Promise<{ won: boolean | null; reason: string }>;
  dispose(): void;
}

const STATUS_LABEL: Partial<Record<StatusKind, string>> = {
  burn: 'Burn', bleed: 'Bleed', poison: 'Poison', dissolve: 'Dissolve',
  stun: 'Stun', sleep: 'Asleep', slow: 'Slow', blind: 'Blind', fear: 'Fear',
  healBlock: 'No heal', taunt: 'Taunt', untargetable: 'Hidden', doom: 'Doom',
  regen: 'Regen', shield: 'Shield', atkUp: 'ATK+', atkDown: 'ATK-',
  defUp: 'DEF+', defDown: 'DEF-', spdUp: 'SPD+', spdDown: 'SPD-',
  accUp: 'ACC+', accDown: 'ACC-', critUp: 'CRIT+', noDodge: 'Pinned',
  damageCut: 'Braced', dodgeUp: 'Evasive', unkillable: 'Unkillable', healUp: 'Heal+',
};

export function mountBattle(
  controller: BattleController,
  onExit: (result: { won: boolean | null; reason: string }) => void,
): void {
  const root = el(`
    <div class="arena">
      <header class="arena__top">
        <div class="arena__side arena__side--them">
          <span class="arena__who"></span>
          <span class="arena__tag">Opponent</span>
        </div>
        <div class="arena__round"></div>
        <button class="arena__resign" type="button">Resign</button>
      </header>

      <div class="field field--them"></div>
      <div class="arena__banner"></div>
      <div class="field field--me"></div>

      <div class="arena__bottom">
        <div class="skills-bar"></div>
        <ol class="combat-log" aria-live="polite"></ol>
      </div>
    </div>
  `);

  const them = qs(root, '.field--them');
  const mine = qs(root, '.field--me');
  const bar = qs(root, '.skills-bar');
  const banner = qs(root, '.arena__banner');
  const logList = qs(root, '.combat-log');
  const roundLabel = qs(root, '.arena__round');

  qs(root, '.arena__who').textContent = controller.opponentName;
  qs(root, '.arena__resign').addEventListener('click', () => {
    if (confirm('Resign this battle?')) controller.resign();
  });

  /** Set while waiting for the player to pick a target for a chosen skill. */
  let pendingSkill: 0 | 1 | 2 | null = null;
  let renderedLog = 0;

  function render(): void {
    const state = controller.state();
    if (!state) return;

    roundLabel.textContent = `Round ${state.round}`;
    const actor = activeUnit(state);

    renderSide(them, state, opposite(controller.mySide), state.activeUnitId);
    renderSide(mine, state, controller.mySide, state.activeUnitId);

    if (state.winner) {
      banner.textContent = '';
      banner.className = 'arena__banner';
    } else if (controller.isMyTurn() && actor) {
      banner.textContent = pendingSkill === null ? `${actor.name} — choose a skill` : 'Choose a target';
      banner.className = 'arena__banner is-mine';
    } else {
      banner.textContent = `${controller.opponentName} is thinking…`;
      banner.className = 'arena__banner is-theirs';
    }

    renderSkills(state, actor);
    renderLog(state);
  }

  function renderSide(host: HTMLElement, state: BattleState, side: Side, activeId: string | null): void {
    host.replaceChildren();
    for (const unit of state.units.filter((u) => u.side === side)) {
      host.appendChild(unitCard(state, unit, unit.id === activeId));
    }
  }

  function unitCard(state: BattleState, unit: Unit, isActive: boolean): HTMLElement {
    const species = getSpecies(unit.speciesId);
    const pct = Math.max(0, Math.round((unit.hp / unit.maxHp) * 100));
    const dead = unit.hp <= 0;

    const node = el(`
      <div class="fighter${dead ? ' is-down' : ''}${isActive ? ' is-active' : ''}"
           data-unit="${unit.id}">
        <div class="fighter__art">${creatureVisual(species, { context: 'card' })}</div>
        <div class="fighter__body">
          <p class="fighter__name">${escapeHtml(unit.name)} <span class="fighter__lvl">L${unit.level}</span></p>
          <div class="fighter__hp"><span class="fighter__hp-fill" style="width:${pct}%"></span></div>
          <p class="fighter__numbers">${Math.max(0, unit.hp)} / ${unit.maxHp}</p>
          <div class="fighter__statuses"></div>
        </div>
      </div>
    `);

    const statuses = qs(node, '.fighter__statuses');
    for (const s of unit.statuses) {
      const bad = DEBUFFS.has(s.kind);
      statuses.appendChild(
        el(
          `<span class="chip-status${bad ? ' is-bad' : ' is-good'}" title="${escapeHtml(
            `${STATUS_LABEL[s.kind] ?? s.kind}${s.magnitude ? ` ${s.magnitude}%` : ''} · ${s.turns} turn(s)`,
          )}">${escapeHtml(STATUS_LABEL[s.kind] ?? s.kind)}${s.turns > 1 ? ` ${s.turns}` : ''}</span>`,
        ),
      );
    }

    // Target picking: only legal targets are clickable, and only while one is wanted.
    if (pendingSkill !== null) {
      const actor = activeUnit(state);
      if (actor) {
        const mechanic = compiled(actor.speciesId).skills[pendingSkill].mechanic;
        const legal = legalTargets(state, actor, mechanic).some((t) => t.id === unit.id);
        if (legal) {
          node.classList.add('is-targetable');
          node.addEventListener('click', () => {
            const skill = pendingSkill!;
            pendingSkill = null;
            controller.submit({ unitId: actor.id, skill, targetId: unit.id });
          });
        }
      }
    }

    return node;
  }

  function renderSkills(state: BattleState, actor: Unit | null): void {
    bar.replaceChildren();
    if (!actor || state.winner || !controller.isMyTurn()) return;

    const species = compiled(actor.speciesId);
    for (const index of [0, 1, 2] as const) {
      const skill = species.skills[index];
      const ready = skillReady(actor, index);
      const cd = actor.cooldowns[index];

      const button = el(`
        <button class="skill-btn${ready ? '' : ' is-cooling'}${pendingSkill === index ? ' is-armed' : ''}"
                type="button" ${ready ? '' : 'disabled'}>
          <span class="skill-btn__name">${escapeHtml(skill.name)}</span>
          <span class="skill-btn__text">${escapeHtml(skill.text)}</span>
          <span class="skill-btn__cd">${ready ? (skill.cooldown === 0 ? 'ready' : `CD ${skill.cooldown}`) : `${cd} turn${cd === 1 ? '' : 's'}`}</span>
        </button>
      `);

      button.addEventListener('click', () => {
        const mechanic = species.skills[index].mechanic;
        const pool = legalTargets(state, actor, mechanic);
        const picksItself = [
          'self', 'allEnemies', 'allAllies', 'lowestAlly', 'lowestEnemy',
          'fastestEnemy', 'strongestEnemy', 'fallenAlly',
        ].includes(mechanic.target);

        if (picksItself || pool.length <= 1) {
          pendingSkill = null;
          controller.submit({ unitId: actor.id, skill: index, targetId: pool[0]?.id ?? null });
          return;
        }
        // Toggle: clicking the armed skill again cancels target picking.
        pendingSkill = pendingSkill === index ? null : index;
        render();
      });

      bar.appendChild(button);
    }
  }

  function renderLog(state: BattleState): void {
    for (let i = renderedLog; i < state.log.length; i++) {
      const entry = state.log[i]!;
      logList.appendChild(el(`<li class="combat-log__line">${escapeHtml(entry.text)}</li>`));
    }
    renderedLog = state.log.length;
    logList.scrollTop = logList.scrollHeight;
  }

  controller.subscribe(render);
  document.body.appendChild(root);
  render();

  void controller.finished().then((result) => {
    showOutcome(root, result, () => {
      controller.dispose();
      root.remove();
      onExit(result);
    });
  });
}

function opposite(side: Side): Side {
  return side === 'a' ? 'b' : 'a';
}

function showOutcome(
  root: HTMLElement,
  result: { won: boolean | null; reason: string },
  onClose: () => void,
): void {
  const title = result.won === true ? 'Victory' : result.won === false ? 'Defeat' : 'No result';
  const overlay = el(`
    <div class="outcome outcome--${result.won === true ? 'win' : result.won === false ? 'loss' : 'none'}">
      <div class="outcome__card">
        <h2 class="outcome__title">${escapeHtml(title)}</h2>
        <p class="outcome__reason">${escapeHtml(result.reason)}</p>
        <div class="outcome__reward"></div>
        <button class="btn btn--primary" type="button">Back to the clearing</button>
      </div>
    </div>
  `);
  qs(overlay, 'button').addEventListener('click', onClose);
  root.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('is-open'));
}

/** Adds a line to the outcome card — used to announce an egg drop. */
export function announceReward(text: string): void {
  const slot = document.querySelector('.outcome__reward');
  if (slot) slot.appendChild(el(`<p class="outcome__reward-line">${escapeHtml(text)}</p>`));
}

// ── controllers ───────────────────────────────────────────────────────────────

/** Local battle against the AI. */
export function skirmishController(myTeam: TeamMember[], foeTeam: TeamMember[], seed: number): BattleController {
  let state = createBattle(myTeam, foeTeam, seed);
  const listeners: (() => void)[] = [];
  let settle: ((r: { won: boolean | null; reason: string }) => void) | null = null;
  const done = new Promise<{ won: boolean | null; reason: string }>((resolve) => {
    settle = resolve;
  });
  let timer = 0;
  let disposed = false;

  const notify = () => listeners.forEach((l) => l());

  function check(): void {
    if (!state.winner) return;
    const won = state.winner === 'draw' ? null : state.winner === 'a';
    settle?.({
      won,
      reason: won === null
        ? 'A draw — both teams still standing when time ran out.'
        : won
          ? 'You cleared the skirmish.'
          : 'Your team went down.',
    });
  }

  /** Give the AI a beat so the player can read what happened. */
  function maybeAiTurn(): void {
    if (disposed || state.winner) return;
    const actor = activeUnit(state);
    if (!actor || actor.side === 'a') return;
    timer = window.setTimeout(() => {
      if (disposed || state.winner) return;
      const move = chooseMove(state);
      if (move) state = applyMove(state, move);
      notify();
      check();
      maybeAiTurn();
    }, 700);
  }

  maybeAiTurn();

  return {
    mySide: 'a',
    opponentName: 'Wild swarm',
    state: () => state,
    isMyTurn: () => activeUnit(state)?.side === 'a' && !state.winner,
    submit(move) {
      if (activeUnit(state)?.side !== 'a' || state.winner) return;
      state = applyMove(state, move);
      notify();
      check();
      maybeAiTurn();
    },
    resign() {
      settle?.({ won: false, reason: 'You withdrew from the skirmish.' });
    },
    subscribe(listener) {
      listeners.push(listener);
    },
    finished: () => done,
    dispose() {
      disposed = true;
      clearTimeout(timer);
    },
  };
}
