/**
 * Builds every rig in every style, headless, and reports what the geometry actually does.
 *
 * Worth having as a script rather than something to eyeball: the rigs are parametric, so a
 * change to one angle moves all 112 animals at once, and the failure modes are quiet. Legs
 * that end up above the floor leave the animal hovering; a bad joint sign sends a leg
 * through the body; an infinite loop in a builder freezes the tab with no error. None of
 * that shows up in a typecheck, and only some of it is obvious in a screenshot.
 *
 * No WebGL is involved — Three's scene graph and bounding boxes are plain maths.
 *
 * Run with: npm run check
 */

import * as THREE from 'three';
import { ALL_SPECIES, SPECIES, type Species } from '../src/content/species';
import { buildInsect } from '../src/scene/insectRig';
import { RIG_STYLES, STYLE_ORDER } from '../src/scene/rigStyle';

/** How far an animal may sit below the floor before it looks sunk rather than planted. */
const FLOOR_TOLERANCE = 0.12;

let failures = 0;

function fail(message: string): void {
  failures++;
  console.error(`  FAIL  ${message}`);
}

/**
 * Where the leg tips ended up.
 *
 * Read off the meshes the rig names `foot`, rather than inferred from height. Inferring was
 * how the first version of this check produced nonsense: these animals range from a flea to a
 * termite queen, so any height cutoff either misses the feet of the tall ones or swallows half
 * the body of the flat ones, and a queen whose length is nearly all abdomen looked like a
 * failure when her stance was correct.
 */
function feetOf(rig: ReturnType<typeof buildInsect>): THREE.Vector3[] {
  const feet: THREE.Vector3[] = [];
  rig.group.traverse((o) => {
    if (o.name === 'foot') feet.push(o.getWorldPosition(new THREE.Vector3()));
  });
  return feet;
}

console.log(`Building ${ALL_SPECIES.length} species in ${STYLE_ORDER.length} styles…`);

for (const style of STYLE_ORDER) {
  let deepest = { id: '', y: 0 };
  for (const species of ALL_SPECIES) {
    let rig;
    try {
      rig = buildInsect(species.id, species.body, species.palette, style);
    } catch (err) {
      fail(`${species.id} in ${style} threw: ${String(err)}`);
      continue;
    }
    // Animated, because a clip can move a foot even when the rest pose is fine.
    rig.tick(0.37);
    const box = new THREE.Box3().setFromObject(rig.group);
    if (box.min.y < deepest.y) deepest = { id: species.id, y: box.min.y };
    rig.dispose();
  }
  const label = `${RIG_STYLES[style].name}`.padEnd(18);
  console.log(`  ${label} deepest below floor: ${deepest.y.toFixed(3)} (${deepest.id || 'none'})`);
  if (deepest.y < -FLOOR_TOLERANCE) {
    fail(`${deepest.id} sits ${(-deepest.y).toFixed(2)} below the floor in ${style}`);
  }
}

/*
 * Every animal has to stand on its feet, which is the thing the splay change was really about.
 *
 * The splay used to be a pitch at the hip. On a leg that already points out to the side that
 * swings the foot upward instead of forward, so on the elongated species four of the six legs
 * hung in the air and only the middle pair touched the ground. Two properties catch that:
 * the feet all have to be near the floor, and they have to be spread out fore and aft rather
 * than bunched under the thorax.
 *
 * The spread is measured against the animal's own leg reach, not its body length — a termite
 * queen is five units long because of her abdomen, and her feet are correctly all up front.
 */
console.log('\nStance:');
let bellyDraggers = 0;

for (const species of ALL_SPECIES) {
  const rig = buildInsect(species.id, species.body, species.palette);
  rig.tick(0);
  const feet = feetOf(rig);
  const reach = species.body.legs * species.body.size;
  const ys = feet.map((f) => f.y);
  const zs = feet.map((f) => f.z);
  const xs = feet.map((f) => Math.abs(f.x));

  // The feet should all be on one plane. Whether that plane is the floor is a separate
  // question — a termite queen rests on her abdomen, so her legs are correctly clear of it.
  const unevenness = Math.max(...ys) - Math.min(...ys);
  if (unevenness > reach * 0.2) {
    fail(`${species.id} plants its feet on ${unevenness.toFixed(2)} of different heights`);
  }

  // Fore and aft, so the legs carry the body along its length.
  const span = Math.max(...zs) - Math.min(...zs);
  if (span < reach * 0.35) {
    fail(`${species.id} bunches its feet into a ${span.toFixed(2)} span on a ${reach.toFixed(2)} reach`);
  }

  // And out to the sides, which is the one that was broken: every foot used to land on the
  // midline because the tibia folded back across the body.
  const width = Math.min(...xs);
  if (width < reach * 0.2) {
    fail(`${species.id} puts a foot ${width.toFixed(2)} from the midline on a ${reach.toFixed(2)} reach`);
  }

  if (Math.min(...ys) > reach * 0.15) bellyDraggers++;
  rig.dispose();
}

console.log(`  ${ALL_SPECIES.length - bellyDraggers} stand on their feet, ${bellyDraggers} rest on the abdomen.`);

const shown: Species[] = ['morosa', 'scolopendrina', 'anax', 'mantis', 'coccinella', 'macrotermes']
  .map((id) => ALL_SPECIES.find((s) => s.id === id))
  .filter((s): s is Species => !!s);

for (const species of shown) {
  const rig = buildInsect(species.id, species.body, species.palette);
  rig.tick(0);
  const feet = feetOf(rig);
  const zs = feet.map((f) => f.z);
  const slenderness = species.body.legs / species.body.girth;
  console.log(
    `  ${species.name.padEnd(22)} slenderness ${slenderness.toFixed(2).padStart(5)}` +
      `  ${feet.length} feet  span ${(Math.max(...zs) - Math.min(...zs)).toFixed(2)}` +
      `  half-width ${Math.max(...feet.map((f) => Math.abs(f.x))).toFixed(2)}`,
  );
  rig.dispose();
}

console.log(`\n${SPECIES.length} of ${ALL_SPECIES.length} species are in the active roster.`);
if (failures > 0) {
  console.error(`\n${failures} problem(s).`);
  process.exit(1);
}
console.log('All rigs build, animate, and stand on the floor.');
