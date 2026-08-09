/**
 * Geometry builders for the Bastion.
 *
 * SCALE IS THE WHOLE POINT. This is a macro shot of the forest floor at insect scale:
 * the clearing is a small patch of trodden earth, the trees around it are enormous
 * columns that leave the frame going up, and the litter on the ground — leaves,
 * pebbles, twigs — is big relative to the clearing, because to an insect it is.
 *
 * Everything is procedural and seeded, so a player's home looks identical every time.
 */

import * as THREE from 'three';

/** mulberry32 — small, fast, seedable. */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const between = (r: () => number, lo: number, hi: number) => lo + r() * (hi - lo);

/** Small on purpose — this is a patch of ground, not a meadow. */
export const CLEARING_RADIUS = 6.5;

/** The camera sits on +z; a full-height trunk in that arc would block the shot. */
const CAMERA_WEDGE_SIN = 0.62;
/** Where the blocked wedge starts and ends, in radians. */
const WEDGE_FROM = Math.asin(CAMERA_WEDGE_SIN);
const WEDGE_TO = Math.PI - WEDGE_FROM;
/** How much of the circle is left for full-height trunks. */
const OPEN_ARC = Math.PI * 2 - (WEDGE_TO - WEDGE_FROM);

/**
 * Spreads `count` angles evenly over everything except the camera wedge.
 *
 * Mapping into the open arc rather than rejecting-and-retrying matters: a retry loop that
 * recomputes the same base angle plus a small jitter can never escape the wedge, and spins
 * forever. That bug froze the whole tab, since the scene is built synchronously.
 */
function openArcAngle(index: number, count: number, jitter: number): number {
  const spread = OPEN_ARC / count;
  // Keep the jitter inside one slot so it can never push a trunk into the wedge.
  const wobble = Math.max(-spread / 2, Math.min(spread / 2, jitter)) * 0.8;
  return WEDGE_TO + index * spread + spread / 2 + wobble;
}

/**
 * The trodden earth floor: a disc pushed around by noise, vertex-coloured so the
 * middle reads as bare packed dirt and the rim as trampled growth.
 */
export function buildGround(seed: number): THREE.Mesh {
  const geo = new THREE.CircleGeometry(CLEARING_RADIUS + 2.2, 128, 0, Math.PI * 2);
  geo.rotateX(-Math.PI / 2);

  const r = rng(seed);
  const bumps = Array.from({ length: 16 }, () => ({
    x: between(r, -CLEARING_RADIUS, CLEARING_RADIUS),
    z: between(r, -CLEARING_RADIUS, CLEARING_RADIUS),
    amp: between(r, -0.2, 0.26),
    spread: between(r, 1.3, 3.4),
  }));

  const pos = geo.getAttribute('position') as THREE.BufferAttribute;
  const colors = new Float32Array(pos.count * 3);

  const dirt = new THREE.Color('#8a6b4c');
  const packed = new THREE.Color('#a8855f');
  const trampled = new THREE.Color('#6e7a48');
  const c = new THREE.Color();

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const dist = Math.hypot(x, z);

    let y = 0;
    for (const b of bumps) {
      const d = Math.hypot(x - b.x, z - b.z);
      y += b.amp * Math.exp(-(d * d) / (b.spread * b.spread));
    }
    // Dish the middle very slightly — it is walked on.
    y -= 0.1 * Math.exp(-(dist * dist) / 14);
    pos.setY(i, y);

    const wear = THREE.MathUtils.smoothstep(dist, CLEARING_RADIUS - 2.2, CLEARING_RADIUS + 1.2);
    c.copy(packed).lerp(dirt, between(r, 0, 0.55)).lerp(trampled, wear);
    c.toArray(colors, i * 3);
  }

  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();

  const mesh = new THREE.Mesh(
    geo,
    new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.96, metalness: 0 }),
  );
  mesh.receiveShadow = true;
  return mesh;
}

/**
 * The forest: a handful of colossal trunks ringing the clearing and leaving the frame
 * going up, a darker mass of distant trunks behind them, and low canopy hanging into
 * the top of the shot. Nothing here is a whole "tree" — at this scale you only ever
 * see the bottom of one.
 */
export function buildForest(seed: number): THREE.Group {
  const group = new THREE.Group();
  const r = rng(seed);

  const barkMat = new THREE.MeshStandardMaterial({ color: '#6b5440', roughness: 0.96, flatShading: true });
  const barkDarkMat = new THREE.MeshStandardMaterial({ color: '#42342a', roughness: 1, flatShading: true });
  const canopyMat = new THREE.MeshStandardMaterial({ color: '#3e5c34', roughness: 0.88, flatShading: true });

  // --- the giant near trunks, spread across the arc that is not facing the camera ---
  const NEAR = 11;
  for (let i = 0; i < NEAR; i++) {
    const angle = openArcAngle(i, NEAR, between(r, -0.3, 0.3));

    const radius = CLEARING_RADIUS + between(r, 1.6, 5.5);
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;

    const rBase = between(r, 1.5, 3.1);
    const height = between(r, 46, 78);

    // A slight taper and a lean away from the clearing reads as a real trunk.
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(rBase * 0.62, rBase, height, 11, 1),
      barkMat,
    );
    trunk.position.set(x, height / 2 - 0.6, z);
    trunk.rotation.set(between(r, -0.03, 0.03), r() * Math.PI * 2, between(r, -0.03, 0.03));
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    group.add(trunk);

    // Bark ribs, only on the lower stretch that is actually in frame.
    for (let k = 0; k < 7; k++) {
      const a = r() * Math.PI * 2;
      const rib = new THREE.Mesh(
        new THREE.BoxGeometry(between(r, 0.22, 0.5), between(r, 3, 11), between(r, 0.16, 0.32)),
        barkDarkMat,
      );
      rib.position.set(x + Math.cos(a) * rBase * 0.97, between(r, 1, 13), z + Math.sin(a) * rBase * 0.97);
      rib.rotation.y = -a;
      group.add(rib);
    }

    // Buttress roots crawling out onto the floor — the strongest macro-scale cue.
    const roots = Math.round(between(r, 2, 4));
    for (let k = 0; k < roots; k++) {
      const spread = angle + Math.PI + between(r, -0.75, 0.75);
      const len = between(r, 2.6, 5.4);
      const root = new THREE.Mesh(
        new THREE.CylinderGeometry(between(r, 0.16, 0.34), between(r, 0.42, 0.7), len, 7, 1),
        barkMat,
      );
      const mid = len / 2;
      root.position.set(
        x + Math.cos(spread) * (rBase * 0.6 + mid * 0.72),
        between(r, 0.05, 0.3),
        z + Math.sin(spread) * (rBase * 0.6 + mid * 0.72),
      );
      // Lay it almost flat, pointing away from the trunk.
      const dir = new THREE.Vector3(-Math.cos(spread), between(r, 0.16, 0.4), -Math.sin(spread)).normalize();
      root.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
      root.castShadow = true;
      root.receiveShadow = true;
      group.add(root);
    }
  }

  // --- distant trunks, instanced, filling the gaps with darkness ---
  const FAR = 90;
  const farGeo = new THREE.CylinderGeometry(0.8, 1.15, 40, 7, 1);
  farGeo.translate(0, 20, 0);
  const far = new THREE.InstancedMesh(farGeo, barkDarkMat, FAR);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < FAR; i++) {
    const angle = r() * Math.PI * 2;
    const t = Math.pow(r(), 0.6);
    const radius = CLEARING_RADIUS + 7 + t * 34;
    dummy.position.set(Math.cos(angle) * radius, -1, Math.sin(angle) * radius);
    dummy.rotation.set(0, r() * Math.PI * 2, 0);
    dummy.scale.set(between(r, 0.7, 2.0), between(r, 0.8, 1.6), between(r, 0.7, 2.0));
    dummy.updateMatrix();
    far.setMatrixAt(i, dummy.matrix);
  }
  far.instanceMatrix.needsUpdate = true;
  group.add(far);

  // --- canopy hanging into the top of the frame, so the sky is never empty ---
  const CANOPY = 26;
  const canopy = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), canopyMat, CANOPY);
  for (let i = 0; i < CANOPY; i++) {
    const angle = r() * Math.PI * 2;
    const radius = between(r, 4, 30);
    dummy.position.set(Math.cos(angle) * radius, between(r, 21, 36), Math.sin(angle) * radius);
    dummy.rotation.set(r() * Math.PI, r() * Math.PI, r() * Math.PI);
    const s = between(r, 5, 12);
    dummy.scale.set(s, s * between(r, 0.5, 0.8), s);
    dummy.updateMatrix();
    canopy.setMatrixAt(i, dummy.matrix);
  }
  canopy.instanceMatrix.needsUpdate = true;
  group.add(canopy);

  return group;
}

/**
 * Forest-floor litter, sized for macro: leaves you could shelter under, pebbles that
 * are boulders, stalks that tower over the buildings.
 */
export function buildUndergrowth(seed: number): THREE.Group {
  const group = new THREE.Group();
  const r = rng(seed);
  const dummy = new THREE.Object3D();
  const col = new THREE.Color();

  // --- stalks around the rim ---
  const STALKS = 130;
  const stalkGeo = new THREE.ConeGeometry(0.13, 1, 4, 1, true);
  stalkGeo.translate(0, 0.5, 0);
  const stalks = new THREE.InstancedMesh(
    stalkGeo,
    // No `vertexColors` — per-instance colour comes from `instanceColor`, and asking
    // for a geometry `color` attribute that does not exist renders everything black.
    new THREE.MeshStandardMaterial({ roughness: 0.9, flatShading: true, side: THREE.DoubleSide }),
    STALKS,
  );
  stalks.castShadow = true;
  const grassA = new THREE.Color('#8fa84c');
  const grassB = new THREE.Color('#5a7a34');
  for (let i = 0; i < STALKS; i++) {
    const radius = CLEARING_RADIUS + 0.6 - Math.pow(r(), 2.4) * (CLEARING_RADIUS - 1.5);
    const angle = r() * Math.PI * 2;
    dummy.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
    dummy.rotation.set(between(r, -0.22, 0.22), r() * Math.PI * 2, between(r, -0.22, 0.22));
    dummy.scale.set(between(r, 0.6, 1.2), between(r, 1.1, 3.4), between(r, 0.6, 1.2));
    dummy.updateMatrix();
    stalks.setMatrixAt(i, dummy.matrix);
    col.copy(grassA).lerp(grassB, r());
    stalks.setColorAt(i, col);
  }
  stalks.instanceMatrix.needsUpdate = true;
  if (stalks.instanceColor) stalks.instanceColor.needsUpdate = true;

  // --- pebbles, which at this scale are boulders ---
  const PEBBLES = 34;
  const pebbles = new THREE.InstancedMesh(
    new THREE.DodecahedronGeometry(0.42, 0),
    new THREE.MeshStandardMaterial({ roughness: 0.85, flatShading: true }),
    PEBBLES,
  );
  pebbles.castShadow = true;
  pebbles.receiveShadow = true;
  const stoneA = new THREE.Color('#7a7267');
  const stoneB = new THREE.Color('#45413a');
  for (let i = 0; i < PEBBLES; i++) {
    const radius = Math.sqrt(r()) * (CLEARING_RADIUS + 0.8);
    const angle = r() * Math.PI * 2;
    dummy.position.set(Math.cos(angle) * radius, between(r, -0.1, 0.14), Math.sin(angle) * radius);
    dummy.rotation.set(r() * Math.PI, r() * Math.PI, r() * Math.PI);
    dummy.scale.set(between(r, 0.5, 1.5), between(r, 0.4, 1.0), between(r, 0.5, 1.5));
    dummy.updateMatrix();
    pebbles.setMatrixAt(i, dummy.matrix);
    col.copy(stoneA).lerp(stoneB, r());
    pebbles.setColorAt(i, col);
  }
  pebbles.instanceMatrix.needsUpdate = true;
  if (pebbles.instanceColor) pebbles.instanceColor.needsUpdate = true;

  // --- fallen leaves, big enough to hide under ---
  const LEAVES = 46;
  const leafGeo = new THREE.CircleGeometry(0.95, 6);
  leafGeo.rotateX(-Math.PI / 2);
  leafGeo.scale(1, 1, 1.55);
  const leaves = new THREE.InstancedMesh(
    leafGeo,
    new THREE.MeshStandardMaterial({ roughness: 0.88, side: THREE.DoubleSide }),
    LEAVES,
  );
  leaves.receiveShadow = true;
  const leafA = new THREE.Color('#8a6427');
  const leafB = new THREE.Color('#4a3418');
  const leafC = new THREE.Color('#5f6b2c');
  for (let i = 0; i < LEAVES; i++) {
    const radius = Math.sqrt(r()) * (CLEARING_RADIUS + 1.6);
    const angle = r() * Math.PI * 2;
    dummy.position.set(Math.cos(angle) * radius, between(r, 0.04, 0.16), Math.sin(angle) * radius);
    // Leaves curl, so tilt them more than you would a flat decal.
    dummy.rotation.set(between(r, -0.5, 0.5), r() * Math.PI * 2, between(r, -0.5, 0.5));
    dummy.scale.setScalar(between(r, 0.6, 1.5));
    dummy.updateMatrix();
    leaves.setMatrixAt(i, dummy.matrix);
    col.copy(leafA).lerp(leafB, r()).lerp(leafC, r() * 0.4);
    leaves.setColorAt(i, col);
  }
  leaves.instanceMatrix.needsUpdate = true;
  if (leaves.instanceColor) leaves.instanceColor.needsUpdate = true;

  group.add(stalks, pebbles, leaves);

  // --- a few fallen twigs lying across the floor ---
  const twigMat = new THREE.MeshStandardMaterial({ color: '#5d4830', roughness: 0.96, flatShading: true });
  const up = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < 7; i++) {
    const len = between(r, 3.5, 9);
    const twig = new THREE.Mesh(
      new THREE.CylinderGeometry(between(r, 0.1, 0.22), between(r, 0.14, 0.3), len, 6, 1),
      twigMat,
    );
    const angle = r() * Math.PI * 2;
    const radius = between(r, 1, CLEARING_RADIUS + 1.5);
    twig.position.set(Math.cos(angle) * radius, between(r, 0.12, 0.3), Math.sin(angle) * radius);
    const dir = new THREE.Vector3(Math.cos(r() * Math.PI * 2), between(r, -0.1, 0.1), Math.sin(r() * Math.PI * 2));
    twig.quaternion.setFromUnitVectors(up, dir.normalize());
    twig.castShadow = true;
    twig.receiveShadow = true;
    group.add(twig);
  }

  // --- moss patches, flat and soft, to break up the bare dirt ---
  const mossMat = new THREE.MeshStandardMaterial({ color: '#5e8040', roughness: 0.93, flatShading: true });
  for (let i = 0; i < 9; i++) {
    const patch = new THREE.Mesh(new THREE.CircleGeometry(between(r, 0.7, 1.9), 8), mossMat);
    patch.rotation.x = -Math.PI / 2;
    const angle = r() * Math.PI * 2;
    const radius = between(r, 2.5, CLEARING_RADIUS + 1.8);
    patch.position.set(Math.cos(angle) * radius, 0.03, Math.sin(angle) * radius);
    patch.scale.set(1, 1, between(r, 0.6, 1.1));
    patch.receiveShadow = true;
    group.add(patch);
  }

  return group;
}

export interface Building {
  group: THREE.Group;
  /** Invisible box the raycaster tests against, so thin geometry stays clickable. */
  hitbox: THREE.Mesh;
  /** World point the floating DOM label anchors to. */
  labelAnchor: THREE.Vector3;
  /** Called every frame with elapsed seconds and hover strength 0..1. */
  tick: (elapsed: number, hover: number) => void;
}

function hitbox(w: number, h: number, d: number, at: THREE.Vector3): THREE.Mesh {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshBasicMaterial({ visible: false }),
  );
  mesh.position.copy(at).add(new THREE.Vector3(0, h / 2, 0));
  return mesh;
}

/**
 * The Hatchery: a split, rotting log half-sunk in a mound of soil, with four egg
 * hollows scooped out in front of it. Eggs glow from within and breathe.
 */
export function buildHatchery(seed: number, position: THREE.Vector3): Building & { eggs: THREE.Mesh[] } {
  const group = new THREE.Group();
  group.position.copy(position);
  const r = rng(seed);

  const woodMat = new THREE.MeshStandardMaterial({ color: '#4a3a2a', roughness: 0.95, flatShading: true });
  const rotMat = new THREE.MeshStandardMaterial({ color: '#2e2418', roughness: 1, flatShading: true });
  const soilMat = new THREE.MeshStandardMaterial({ color: '#4b3826', roughness: 1, flatShading: true });

  // Soil mound the log rests in.
  const mound = new THREE.Mesh(new THREE.SphereGeometry(2.5, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), soilMat);
  mound.scale.set(1, 0.26, 0.8);
  mound.receiveShadow = true;
  group.add(mound);

  // The log itself, lying across the mound, mouth turned toward the camera.
  const log = new THREE.Group();
  log.rotation.set(0.05, -0.5, Math.PI / 2);
  log.position.set(-0.15, 0.72, -0.45);

  const shell = new THREE.Mesh(new THREE.CylinderGeometry(0.78, 0.86, 3.6, 12, 1, false), woodMat);
  shell.castShadow = true;
  shell.receiveShadow = true;
  log.add(shell);

  const hollow = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.64, 3.7, 12, 1, true), rotMat);
  hollow.material.side = THREE.BackSide;
  log.add(hollow);

  const mouth = new THREE.Mesh(new THREE.CircleGeometry(0.62, 12), rotMat);
  mouth.position.y = 1.81;
  mouth.rotation.x = -Math.PI / 2;
  log.add(mouth);

  for (let i = 0; i < 9; i++) {
    const ridge = new THREE.Mesh(new THREE.BoxGeometry(0.13, between(r, 0.8, 2.2), 0.09), woodMat);
    const a = r() * Math.PI * 2;
    ridge.position.set(Math.cos(a) * 0.8, between(r, -1.3, 1.3), Math.sin(a) * 0.8);
    ridge.rotation.y = -a;
    ridge.castShadow = true;
    log.add(ridge);
  }
  group.add(log);

  // Bracket fungus on the flank — the tell that the wood is rotting.
  const fungusMat = new THREE.MeshStandardMaterial({ color: '#c8a256', roughness: 0.8, flatShading: true });
  for (let i = 0; i < 4; i++) {
    const cap = new THREE.Mesh(
      new THREE.SphereGeometry(between(r, 0.14, 0.28), 8, 5, 0, Math.PI * 2, 0, Math.PI / 2),
      fungusMat,
    );
    cap.scale.set(1, 0.32, 1);
    cap.position.set(between(r, -1.3, 1.3), between(r, 0.45, 1.4), between(r, 0.35, 0.8));
    cap.rotation.z = between(r, -0.5, 0.5);
    cap.castShadow = true;
    group.add(cap);
  }

  // Four egg hollows in a shallow arc in front of the log.
  const eggs: THREE.Mesh[] = [];
  const hollowMat = new THREE.MeshStandardMaterial({ color: '#33261a', roughness: 1, flatShading: true });
  for (let i = 0; i < 4; i++) {
    const a = -0.66 + i * 0.44;
    const px = Math.sin(a) * 1.75;
    const pz = 1.25 + Math.cos(a) * 0.4;

    const dish = new THREE.Mesh(
      new THREE.SphereGeometry(0.38, 12, 6, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2),
      hollowMat,
    );
    dish.scale.set(1, 0.5, 1);
    dish.position.set(px, 0.14, pz);
    group.add(dish);

    const egg = new THREE.Mesh(
      new THREE.SphereGeometry(0.27, 16, 12),
      new THREE.MeshStandardMaterial({
        color: '#e8dcc4',
        roughness: 0.5,
        emissive: new THREE.Color('#c98b2e'),
        emissiveIntensity: 0.35,
      }),
    );
    egg.scale.set(0.82, 1.15, 0.82);
    egg.position.set(px, 0.3, pz);
    egg.castShadow = true;
    egg.visible = false; // shown only when the player actually holds that many eggs
    group.add(egg);
    eggs.push(egg);
  }

  const glow = new THREE.PointLight('#ff9a3c', 5, 6, 2);
  glow.position.set(0.1, 0.95, 0.95);
  group.add(glow);

  const box = hitbox(4.4, 2.6, 3.6, position.clone());

  return {
    group,
    hitbox: box,
    labelAnchor: position.clone().add(new THREE.Vector3(0, 3.0, 0)),
    eggs,
    tick(elapsed, hover) {
      glow.intensity = 4.4 + Math.sin(elapsed * 2.1) * 0.6 + Math.sin(elapsed * 5.3) * 0.25 + hover * 3;
      for (let i = 0; i < eggs.length; i++) {
        const egg = eggs[i]!;
        if (!egg.visible) continue;
        const breathe = Math.sin(elapsed * 1.6 + i * 1.7);
        egg.scale.set(0.82 + breathe * 0.015, 1.15 + breathe * 0.03, 0.82 + breathe * 0.015);
        const mat = egg.material as THREE.MeshStandardMaterial;
        mat.emissiveIntensity = 0.3 + breathe * 0.18 + hover * 0.25;
      }
      group.position.y = position.y + hover * 0.05;
    },
  };
}

/**
 * The Nest: a woven bowl of twigs built into the crook of a broken stump, packed
 * with leaves. Where the player's insects live between fights.
 */
export function buildNest(seed: number, position: THREE.Vector3): Building {
  const group = new THREE.Group();
  group.position.copy(position);
  const r = rng(seed);

  const woodMat = new THREE.MeshStandardMaterial({ color: '#463527', roughness: 0.95, flatShading: true });
  const twigMat = new THREE.MeshStandardMaterial({ color: '#6b5334', roughness: 0.95, flatShading: true });
  const leafMat = new THREE.MeshStandardMaterial({ color: '#4a6330', roughness: 0.85, flatShading: true });

  // Broken stump the nest leans against.
  const stump = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 1.05, 2.3, 9, 1), woodMat);
  stump.position.set(-1.3, 1.15, -0.5);
  stump.rotation.z = 0.09;
  stump.castShadow = true;
  stump.receiveShadow = true;
  group.add(stump);

  // Splintered top, so it reads as snapped rather than sawn.
  for (let i = 0; i < 6; i++) {
    const splinter = new THREE.Mesh(
      new THREE.ConeGeometry(between(r, 0.1, 0.24), between(r, 0.35, 0.95), 4),
      woodMat,
    );
    const a = r() * Math.PI * 2;
    splinter.position.set(
      -1.3 + Math.cos(a) * between(r, 0.15, 0.7),
      2.32,
      -0.5 + Math.sin(a) * between(r, 0.15, 0.7),
    );
    splinter.rotation.set(between(r, -0.3, 0.3), 0, between(r, -0.3, 0.3));
    splinter.castShadow = true;
    group.add(splinter);
  }

  // The woven bowl: short cylinders laid tangentially around a ring in courses.
  const bowl = new THREE.Group();
  bowl.position.set(0.45, 0.48, 0.3);
  const COURSES = 7;
  const up = new THREE.Vector3(0, 1, 0);
  for (let c = 0; c < COURSES; c++) {
    const y = c * 0.16;
    const radius = 1.25 + c * 0.065;
    const perCourse = 16;
    for (let i = 0; i < perCourse; i++) {
      const a = (i / perCourse) * Math.PI * 2 + c * 0.42 + r() * 0.12;
      const twig = new THREE.Mesh(
        new THREE.CylinderGeometry(between(r, 0.04, 0.065), between(r, 0.04, 0.065), between(r, 0.6, 1.0), 5),
        twigMat,
      );
      twig.position.set(Math.cos(a) * radius, y, Math.sin(a) * radius);
      // Align the cylinder's own axis with the ring's tangent, with a little vertical
      // wobble. Doing it by Euler angles fans the twigs flat instead of weaving them.
      const tangent = new THREE.Vector3(-Math.sin(a), between(r, -0.22, 0.22), Math.cos(a)).normalize();
      twig.quaternion.setFromUnitVectors(up, tangent);
      twig.castShadow = true;
      bowl.add(twig);
    }
  }
  group.add(bowl);

  // Leaf bedding filling the bowl.
  for (let i = 0; i < 24; i++) {
    const leaf = new THREE.Mesh(new THREE.CircleGeometry(between(r, 0.2, 0.36), 5), leafMat);
    const a = r() * Math.PI * 2;
    const rad = Math.sqrt(r()) * 1.05;
    leaf.position.set(0.45 + Math.cos(a) * rad, 0.54 + r() * 0.2, 0.3 + Math.sin(a) * rad);
    leaf.rotation.set(-Math.PI / 2 + between(r, -0.45, 0.45), r() * Math.PI * 2, between(r, -0.4, 0.4));
    leaf.scale.z = 1.6;
    group.add(leaf);
  }

  const glow = new THREE.PointLight('#7fd4a8', 2.2, 5, 2);
  glow.position.set(0.45, 1.1, 0.3);
  group.add(glow);

  const box = hitbox(4.0, 2.6, 3.4, position.clone());

  return {
    group,
    hitbox: box,
    labelAnchor: position.clone().add(new THREE.Vector3(0, 3.2, 0)),
    tick(elapsed, hover) {
      glow.intensity = 2.0 + Math.sin(elapsed * 1.3) * 0.3 + hover * 2;
      group.position.y = position.y + hover * 0.05;
    },
  };
}

/** Drifting motes of light. Cheap, and does most of the work of making it feel alive. */
export function buildFireflies(seed: number, count = 80): { points: THREE.Points; tick: (t: number) => void } {
  const r = rng(seed);
  const positions = new Float32Array(count * 3);
  const seeds = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const radius = Math.sqrt(r()) * (CLEARING_RADIUS + 4);
    const a = r() * Math.PI * 2;
    positions[i * 3] = Math.cos(a) * radius;
    positions[i * 3 + 1] = between(r, 0.3, 7);
    positions[i * 3 + 2] = Math.sin(a) * radius;
    seeds[i * 3] = r() * Math.PI * 2;
    seeds[i * 3 + 1] = between(r, 0.25, 0.8);
    seeds[i * 3 + 2] = between(r, 0.3, 1.1);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const home = positions.slice();

  const points = new THREE.Points(
    geo,
    new THREE.PointsMaterial({
      color: '#ffd98a',
      size: 0.11,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );

  const attr = geo.getAttribute('position') as THREE.BufferAttribute;
  return {
    points,
    tick(t) {
      for (let i = 0; i < count; i++) {
        const phase = seeds[i * 3]!;
        const speed = seeds[i * 3 + 1]!;
        const amp = seeds[i * 3 + 2]!;
        attr.setX(i, home[i * 3]! + Math.sin(t * speed + phase) * amp);
        attr.setY(i, home[i * 3 + 1]! + Math.sin(t * speed * 0.7 + phase * 2) * amp * 0.5);
        attr.setZ(i, home[i * 3 + 2]! + Math.cos(t * speed * 0.85 + phase) * amp);
      }
      attr.needsUpdate = true;
    },
  };
}

/**
 * Shafts of light coming down from far above. At this scale they start well outside
 * the frame, which is what makes the canopy feel high up.
 */
export function buildLightShafts(seed: number): THREE.Group {
  const group = new THREE.Group();
  const r = rng(seed);
  for (let i = 0; i < 5; i++) {
    const geo = new THREE.CylinderGeometry(0.25, between(r, 1.6, 3.4), 40, 12, 1, true);
    const mat = new THREE.MeshBasicMaterial({
      color: '#ffe6a8',
      transparent: true,
      opacity: between(r, 0.03, 0.06),
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const shaft = new THREE.Mesh(geo, mat);
    const a = r() * Math.PI * 2;
    const rad = between(r, 1, CLEARING_RADIUS + 1);
    shaft.position.set(Math.cos(a) * rad, 19, Math.sin(a) * rad);
    shaft.rotation.set(between(r, -0.1, 0.1), 0, between(r, -0.1, 0.1));
    group.add(shaft);
  }
  return group;
}
