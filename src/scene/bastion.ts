/**
 * The Bastion: a trodden earth clearing ringed by forest, viewed from a fixed
 * elevated three-quarter camera. The camera never orbits — it only drifts a little
 * with the pointer — which is what gives the scene its 2.5D, diorama read.
 */

import * as THREE from 'three';
import {
  buildFireflies,
  buildForest,
  buildGround,
  buildHatchery,
  buildLightShafts,
  buildNest,
  buildUndergrowth,
  type Building,
} from './props';

export type BuildingId = 'hatchery' | 'nest';

export const BUILDING_LABEL: Record<BuildingId, string> = {
  hatchery: 'Hatchery',
  nest: 'Nest',
};

export const BUILDING_HINT: Record<BuildingId, string> = {
  hatchery: 'Set eggs to develop',
  nest: 'Your colony',
};

const SEED = 20260807;

interface Interactive {
  id: BuildingId;
  building: Building;
  hover: number;
}

export class Bastion {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera: THREE.PerspectiveCamera;
  private readonly clock = new THREE.Clock();
  private readonly raycaster = new THREE.Raycaster();
  private readonly pointer = new THREE.Vector2(-2, -2);
  private readonly interactives: Interactive[] = [];
  private readonly labels = new Map<BuildingId, HTMLElement>();
  private readonly fireflies: { points: THREE.Points; tick: (t: number) => void };
  private readonly hatcheryEggs: THREE.Mesh[];

  /**
   * A macro shot of the forest floor: back far enough for a long-lens look, but aimed
   * low so the trunks leave the top of the frame instead of fitting inside it. The
   * clearing should feel like a small patch under very tall trees.
   */
  private readonly cameraHome = new THREE.Vector3(0, 15.5, 27);
  private readonly target = new THREE.Vector3(0, 3.4, -0.8);
  private readonly drift = new THREE.Vector2(0, 0);
  private readonly driftTarget = new THREE.Vector2(0, 0);

  private hovered: BuildingId | null = null;
  private frame = 0;
  private disposed = false;

  onOpen: (id: BuildingId) => void = () => {};

  constructor(private readonly host: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.28;
    this.renderer.domElement.classList.add('bastion-canvas');
    host.appendChild(this.renderer.domElement);

    this.scene.background = new THREE.Color('#33422f');
    // Light, thin haze. Dark dense fog separated the trunks well but made the clearing feel
    // nocturnal, which was most of why the whole game read as gloomy.
    this.scene.fog = new THREE.FogExp2('#3e5136', 0.0075);

    // Narrow FOV — a macro lens compresses depth, and a wide one would make the
    // giant trunks splay outward and read as small cones instead.
    this.camera = new THREE.PerspectiveCamera(24, 1, 0.1, 200);
    this.camera.position.copy(this.cameraHome);
    this.camera.lookAt(this.target);

    this.buildWorld();
    const hatchery = this.mountBuildings();
    this.hatcheryEggs = hatchery.eggs;

    this.fireflies = buildFireflies(SEED + 9);
    this.scene.add(this.fireflies.points);

    this.attachEvents();
    this.resize();
    this.renderer.setAnimationLoop(() => this.tick());
  }

  private buildWorld(): void {
    this.scene.add(buildGround(SEED));
    this.scene.add(buildForest(SEED + 1));
    this.scene.add(buildUndergrowth(SEED + 2));
    this.scene.add(buildLightShafts(SEED + 3));

    // Sky/ground bounce, turned well up: this is the light that fills the shadows, and it
    // does more for the mood than the sun does.
    this.scene.add(new THREE.HemisphereLight('#cfe4ff', '#6b7a4a', 2.6));

    // Late-afternoon sun raking down through the canopy, from high up and off to one side.
    const sun = new THREE.DirectionalLight('#fff2d8', 3.4);
    sun.position.set(-11, 26, 9);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    // Tight bounds now that the clearing is small — this is what keeps shadows crisp.
    sun.shadow.camera.left = -13;
    sun.shadow.camera.right = 13;
    sun.shadow.camera.top = 13;
    sun.shadow.camera.bottom = -13;
    sun.shadow.camera.far = 70;
    sun.shadow.bias = -0.0012;
    sun.shadow.normalBias = 0.02;
    this.scene.add(sun);

    // Cool fill from the opposite side so shadowed geometry does not go black.
    const fill = new THREE.DirectionalLight('#bcd8e8', 1.1);
    fill.position.set(8, 6, -9);
    this.scene.add(fill);
  }

  private mountBuildings(): ReturnType<typeof buildHatchery> {
    const hatchery = buildHatchery(SEED + 4, new THREE.Vector3(-3.1, 0, 0.6));
    const nest = buildNest(SEED + 5, new THREE.Vector3(3.2, 0, -1.0));

    for (const [id, building] of [
      ['hatchery', hatchery],
      ['nest', nest],
    ] as [BuildingId, Building][]) {
      this.scene.add(building.group, building.hitbox);
      building.hitbox.userData.buildingId = id;
      this.interactives.push({ id, building, hover: 0 });
      this.labels.set(id, this.createLabel(id));
    }

    return hatchery;
  }

  private createLabel(id: BuildingId): HTMLElement {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'bastion-label';
    el.innerHTML = `<span class="bastion-label__name">${BUILDING_LABEL[id]}</span>` +
      `<span class="bastion-label__hint">${BUILDING_HINT[id]}</span>` +
      `<span class="bastion-label__badge" hidden></span>`;
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      this.onOpen(id);
    });
    this.host.appendChild(el);
    return el;
  }

  /** Shows a small count badge on a building's label (eggs ready, insects held). */
  setBadge(id: BuildingId, text: string | null, urgent = false): void {
    const badge = this.labels.get(id)?.querySelector<HTMLElement>('.bastion-label__badge');
    if (!badge) return;
    badge.hidden = text === null;
    badge.textContent = text ?? '';
    badge.classList.toggle('is-urgent', urgent);
  }

  /** How many hatchery hollows currently show an egg. */
  setEggCount(occupied: number): void {
    this.hatcheryEggs.forEach((egg, i) => {
      egg.visible = i < occupied;
    });
  }

  private attachEvents(): void {
    this.onResize = this.onResize.bind(this);
    window.addEventListener('resize', this.onResize);

    const canvas = this.renderer.domElement;
    canvas.addEventListener('pointermove', (e) => {
      const rect = canvas.getBoundingClientRect();
      this.pointer.set(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1,
      );
      this.driftTarget.set(this.pointer.x, this.pointer.y);
    });
    canvas.addEventListener('pointerleave', () => {
      this.pointer.set(-2, -2);
      this.driftTarget.set(0, 0);
    });
    canvas.addEventListener('click', () => {
      if (this.hovered) this.onOpen(this.hovered);
    });
  }

  private onResize(): void {
    this.resize();
  }

  private resize(): void {
    const w = this.host.clientWidth || window.innerWidth;
    const h = this.host.clientHeight || window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    // Widen the view on narrow screens so the whole clearing still fits.
    this.camera.fov = h > w ? 34 : 24;
    this.camera.updateProjectionMatrix();
  }

  private updateHover(): void {
    const hits = this.raycaster.intersectObjects(
      this.interactives.map((i) => i.building.hitbox),
      false,
    );
    const next = (hits[0]?.object.userData.buildingId as BuildingId | undefined) ?? null;
    if (next !== this.hovered) {
      this.hovered = next;
      this.renderer.domElement.style.cursor = next ? 'pointer' : 'default';
    }
  }

  private positionLabels(): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const v = new THREE.Vector3();
    for (const item of this.interactives) {
      const el = this.labels.get(item.id);
      if (!el) continue;
      v.copy(item.building.labelAnchor).project(this.camera);
      el.style.left = `${((v.x + 1) / 2) * rect.width}px`;
      el.style.top = `${((-v.y + 1) / 2) * rect.height}px`;
      el.classList.toggle('is-hovered', this.hovered === item.id);
    }
  }

  private tick(): void {
    if (this.disposed) return;
    const elapsed = this.clock.getElapsedTime();
    this.frame++;

    // Pointer drift. Small numbers on purpose — this is a diorama, not an orbit camera.
    this.drift.lerp(this.driftTarget, 0.045);
    this.camera.position.set(
      this.cameraHome.x + this.drift.x * 1.5,
      this.cameraHome.y - this.drift.y * 0.9,
      this.cameraHome.z + Math.abs(this.drift.x) * 0.25,
    );
    this.camera.lookAt(this.target.x + this.drift.x * 0.35, this.target.y + this.drift.y * 0.2, this.target.z);

    // Raycasting every third frame is imperceptible and keeps the loop cheap.
    if (this.frame % 3 === 0) {
      this.raycaster.setFromCamera(this.pointer, this.camera);
      this.updateHover();
    }

    for (const item of this.interactives) {
      const wanted = this.hovered === item.id ? 1 : 0;
      item.hover += (wanted - item.hover) * 0.14;
      item.building.tick(elapsed, item.hover);
    }

    this.fireflies.tick(elapsed);
    this.positionLabels();
    this.renderer.render(this.scene, this.camera);
  }

  dispose(): void {
    this.disposed = true;
    this.renderer.setAnimationLoop(null);
    window.removeEventListener('resize', this.onResize);
    for (const el of this.labels.values()) el.remove();
    this.labels.clear();
    this.scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh || obj instanceof THREE.Points || obj instanceof THREE.InstancedMesh) {
        obj.geometry.dispose();
        const mat = obj.material;
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
        else mat.dispose();
      }
    });
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
