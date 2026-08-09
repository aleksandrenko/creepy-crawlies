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
  FLASK_HEAL,
  legalTargets,
  skillReady,
  type FlaskId,
  type BattleState,
  type Move,
  type Side,
  type TeamMember,
  type Unit,
} from '../battle/engine';
import { BattleArena } from '../scene/battleArena';
import { compiled, DEBUFFS, type StatusKind } from '../battle/mechanics';
import { is3dSupported } from './insect3d';
import { getSpecies, RARITY_COLOR } from '../content/species';
import { creatureVisual, creatureView } from './creature';
import { el, escapeHtml, qs } from './dom';
import { ICON_FAMILY, ICON_LABEL, iconFor, iconSvg } from './skillIcon';
import { announceStrike, floatNumber, markActor, showStrike, type StrikeKind } from './strikeFx';

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
  // Two stacked arenas would leave the player looking at one battle while clicking on
  // another. Whatever route got us here, only one may ever be on screen.
  for (const stale of document.querySelectorAll('.arena')) stale.remove();

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

      <div class="stage3d"></div>
      <div class="field field--them"></div>
      <div class="arena__middle">
        <div class="arena__callout" aria-live="polite"></div>
        <div class="arena__banner"></div>
      </div>
      <div class="field field--me"></div>

      <div class="arena__bottom">
        <div class="arena__actions">
          <div class="skills-bar"></div>
          <div class="flasks"></div>
        </div>
        <ol class="combat-log" aria-live="polite"></ol>
      </div>
    </div>
  `);

  const stage3d = qs(root, '.stage3d');
  const them = qs(root, '.field--them');
  const mine = qs(root, '.field--me');

  /*
   * The battle is a 3D scene when WebGL allows it: insects on the ground, walking in to hit
   * each other. The card rows stay as the fallback, and as the only path on a machine that
   * cannot run it.
   */
  let arena: BattleArena | null = null;
  if (is3dSupported()) {
    try {
      arena = new BattleArena(stage3d);
      root.classList.add('is-3d');
    } catch {
      arena = null;
    }
  }
  if (!arena) stage3d.remove();
  const bar = qs(root, '.skills-bar');
  const flaskBar = qs(root, '.flasks');
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
  /** Log entries already animated, so a redraw does not replay old hits. */
  let playedFx = 0;
  /** The arena is populated once; after that only its numbers change. */
  let placed = false;

  function render(): void {
    const state = controller.state();
    if (!state) return;

    roundLabel.textContent = `Round ${state.round}`;
    const actor = activeUnit(state);

    if (arena) {
      if (!placed) {
        placed = true;
        arena.setUnits(
          state.units.map((u) => ({
            id: u.id,
            speciesId: u.speciesId,
            // The player's team always stands nearest the camera, whichever side they are.
            side: u.side === controller.mySide ? 'a' : 'b',
            slot: u.slot,
          })),
        );
      }
      arena.update(
        state.units.map((u) => ({
          id: u.id,
          name: u.name,
          hp: u.hp,
          maxHp: u.maxHp,
          rarity: getSpecies(u.speciesId).rarity,
          statuses: u.statuses.map((st) => ({
            label: STATUS_LABEL[st.kind] ?? st.kind,
            bad: DEBUFFS.has(st.kind),
          })),
        })),
      );
      arena.setActive(state.winner ? null : state.activeUnitId);

      // Highlight what the armed skill may legally hit.
      const armedActor = pendingSkill !== null ? activeUnit(state) : null;
      const legal = armedActor
        ? new Set(
            legalTargets(state, armedActor, compiled(armedActor.speciesId).skills[pendingSkill!].mechanic)
              .map((t) => t.id),
          )
        : new Set<string>();
      for (const label of arena.el.querySelectorAll<HTMLElement>('.arena3d__label')) {
        label.classList.toggle('is-targetable', legal.has(label.dataset.unit ?? ''));
      }
    } else {
      renderSide(them, state, opposite(controller.mySide), state.activeUnitId);
      renderSide(mine, state, controller.mySide, state.activeUnitId);
    }

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
    renderFlasks(state, actor);
    renderLog(state);
    markActor(root, state.activeUnitId);
    playPending(state);
  }

  /**
   * Animates any log entries that appeared since the last redraw.
   *
   * Runs after the cards are rebuilt, because the bolt is measured from where the fighters
   * actually are on screen. Multiple hits in one move are staggered so a five-hit skill
   * reads as five strikes rather than one flash.
   */
  function playPending(state: BattleState): void {
    for (let i = playedFx; i < state.log.length; i++) {
      const entry = state.log[i]!;
      if (!entry.actorId || entry.fx.length === 0) continue;

      const actor = state.units.find((u) => u.id === entry.actorId);
      const first = entry.fx[0]!;
      const victim = state.units.find((u) => u.id === first.unitId);
      const kindOf = (k: string): StrikeKind => (k === 'miss' ? 'hit' : (k as StrikeKind));

      // Name it as well as draw it: the animation carries the drama, the words the detail.
      if (actor && victim) {
        const verb = first.kind === 'heal' ? 'mends' : first.kind === 'buff' ? 'bolsters' : 'strikes';
        const skillName = entry.text.split(' used ')[1]?.split(' · ')[0] ?? '';
        const target = victim.id === actor.id ? 'itself' : victim.name;
        announceStrike(
          root,
          skillName ? `${actor.name} — ${skillName} → ${target}` : `${actor.name} ${verb} ${target}`,
          kindOf(first.kind),
        );
      }

      // Card fallback only: in the arena the pose is part of the choreography.
      if (!arena && actor) {
        const skillIndex = compiled(actor.speciesId).skills.findIndex(
          (sk) => entry.text.includes(sk.name),
        );
        if (skillIndex >= 0) {
          creatureView(actor.id)?.play(iconFor(compiled(actor.speciesId).skills[skillIndex]!.mechanic));
        }
      }

      if (arena && actor) {
        const skillIndex = compiled(actor.speciesId).skills.findIndex((sk) => entry.text.includes(sk.name));
        const clip = skillIndex >= 0
          ? iconFor(compiled(actor.speciesId).skills[skillIndex]!.mechanic)
          : 'strike';
        void arena.playAction(entry.actorId, entry.fx.map((f) => f.unitId), clip);
      }

      entry.fx.forEach((fx, n) => {
        setTimeout(() => {
          const kind = kindOf(fx.kind);
          if (!arena && fx.unitId !== entry.actorId) showStrike(root, entry.actorId!, fx.unitId, kind);
          const label = fx.kind === 'miss'
            ? 'MISS'
            : fx.amount > 0
              ? `${fx.kind === 'heal' ? '+' : '-'}${fx.amount}`
              : fx.kind === 'debuff' ? 'DEBUFF' : 'BUFF';
          floatNumber(arena ? arena.el : root, fx.unitId, label, kind);
        }, n * 220);
      });
    }
    playedFx = state.log.length;
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
           data-unit="${unit.id}" data-rarity="${species.rarity}"
           style="--rarity:${RARITY_COLOR[species.rarity]}">
        <div class="fighter__art">${creatureVisual(species, { context: 'battle', key: unit.id })}</div>
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

      const kind = iconFor(skill.mechanic);
      // The third skill is the unit's big one, and reads as such at a glance.
      const ultimate = index === 2;

      const button = el(`
        <button class="skill-orb${ready ? '' : ' is-cooling'}${pendingSkill === index ? ' is-armed' : ''}${ultimate ? ' skill-orb--ultimate' : ''}"
                type="button" ${ready ? '' : 'disabled'}
                data-family="${ICON_FAMILY[kind]}"
                aria-label="${escapeHtml(`${skill.name}. ${skill.text}`)}">
          <span class="skill-orb__ring" aria-hidden="true"></span>
          ${iconSvg(kind)}
          ${ready ? '' : `<span class="skill-orb__cd">${cd}</span>`}
          <span class="skill-orb__tip" role="tooltip">
            <span class="skill-orb__tip-head">
              <span class="skill-orb__tip-name">${escapeHtml(skill.name)}</span>
              <span class="skill-orb__tip-kind">${escapeHtml(ICON_LABEL[kind])}</span>
            </span>
            <span class="skill-orb__tip-text">${escapeHtml(skill.text)}</span>
            <span class="skill-orb__tip-cd">${
              ready
                ? skill.cooldown === 0
                  ? 'Usable every turn'
                  : `${skill.cooldown}-turn cooldown`
                : `Ready in ${cd} turn${cd === 1 ? '' : 's'}`
            }</span>
          </span>
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

  /**
   * The two once-per-battle flasks. Always visible, so you know they exist and can see at a
   * glance whether they are still available — hiding a spent one would just be confusing.
   */
  function renderFlasks(state: BattleState, actor: Unit | null): void {
    flaskBar.replaceChildren();
    const stock = state.flasks[controller.mySide];
    const usable = !!actor && controller.isMyTurn() && !state.winner;

    const flasks: { id: FlaskId; name: string; blurb: string }[] = [
      { id: 'heal', name: 'Nectar Flask', blurb: `Heals your whole team ${Math.round(FLASK_HEAL * 100)}%` },
      { id: 'cleanse', name: 'Clearwater Flask', blurb: 'Clears every debuff from your team' },
    ];

    for (const flask of flasks) {
      const left = stock[flask.id];
      const button = el(`
        <button class="flask flask--${flask.id}${left ? '' : ' is-spent'}" type="button"
                ${left && usable ? '' : 'disabled'}
                title="${escapeHtml(`${flask.name} — ${flask.blurb}. Once per battle, and it costs this unit's turn.`)}">
          <span class="flask__glass" aria-hidden="true"></span>
          <span class="flask__name">${escapeHtml(flask.name)}</span>
          <span class="flask__state">${left ? 'once per battle' : 'used'}</span>
        </button>
      `);
      if (left && usable && actor) {
        button.addEventListener('click', () => {
          pendingSkill = null;
          controller.submit({ unitId: actor.id, skill: 0, targetId: null, flask: flask.id });
        });
      }
      flaskBar.appendChild(button);
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
  if (arena) wireArenaTargeting();

  /**
   * In the arena there are no cards to click, so the floating labels are the hit targets.
   * Rebuilt on every render would be wasteful; instead one delegated listener reads the
   * pending skill at click time.
   */
  function wireArenaTargeting(): void {
    arena!.el.addEventListener('click', (e) => {
      const label = (e.target as HTMLElement).closest<HTMLElement>('.arena3d__label');
      const unitId = label?.dataset.unit;
      const state = controller.state();
      if (!unitId || !state || pendingSkill === null) return;
      const actor = activeUnit(state);
      if (!actor || !controller.isMyTurn()) return;
      const mechanic = compiled(actor.speciesId).skills[pendingSkill].mechanic;
      if (!legalTargets(state, actor, mechanic).some((t) => t.id === unitId)) return;
      const skill = pendingSkill;
      pendingSkill = null;
      controller.submit({ unitId: actor.id, skill, targetId: unitId });
    });
  }

  void controller.finished().then((result) => {
    showOutcome(root, result, () => {
      controller.dispose();
      arena?.dispose();
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
      // Long enough for the strike animation to finish before the next one starts.
    }, 1500);
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
