/**
 * A parametric hexapod, built from the same `BodyParams` the 2D drawing uses.
 *
 * One rig covers all 118 species. It cannot be photoreal — that would mean modelling each
 * animal by hand — but it is driven by real proportions, so the silhouettes genuinely
 * differ: a beetle comes out squat and armoured, a mantis long-limbed with raptorial
 * forelegs held up, a stick insect thin and absurdly elongated, a dragonfly a long abdomen
 * behind four membranous wings.
 *
 * Anatomy follows the real thing where it costs nothing: head / thorax / abdomen, six legs
 * in three pairs off the thorax only, each leg a femur-tibia-tarsus chain that goes out,
 * up, then down to the ground. That last detail is most of why an insect reads as an
 * insect rather than as a spider or a lizard.
 */

import * as THREE from 'three';
import type { BodyParams, Palette } from '../content/species';

/**
 * Attack poses, keyed the same way skill icons are, so every one of the 354 skills gets a
 * matching animation without a second mapping to maintain.
 */
export type RigClip =
  | 'strike' | 'multihit' | 'aoe' | 'execute'
  | 'dot' | 'stun' | 'debuff' | 'strip'
  | 'heal' | 'revive' | 'drain'
  | 'shield' | 'buff' | 'cleanse' | 'evade';

export interface InsectRig {
  group: THREE.Group;
  /** Advance the idle animation. `t` is seconds. */
  tick: (t: number) => void;
  /** Play an attack pose once. Returns how long it will take, in seconds. */
  play: (clip: RigClip) => number;
  dispose: () => void;
}

interface ClipSpec {
  duration: number;
  /**
   * Applies the pose. `k` runs 0 → 1 → 0 across the clip, so a clip only has to describe
   * its extreme and it eases in and back out on its own.
   */
  apply: (k: number, parts: Parts) => void;
}

interface Parts {
  root: THREE.Group;
  /** Everything that is the animal, so a pose can tilt it without tilting the framing. */
  torso: THREE.Group;
  head: THREE.Group;
  abdomen: THREE.Group;
  wings: THREE.Object3D[];
  arms: THREE.Group[];
  legs: { femur: THREE.Group; tibia: THREE.Group }[];
  /** Lit up during a clip, for a flash of colour on the shell. */
  glow: THREE.MeshStandardMaterial;
  glowColour: THREE.Color;
}

/**
 * The pose table.
 *
 * Deliberately exaggerated: at card size a subtle motion reads as no motion at all. Each
 * one is a physical idea rather than a generic wobble — a spray recoils, a shield hunkers,
 * a revive rears up and flares its wings.
 */
const CLIPS: Record<RigClip, ClipSpec> = {
  strike: {
    duration: 0.52,
    apply: (k, p) => {
      p.root.position.z += k * 0.42;
      p.torso.rotation.x = -k * 0.34;
      p.head.rotation.x = k * 0.3;
    },
  },
  multihit: {
    duration: 0.72,
    apply: (k, p) => {
      // Three jabs inside one clip.
      const jab = Math.abs(Math.sin(k * Math.PI * 3));
      p.root.position.z += jab * 0.3;
      p.head.rotation.x = jab * 0.34;
      p.root.rotation.z += Math.sin(k * Math.PI * 6) * 0.05;
    },
  },
  aoe: {
    duration: 0.78,
    apply: (k, p) => {
      // Rear up, then slam down and out.
      const rear = Math.min(1, k * 1.7);
      const slam = Math.max(0, (k - 0.55) / 0.45);
      p.torso.rotation.x = rear * 0.55 - slam * 0.9;
      p.root.position.y += rear * 0.22 - slam * 0.24;
      for (const w of p.wings) w.rotation.z = rear * 0.9;
      for (const l of p.legs) l.femur.rotation.z *= 1 + rear * 0.12;
    },
  },
  execute: {
    duration: 0.62,
    apply: (k, p) => {
      // A long wind-up, then a single hard drop.
      const wind = Math.min(1, k * 1.4);
      const drop = Math.max(0, (k - 0.6) / 0.4);
      p.torso.rotation.x = wind * 0.42 - drop * 1.15;
      p.root.position.z += drop * 0.5;
      p.head.rotation.x = drop * 0.5;
    },
  },
  dot: {
    duration: 0.7,
    apply: (k, p) => {
      // Abdomen swings up and forward over the back, body recoils. The bombardier pose.
      p.abdomen.rotation.x = -k * 1.15;
      p.root.position.z -= k * 0.16;
      p.torso.rotation.x = k * 0.2;
    },
  },
  stun: {
    duration: 0.46,
    apply: (k, p) => {
      const snap = Math.abs(Math.sin(k * Math.PI * 2));
      p.head.rotation.x = snap * 0.62;
      p.root.position.z += snap * 0.24;
      for (const a of p.arms) a.rotation.x -= snap * 0.5;
    },
  },
  debuff: {
    duration: 0.6,
    apply: (k, p) => {
      // Lean in and sweep, as if smearing something on the target.
      p.torso.rotation.x = -k * 0.3;
      p.root.rotation.y += Math.sin(k * Math.PI) * 0.34;
      p.root.position.z += k * 0.2;
    },
  },
  strip: {
    duration: 0.58,
    apply: (k, p) => {
      // Reach out and pull back sharply.
      const reach = Math.min(1, k * 2);
      const pull = Math.max(0, (k - 0.5) / 0.5);
      p.root.position.z += reach * 0.34 - pull * 0.5;
      for (const a of p.arms) a.rotation.x = -reach * 0.7 + pull * 0.4;
    },
  },
  heal: {
    duration: 0.9,
    apply: (k, p) => {
      // Rise, open up, settle. Nothing aggressive.
      p.root.position.y += k * 0.26;
      p.torso.rotation.x = k * 0.2;
      for (const w of p.wings) w.rotation.z = k * 0.55;
      p.glow.emissiveIntensity = k * 1.5;
    },
  },
  revive: {
    duration: 1.05,
    apply: (k, p) => {
      p.root.position.y += k * 0.4;
      p.torso.rotation.x = k * 0.5;
      p.root.rotation.y += k * 0.7;
      for (const w of p.wings) w.rotation.z = k * 1.15;
      p.glow.emissiveIntensity = k * 2.4;
    },
  },
  drain: {
    duration: 0.72,
    apply: (k, p) => {
      // Bite in, then draw back while feeding.
      const bite = Math.min(1, k * 2.2);
      p.root.position.z += bite * 0.36 - Math.max(0, k - 0.45) * 0.3;
      p.head.rotation.x = bite * 0.4;
      p.abdomen.scale.setScalar(1 + k * 0.14);
      p.glow.emissiveIntensity = k * 1.1;
    },
  },
  shield: {
    duration: 0.8,
    apply: (k, p) => {
      // Hunker: drop, tuck the legs, pull the head in.
      p.root.position.y -= k * 0.16;
      p.torso.rotation.x = k * 0.12;
      p.head.rotation.x = -k * 0.4;
      for (const l of p.legs) l.tibia.rotation.z *= 1 - k * 0.28;
      p.glow.emissiveIntensity = k * 1.2;
    },
  },
  buff: {
    duration: 0.78,
    apply: (k, p) => {
      p.root.position.y += k * 0.22;
      p.torso.rotation.x = k * 0.28;
      for (const a of p.arms) a.rotation.x = -k * 0.6;
      for (const w of p.wings) w.rotation.z = k * 0.7;
      p.glow.emissiveIntensity = k * 1.8;
    },
  },
  cleanse: {
    duration: 0.82,
    apply: (k, p) => {
      // A shake, the way an animal actually sheds something.
      p.root.rotation.y += Math.sin(k * Math.PI * 5) * 0.2;
      p.root.position.y += k * 0.1;
      p.glow.emissiveIntensity = k * 1.4;
    },
  },
  evade: {
    duration: 0.5,
    apply: (k, p) => {
      // Dart sideways and back.
      p.root.position.x += Math.sin(k * Math.PI) * 0.42;
      p.root.rotation.z += Math.sin(k * Math.PI) * 0.22;
    },
  },
};

/** Deterministic jitter, so the same species always looks the same. */
function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashId(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619) >>> 0;
  return h;
}

/** Chitin: tight highlight, low roughness variation, never metallic. */
function shell(colour: string, opts: { rough?: number; flat?: boolean } = {}): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: colour,
    roughness: opts.rough ?? 0.42,
    metalness: 0.08,
    flatShading: opts.flat ?? false,
  });
}

/**
 * A tapered tube from one point to another.
 *
 * Segments are built from explicit endpoints rather than chained Euler angles. The first
 * version of this rig chained rotations about Z and got the sign wrong, so every right-hand
 * leg swung *across* the body and the tibia pointed up: the animal looked like a dead
 * spider. Endpoints cannot express that mistake — if the foot is at y=0, the foot is on
 * the ground.
 */
function segment(
  from: THREE.Vector3,
  to: THREE.Vector3,
  r0: number,
  r1: number,
  mat: THREE.Material,
): THREE.Mesh {
  const dir = new THREE.Vector3().subVectors(to, from);
  const len = dir.length() || 0.001;
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r0, r1, len, 6), mat);
  // Cylinders are built along +Y, so aim that axis down the segment.
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
  mesh.position.copy(from).addScaledVector(dir, 0.5);
  mesh.castShadow = true;
  return mesh;
}

/**
 * One leg, as a real insect holds it: coxa out from the body, femur out and *up* to a knee
 * above the body line, then tibia and tarsus back down to the ground. That raised knee is
 * most of why an insect reads as an insect.
 */
function buildLeg(
  side: 1 | -1,
  pair: 0 | 1 | 2,
  body: BodyParams,
  ride: number,
  mat: THREE.Material,
): { group: THREE.Group; hip: THREE.Group } {
  const scale = body.size;
  const reach = 0.62 * body.legs * scale;
  // Middle pair shortest, hind pair longest — the usual arrangement.
  const byPair = [0.94, 0.86, 1.18][pair]!;
  const out = reach * byPair;
  const thick = 0.042 * scale * (0.85 + body.girth * 0.2);

  const group = new THREE.Group();
  const hip = new THREE.Group();
  group.add(hip);

  // Front pair reaches forward, hind pair back.
  const forward = [0.42, 0.0, -0.5][pair]! * out;

  const origin = new THREE.Vector3(0, 0, 0);
  // Knee sits above the body, out to the side and part-way along the reach.
  const knee = new THREE.Vector3(side * out * 0.62, ride * 0.55, forward * 0.45);
  // Foot on the floor, further out and further along.
  const foot = new THREE.Vector3(side * out * 0.95, -ride, forward);

  hip.add(segment(origin, knee, thick, thick * 1.25, mat));
  const kneeBall = new THREE.Mesh(new THREE.SphereGeometry(thick * 1.3, 8, 6), mat);
  kneeBall.position.copy(knee);
  hip.add(kneeBall);

  // Tibia stops short of the floor; the tarsus finishes the job, angled forward.
  const ankle = new THREE.Vector3().lerpVectors(knee, foot, 0.78);
  hip.add(segment(knee, ankle, thick * 0.9, thick * 0.55, mat));
  hip.add(segment(ankle, foot, thick * 0.5, thick * 0.26, mat));

  return { group, hip };
}

/**
 * A mantis-style foreleg, folded in front: femur angled up and forward, tibia hinged back
 * along it, spines on the inner edge. The Z-shape is the whole silhouette.
 */
function buildRaptorial(side: 1 | -1, body: BodyParams, mat: THREE.Material): THREE.Group {
  const scale = body.size;
  const root = new THREE.Group();
  const thick = 0.055 * scale;

  const origin = new THREE.Vector3(0, 0, 0);
  const elbow = new THREE.Vector3(side * 0.2 * scale, 0.34 * scale, 0.34 * scale);
  // Tibia folds back toward the head, ending above and in front of the shoulder.
  const claw = new THREE.Vector3(side * 0.1 * scale, 0.14 * scale, 0.62 * scale);

  root.add(segment(origin, elbow, thick * 1.4, thick, mat));
  const joint = new THREE.Mesh(new THREE.SphereGeometry(thick * 1.5, 8, 6), mat);
  joint.position.copy(elbow);
  root.add(joint);
  root.add(segment(elbow, claw, thick * 1.05, thick * 0.4, mat));

  // Spines along the grasping edge of the tibia.
  const along = new THREE.Vector3().subVectors(claw, elbow);
  for (let i = 0; i < 5; i++) {
    const spine = new THREE.Mesh(new THREE.ConeGeometry(thick * 0.28, thick * 2.1, 4), mat);
    const at = new THREE.Vector3().copy(elbow).addScaledVector(along, 0.18 + i * 0.18);
    spine.position.copy(at).add(new THREE.Vector3(0, -thick * 1.1, 0));
    spine.rotation.x = Math.PI;
    root.add(spine);
  }

  return root;
}

/** Membranous wings, or hardened elytra that split down the middle. */
function buildWings(body: BodyParams, palette: Palette, abdomenLen: number): THREE.Group {
  const group = new THREE.Group();
  const scale = body.size;

  if (body.wings === 1) {
    // Elytra: two hard covers over the abdomen, meeting at a seam.
    const mat = shell(palette.carapace, { rough: 0.3 });
    for (const side of [1, -1] as const) {
      const geo = new THREE.SphereGeometry(1, 16, 12, 0, Math.PI, 0, Math.PI);
      const cover = new THREE.Mesh(geo, mat);
      cover.scale.set(0.3 * body.girth * scale, 0.24 * scale, abdomenLen * 0.52);
      cover.position.set(side * 0.145 * body.girth * scale, 0.04 * scale, -abdomenLen * 0.42);
      cover.rotation.y = side === 1 ? 0 : Math.PI;
      cover.castShadow = true;
      group.add(cover);
    }
    return group;
  }

  if (body.wings === 2) {
    // Two pairs of translucent wings, swept back at rest.
    const mat = new THREE.MeshStandardMaterial({
      color: palette.accent,
      transparent: true,
      opacity: 0.3,
      roughness: 0.15,
      metalness: 0.1,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const veinMat = new THREE.MeshStandardMaterial({ color: palette.carapace, roughness: 0.5 });

    for (const side of [1, -1] as const) {
      for (const pair of [0, 1] as const) {
        const wing = new THREE.Group();
        const len = (pair === 0 ? 1.25 : 1.0) * scale;
        const wid = (pair === 0 ? 0.34 : 0.3) * scale;

        const blade = new THREE.Mesh(new THREE.CircleGeometry(0.5, 18), mat);
        blade.scale.set(wid * 2, len * 2, 1);
        blade.position.set(0, 0, -len * 0.5);
        blade.rotation.x = -Math.PI / 2;
        wing.add(blade);

        // A leading-edge vein stops the wing reading as a flat cut-out.
        const vein = new THREE.Mesh(new THREE.CylinderGeometry(0.012 * scale, 0.02 * scale, len, 4), veinMat);
        vein.position.set(-wid * 0.9 * side, 0.004, -len * 0.5);
        vein.rotation.x = Math.PI / 2;
        wing.add(vein);

        wing.position.set(side * 0.1 * scale, 0.1 * scale, -0.1 * scale - pair * 0.12 * scale);
        wing.rotation.set(pair === 0 ? -0.08 : -0.02, side * (pair === 0 ? 0.34 : 0.5), 0);
        wing.name = `wing-${side}-${pair}`;
        group.add(wing);
      }
    }
    return group;
  }

  return group;
}

/**
 * Builds the whole animal. `id` seeds the small asymmetries so a species always looks
 * identical between sessions and between the two players in a duel.
 */
export function buildInsect(id: string, body: BodyParams, palette: Palette): InsectRig {
  const rng = seeded(hashId(id));
  const group = new THREE.Group();
  const scale = body.size;

  const carapace = shell(palette.carapace);
  const underside = shell(palette.underside, { rough: 0.55 });
  const accent = shell(palette.accent, { rough: 0.35 });
  const eyeMat = new THREE.MeshStandardMaterial({
    color: palette.eye,
    roughness: 0.12,
    metalness: 0.25,
  });
  const materials = [carapace, underside, accent, eyeMat];

  const ride = 0.34 * scale * body.stance; // how high the body sits off the ground
  const thoraxLen = 0.52 * scale;
  const thoraxWid = 0.3 * scale * (0.72 + body.girth * 0.34);
  const abdomenLen = 0.62 * scale * body.abdomen;

  // ── thorax ──
  const thorax = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), carapace);
  thorax.scale.set(thoraxWid, thoraxWid * 0.82, thoraxLen);
  thorax.position.set(0, ride, 0);
  thorax.castShadow = true;
  group.add(thorax);

  // Pronotum: the plate over the front of the thorax, prominent on beetles.
  const pronotum = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), accent);
  pronotum.scale.set(thoraxWid * 0.92, thoraxWid * 0.62, thoraxLen * 0.46);
  pronotum.position.set(0, ride + thoraxWid * 0.16, thoraxLen * 0.5);
  pronotum.castShadow = true;
  group.add(pronotum);

  // ── abdomen, tapering and segmented ──
  const abdomen = new THREE.Group();
  abdomen.position.set(0, ride, -thoraxLen * 0.75);
  group.add(abdomen);

  const SEGMENTS = 6;
  for (let i = 0; i < SEGMENTS; i++) {
    const t = i / (SEGMENTS - 1);
    const taper = 1 - Math.pow(t, 1.6) * 0.72;
    const seg = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 10), i % 2 ? underside : carapace);
    const wid = thoraxWid * 0.96 * body.girth * taper;
    seg.scale.set(wid, wid * 0.8, (abdomenLen / SEGMENTS) * 0.78);
    seg.position.set(0, -t * 0.04 * scale, -(abdomenLen / SEGMENTS) * i);
    seg.castShadow = true;
    abdomen.add(seg);
  }

  // ── head ──
  const head = new THREE.Group();
  head.position.set(0, ride + thoraxWid * 0.1, thoraxLen * 0.92);
  group.add(head);

  const headR = thoraxWid * 0.72;
  const skull = new THREE.Mesh(new THREE.SphereGeometry(headR, 16, 12), carapace);
  skull.scale.set(1.12, 0.92, 0.9);
  skull.castShadow = true;
  head.add(skull);

  // Compound eyes: big, bulging, wrapped around the sides.
  for (const side of [1, -1] as const) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(headR * 0.46, 14, 10), eyeMat);
    eye.scale.set(0.9, 1.1, 0.85);
    eye.position.set(side * headR * 0.78, headR * 0.16, headR * 0.2);
    head.add(eye);
  }

  // ── mandibles ──
  if (body.mandibles) {
    const m = body.mandibles;
    for (const side of [1, -1] as const) {
      const jaw = new THREE.Mesh(
        new THREE.ConeGeometry(headR * 0.16 * m, headR * 1.5 * m, 5),
        accent,
      );
      jaw.position.set(side * headR * 0.42, -headR * 0.2, headR * 0.9);
      jaw.rotation.set(Math.PI / 2 - 0.35, 0, side * 0.42);
      jaw.castShadow = true;
      head.add(jaw);
    }
  }

  // ── antennae ──
  const antennae: THREE.Group[] = [];
  if (body.antennae > 0) {
    const len = 0.85 * scale * body.antennae;
    // Enough beads that they overlap into a segmented whip rather than a dotted line.
    const beads = Math.max(9, Math.round(14 * body.antennae));
    for (const side of [1, -1] as const) {
      const stalk = new THREE.Group();
      stalk.position.set(side * headR * 0.5, headR * 0.42, headR * 0.55);
      stalk.rotation.set(-0.5, side * 0.5, 0);
      // Built from beads along a curve, which bends far more convincingly than a tube.
      for (let i = 0; i < beads; i++) {
        const t = i / (beads - 1);
        const bead = new THREE.Mesh(
          new THREE.SphereGeometry(0.032 * scale * (1 - t * 0.35), 6, 5),
          accent,
        );
        bead.position.set(0, len * t, -Math.pow(t, 2) * len * 0.32);
        stalk.add(bead);
      }
      head.add(stalk);
      antennae.push(stalk);
    }
  }

  // ── legs ──
  const legs: { femur: THREE.Group; tibia: THREE.Group }[] = [];
  const pairZ = [thoraxLen * 0.42, 0, -thoraxLen * 0.46];
  for (const pair of [0, 1, 2] as const) {
    // A raptorial species uses its first pair for grasping, not walking.
    if (pair === 0 && body.raptorial) continue;
    for (const side of [1, -1] as const) {
      const hipHeight = ride - thoraxWid * 0.12;
      const leg = buildLeg(side, pair, body, hipHeight, carapace);
      leg.group.position.set(side * thoraxWid * 0.78, hipHeight, pairZ[pair]!);
      group.add(leg.group);
      // Poses and idle both nudge the whole leg at the hip, which is enough at this size
      // and cannot fold a foot through the floor.
      legs.push({ femur: leg.hip, tibia: leg.hip });
    }
  }

  const raptorialArms: THREE.Group[] = [];
  if (body.raptorial) {
    for (const side of [1, -1] as const) {
      const arm = buildRaptorial(side, body, carapace);
      arm.position.set(side * thoraxWid * 0.5, ride + thoraxWid * 0.1, thoraxLen * 0.62);
      group.add(arm);
      raptorialArms.push(arm);
    }
  }

  // ── wings ──
  const wings = buildWings(body, palette, abdomenLen);
  wings.position.set(0, ride + thoraxWid * 0.42, -thoraxLen * 0.2);
  group.add(wings);
  const flappers = wings.children.filter((c) => c.name.startsWith('wing-'));

  // Small per-species asymmetry so no two rigs look machine-stamped.
  group.rotation.z = (rng() - 0.5) * 0.03;

  const restLegs = legs.map((l) => ({ femur: l.femur.rotation.z, tibia: l.tibia.rotation.z }));
  const restAntennae = antennae.map((a) => a.rotation.x);
  const phases = legs.map(() => rng() * Math.PI * 2);
  const antennaPhases = antennae.map(() => rng() * Math.PI * 2);

  /*
   * Clips move `body` and `pose` rather than `group`, because `group` carries the framing
   * transform and the viewer's own yaw. Writing poses onto it would fight both.
   */
  const pose = new THREE.Group();
  const torso = new THREE.Group();
  // Re-parent everything built so far under the two pose groups.
  const built = [...group.children];
  group.add(pose);
  pose.add(torso);
  for (const child of built) torso.add(child);

  const glow = accent;
  const glowColour = new THREE.Color(palette.accent);
  glow.emissive = glowColour;
  glow.emissiveIntensity = 0;

  const parts: Parts = {
    root: pose,
    torso,
    head,
    abdomen,
    wings: flappers.length > 0 ? flappers : wings.children,
    arms: raptorialArms,
    legs,
    glow,
    glowColour,
  };

  let clip: { spec: ClipSpec; started: number } | null = null;
  let now = 0;

  return {
    group,
    play(kind) {
      const spec = CLIPS[kind];
      clip = { spec, started: now };
      return spec.duration;
    },
    tick(t) {
      now = t;

      // Idle first, then the clip on top, so a pose never has to restate the idle.
      pose.position.set(0, 0, 0);
      pose.rotation.set(0, 0, 0);
      torso.rotation.set(0, 0, 0);
      head.rotation.x = 0;
      abdomen.rotation.x = 0;
      glow.emissiveIntensity = 0;

      // Breathing: the abdomen is the soft part, so it is the part that moves.
      const breathe = Math.sin(t * 1.6) * 0.5 + 0.5;
      abdomen.scale.setScalar(1 + breathe * 0.035);
      abdomen.position.y = ride - breathe * 0.008 * scale;

      // Legs micro-adjust, out of phase, the way a standing insect never quite settles.
      legs.forEach((leg, i) => {
        const wobble = Math.sin(t * 2.1 + phases[i]!) * 0.035;
        leg.femur.rotation.z = restLegs[i]!.femur + wobble;
        leg.tibia.rotation.z = restLegs[i]!.tibia - wobble * 1.4;
      });

      // Antennae sweep constantly — the single most alive-looking thing an insect does.
      antennae.forEach((a, i) => {
        a.rotation.x = restAntennae[i]! + Math.sin(t * 1.15 + antennaPhases[i]!) * 0.26;
        a.rotation.z = Math.cos(t * 0.9 + antennaPhases[i]!) * 0.16;
      });

      // Membranous wings shiver rather than flap; a flap at rest would look wrong.
      flappers.forEach((w, i) => {
        w.rotation.z = Math.sin(t * 9 + i) * 0.03;
      });

      if (clip) {
        const progress = (t - clip.started) / clip.spec.duration;
        if (progress >= 1) {
          clip = null;
        } else {
          // Ease out and back: 0 → 1 → 0, so the pose returns to rest by itself.
          const eased = Math.sin(Math.min(1, Math.max(0, progress)) * Math.PI);
          clip.spec.apply(eased, parts);
        }
      }
    },
    dispose() {
      group.traverse((o) => {
        if (o instanceof THREE.Mesh) o.geometry.dispose();
      });
      for (const m of materials) m.dispose();
    },
  };
}
