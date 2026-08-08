import './ui/styles.css';

import { backend, HATCHERY_HOLLOWS, type GameState } from './backend';
import { SPECIES } from './content/species';
import { Bastion, type BuildingId } from './scene/bastion';
import { openBattleMenu, openProfile } from './ui/battle';
import { openCodex } from './ui/codex';
import { el, escapeHtml, qs } from './ui/dom';
import { openHatchery } from './ui/hatchery';
import { Hud } from './ui/hud';
import { installCreatureHydration, refreshCreatures } from './ui/creature';
import { initDisplayMode, onDisplayModeChange } from './ui/displayMode';
import { openNest } from './ui/nest';

const app = qs(document, '#app');

/**
 * Puts boot failures on the screen.
 *
 * Without this a thrown error during startup leaves a black page and the only way to find
 * out why is the devtools console, which is not always available to whoever is looking.
 */
function showFatal(what: string, error: unknown): void {
  const detail = error instanceof Error ? `${error.name}: ${error.message}\n\n${error.stack ?? ''}` : String(error);
  const existing = document.querySelector('.fatal');
  if (existing) {
    existing.appendChild(el(`<pre class="fatal__more">${escapeHtml(`${what}\n${detail}`)}</pre>`));
    return;
  }
  document.body.appendChild(
    el(`
      <div class="fatal">
        <h1 class="fatal__title">Creepy Crawlies could not start</h1>
        <p class="fatal__hint">${escapeHtml(what)}</p>
        <pre class="fatal__more">${escapeHtml(detail)}</pre>
      </div>
    `),
  );
}

window.addEventListener('error', (e) => showFatal('An error was thrown.', e.error ?? e.message));
window.addEventListener('unhandledrejection', (e) => showFatal('A promise was rejected.', e.reason));

/** One live game session: the scene, the HUD, and the state they both read. */
class Game {
  private readonly bastion: Bastion;
  private readonly hud: Hud;
  private state!: GameState;
  private lastLevel = 0;

  private constructor(state: GameState) {
    this.state = state;
    this.lastLevel = state.profile.level;

    const stage = document.createElement('div');
    stage.className = 'stage';
    app.appendChild(stage);

    this.bastion = new Bastion(stage);
    this.bastion.onOpen = (id) => this.openBuilding(id);

    this.hud = new Hud(stage, {
      onBattle: () => openBattleMenu(this.state, () => this.refresh()),
      onCodex: () => openCodex(this.state),
      onProfile: () => openProfile(this.state, () => void this.reload()),
    });

    this.syncView();
  }

  static async start(): Promise<Game> {
    return new Game(await backend.loadState());
  }

  private openBuilding(id: BuildingId): void {
    const refresh = () => this.refresh();
    if (id === 'hatchery') openHatchery(this.state, refresh);
    else openNest(this.state, refresh);
  }

  /** Pull state back from the backend after anything that mutates it. */
  private async refresh(): Promise<void> {
    this.state = await backend.loadState();
    this.syncView();
  }

  private syncView(): void {
    this.hud.update(this.state, SPECIES.length);
    // The hollows only have room to show a few; the player may hold more than that.
    this.bastion.setEggCount(Math.min(HATCHERY_HOLLOWS, this.state.eggs.length));

    const eggs = this.state.eggs.length;
    this.bastion.setBadge('hatchery', eggs > 0 ? `${eggs} to hatch` : null, eggs > 0);
    this.bastion.setBadge('nest', String(this.state.nest.length));

    if (this.state.profile.level > this.lastLevel) {
      this.hud.celebrate(`Level ${this.state.profile.level}`);
      this.lastLevel = this.state.profile.level;
    }
  }

  /** With login off there is nothing to sign out to, so this just reloads the colony. */
  private async reload(): Promise<void> {
    this.bastion.dispose();
    this.hud.root.remove();
    app.replaceChildren();
    await main();
  }
}

/**
 * Login is switched off for now: the game opens straight into whatever colony this
 * browser is holding, creating one on first run. `ui/auth.ts` is still on disk and
 * unwired, ready to come back once there is a server to keep accounts on.
 */
async function main(): Promise<void> {
  initDisplayMode();
  installCreatureHydration();
  // Flipping the view redraws whatever is already on screen, panels included.
  onDisplayModeChange(() => refreshCreatures());

  try {
    await backend.ensureLocalPlayer();
  } catch (err) {
    showFatal('Could not read or create the colony stored in this browser.', err);
    return;
  }

  try {
    await Game.start();
  } catch (err) {
    showFatal('The colony loaded but the clearing failed to build.', err);
  }
}

void main();
