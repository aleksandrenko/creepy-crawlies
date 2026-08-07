/**
 * The persistent overlay: profile block top-left, action cluster bottom-right.
 * Layout mirrors the genre convention so it reads as a game immediately.
 */

import { xpForLevel, type GameState } from '../backend';
import { el, escapeHtml, qs } from './dom';

export interface HudCallbacks {
  onBattle(): void;
  onCodex(): void;
  onProfile(): void;
}

export class Hud {
  readonly root: HTMLElement;

  constructor(host: HTMLElement, cb: HudCallbacks) {
    this.root = el(`
      <div class="hud">
        <button class="profile" type="button">
          <span class="profile__avatar">
            <span class="profile__level">1</span>
          </span>
          <span class="profile__text">
            <span class="profile__handle"></span>
            <span class="profile__bar"><span class="profile__fill"></span></span>
            <span class="profile__xp"></span>
          </span>
        </button>

        <div class="purse">
          <span class="purse__icon" aria-hidden="true"></span>
          <span class="purse__amount">0</span>
          <span class="purse__label">motes</span>
        </div>

        <div class="actions">
          <button class="action action--codex" type="button" aria-label="Codex">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 4.6c0-.7.5-1.2 1.2-1.2H10c1.1 0 2 .9 2 2v14c0-1.1-.9-2-2-2H5.2c-.7 0-1.2-.5-1.2-1.2V4.6Z"/>
              <path d="M20 4.6c0-.7-.5-1.2-1.2-1.2H14c-1.1 0-2 .9-2 2v14c0-1.1.9-2 2-2h4.8c.7 0 1.2-.5 1.2-1.2V4.6Z"/>
              <path d="M12 7.4v11.9"/>
            </svg>
            <span class="action__caption">Codex</span>
            <span class="action__badge" hidden></span>
          </button>

          <button class="action action--battle" type="button">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4.5 3.8 12 11.3l7.5-7.5 1.7 1.7-7.5 7.5 7.5 7.5-1.7 1.7L12 14.7l-7.5 7.5-1.7-1.7 7.5-7.5-7.5-7.5 1.7-1.7Z"/>
            </svg>
            <span class="action__caption">Battle</span>
          </button>
        </div>
      </div>
    `);

    qs(this.root, '.profile').addEventListener('click', cb.onProfile);
    qs(this.root, '.action--battle').addEventListener('click', cb.onBattle);
    qs(this.root, '.action--codex').addEventListener('click', cb.onCodex);

    host.appendChild(this.root);
  }

  update(state: GameState, totalSpecies: number): void {
    const { profile } = state;
    const need = xpForLevel(profile.level);
    const pct = Math.min(100, Math.round((profile.xp / need) * 100));

    qs(this.root, '.profile__level').textContent = String(profile.level);
    qs(this.root, '.profile__handle').textContent = profile.handle;
    qs(this.root, '.profile__fill').style.width = `${pct}%`;
    qs(this.root, '.profile__xp').textContent = `${profile.xp} / ${need} XP`;
    qs(this.root, '.purse__amount').textContent = profile.motes.toLocaleString('en-GB');

    const badge = qs(this.root, '.action__badge');
    const discovered = state.discovered.length;
    badge.hidden = false;
    badge.textContent = `${discovered}/${totalSpecies}`;
    badge.title = `${discovered} of ${totalSpecies} species discovered`;
  }

  /** Flash the level pip — used after a level-up. */
  celebrate(text: string): void {
    const pop = el(`<span class="level-pop">${escapeHtml(text)}</span>`);
    qs(this.root, '.profile__avatar').appendChild(pop);
    setTimeout(() => pop.remove(), 2400);
  }
}
