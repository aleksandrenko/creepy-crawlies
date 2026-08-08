/** Pick exactly three insects from the Nest to take into a battle. */

import type { GameState, OwnedInsect } from '../backend';
import type { TeamMember } from '../battle/engine';
import { getSpecies, RARITY_COLOR, ROLE_LABEL } from '../content/species';
import { creatureVisual } from './creature';
import { el, escapeHtml, qs } from './dom';
import { openPanel } from './panel';

const TEAM_SIZE = 3;

export function pickTeam(
  state: GameState,
  opts: { title: string; confirmLabel: string },
  onReady: (team: TeamMember[], close: () => void) => void,
): void {
  const panel = openPanel({
    title: opts.title,
    subtitle: `Choose ${TEAM_SIZE} from your Nest`,
    wide: true,
  });

  const chosen: string[] = [];

  const body = el(`
    <div class="picker">
      <div class="picker__slots"></div>
      <div class="roster picker__roster"></div>
      <button class="btn btn--primary picker__go" type="button" disabled>${escapeHtml(opts.confirmLabel)}</button>
    </div>
  `);

  const slots = qs(body, '.picker__slots');
  const roster = qs(body, '.picker__roster');
  const go = qs<HTMLButtonElement>(body, '.picker__go');

  function renderSlots(): void {
    slots.replaceChildren();
    for (let i = 0; i < TEAM_SIZE; i++) {
      const id = chosen[i];
      const insect = id ? state.nest.find((n) => n.id === id) : undefined;
      if (!insect) {
        slots.appendChild(el(`<div class="picker__slot picker__slot--empty">${i + 1}</div>`));
        continue;
      }
      const species = getSpecies(insect.speciesId);
      const node = el(`
        <button class="picker__slot" type="button" style="--rarity:${RARITY_COLOR[species.rarity]}"
                title="Remove ${escapeHtml(insect.nickname ?? species.name)}">
          <span class="picker__slot-art">${creatureVisual(species, { context: 'grid' })}</span>
          <span class="picker__slot-name">${escapeHtml(insect.nickname ?? species.name)}</span>
        </button>
      `);
      node.addEventListener('click', () => {
        chosen.splice(chosen.indexOf(insect.id), 1);
        update();
      });
      slots.appendChild(node);
    }
  }

  function renderRoster(): void {
    roster.replaceChildren();
    if (state.nest.length < TEAM_SIZE) {
      roster.appendChild(
        el(
          `<p class="empty">A team needs ${TEAM_SIZE} insects and you have ${state.nest.length}. ` +
            `Hatch more in the Hatchery.</p>`,
        ),
      );
      return;
    }
    for (const insect of [...state.nest].sort(byPower)) {
      roster.appendChild(card(insect));
    }
  }

  function card(insect: OwnedInsect): HTMLElement {
    const species = getSpecies(insect.speciesId);
    const picked = chosen.includes(insect.id);
    const node = el(`
      <button class="crawly${picked ? ' is-picked' : ''}" type="button"
              style="--rarity:${RARITY_COLOR[species.rarity]}">
        <span class="crawly__art">${creatureVisual(species, { context: 'grid' })}</span>
        <span class="crawly__level">${insect.level}</span>
        <span class="crawly__name">${escapeHtml(insect.nickname ?? species.name)}</span>
        <span class="crawly__role">${escapeHtml(ROLE_LABEL[species.role])}</span>
      </button>
    `);
    node.addEventListener('click', () => {
      if (picked) chosen.splice(chosen.indexOf(insect.id), 1);
      else if (chosen.length < TEAM_SIZE) chosen.push(insect.id);
      update();
    });
    return node;
  }

  function update(): void {
    renderSlots();
    renderRoster();
    go.disabled = chosen.length !== TEAM_SIZE;
    panel.setSubtitle(
      chosen.length === TEAM_SIZE
        ? 'Team ready'
        : `Choose ${TEAM_SIZE - chosen.length} more from your Nest`,
    );
  }

  go.addEventListener('click', () => {
    const team: TeamMember[] = chosen.map((id) => {
      const insect = state.nest.find((n) => n.id === id)!;
      return { speciesId: insect.speciesId, level: insect.level, nickname: insect.nickname };
    });
    onReady(team, () => panel.close());
  });

  update();
  panel.body.appendChild(body);
}

/** Strongest-looking first, so the obvious picks are at the top. */
function byPower(a: OwnedInsect, b: OwnedInsect): number {
  const sa = getSpecies(a.speciesId).stats;
  const sb = getSpecies(b.speciesId).stats;
  const score = (s: typeof sa, level: number) => (s.hp / 8 + s.atk + s.def + s.spd) * level;
  return score(sb, b.level) - score(sa, a.level);
}
