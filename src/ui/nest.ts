/** The Nest: every insect the player owns, with its stats and kit. */

import { backend, BackendError, type GameState, type OwnedInsect } from '../backend';
import { BIOME_LABEL, getSpecies, RARITY_COLOR, RARITY_ORDER, ROLE_LABEL, type Role } from '../content/species';
import { el, escapeHtml, qs } from './dom';
import { openPanel, toast } from './panel';
import { creatureVisual } from './creature';

type SortKey = 'rarity' | 'level' | 'newest' | 'name';

export function openNest(state: GameState, refresh: () => Promise<void>): void {
  const panel = openPanel({
    title: 'Nest',
    subtitle: `${state.nest.length} ${state.nest.length === 1 ? 'insect' : 'insects'} in your colony`,
    wide: true,
  });

  let sort: SortKey = 'rarity';
  let roleFilter: Role | 'all' = 'all';

  const body = el(`
    <div class="nest">
      <div class="nest__bar">
        <div class="chips chips--role"></div>
        <label class="select">
          <span class="select__label">Sort</span>
          <select class="select__input">
            <option value="rarity">Rarity</option>
            <option value="level">Level</option>
            <option value="newest">Newest</option>
            <option value="name">Name</option>
          </select>
        </label>
      </div>
      <div class="roster"></div>
    </div>
  `);

  const chips = qs(body, '.chips--role');
  const roles: (Role | 'all')[] = ['all', 'striker', 'bulwark', 'controller', 'tender'];
  for (const r of roles) {
    const chip = el(
      `<button class="chip" type="button">${escapeHtml(r === 'all' ? 'All' : ROLE_LABEL[r])}</button>`,
    );
    chip.addEventListener('click', () => {
      roleFilter = r;
      for (const c of chips.children) c.classList.toggle('is-active', c === chip);
      renderRoster();
    });
    chips.appendChild(chip);
  }
  chips.firstElementChild?.classList.add('is-active');

  qs<HTMLSelectElement>(body, '.select__input').addEventListener('change', (e) => {
    sort = (e.target as HTMLSelectElement).value as SortKey;
    renderRoster();
  });

  const roster = qs(body, '.roster');

  function renderRoster(): void {
    const items = state.nest
      .filter((i) => roleFilter === 'all' || getSpecies(i.speciesId).role === roleFilter)
      .sort(comparator(sort));

    roster.replaceChildren();
    if (items.length === 0) {
      roster.appendChild(
        el(`<p class="empty">Nothing here yet. Set a clutch in the Hatchery and come back.</p>`),
      );
      return;
    }
    for (const insect of items) roster.appendChild(card(insect));
  }

  function card(insect: OwnedInsect): HTMLElement {
    const species = getSpecies(insect.speciesId);
    const node = el(`
      <button class="crawly" type="button" style="--rarity:${RARITY_COLOR[species.rarity]}">
        <span class="crawly__art">${creatureVisual(species, { context: 'grid' })}</span>
        <span class="crawly__level">${insect.level}</span>
        <span class="crawly__name">${escapeHtml(insect.nickname ?? species.name)}</span>
        <span class="crawly__role">${escapeHtml(ROLE_LABEL[species.role])}</span>
        <span class="crawly__pips">${'<i></i>'.repeat(insect.tier)}</span>
      </button>
    `);
    node.addEventListener('click', () => openDetail(insect, refresh, () => {
      panel.setSubtitle(`${state.nest.length} ${state.nest.length === 1 ? 'insect' : 'insects'} in your colony`);
      renderRoster();
    }));
    return node;
  }

  renderRoster();
  panel.body.appendChild(body);
}

function comparator(sort: SortKey): (a: OwnedInsect, b: OwnedInsect) => number {
  switch (sort) {
    case 'level':
      return (a, b) => b.level - a.level || b.tier - a.tier;
    case 'newest':
      return (a, b) => b.acquiredAt - a.acquiredAt;
    case 'name':
      return (a, b) =>
        (a.nickname ?? getSpecies(a.speciesId).name).localeCompare(b.nickname ?? getSpecies(b.speciesId).name);
    case 'rarity':
    default:
      return (a, b) => {
        const ra = RARITY_ORDER.indexOf(getSpecies(a.speciesId).rarity);
        const rb = RARITY_ORDER.indexOf(getSpecies(b.speciesId).rarity);
        return rb - ra || b.level - a.level;
      };
  }
}

function openDetail(insect: OwnedInsect, refresh: () => Promise<void>, onChanged: () => void): void {
  const species = getSpecies(insect.speciesId);
  const detail = openPanel({ title: insect.nickname ?? species.name, subtitle: species.latin });

  const body = el(`
    <div class="detail" style="--rarity:${RARITY_COLOR[species.rarity]}">
      <div class="detail__hero">
        <div class="detail__art">${creatureVisual(species, { context: 'detail' })}</div>
        <div class="detail__meta">
          <p class="detail__tags">
            <span class="tag tag--rarity">${species.rarity}</span>
            <span class="tag">${escapeHtml(ROLE_LABEL[species.role])}</span>
            <span class="tag">${escapeHtml(BIOME_LABEL[species.biome])}</span>
          </p>
          <dl class="stats">
            <div><dt>HP</dt><dd>${species.stats.hp}</dd></div>
            <div><dt>ATK</dt><dd>${species.stats.atk}</dd></div>
            <div><dt>DEF</dt><dd>${species.stats.def}</dd></div>
            <div><dt>SPD</dt><dd>${species.stats.spd}</dd></div>
          </dl>
          <p class="detail__level">Level ${insect.level} · Tier ${insect.tier}</p>
        </div>
      </div>

      <section class="detail__section">
        <h3 class="detail__heading">In the real world</h3>
        <p class="detail__fact">${escapeHtml(species.fact)}</p>
      </section>

      <section class="detail__section">
        <h3 class="detail__heading">Kit</h3>
        <ul class="skills">
          ${species.skills
            .map(
              (s) => `
            <li class="skill">
              <span class="skill__name">${escapeHtml(s.name)}</span>
              <span class="skill__cd">${s.cooldown === 0 ? 'every turn' : `${s.cooldown} turn cooldown`}</span>
              <span class="skill__text">${escapeHtml(s.text)}</span>
            </li>`,
            )
            .join('')}
        </ul>
      </section>

      <section class="detail__section">
        <h3 class="detail__heading">Nickname</h3>
        <form class="rename">
          <input class="field__input" name="nickname" type="text" maxlength="24"
                 placeholder="${escapeHtml(species.name)}" value="${escapeHtml(insect.nickname ?? '')}" />
          <button class="btn btn--ghost" type="submit">Save</button>
        </form>
      </section>
    </div>
  `);

  qs<HTMLFormElement>(body, '.rename').addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = qs<HTMLInputElement>(body, 'input[name="nickname"]');
    try {
      await backend.renameInsect(insect.id, input.value);
      await refresh();
      onChanged();
      detail.close();
      toast('Renamed.', 'good');
    } catch (err) {
      toast(err instanceof BackendError ? err.message : 'Could not rename.', 'error');
    }
  });

  detail.body.appendChild(body);
}
