/**
 * Side-by-side preview of the five rendering styles, on one species.
 *
 * All five are live and turning, on the same animal, so the comparison is about the style
 * and nothing else. Picking one applies it to every insect in the game and redraws whatever
 * is already on screen.
 */

import { ALL_SPECIES, getSpecies, type Species } from '../content/species';
import { buildInsect } from '../scene/insectRig';
import { RIG_STYLES, rigStyleId, setRigStyle, STYLE_ORDER } from '../scene/rigStyle';
import * as THREE from 'three';
import { refreshCreatures } from './creature';
import { el, escapeHtml, qs } from './dom';
import { is3dSupported } from './insect3d';
import { openPanel, toast } from './panel';

/** The stick insect makes the best subject: long limbs and a segmented body show up most. */
const PREFERRED_SUBJECT = 'morosa';

/** Render resolution of each preview. Larger than the slot, so the shading survives scaling. */
const SIZE = 420;

interface Preview {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  scene: THREE.Scene;
  rig: ReturnType<typeof buildInsect>;
}

function subject(): Species {
  // Preview-only: the stick insect is worth showing even when it is not in the active roster.
  const found = ALL_SPECIES.find((s) => s.id === PREFERRED_SUBJECT);
  return found ?? getSpecies(ALL_SPECIES[0]!.id);
}

/**
 * Wraps an object and fits it to the view.
 *
 * Fits on the diagonal of the footprint rather than the single longest axis, so a long thin
 * animal fills the frame instead of being scaled down until its length happens to fit.
 */
function frame(object: THREE.Object3D, target: number): THREE.Group {
  const wrapper = new THREE.Group();
  wrapper.add(object);

  const box = new THREE.Box3().setFromObject(object);
  const size = box.getSize(new THREE.Vector3());
  const centre = box.getCenter(new THREE.Vector3());
  /*
   * The visual bulk of an insect seen at an angle is its footprint diagonal and its height.
   *
   * The 0.72 is a discount on that diagonal, because the corners of a footprint are empty air:
   * a sprawling animal is not actually as wide as the box around its feet. Too generous a
   * discount and the abdomen tip runs off the edge, which it was doing on the stick insect.
   */
  const extent = Math.max(Math.hypot(size.x, size.z) * 0.86, size.y, 0.001);
  const s = target / extent;

  object.position.sub(centre);
  wrapper.scale.setScalar(s);
  return wrapper;
}

function lightScene(scene: THREE.Scene): void {
  scene.add(new THREE.HemisphereLight(0xd8e8f8, 0x6b6250, 2.0));
  const key = new THREE.DirectionalLight(0xfff0d8, 3.0);
  key.position.set(-1.8, 2.6, 2.2);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xa8c8dc, 1.1);
  fill.position.set(2.4, 1.0, 1.2);
  scene.add(fill);
  const rim = new THREE.DirectionalLight(0xffd9a0, 2.0);
  rim.position.set(0.6, 1.4, -2.6);
  scene.add(rim);
}

export function openStylePicker(): void {
  if (!is3dSupported()) {
    toast('This browser cannot show 3D models, so there is nothing to compare.', 'info');
    return;
  }

  const species = subject();
  const panel = openPanel({
    title: 'Model style',
    subtitle: `Five ways to render the same animal — ${species.name}. Pick one and it applies to all.`,
    wide: true,
    onClose: () => teardown(),
  });

  /*
   * A subject selector, because the stick insect is a poor model even though it is a good
   * style test: its parameters are extreme enough that the legs dominate and it reads as a
   * pile of sticks. Judging the shading from it works; judging the animal does not.
   */
  const subjects = [
    ...(ALL_SPECIES.find((s) => s.id === PREFERRED_SUBJECT) ? [PREFERRED_SUBJECT] : []),
    'mantis', 'lucanus', 'apis', 'coccinella', 'anax',
  ]
    .map((id) => ALL_SPECIES.find((s) => s.id === id))
    .filter((s): s is Species => !!s);

  const bar = el(`
    <label class="select styles__subject">
      <span class="select__label">Subject</span>
      <select class="select__input">
        ${subjects.map((s) => `<option value="${s.id}">${escapeHtml(s.name)}</option>`).join('')}
      </select>
    </label>
  `);
  panel.body.appendChild(bar);

  const body = el(`<div class="styles"></div>`);
  panel.body.appendChild(body);

  // One renderer for all five previews, same as everywhere else: contexts are scarce.
  let renderer: THREE.WebGLRenderer | null = null;
  try {
    // `preserveDrawingBuffer` is required, not optional: without it the back buffer is
    // gone by the time each preview blits it, and four of the five cards come out blank.
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(1);
    renderer.setSize(SIZE, SIZE, false);
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
  } catch {
    toast('Could not start the 3D preview.', 'error');
    return;
  }

  const camera = new THREE.PerspectiveCamera(32, 1, 0.05, 40);
  // Above and off to one side: a long abdomen is invisible head-on.
  camera.position.set(1.5, 1.3, 2.5);
  camera.lookAt(0, 0, 0);

  const previews: Preview[] = [];
  let running = true;
  const clock = new THREE.Clock();

  qs<HTMLSelectElement>(bar, '.select__input').addEventListener('change', (e) => {
    const picked = ALL_SPECIES.find((s) => s.id === (e.target as HTMLSelectElement).value);
    if (picked) buildCards(picked);
  });

  buildCards(species);

  function buildCards(subjectSpecies: Species): void {
  // Tear the old set down first, or their WebGL resources leak on every change.
  for (const preview of previews) preview.rig.dispose();
  previews.length = 0;
  body.replaceChildren();
  panel.setSubtitle(
    `Five ways to render the same animal — ${subjectSpecies.name}. Pick one and it applies to all.`,
  );

  for (const id of STYLE_ORDER) {
    const style = RIG_STYLES[id];
    const chosen = rigStyleId() === id;

    const card = el(`
      <div class="style-card${chosen ? ' is-chosen' : ''}" data-style="${id}">
        <div class="style-card__view"></div>
        <p class="style-card__name">${escapeHtml(style.name)}</p>
        <p class="style-card__blurb">${escapeHtml(style.blurb)}</p>
        <button class="btn ${chosen ? 'btn--ghost' : 'btn--primary'} style-card__pick" type="button">
          ${chosen ? 'In use' : 'Use this style'}
        </button>
      </div>
    `);

    const canvas = document.createElement('canvas');
    canvas.className = 'style-card__canvas';
    canvas.width = SIZE;
    canvas.height = SIZE;
    const ctx = canvas.getContext('2d');
    if (!ctx) continue;
    qs(card, '.style-card__view').appendChild(canvas);

    const scene = new THREE.Scene();
    lightScene(scene);
    const rig = buildInsect(subjectSpecies.id, subjectSpecies.body, subjectSpecies.palette, id);
    /*
     * Framed through a wrapper, not by moving the rig.
     *
     * `buildInsect` already offsets the rig so its feet rest on y = 0. Scaling and
     * re-centring the same group applied a second offset on top of that, which pushed the
     * animal into a corner — and normalising by the longest axis shrank a stick insect,
     * which is nearly all length, down to a scribble.
     */
    scene.add(frame(rig.group, 1.55));

    previews.push({ canvas, ctx, scene, rig });

    qs(card, '.style-card__pick').addEventListener('click', () => {
      setRigStyle(id);
      refreshCreatures();
      // Repaint the cards so the chosen one is marked without rebuilding the previews.
      for (const node of body.querySelectorAll<HTMLElement>('.style-card')) {
        const isChosen = node.dataset.style === id;
        node.classList.toggle('is-chosen', isChosen);
        const btn = qs<HTMLButtonElement>(node, '.style-card__pick');
        btn.textContent = isChosen ? 'In use' : 'Use this style';
        btn.classList.toggle('btn--primary', !isChosen);
        btn.classList.toggle('btn--ghost', isChosen);
      }
      toast(`${RIG_STYLES[id].name} applied to every insect.`, 'good');
    });

    body.appendChild(card);
  }

  body.appendChild(
    el(
      `<p class="sheet__foot">The geometry is the same in all five — only the shading and how ` +
        `finely it is built change.</p>`,
    ),
  );
  }

  function loop(): void {
    if (!running || !renderer) return;
    const t = clock.getElapsedTime();
    for (const preview of previews) {
      preview.rig.tick(t);
      // Only the yaw is touched here: the position carries the centring offset.
      preview.rig.group.rotation.y = 0.4 + t * 0.28;
      renderer.render(preview.scene, camera);
      preview.ctx.clearRect(0, 0, SIZE, SIZE);
      preview.ctx.drawImage(renderer.domElement, 0, 0, SIZE, SIZE);
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  function teardown(): void {
    running = false;
    for (const preview of previews) preview.rig.dispose();
    previews.length = 0;
    renderer?.dispose();
    renderer = null;
  }
}
