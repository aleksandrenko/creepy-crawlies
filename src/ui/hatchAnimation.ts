/**
 * The hatching sequence: the payoff moment of the whole loop.
 *
 * Four beats — wobble, crack, charge, burst — then it resolves and the caller opens the
 * reveal. The species is already decided by the time this runs, so the show is scaled and
 * coloured by its rarity: a common gives a modest pop, a legendary fills the screen. That
 * escalation is the suspense, and it also tells you something before you read a word.
 *
 * Everything is DOM and CSS, so `prefers-reduced-motion` can cut it to almost nothing
 * without a separate code path.
 */

import { RARITY_COLOR, type Rarity } from '../content/species';
import { el } from './dom';

interface Show {
  /** How many sparks fly outward. */
  sparks: number;
  /** How many light rays sweep behind the burst. */
  rays: number;
  /** Total run time in ms. */
  duration: number;
  /** Extra shake, for the ones worth shaking about. */
  intensity: number;
}

const SHOW: Record<Rarity, Show> = {
  common: { sparks: 26, rays: 0, duration: 1500, intensity: 0.7 },
  rare: { sparks: 44, rays: 6, duration: 1800, intensity: 0.9 },
  epic: { sparks: 70, rays: 10, duration: 2100, intensity: 1.15 },
  legendary: { sparks: 110, rays: 16, duration: 2500, intensity: 1.5 },
};

/**
 * Runs the sequence and resolves when the reveal should appear.
 *
 * Resolves rather than rejects on any trouble: a decorative animation must never be the
 * reason a player does not get their insect.
 */
export function playHatch(rarity: Rarity): Promise<void> {
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  const show = SHOW[rarity];
  const colour = RARITY_COLOR[rarity];

  const stage = el(`
    <div class="hatch" style="--rarity:${colour}" aria-live="polite" aria-label="Hatching">
      <div class="hatch__glow"></div>
      <div class="hatch__rays"></div>
      <div class="hatch__egg">
        <span class="hatch__shine"></span>
        <svg class="hatch__cracks" viewBox="0 0 100 130" aria-hidden="true" fill="none"
             stroke="currentColor" stroke-width="2.4" stroke-linecap="round">
          <path d="M50 18 L44 42 L57 52 L46 74 L54 96 L47 116" />
          <path d="M44 42 L26 36" />
          <path d="M57 52 L76 46" />
          <path d="M46 74 L24 78" />
          <path d="M54 96 L74 100" />
        </svg>
      </div>
      <div class="hatch__sparks"></div>
      <p class="hatch__caption">Something is moving…</p>
    </div>
  `);

  document.body.appendChild(stage);

  if (reduced) {
    // Straight to the point, with no motion at all.
    stage.classList.add('is-reduced');
    return new Promise((resolve) => {
      setTimeout(() => {
        stage.remove();
        resolve();
      }, 320);
    });
  }

  stage.style.setProperty('--intensity', String(show.intensity));

  const rays = stage.querySelector<HTMLElement>('.hatch__rays');
  for (let i = 0; i < show.rays; i++) {
    const ray = el('<span class="hatch__ray"></span>');
    ray.style.setProperty('--angle', `${(360 / show.rays) * i}deg`);
    ray.style.setProperty('--delay', `${i * 12}ms`);
    rays?.appendChild(ray);
  }

  const sparkHost = stage.querySelector<HTMLElement>('.hatch__sparks');
  for (let i = 0; i < show.sparks; i++) {
    const spark = el('<span class="hatch__spark"></span>');
    // Spread by angle and distance so the burst is uneven, the way a real one is.
    const angle = Math.random() * 360;
    const distance = 90 + Math.random() * 260 * show.intensity;
    spark.style.setProperty('--angle', `${angle}deg`);
    spark.style.setProperty('--distance', `${distance}px`);
    spark.style.setProperty('--size', `${3 + Math.random() * 6}px`);
    spark.style.setProperty('--delay', `${Math.random() * 140}ms`);
    spark.style.setProperty('--spin', `${(Math.random() - 0.5) * 400}deg`);
    // A few sparks stay white-hot; the rest take the rarity colour.
    if (Math.random() < 0.3) spark.classList.add('is-hot');
    sparkHost?.appendChild(spark);
  }

  // Beat 1-2: wobble and crack. Beat 3: charge. Beat 4: burst.
  const crackAt = Math.round(show.duration * 0.32);
  const chargeAt = Math.round(show.duration * 0.62);
  const burstAt = Math.round(show.duration * 0.84);

  const timers: number[] = [];
  const at = (ms: number, fn: () => void) => timers.push(window.setTimeout(fn, ms));

  at(30, () => stage.classList.add('is-wobbling'));
  at(crackAt, () => {
    stage.classList.add('is-cracking');
    const caption = stage.querySelector('.hatch__caption');
    if (caption) caption.textContent = 'The shell is giving way…';
  });
  at(chargeAt, () => stage.classList.add('is-charging'));
  at(burstAt, () => {
    stage.classList.add('is-bursting');
    const caption = stage.querySelector('.hatch__caption');
    if (caption) caption.textContent = '';
  });

  return new Promise((resolve) => {
    at(show.duration, () => {
      for (const t of timers) clearTimeout(t);
      stage.classList.add('is-leaving');
      setTimeout(() => stage.remove(), 340);
      resolve();
    });
  });
}
