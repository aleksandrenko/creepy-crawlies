/**
 * The Hatchery: the eggs you are holding, and a button to crack each one.
 *
 * No timers and no waiting — an egg is already for a known species, and hatching is
 * immediate. The random part of the loop is which egg a battle drops, not the wait.
 */

import { backend, BackendError, EGG_SOURCE_LABEL, type Egg, type GameState } from '../backend';
import { BIOME_LABEL, getSpecies, RARITY_COLOR, ROLE_LABEL } from '../content/species';
import { el, escapeHtml, qs } from './dom';
import { openPanel, toast } from './panel';
import { insectSvg } from './silhouette';

export function openHatchery(state: GameState, refresh: () => Promise<void>): void {
  const panel = openPanel({
    title: 'Hatchery',
    subtitle: subtitleFor(state),
    wide: true,
  });

  const body = el(`<div class="hatchery"><div class="eggs"></div></div>`);
  const grid = qs(body, '.eggs');

  function render(): void {
    panel.setSubtitle(subtitleFor(state));
    grid.replaceChildren();

    if (state.eggs.length === 0) {
      grid.appendChild(
        el(`
          <div class="empty-state">
            <div class="empty-state__hollow" aria-hidden="true"></div>
            <p class="empty-state__title">No eggs in the hollows</p>
            <p class="empty-state__text">Eggs drop from battles. Which species you get is the luck of it.</p>
          </div>
        `),
      );
      return;
    }

    for (const egg of [...state.eggs].sort((a, b) => b.acquiredAt - a.acquiredAt)) {
      grid.appendChild(card(egg));
    }
  }

  function card(egg: Egg): HTMLElement {
    const species = getSpecies(egg.speciesId);
    const known = state.discovered.includes(species.id);

    const node = el(`
      <div class="egg-card" style="--rarity:${RARITY_COLOR[species.rarity]}">
        <div class="egg-card__egg" aria-hidden="true">
          <span class="egg-card__shine"></span>
          <span class="egg-card__inside">${insectSvg(species.body, species.palette)}</span>
        </div>
        <p class="egg-card__name">${escapeHtml(species.name)}</p>
        <p class="egg-card__tags">
          <span class="tag tag--rarity">${escapeHtml(species.rarity)}</span>
          <span class="tag">${escapeHtml(ROLE_LABEL[species.role])}</span>
        </p>
        <p class="egg-card__source">${escapeHtml(EGG_SOURCE_LABEL[egg.source])}</p>
        ${known ? '' : '<p class="egg-card__new">New to your Codex</p>'}
        <button class="btn btn--primary egg-card__hatch" type="button">Hatch</button>
      </div>
    `);

    qs(node, '.egg-card__hatch').addEventListener('click', async () => {
      try {
        const result = await backend.hatch(egg.id);
        await refresh();
        render();
        showHatchReveal(result.insect.speciesId, result.firstTime);
      } catch (err) {
        toast(err instanceof BackendError ? err.message : 'Could not hatch that egg.', 'error');
      }
    });

    return node;
  }

  render();
  panel.body.appendChild(body);
}

function subtitleFor(state: GameState): string {
  const n = state.eggs.length;
  if (n === 0) return 'Nothing waiting to hatch';
  return `${n} ${n === 1 ? 'egg' : 'eggs'} ready — hatch whenever you like`;
}

/** The payoff moment: what came out of the egg. */
function showHatchReveal(speciesId: string, firstTime: boolean): void {
  const species = getSpecies(speciesId);
  const reveal = openPanel({
    title: firstTime ? 'New species discovered' : 'Hatched',
    subtitle: species.latin,
  });
  reveal.body.appendChild(
    el(`
      <div class="reveal" style="--rarity:${RARITY_COLOR[species.rarity]}">
        <div class="reveal__art">${insectSvg(species.body, species.palette)}</div>
        <h3 class="reveal__name">${escapeHtml(species.name)}</h3>
        <p class="reveal__tags">
          <span class="tag tag--rarity">${escapeHtml(species.rarity)}</span>
          <span class="tag">${escapeHtml(ROLE_LABEL[species.role])}</span>
          <span class="tag">${escapeHtml(BIOME_LABEL[species.biome])}</span>
        </p>
        <p class="reveal__fact">${escapeHtml(species.fact)}</p>
      </div>
    `),
  );
}
