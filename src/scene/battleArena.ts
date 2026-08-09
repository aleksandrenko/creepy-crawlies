/**
 * The battle, as a 3D scene on the forest floor rather than a row of cards.
 *
 * Six insects stand on the ground in two facing lines. The one to act has a glowing ring
 * beneath it. A melee attack walks the attacker across to its target, strikes, and walks it
 * home; everything ranged or supportive is performed on the spot, with a projectile or a
 * pulse to carry it. That distinction is the whole point — you can tell what kind of thing
 * happened from across the room, without reading the log.
 *
 * Its own renderer, separate from `insect3d`'s shared one: this is a single full-size scene
 * with shadows and depth, not a grid of small portraits, and the two want opposite settings.
 */

import * as THREE from 'three';
import { buildInsect, type InsectRig, type RigClip } from './insectRig';
import { getSpecies } from '../content/species';

/** Which clips are physical contact, and so require closing the distance first. */
const MELEE: ReadonlySet<RigClip> = new Set<RigClip>(['strike', 'multihit', 'execute', 'drain', 'stun']);

/** Offensive clips performed at range, which throw something instead of walking. */
const PROJECTILE: ReadonlySet<RigClip> = new Set<RigClip>(['dot', 'debuff', 'strip', 'aoe']);

export interface ArenaUnit {
  id: string;
  speciesId: string;
  side: 'a' | 'b';
  slot: number;
}

interface Fighter {
  id: string;
  rig: InsectRig;
  home: THREE.Vector3;
  facing: number;
  down: boolean;
}

const CLIP_COLOUR: Partial<Record<RigClip, number>> = {
  strike: 0xff5a3c,
  multihit: 0xff7a4c,
  execute: 0xff3a2c,
  aoe: 0xff8a3c,
  dot: 0xffa03c,
  stun: 0xc88cf0,
  debuff: 0xc46cf0,
  strip: 0xb06ce0,
  drain: 0x9ce87a,
  heal: 0x6fe08a,
  revive: 0x8fffa8,
  shield: 0xffd257,
  buff: 0xffd257,
  cleanse: 0x8fd4ff,
  evade: 0xa8c8ff,
};

export class BattleArena {
  readonly el: HTMLElement;

  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera: THREE.PerspectiveCamera;
  private readonly clock = new THREE.Clock();
  private readonly fighters = new Map<string, Fighter>();
  private readonly labels = new Map<string, HTMLElement>();

  /** Expanding rings and travelling projectiles, ticked and reaped each frame. */
  private readonly fx: {
    mesh: THREE.Mesh;
    age: number;
    dur: number;
    kind: 'ring' | 'shot';
    from?: THREE.Vector3;
    to?: THREE.Vector3;
    rise: number;
  }[] = [];

  private readonly ring: THREE.Mesh;
  private ringFor: string | null = null;
  private disposed = false;

  constructor(host: HTMLElement) {
    this.el = document.createElement('div');
    this.el.className = 'arena3d';
    host.appendChild(this.el);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.renderer.domElement.className = 'arena3d__canvas';
    this.el.appendChild(this.renderer.domElement);

    this.scene.background = new THREE.Color('#0b110e');
    // Dense enough that the floor fades into the dark rather than ending at a visible rim.
    this.scene.fog = new THREE.FogExp2('#0b110e', 0.075);

    // Looking down the length of the field, from behind and above the player's line.
    this.camera = new THREE.PerspectiveCamera(38, 1, 0.1, 90);
    this.camera.position.set(0, 5.2, 8.6);
    this.camera.lookAt(0, 0.5, -0.9);

    this.buildGround();
    this.ring = this.buildRing();
    this.scene.add(this.ring);

    this.onResize = this.onResize.bind(this);
    window.addEventListener('resize', this.onResize);
    this.resize();
    this.renderer.setAnimationLoop(() => this.frame());
  }

  // ── the ground ──────────────────────────────────────────────────────────────

  private buildGround(): void {
    const dirt = new THREE.Mesh(
      new THREE.CircleGeometry(16, 64),
      new THREE.MeshStandardMaterial({ color: '#6b5138', roughness: 0.97 }),
    );
    dirt.rotation.x = -Math.PI / 2;
    dirt.receiveShadow = true;
    this.scene.add(dirt);

    // Litter, so the floor is not a flat disc. Seeded by index rather than Math.random so
    // the arena looks the same every battle.
    const dummy = new THREE.Object3D();
    const leaf = new THREE.InstancedMesh(
      (() => {
        // Nine segments and a squash: at this scale a hexagon reads as a hexagon.
        const g = new THREE.CircleGeometry(0.26, 9);
        g.rotateX(-Math.PI / 2);
        g.scale(1, 1, 1.7);
        return g;
      })(),
      new THREE.MeshStandardMaterial({ roughness: 0.9, side: THREE.DoubleSide }),
      140,
    );
    leaf.receiveShadow = true;
    const colour = new THREE.Color();
    const leafA = new THREE.Color('#8a6427');
    const leafB = new THREE.Color('#4a3418');
    for (let i = 0; i < 140; i++) {
      const a = (i * 2.399) % (Math.PI * 2);
      const r = 2.4 + ((i * 7919) % 1000) / 1000 * 11;
      dummy.position.set(Math.cos(a) * r, 0.012 + (i % 5) * 0.004, Math.sin(a) * r);
      dummy.rotation.set(0, (i * 1.7) % Math.PI, 0);
      dummy.scale.setScalar(0.7 + ((i * 37) % 100) / 100);
      dummy.updateMatrix();
      leaf.setMatrixAt(i, dummy.matrix);
      colour.copy(leafA).lerp(leafB, ((i * 53) % 100) / 100);
      leaf.setColorAt(i, colour);
    }
    leaf.instanceMatrix.needsUpdate = true;
    if (leaf.instanceColor) leaf.instanceColor.needsUpdate = true;
    this.scene.add(leaf);

    const pebble = new THREE.InstancedMesh(
      new THREE.DodecahedronGeometry(0.24, 0),
      new THREE.MeshStandardMaterial({ roughness: 0.85, flatShading: true }),
      40,
    );
    pebble.castShadow = true;
    pebble.receiveShadow = true;
    const stoneA = new THREE.Color('#7a7267');
    const stoneB = new THREE.Color('#45413a');
    for (let i = 0; i < 40; i++) {
      const a = (i * 1.777) % (Math.PI * 2);
      const r = 3 + ((i * 5477) % 1000) / 1000 * 10;
      dummy.position.set(Math.cos(a) * r, 0.02, Math.sin(a) * r);
      dummy.rotation.set(i, i * 2, i * 3);
      dummy.scale.setScalar(0.6 + ((i * 29) % 100) / 130);
      dummy.updateMatrix();
      pebble.setMatrixAt(i, dummy.matrix);
      colour.copy(stoneA).lerp(stoneB, ((i * 61) % 100) / 100);
      pebble.setColorAt(i, colour);
    }
    pebble.instanceMatrix.needsUpdate = true;
    if (pebble.instanceColor) pebble.instanceColor.needsUpdate = true;
    this.scene.add(pebble);

    // A low band of dark scrub around the rim: the eye reads it as the clearing continuing
    // into the undergrowth, which a bare horizon does not.
    const scrub = new THREE.InstancedMesh(
      new THREE.IcosahedronGeometry(1, 1),
      new THREE.MeshStandardMaterial({ color: '#1d2c1f', roughness: 0.9, flatShading: true }),
      90,
    );
    for (let i = 0; i < 90; i++) {
      const a = (i / 90) * Math.PI * 2 + ((i * 13) % 7) * 0.02;
      const r = 12.5 + ((i * 3571) % 100) / 100 * 3.5;
      const h = 0.9 + ((i * 97) % 100) / 100 * 1.9;
      dummy.position.set(Math.cos(a) * r, h * 0.25, Math.sin(a) * r);
      dummy.rotation.set(i, i * 1.3, i * 0.7);
      dummy.scale.set(h * 1.3, h, h * 1.3);
      dummy.updateMatrix();
      scrub.setMatrixAt(i, dummy.matrix);
    }
    scrub.instanceMatrix.needsUpdate = true;
    this.scene.add(scrub);

    this.scene.add(new THREE.HemisphereLight(0x9fc3e8, 0x3a4426, 1.25));

    const sun = new THREE.DirectionalLight(0xffd9a0, 2.7);
    sun.position.set(-6, 11, 6);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -10;
    sun.shadow.camera.right = 10;
    sun.shadow.camera.top = 10;
    sun.shadow.camera.bottom = -10;
    sun.shadow.camera.far = 40;
    sun.shadow.normalBias = 0.02;
    this.scene.add(sun);

    const fill = new THREE.DirectionalLight(0x8fb6c9, 0.6);
    fill.position.set(6, 4, -6);
    this.scene.add(fill);
  }

  /** The marker under whoever is about to act. */
  private buildRing(): THREE.Mesh {
    const group = new THREE.Mesh(
      new THREE.RingGeometry(0.52, 0.78, 48),
      new THREE.MeshBasicMaterial({
        color: 0xffc861,
        transparent: true,
        opacity: 0.85,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    group.rotation.x = -Math.PI / 2;
    group.position.y = 0.03;
    group.visible = false;
    return group;
  }

  // ── fighters ────────────────────────────────────────────────────────────────

  /** Places the six insects in two facing lines. */
  setUnits(units: ArenaUnit[]): void {
    for (const fighter of this.fighters.values()) {
      this.scene.remove(fighter.rig.group);
      fighter.rig.dispose();
    }
    this.fighters.clear();
    for (const label of this.labels.values()) label.remove();
    this.labels.clear();

    for (const unit of units) {
      const species = getSpecies(unit.speciesId);
      const rig = buildInsect(unit.speciesId, species.body, species.palette);

      // A stick insect and a flea differ by an order of magnitude; normalise so both are
      // visible without one of them becoming scenery.
      const box = new THREE.Box3().setFromObject(rig.group);
      const extent = Math.max(...box.getSize(new THREE.Vector3()).toArray(), 0.001);
      rig.group.scale.multiplyScalar(1.5 / extent);

      // Player's line nearer the camera, opponent's further away.
      const z = unit.side === 'a' ? 2.6 : -2.6;
      const x = (unit.slot - 1) * 3.1;
      const facing = unit.side === 'a' ? 0 : Math.PI;

      const home = new THREE.Vector3(x, 0, z);
      rig.group.position.copy(home);
      rig.group.rotation.y = facing;
      this.scene.add(rig.group);

      this.fighters.set(unit.id, { id: unit.id, rig, home, facing, down: false });
      this.labels.set(unit.id, this.makeLabel(unit.id));
    }
  }

  private makeLabel(id: string): HTMLElement {
    const el = document.createElement('div');
    el.className = 'arena3d__label';
    el.dataset.unit = id;
    el.innerHTML =
      '<span class="arena3d__name"></span>' +
      '<span class="arena3d__hp"><span class="arena3d__hp-fill"></span></span>' +
      '<span class="arena3d__statuses"></span>';
    this.el.appendChild(el);
    return el;
  }

  /** Feeds the floating labels and the toppled state. */
  update(
    rows: {
      id: string;
      name: string;
      hp: number;
      maxHp: number;
      rarity: string;
      statuses: { label: string; bad: boolean }[];
    }[],
  ): void {
    for (const row of rows) {
      const label = this.labels.get(row.id);
      const fighter = this.fighters.get(row.id);
      if (!label || !fighter) continue;

      const pct = Math.max(0, Math.round((row.hp / row.maxHp) * 100));
      label.querySelector('.arena3d__name')!.textContent = row.name;
      (label.querySelector('.arena3d__hp-fill') as HTMLElement).style.width = `${pct}%`;
      label.dataset.rarity = row.rarity;
      label.classList.toggle('is-down', row.hp <= 0);

      const statuses = label.querySelector('.arena3d__statuses')!;
      statuses.replaceChildren();
      for (const status of row.statuses.slice(0, 6)) {
        const chip = document.createElement('span');
        chip.className = `arena3d__chip${status.bad ? ' is-bad' : ' is-good'}`;
        chip.textContent = status.label;
        statuses.appendChild(chip);
      }

      // A downed insect rolls onto its side and stays there.
      const wasDown = fighter.down;
      fighter.down = row.hp <= 0;
      if (fighter.down !== wasDown) {
        // On its back, settled onto the floor, still on its own square.
        fighter.rig.group.rotation.z = fighter.down ? Math.PI * 0.85 : 0;
        fighter.rig.group.position.copy(fighter.home);
        fighter.rig.group.position.y = fighter.down ? 0.18 : 0;
      }
    }
  }

  setActive(id: string | null): void {
    this.ringFor = id;
    const fighter = id ? this.fighters.get(id) : null;
    this.ring.visible = !!fighter && !fighter.down;
    if (fighter) {
      this.ring.position.set(fighter.rig.group.position.x, 0.03, fighter.rig.group.position.z);
    }
  }

  // ── choreography ────────────────────────────────────────────────────────────

  /**
   * Performs one action and resolves when it is done.
   *
   * Melee closes the distance and comes back; everything else stays home. `targets` drives
   * where a projectile flies and where the impact rings land.
   */
  playAction(actorId: string, targetIds: string[], clip: RigClip): Promise<void> {
    const actor = this.fighters.get(actorId);
    if (!actor || this.disposed) return Promise.resolve();

    const colour = CLIP_COLOUR[clip] ?? 0xffffff;
    const targets = targetIds
      .map((id) => this.fighters.get(id))
      .filter((f): f is Fighter => !!f && f !== actor);

    if (MELEE.has(clip) && targets.length > 0) {
      // The pose fires on arrival, not on departure — a swing thrown at the start of the
      // walk lands in empty air.
      return this.melee(actor, targets[0]!, clip, colour);
    }

    actor.rig.play(clip);

    // In place. Offensive skills throw something; supportive ones pulse where they stand.
    if (PROJECTILE.has(clip) && targets.length > 0) {
      for (const target of targets) this.shoot(actor, target, colour);
      setTimeout(() => {
        for (const target of targets) this.ringAt(target, colour);
      }, 340);
    } else {
      this.ringAt(actor, colour);
      for (const target of targets) {
        if (target !== actor) setTimeout(() => this.ringAt(target, colour), 180);
      }
    }

    return this.wait(760);
  }

  /** Walk in, hit, walk back. */
  private melee(actor: Fighter, target: Fighter, clip: RigClip, colour: number): Promise<void> {
    const from = actor.home.clone();
    const to = target.rig.group.position.clone();
    const direction = new THREE.Vector3().subVectors(to, from);
    const distance = direction.length() || 0.001;
    direction.divideScalar(distance);
    // Stop short, or the two insects interpenetrate.
    const stop = from.clone().addScaledVector(direction, Math.max(0, distance - 1.6));

    // Turn to face where it is going, rather than sliding sideways.
    const heading = Math.atan2(direction.x, direction.z);

    const OUT = 420;
    const HOLD = 340;
    const BACK = 380;
    const started = performance.now();
    let struck = false;

    return new Promise((resolve) => {
      const step = (): void => {
        if (this.disposed) return resolve();
        const t = performance.now() - started;

        if (t < OUT) {
          const k = ease(t / OUT);
          actor.rig.group.position.lerpVectors(from, stop, k);
          actor.rig.group.rotation.y = lerpAngle(actor.facing, heading, k);
          // A small hop so the walk has weight.
          actor.rig.group.position.y = Math.sin(k * Math.PI) * 0.12;
        } else if (t < OUT + HOLD) {
          actor.rig.group.position.copy(stop);
          actor.rig.group.position.y = 0;
          if (!struck) {
            struck = true;
            actor.rig.play(clip);
            this.ringAt(target, colour);
          }
        } else if (t < OUT + HOLD + BACK) {
          const k = ease((t - OUT - HOLD) / BACK);
          actor.rig.group.position.lerpVectors(stop, from, k);
          actor.rig.group.rotation.y = lerpAngle(heading, actor.facing, k);
        } else {
          actor.rig.group.position.copy(from);
          actor.rig.group.rotation.y = actor.facing;
          return resolve();
        }
        requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }

  private shoot(actor: Fighter, target: Fighter, colour: number): void {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 10, 8),
      new THREE.MeshBasicMaterial({
        color: colour,
        transparent: true,
        opacity: 0.95,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    const from = actor.rig.group.position.clone().setY(0.55);
    const to = target.rig.group.position.clone().setY(0.5);
    mesh.position.copy(from);
    this.scene.add(mesh);
    this.fx.push({ mesh, age: 0, dur: 0.36, kind: 'shot', from, to, rise: 0 });
  }

  private ringAt(fighter: Fighter, colour: number): void {
    const mesh = new THREE.Mesh(
      new THREE.TorusGeometry(0.4, 0.035, 8, 40),
      new THREE.MeshBasicMaterial({
        color: colour,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    mesh.rotation.x = Math.PI / 2;
    mesh.position.copy(fighter.rig.group.position).setY(0.1);
    this.scene.add(mesh);
    this.fx.push({ mesh, age: 0, dur: 0.7, kind: 'ring', rise: 0.7 });
  }

  private wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // ── loop ────────────────────────────────────────────────────────────────────

  private frame(): void {
    if (this.disposed) return;
    const t = this.clock.getElapsedTime();
    const dt = Math.min(0.05, this.clock.getDelta());

    for (const fighter of this.fighters.values()) {
      if (!fighter.down) fighter.rig.tick(t);
    }

    // The active marker breathes, and follows its owner if it is mid-walk.
    if (this.ring.visible && this.ringFor) {
      const owner = this.fighters.get(this.ringFor);
      if (owner) this.ring.position.set(owner.rig.group.position.x, 0.03, owner.rig.group.position.z);
      const pulse = 1 + Math.sin(t * 3.4) * 0.09;
      this.ring.scale.set(pulse, pulse, 1);
      (this.ring.material as THREE.MeshBasicMaterial).opacity = 0.62 + Math.sin(t * 3.4) * 0.22;
    }

    for (let i = this.fx.length - 1; i >= 0; i--) {
      const item = this.fx[i]!;
      item.age += dt;
      const k = item.age / item.dur;
      if (k >= 1) {
        this.scene.remove(item.mesh);
        item.mesh.geometry.dispose();
        (item.mesh.material as THREE.Material).dispose();
        this.fx.splice(i, 1);
        continue;
      }
      const mat = item.mesh.material as THREE.MeshBasicMaterial;
      if (item.kind === 'ring') {
        item.mesh.position.y = 0.1 + easeOut(k) * item.rise;
        const s = 1 + k * 1.9;
        item.mesh.scale.set(s, s, s);
        mat.opacity = 0.9 * (1 - k);
      } else if (item.from && item.to) {
        item.mesh.position.lerpVectors(item.from, item.to, easeOut(k));
        // A slight arc reads as thrown rather than beamed.
        item.mesh.position.y += Math.sin(k * Math.PI) * 0.4;
        mat.opacity = 1 - k * 0.4;
      }
    }

    this.positionLabels();
    this.renderer.render(this.scene, this.camera);
  }

  private positionLabels(): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const v = new THREE.Vector3();
    for (const [id, label] of this.labels) {
      const fighter = this.fighters.get(id);
      if (!fighter) continue;
      v.copy(fighter.rig.group.position);
      v.y += 1.5;
      v.project(this.camera);
      label.style.left = `${((v.x + 1) / 2) * rect.width}px`;
      label.style.top = `${((-v.y + 1) / 2) * rect.height}px`;
    }
  }

  private onResize(): void {
    this.resize();
  }

  private resize(): void {
    const w = this.el.clientWidth || 800;
    const h = this.el.clientHeight || 400;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    // Narrow screens need a wider lens or the outer two insects fall off the sides.
    this.camera.fov = w / h < 1.25 ? 52 : 38;
    this.camera.updateProjectionMatrix();
  }

  dispose(): void {
    this.disposed = true;
    this.renderer.setAnimationLoop(null);
    window.removeEventListener('resize', this.onResize);
    for (const fighter of this.fighters.values()) fighter.rig.dispose();
    this.fighters.clear();
    for (const label of this.labels.values()) label.remove();
    this.labels.clear();
    this.scene.traverse((o) => {
      if (o instanceof THREE.Mesh || o instanceof THREE.InstancedMesh) {
        o.geometry.dispose();
        const m = o.material;
        if (Array.isArray(m)) m.forEach((x) => x.dispose());
        else m.dispose();
      }
    });
    this.renderer.dispose();
    this.el.remove();
  }
}

const ease = (k: number) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
const easeOut = (k: number) => 1 - Math.pow(1 - k, 3);

/** Shortest way round, so a turn never takes the long path. */
function lerpAngle(from: number, to: number, k: number): number {
  let delta = ((to - from + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (delta < -Math.PI) delta += Math.PI * 2;
  return from + delta * k;
}
