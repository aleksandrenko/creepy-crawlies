/**
 * Renders the parametric insect rig into any number of places on the page.
 *
 * A browser will only hand out something like sixteen WebGL contexts, and the Codex alone
 * has 118 entries, so there is exactly ONE renderer here. Live views draw through it in
 * turn each frame and blit the result into their own 2D canvas; grid entries get a still
 * portrait rendered once and cached, because 118 animated insects is neither necessary nor
 * affordable.
 *
 * Nothing in here throws for a caller: if WebGL is unavailable the whole module reports
 * itself unsupported and callers fall back to the photograph.
 */

import * as THREE from 'three';
import { buildInsect, type InsectRig, type RigClip } from '../scene/insectRig';
import type { Species } from '../content/species';

const RENDER_SIZE = 512;

interface View {
  target: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  scene: THREE.Scene;
  rig: InsectRig;
  /** Set by the observer; offscreen views cost nothing. */
  visible: boolean;
  /** Extra yaw from dragging. */
  spin: number;
  autoSpin: boolean;
}

let renderer: THREE.WebGLRenderer | null = null;
let camera: THREE.PerspectiveCamera | null = null;
let supported: boolean | null = null;
let loopRunning = false;
const views = new Set<View>();
const clock = new THREE.Clock();

/** One shared portrait per species, keyed by id, rendered on first request. */
const portraits = new Map<string, string>();

let observer: IntersectionObserver | null = null;

export function is3dSupported(): boolean {
  if (supported !== null) return supported;
  try {
    const probe = document.createElement('canvas');
    supported = !!(probe.getContext('webgl2') ?? probe.getContext('webgl'));
  } catch {
    supported = false;
  }
  return supported;
}

function ensureRenderer(): { renderer: THREE.WebGLRenderer; camera: THREE.PerspectiveCamera } | null {
  if (!is3dSupported()) return null;
  if (renderer && camera) return { renderer, camera };
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(1);
    renderer.setSize(RENDER_SIZE, RENDER_SIZE, false);
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;

    camera = new THREE.PerspectiveCamera(30, 1, 0.05, 40);
    // Slightly above and back: enough elevation to read the six legs, not so much that it
    // becomes a top-down diagram.
    camera.position.set(0, 1.05, 3.3);
    camera.lookAt(0, 0.02, 0);
    return { renderer, camera };
  } catch {
    supported = false;
    return null;
  }
}

/** A small studio: warm key, cool fill, bright rim to pick the shell edge off the dark card. */
function lightScene(scene: THREE.Scene): void {
  scene.add(new THREE.HemisphereLight(0xd8e8f8, 0x6b6250, 1.9));

  const key = new THREE.DirectionalLight(0xfff0d8, 3.1);
  key.position.set(-1.9, 2.6, 2.2);
  scene.add(key);

  const fill = new THREE.DirectionalLight(0x9fc0d8, 1.0);
  fill.position.set(2.4, 0.9, 1.2);
  scene.add(fill);

  const rim = new THREE.DirectionalLight(0xffd9a0, 2.2);
  rim.position.set(0.6, 1.4, -2.6);
  scene.add(rim);
}

/** Frames the animal so long species do not shrink into nothing and stubby ones fill out. */
function frame(scene: THREE.Scene, rig: InsectRig): void {
  const box = new THREE.Box3().setFromObject(rig.group);
  const size = box.getSize(new THREE.Vector3());
  const centre = box.getCenter(new THREE.Vector3());
  const extent = Math.max(size.x, size.y, size.z, 0.001);

  // Normalise to a constant on-screen size, then re-centre. Leaving margin matters: a long
  // abdomen was being clipped off the bottom of the frame.
  const s = 1.3 / extent;
  rig.group.scale.multiplyScalar(s);
  rig.group.position.sub(centre.multiplyScalar(s));
  scene.add(rig.group);
}

function makeScene(species: Species): { scene: THREE.Scene; rig: InsectRig } {
  const scene = new THREE.Scene();
  lightScene(scene);
  const rig = buildInsect(species.id, species.body, species.palette);
  frame(scene, rig);
  return { scene, rig };
}

function loop(): void {
  if (!loopRunning) return;
  const shared = ensureRenderer();
  if (!shared) {
    loopRunning = false;
    return;
  }
  const t = clock.getElapsedTime();

  for (const view of views) {
    if (!view.visible) continue;
    view.rig.tick(t);
    if (view.autoSpin) view.spin += 0.0042;
    view.rig.group.rotation.y = view.spin;

    shared.renderer.render(view.scene, shared.camera);
    const { width, height } = view.target;
    view.ctx.clearRect(0, 0, width, height);
    view.ctx.drawImage(shared.renderer.domElement, 0, 0, width, height);
  }

  requestAnimationFrame(loop);
}

function startLoop(): void {
  if (loopRunning) return;
  loopRunning = true;
  requestAnimationFrame(loop);
}

function watch(): IntersectionObserver {
  if (observer) return observer;
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const view = [...views].find((v) => v.target === entry.target);
        if (view) view.visible = entry.isIntersecting;
      }
    },
    { rootMargin: '80px' },
  );
  return observer;
}

export interface Insect3dHandle {
  el: HTMLCanvasElement;
  /** Play an attack pose. Returns its length in seconds, or 0 if there is no live view. */
  play(clip: RigClip): number;
  dispose(): void;
}

/**
 * Live views by key, so a caller that only knows "the unit in slot a0" can still make it
 * lunge. Battle needs exactly that and has no handle of its own.
 */
const byKey = new Map<string, Insect3dHandle>();

export function insect3dByKey(key: string): Insect3dHandle | undefined {
  return byKey.get(key);
}

/**
 * A live, slowly turning insect. Drag to spin it by hand.
 *
 * Returns null when WebGL is unavailable, so the caller can fall back rather than show a
 * blank hole.
 */
export function mountInsect3d(species: Species, size = 256, key?: string): Insect3dHandle | null {
  const shared = ensureRenderer();
  if (!shared) return null;

  const target = document.createElement('canvas');
  target.className = 'insect3d';
  target.width = size;
  target.height = size;
  const ctx = target.getContext('2d');
  if (!ctx) return null;

  const { scene, rig } = makeScene(species);
  const view: View = { target, ctx, scene, rig, visible: true, spin: 0.4, autoSpin: true };
  views.add(view);
  watch().observe(target);

  // Drag to turn it. Pointer capture keeps the drag alive outside the canvas.
  let dragging = false;
  let lastX = 0;
  target.addEventListener('pointerdown', (e) => {
    dragging = true;
    lastX = e.clientX;
    view.autoSpin = false;
    target.setPointerCapture(e.pointerId);
    target.classList.add('is-dragging');
  });
  target.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    view.spin += (e.clientX - lastX) * 0.012;
    lastX = e.clientX;
  });
  const stop = (e: PointerEvent) => {
    if (!dragging) return;
    dragging = false;
    target.releasePointerCapture(e.pointerId);
    target.classList.remove('is-dragging');
    // Resume drifting after a beat, so a nudge does not freeze it forever.
    setTimeout(() => {
      view.autoSpin = true;
    }, 2200);
  };
  target.addEventListener('pointerup', stop);
  target.addEventListener('pointercancel', stop);

  startLoop();

  const handle: Insect3dHandle = {
    el: target,
    play(clip) {
      return view.rig.play(clip);
    },
    dispose() {
      views.delete(view);
      observer?.unobserve(target);
      view.rig.dispose();
      target.remove();
      if (key) byKey.delete(key);
      if (views.size === 0) loopRunning = false;
    },
  };

  if (key) byKey.set(key, handle);
  return handle;
}

/**
 * A still portrait, rendered once and cached as a data URL.
 *
 * This is what the big grids use. Rendering 118 live insects would be pointless as well as
 * expensive — in a grid you are scanning, not admiring.
 */
export function insectPortrait(species: Species, size = 256): string | null {
  const cached = portraits.get(species.id);
  if (cached) return cached;

  const shared = ensureRenderer();
  if (!shared) return null;

  const { scene, rig } = makeScene(species);
  // A three-quarter view reads better as a still than the front-on live pose.
  rig.group.rotation.y = 0.7;
  rig.tick(0.8);
  shared.renderer.render(scene, shared.camera);

  const out = document.createElement('canvas');
  out.width = size;
  out.height = size;
  out.getContext('2d')?.drawImage(shared.renderer.domElement, 0, 0, size, size);
  const url = out.toDataURL('image/png');

  rig.dispose();
  portraits.set(species.id, url);
  return url;
}
