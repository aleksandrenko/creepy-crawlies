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
import { rigStyle, type RigStyle, type StyleId, RIG_STYLES } from './rigStyle';

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
  /**
   * Lights the shell up during a clip.
   *
   * A function rather than the material itself, because not every style uses a material
   * that has an emissive channel — a toon or basic material simply has nothing to set.
   */
  setGlow: (intensity: number) => void;
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
      p.setGlow(k * 1.5);
    },
  },
  revive: {
    duration: 1.05,
    apply: (k, p) => {
      p.root.position.y += k * 0.4;
      p.torso.rotation.x = k * 0.5;
      p.root.rotation.y += k * 0.7;
      for (const w of p.wings) w.rotation.z = k * 1.15;
      p.setGlow(k * 2.4);
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
      p.setGlow(k * 1.1);
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
      p.setGlow(k * 1.2);
    },
  },
  buff: {
    duration: 0.78,
    apply: (k, p) => {
      p.root.position.y += k * 0.22;
      p.torso.rotation.x = k * 0.28;
      for (const a of p.arms) a.rotation.x = -k * 0.6;
      for (const w of p.wings) w.rotation.z = k * 0.7;
      p.setGlow(k * 1.8);
    },
  },
  cleanse: {
    duration: 0.82,
    apply: (k, p) => {
      // A shake, the way an animal actually sheds something.
      p.root.rotation.y += Math.sin(k * Math.PI * 5) * 0.2;
      p.root.position.y += k * 0.1;
      p.setGlow(k * 1.4);
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

/** Places a mesh in one call, the way the original builder did. Keeps the body readable. */
function put(
  parent: THREE.Object3D,
  geo: THREE.BufferGeometry,
  mat: THREE.Material,
  pos: [number, number, number],
  scale?: [number, number, number],
  rot?: [number, number, number],
): THREE.Mesh {
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(...pos);
  if (scale) mesh.scale.set(...scale);
  if (rot) mesh.rotation.set(...rot);
  mesh.castShadow = true;
  parent.add(mesh);
  return mesh;
}

/**
 * One leg: hip held almost horizontally, a long femur out to a raised knee, then a tibia
 * nearly twice its length angled back down to a foot.
 *
 * The proportions are the important part. Real insect legs are absurdly thin and long
 * next to the body — around twenty times thinner than the thorax is wide — and getting
 * that ratio wrong is what made the first attempt look like a beetle-shaped animal with
 * dog legs.
 */
function buildLeg(
  side: 1 | -1,
  pair: 0 | 1 | 2,
  body: BodyParams,
  mat: THREE.Material,
  kneeMat: THREE.Material,
  style: RigStyle,
): { hip: THREE.Group; knee: THREE.Group } {
  const scale = body.size;
  const reach = body.legs * scale;
  const femurLen = 0.44 * reach;
  const tibiaLen = 0.82 * reach;
  const thick = 0.016 * scale;

  const hip = new THREE.Group();
  // Front pair reaches forward, middle out, hind pair back.
  hip.rotation.x = [-0.5, 0.1, 0.52][pair]!;
  // Almost flat to the side: this is what lifts the knee above the body.
  hip.rotation.z = side * -1.4;

  const femur = new THREE.CylinderGeometry(thick, thick * 0.82, femurLen, style.radial);
  femur.translate(0, femurLen / 2, 0);
  put(hip, femur, mat, [0, 0, 0]);

  const knee = new THREE.Group();
  knee.position.y = femurLen;
  // A deeper bend than the original used. With a shallow one the tibia stayed almost
  // horizontal and the legs radiated outward like a sea urchin instead of reaching down.
  knee.rotation.z = side * 0.72;
  hip.add(knee);

  put(knee, new THREE.SphereGeometry(thick * 1.6, style.radial, style.radial - 2), kneeMat, [0, 0, 0]);

  // Rotated a half turn, so it runs back down toward the floor.
  const tibia = new THREE.CylinderGeometry(thick * 0.75, thick * 0.5, tibiaLen, style.radial);
  tibia.translate(0, tibiaLen / 2, 0);
  put(knee, tibia, mat, [0, 0, 0], undefined, [0, 0, Math.PI]);

  // A foot at the far end, which is what makes the leg look planted.
  put(knee, new THREE.SphereGeometry(thick * 1.1, style.radial, style.radial - 2), kneeMat, [0, -tibiaLen, 0]);

  return { hip, knee };
}

/** A mantis foreleg: thick femur up and forward, tibia folded back along it, inner spines. */
function buildRaptorial(side: 1 | -1, body: BodyParams, mat: THREE.Material, style: RigStyle): THREE.Group {
  const scale = body.size;
  const root = new THREE.Group();
  const thick = 0.03 * scale;
  const femurLen = 0.42 * scale;
  const tibiaLen = 0.34 * scale;

  root.rotation.set(-0.55, side * 0.4, side * 0.55);

  const femur = new THREE.CylinderGeometry(thick * 1.5, thick, femurLen, style.radial);
  femur.translate(0, femurLen / 2, 0);
  put(root, femur, mat, [0, 0, 0]);

  const elbow = new THREE.Group();
  elbow.position.y = femurLen;
  // Folded sharply back on itself — the shape that says mantis at a glance.
  elbow.rotation.z = -side * 2.5;
  root.add(elbow);

  const tibia = new THREE.CylinderGeometry(thick, thick * 0.5, tibiaLen, style.radial);
  tibia.translate(0, tibiaLen / 2, 0);
  put(elbow, tibia, mat, [0, 0, 0]);

  for (let i = 0; i < 5; i++) {
    put(
      elbow,
      new THREE.ConeGeometry(thick * 0.26, thick * 1.7, 4),
      mat,
      [thick * 0.9, tibiaLen * (0.16 + i * 0.18), 0],
      undefined,
      [0, 0, -Math.PI / 2],
    );
  }

  return root;
}

/** Two membranous wings per side, swept back at rest. */
function buildWings(palette: Palette, scale: number, style: RigStyle): THREE.Group {
  const group = new THREE.Group();
  const mat = style.material(palette.accent, 'wing', palette);
  const veinMat = style.material(palette.carapace, 'shell', palette);

  for (const side of [1, -1] as const) {
    for (const pair of [0, 1] as const) {
      const wing = new THREE.Group();
      const len = (pair === 0 ? 0.95 : 0.72) * scale;
      const wid = (pair === 0 ? 0.2 : 0.16) * scale;

      const blade = new THREE.CircleGeometry(0.5, 16);
      blade.rotateX(-Math.PI / 2);
      put(wing, blade, mat, [0, 0, -len * 0.5], [wid * 2, 1, len * 2]);

      const vein = new THREE.CylinderGeometry(0.006 * scale, 0.01 * scale, len, Math.max(4, style.radial - 4));
      put(wing, vein, veinMat, [-wid * 0.85 * side, 0.004, -len * 0.5], undefined, [Math.PI / 2, 0, 0]);

      wing.position.set(side * 0.04 * scale, 0.06 * scale, -0.06 * scale - pair * 0.09 * scale);
      wing.rotation.set(pair === 0 ? -0.06 : -0.02, side * (pair === 0 ? 0.36 : 0.52), 0);
      wing.name = `wing-${side}-${pair}`;
      group.add(wing);
    }
  }
  return group;
}

/**
 * Builds the whole animal.
 *
 * Two archetypes, chosen by whether the species has hardened wing cases: a beetle gets a
 * flattened faceted dome with crust bumps, and everything else gets a slender tube thorax
 * with a chained, tapering abdomen. Trying to serve both from one blobby shape was why the
 * first version made a hornet and a stag beetle look like the same animal.
 */
export function buildInsect(
  id: string,
  body: BodyParams,
  palette: Palette,
  styleId?: StyleId,
): InsectRig {
  const style = styleId ? RIG_STYLES[styleId] : rigStyle();
  const rng = seeded(hashId(id));
  const group = new THREE.Group();
  const pose = new THREE.Group();
  const torso = new THREE.Group();
  group.add(pose);
  pose.add(torso);

  const scale = body.size;
  const carapace = style.material(palette.carapace, 'shell', palette);
  const underside = style.material(palette.underside, 'under', palette);
  const accent = style.material(palette.accent, 'accent', palette);
  const eyeMat = style.material(palette.eye, 'eye', palette);
  const materials = [carapace, underside, accent, eyeMat];

  const beetle = body.wings === 1;
  // Body radius is small: everything else is sized against it, as in the original.
  const rad = 0.055 * scale * (0.8 + body.girth * 0.32);
  const ride = 0.42 * scale * body.stance;
  const thoraxLen = 0.62 * scale;

  // ── thorax ──
  if (beetle) {
    // A flattened, faceted dome — the elytra read as the body itself on a beetle.
    put(torso, new THREE.IcosahedronGeometry(rad * 6.2, style.icoDetail), carapace,
      [0, ride, -0.05 * scale], [0.85, 0.44, 1.18]);
    // Crust: small bumps riding the surface of the dome.
    for (let i = 0; i < 14; i++) {
      const bx = (rng() - 0.5) * rad * 7;
      const bz = -0.05 * scale + (rng() - 0.5) * rad * 12;
      const lift = Math.sqrt(Math.max(0, 1 - Math.pow(bx / (rad * 5), 2) - Math.pow(bz / (rad * 7), 2)));
      put(torso, new THREE.IcosahedronGeometry(rad * (0.6 + rng() * 0.5), Math.max(0, style.icoDetail - 1)),
        rng() < 0.4 ? accent : carapace,
        [bx, ride + lift * rad * 2.4, bz], undefined,
        [rng() * 3, rng() * 3, 0]);
    }
    // A seam down the middle, so the two wing cases are legible.
    put(torso, new THREE.BoxGeometry(rad * 0.16, rad * 0.5, thoraxLen * 1.5), underside,
      [0, ride + rad * 2.4, -0.05 * scale]);
  } else {
    const tube = new THREE.CylinderGeometry(rad * 0.9, rad, thoraxLen, style.radial + 1);
    put(torso, tube, carapace, [0, ride, 0.18 * scale], undefined, [Math.PI / 2, 0, 0]);
    // The waist: a narrow collar between thorax and abdomen.
    put(torso, new THREE.CylinderGeometry(rad * 1.04, rad * 1.04, 0.08 * scale, style.radial + 1), accent,
      [0, ride, 0.45 * scale], undefined, [Math.PI / 2, 0, 0]);
  }

  // ── head ──
  const head = new THREE.Group();
  head.position.set(0, ride + (beetle ? rad * 1.2 : 0.01 * scale), (beetle ? 0.42 : 0.56) * scale);
  torso.add(head);

  const headR = rad * (beetle ? 2.6 : 1.3);
  // Elongated forward rather than round: a round head reads as a spider.
  put(head, new THREE.IcosahedronGeometry(headR, style.icoDetail), carapace, [0, 0, 0], [0.85, 0.8, 1.25]);
  for (const side of [1, -1] as const) {
    put(head, new THREE.SphereGeometry(headR * 0.32, style.radial + 2, style.radial), eyeMat,
      [side * headR * 0.62, headR * 0.2, headR * 0.4]);
  }

  if (body.mandibles) {
    const m = body.mandibles;
    for (const side of [1, -1] as const) {
      put(head, new THREE.ConeGeometry(headR * 0.17 * m, headR * 1.6 * m, 5), accent,
        [side * headR * 0.4, -headR * 0.16, headR * 0.95],
        undefined, [Math.PI / 2 - 0.3, 0, side * 0.4]);
    }
  }

  // ── antennae: one long thin whip each, not a row of beads ──
  const antennae: THREE.Group[] = [];
  if (body.antennae > 0) {
    const len = 0.62 * scale * body.antennae;
    for (const side of [1, -1] as const) {
      const stalk = new THREE.Group();
      stalk.position.set(side * headR * 0.42, headR * 0.35, headR * 0.5);
      stalk.rotation.set(1.35, 0, side * -0.35);
      const geo = new THREE.CylinderGeometry(0.007 * scale, 0.004 * scale, len, Math.max(4, style.radial - 2));
      geo.translate(0, len / 2, 0);
      put(stalk, geo, accent, [0, 0, 0]);
      head.add(stalk);
      antennae.push(stalk);
    }
  }

  // ── abdomen: a chain, each segment hanging off the last so it curves ──
  const abdomen = new THREE.Group();
  abdomen.position.set(0, ride, (beetle ? -0.3 : 0.3) * scale);
  torso.add(abdomen);

  if (beetle) {
    // Beetles keep theirs under the shell; just a stub so the silhouette closes.
    put(abdomen, new THREE.IcosahedronGeometry(rad * 3.4, style.icoDetail), underside,
      [0, -rad * 0.4, -thoraxLen * 0.5], [0.7, 0.5, 0.9]);
  } else {
    const segments = Math.max(3, Math.round(5 * body.abdomen));
    const segLen = (0.27 * scale * body.abdomen * 5) / segments;
    let parent: THREE.Object3D = abdomen;
    let segRad = rad * 0.94 * body.girth;
    for (let i = 0; i < segments; i++) {
      const seg = new THREE.Group();
      seg.position.z = i === 0 ? 0 : -segLen * 0.96;
      // A constant small droop per joint, which is what gives the curve.
      seg.rotation.x = -0.05;
      const geo = new THREE.CylinderGeometry(segRad * 0.82, segRad, segLen, style.radial + 1);
      put(seg, geo, i % 2 ? underside : carapace, [0, 0, -segLen / 2], undefined, [Math.PI / 2, 0, 0]);
      parent.add(seg);
      parent = seg;
      segRad *= 0.85;
    }
  }

  // ── legs ──
  const legs: { femur: THREE.Group; tibia: THREE.Group }[] = [];
  const rowZ = [0.42, 0.1, -0.24];
  for (const pair of [0, 1, 2] as const) {
    if (pair === 0 && body.raptorial) continue;
    for (const side of [1, -1] as const) {
      const leg = buildLeg(side, pair, body, carapace, accent, style);
      leg.hip.position.set(side * rad * 0.9, ride - rad * 0.2, rowZ[pair]! * scale);
      torso.add(leg.hip);
      legs.push({ femur: leg.hip, tibia: leg.knee });
    }
  }

  const raptorialArms: THREE.Group[] = [];
  if (body.raptorial) {
    for (const side of [1, -1] as const) {
      const arm = buildRaptorial(side, body, carapace, style);
      arm.position.set(side * rad * 0.9, ride + rad * 0.4, 0.44 * scale);
      torso.add(arm);
      raptorialArms.push(arm);
    }
  }

  // ── wings ──
  let flappers: THREE.Object3D[] = [];
  if (body.wings === 2) {
    const wings = buildWings(palette, scale, style);
    wings.position.set(0, ride + rad * 1.1, 0.1 * scale);
    torso.add(wings);
    flappers = wings.children.filter((c) => c.name.startsWith('wing-'));
  }

  // Outlines and hatching are added last, so they wrap every part including the limbs.
  style.finish?.(group, palette);

  // Sit the whole animal so its feet meet y = 0, whatever the stance worked out to.
  const box = new THREE.Box3().setFromObject(group);
  group.position.y -= box.min.y;

  /*
   * Only materials with an emissive channel can glow. Styles that use toon or basic
   * materials simply do not, rather than the clips having to know which style is active.
   */
  const emissive = 'emissive' in accent ? (accent as THREE.MeshStandardMaterial) : null;
  if (emissive) emissive.emissive = new THREE.Color(palette.accent);
  const setGlow = (intensity: number): void => {
    if (emissive) emissive.emissiveIntensity = intensity;
  };

  const parts: Parts = {
    root: pose,
    torso,
    head,
    abdomen,
    wings: flappers,
    arms: raptorialArms,
    legs,
    setGlow,
  };

  const restLegs = legs.map((l) => ({ femur: l.femur.rotation.z, tibia: l.tibia.rotation.z }));
  const restAntennae = antennae.map((a) => a.rotation.z);
  const phases = legs.map(() => rng() * Math.PI * 2);
  const antennaPhases = antennae.map(() => rng() * Math.PI * 2);

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

      pose.position.set(0, 0, 0);
      pose.rotation.set(0, 0, 0);
      torso.rotation.set(0, 0, 0);
      head.rotation.set(0, 0, 0);
      abdomen.rotation.x = 0;
      setGlow(0);

      // The whole body sways, which is what the original did and reads better than moving
      // any single part.
      torso.rotation.z = Math.sin(t * 1.15) * 0.055;
      torso.rotation.x = Math.sin(t * 0.9 + 1.3) * 0.02;
      head.rotation.y = Math.sin(t * 0.5) * 0.2;

      antennae.forEach((a, i) => {
        a.rotation.z = restAntennae[i]! + Math.sin(t * 1.7 + antennaPhases[i]!) * 0.14;
      });

      legs.forEach((leg, i) => {
        const wobble = Math.sin(t * 2.1 + phases[i]!) * 0.03;
        leg.femur.rotation.z = restLegs[i]!.femur + wobble;
        leg.tibia.rotation.z = restLegs[i]!.tibia - wobble * 1.2;
      });

      flappers.forEach((w, i) => {
        w.rotation.z = Math.sin(t * 9 + i) * 0.03;
      });

      if (clip) {
        const progress = (t - clip.started) / clip.spec.duration;
        if (progress >= 1) {
          clip = null;
        } else {
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
