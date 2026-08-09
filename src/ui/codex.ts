/**
 * The Codex: every species in the game, discovered or not.
 *
 * Undiscovered entries keep their silhouette and rarity but hide the name, stats and
 * kit — enough to want them, not enough to plan around them.
 */

import type { GameState } from '../backend';
import {
  BIOME_LABEL,
  RARITY_COLOR,
  RARITY_ORDER,
  ROLE_LABEL,
  SPECIES,
  type Rarity,
  type Species,
} from '../content/species';
import { paintSpeciesCard } from './cardArt';
import { creatureVisual } from './creature';
import { photoCredit } from './photos';
import { el, escapeHtml, qs } from './dom';
import { CLIP_DURATION, clipForSkill, createLivingCard, type LivingCard } from './livingCard';
import { openPanel } from './panel';
import { openStylePicker } from './stylePicker';

export function openCodex(state: GameState): void {
  const discovered = new Set(state.discovered);
  const panel = openPanel({
    title: 'Codex',
    subtitle: `${discovered.size} of ${SPECIES.length} species discovered`,
    wide: true,
  });

  let filter: Rarity | 'all' = 'all';
  let onlyMissing = false;

  const body = el(`
    <div class="codex">
      <div class="codex__bar">
        <div class="chips chips--rarity"></div>
        <button class="btn btn--ghost codex__styles" type="button">Model style…</button>
        <label class="toggle">
          <input class="toggle__input" type="checkbox" />
          <span class="toggle__label">Only undiscovered</span>
        </label>
      </div>
      <div class="codex__grid"></div>
    </div>
  `);

  const chips = qs(body, '.chips--rarity');
  for (const r of ['all', ...RARITY_ORDER] as (Rarity | 'all')[]) {
    const chip = el(
      `<button class="chip" type="button"${r === 'all' ? '' : ` style="--chip:${RARITY_COLOR[r]}"`}>` +
        `${escapeHtml(r === 'all' ? 'All' : r)}</button>`,
    );
    chip.addEventListener('click', () => {
      filter = r;
      for (const c of chips.children) c.classList.toggle('is-active', c === chip);
      render();
    });
    chips.appendChild(chip);
  }
  chips.firstElementChild?.classList.add('is-active');

  qs(body, '.codex__styles').addEventListener('click', () => openStylePicker());

  qs<HTMLInputElement>(body, '.toggle__input').addEventListener('change', (e) => {
    onlyMissing = (e.target as HTMLInputElement).checked;
    render();
  });

  const grid = qs(body, '.codex__grid');

  function render(): void {
    const items = SPECIES.filter((s) => filter === 'all' || s.rarity === filter)
      .filter((s) => !onlyMissing || !discovered.has(s.id))
      .sort(
        (a, b) =>
          RARITY_ORDER.indexOf(b.rarity) - RARITY_ORDER.indexOf(a.rarity) || a.name.localeCompare(b.name),
      );

    grid.replaceChildren();
    if (items.length === 0) {
      grid.appendChild(el('<p class="empty">Nothing matches that filter.</p>'));
      return;
    }
    for (const species of items) grid.appendChild(entry(species, discovered.has(species.id)));
  }

  function entry(species: Species, known: boolean): HTMLElement {
    const node = el(`
      <button class="codex-entry${known ? '' : ' is-locked'}" type="button"
              style="--rarity:${RARITY_COLOR[species.rarity]}">
        <span class="codex-entry__art">${creatureVisual(species, { silhouette: !known, context: 'grid' })}</span>
        <span class="codex-entry__name">${known ? escapeHtml(species.name) : 'Undiscovered'}</span>
        <span class="codex-entry__sub">${known ? escapeHtml(ROLE_LABEL[species.role]) : escapeHtml(BIOME_LABEL[species.biome])}</span>
        <span class="codex-entry__rarity">${escapeHtml(species.rarity)}</span>
      </button>
    `);
    node.addEventListener('click', () => openEntry(species, known));
    return node;
  }

  render();
  panel.body.appendChild(body);
}

/**
 * Swap the static SVG for the animated card once its textures are painted.
 *
 * Async and best-effort on purpose: the sheet renders instantly with the plain SVG, and if
 * anything about the canvas or WebGL path fails the entry simply stays static.
 */
function mountLivingCard(host: HTMLElement, species: Species, silhouette: boolean): Promise<LivingCard | null> {
  return paintSpeciesCard(species, { silhouette })
    .then(({ art, depth }) => {
      // Clips are authored for a full-size card; this one is a 228px thumbnail.
      const card = createLivingCard(art, depth, { motionScale: 228 / 700 });
      host.classList.add('detail__art--living');
      host.replaceChildren(card.el);
      return card;
    })
    .catch((err: unknown) => {
      console.warn('Living card unavailable, keeping static art', err);
      return null;
    });
}

function openEntry(species: Species, known: boolean): void {
  let card: LivingCard | null = null;
  const sheet = openPanel({
    title: known ? species.name : 'Undiscovered species',
    subtitle: known ? species.latin : `Found in the ${BIOME_LABEL[species.biome]}`,
    onClose: () => card?.destroy(),
  });

  if (!known) {
    const locked = el(`
        <div class="detail detail--locked" style="--rarity:${RARITY_COLOR[species.rarity]}">
          <div class="detail__art">${creatureVisual(species, { silhouette: true, context: 'detail' })}</div>
          <p class="detail__tags">
            <span class="tag tag--rarity">${escapeHtml(species.rarity)}</span>
            <span class="tag">${escapeHtml(BIOME_LABEL[species.biome])}</span>
          </p>
          <p class="empty">Hatch one from a ${escapeHtml(BIOME_LABEL[species.biome])} clutch to fill in this entry.</p>
        </div>
      `);
    sheet.body.appendChild(locked);
    void mountLivingCard(qs(locked, '.detail__art'), species, true).then((c) => {
      card = c;
    });
    return;
  }

  const detail = el(`
      <div class="detail" style="--rarity:${RARITY_COLOR[species.rarity]}">
        <div class="detail__hero">
          <div class="detail__art">${creatureVisual(species, { context: 'detail' })}</div>
          <div class="detail__meta">
            <p class="detail__tags">
              <span class="tag tag--rarity">${escapeHtml(species.rarity)}</span>
              <span class="tag">${escapeHtml(ROLE_LABEL[species.role])}</span>
              <span class="tag">${escapeHtml(BIOME_LABEL[species.biome])}</span>
            </p>
            <dl class="stats">
              <div><dt>HP</dt><dd>${species.stats.hp}</dd></div>
              <div><dt>ATK</dt><dd>${species.stats.atk}</dd></div>
              <div><dt>DEF</dt><dd>${species.stats.def}</dd></div>
              <div><dt>SPD</dt><dd>${species.stats.spd}</dd></div>
            </dl>
          </div>
        </div>
        <section class="detail__section">
          <h3 class="detail__heading">In the real world</h3>
          <p class="detail__fact">${escapeHtml(species.fact)}</p>
          ${creditMarkup(species.id)}
        </section>
        <section class="detail__section">
          <h3 class="detail__heading">Kit</h3>
          <ul class="skills">
            ${species.skills
              .map(
                (s) => `
              <li>
                <button class="skill skill--playable" type="button" title="Play this ability">
                  <span class="skill__name">${escapeHtml(s.name)}</span>
                  <span class="skill__cd">${s.cooldown === 0 ? 'every turn' : `${s.cooldown} turn cooldown`}</span>
                  <span class="skill__text">${escapeHtml(s.text)}</span>
                </button>
              </li>`,
              )
              .join('')}
          </ul>
        </section>
      </div>
    `);

  sheet.body.appendChild(detail);
  void mountLivingCard(qs(detail, '.detail__art'), species, false).then((c) => {
    card = c;
  });

  // Each skill drives the card above it. The clip is read off the skill's own rules text,
  // so the catalogue stays free of presentation data.
  const clips = species.skills.map((s) => clipForSkill(s.text, s.name));
  const buttons = detail.querySelectorAll<HTMLButtonElement>('.skill--playable');
  buttons.forEach((button, i) => {
    const clip = clips[i];
    if (!clip) return;
    button.addEventListener('click', () => {
      if (!card) return;
      card.play(clip);
      for (const other of buttons) other.classList.remove('is-playing');
      button.classList.add('is-playing');
      window.setTimeout(() => button.classList.remove('is-playing'), CLIP_DURATION[clip] * 1000);
    });
  });
}

/**
 * The photo's attribution line.
 *
 * Not optional: the photographs are CC BY or CC BY-SA, which require naming the author and
 * the licence. Species drawn procedurally have nothing to credit and render nothing.
 */
function creditMarkup(speciesId: string): string {
  const c = photoCredit(speciesId);
  if (!c) return '';
  const licence = c.licenseUrl
    ? `<a href="${escapeHtml(c.licenseUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(c.license)}</a>`
    : escapeHtml(c.license);
  const source = c.source
    ? ` · <a href="${escapeHtml(c.source)}" target="_blank" rel="noopener noreferrer">source</a>`
    : '';
  return `<p class="photo-credit">Photograph by ${escapeHtml(c.author)} — ${licence}${source}</p>`;
}
