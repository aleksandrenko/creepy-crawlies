/**
 * Five ways to render the same insect.
 *
 * The geometry stays parametric and shared; what changes here is how it is shaded and how
 * finely it is built. That is the axis that actually decides what the animals look like —
 * the same stick insect can read as a low-poly game asset, a soft toy, a wet chitinous
 * shell, a cel-shaded cartoon, or an engraving from a naturalist's plate.
 *
 * Pick one and it applies to every species, which is the point: a roster rendered five
 * different ways would look like five different games.
 */

import * as THREE from 'three';
import type { Palette } from '../content/species';

export type StyleId = 'faceted' | 'organic' | 'carapace' | 'toon' | 'plate';

export type MaterialRole = 'shell' | 'under' | 'accent' | 'eye' | 'wing';

export interface RigStyle {
  id: StyleId;
  name: string;
  blurb: string;
  /** Subdivision for body masses. 0 is a raw icosahedron, 3 is nearly a sphere. */
  icoDetail: number;
  /** Radial segments for limbs, tubes and abdomen rings. */
  radial: number;
  material(colour: string, role: MaterialRole, palette: Palette): THREE.Material;
  /** Optional pass over the finished animal: outlines, wireframe, and so on. */
  finish?(group: THREE.Group, palette: Palette): void;
}

/** Adds a slightly larger inside-out copy of every mesh, which reads as an ink outline. */
function outline(group: THREE.Group, colour: string, thickness: number): void {
  const mat = new THREE.MeshBasicMaterial({ color: colour, side: THREE.BackSide });
  const originals: THREE.Mesh[] = [];
  group.traverse((o) => {
    if (o instanceof THREE.Mesh) originals.push(o);
  });
  for (const mesh of originals) {
    // Parented to the mesh itself, so it follows every animated joint for free.
    const shell = new THREE.Mesh(mesh.geometry, mat);
    shell.scale.setScalar(1 + thickness);
    shell.renderOrder = -1;
    mesh.add(shell);
  }
}

/** Lays a dark wireframe over the body, like the hatching on an engraved plate. */
function hatch(group: THREE.Group, colour: string): void {
  const mat = new THREE.MeshBasicMaterial({
    color: colour,
    wireframe: true,
    transparent: true,
    opacity: 0.55,
  });
  const originals: THREE.Mesh[] = [];
  group.traverse((o) => {
    if (o instanceof THREE.Mesh) originals.push(o);
  });
  for (const mesh of originals) {
    const lines = new THREE.Mesh(mesh.geometry, mat);
    lines.scale.setScalar(1.004);
    mesh.add(lines);
  }
}

export const RIG_STYLES: Record<StyleId, RigStyle> = {
  /** What the earlier hand-built champions used: matte, faceted, unfussy. */
  faceted: {
    id: 'faceted',
    name: 'Faceted',
    blurb: 'Matte low-poly with hard facets. Reads clearly at small sizes and never looks wet.',
    icoDetail: 1,
    radial: 6,
    material(colour, role) {
      if (role === 'wing') {
        return new THREE.MeshStandardMaterial({
          color: colour, transparent: true, opacity: 0.26, roughness: 0.4,
          side: THREE.DoubleSide, depthWrite: false, flatShading: true,
        });
      }
      return new THREE.MeshStandardMaterial({
        color: colour,
        roughness: role === 'eye' ? 0.35 : 0.95,
        metalness: 0,
        flatShading: true,
      });
    },
  },

  /** Rounded and soft, closer to a plush model than an insect. */
  organic: {
    id: 'organic',
    name: 'Organic',
    blurb: 'Smooth, rounded and softly lit. Friendlier, and the segments flow into each other.',
    icoDetail: 3,
    radial: 14,
    material(colour, role) {
      if (role === 'wing') {
        return new THREE.MeshStandardMaterial({
          color: colour, transparent: true, opacity: 0.3, roughness: 0.3,
          side: THREE.DoubleSide, depthWrite: false,
        });
      }
      return new THREE.MeshStandardMaterial({
        color: colour,
        roughness: role === 'eye' ? 0.3 : 0.62,
        metalness: 0.02,
      });
    },
  },

  /** Wet, hard shell: the way a live beetle actually catches light. */
  carapace: {
    id: 'carapace',
    name: 'Carapace',
    blurb: 'Hard glossy chitin with a wet highlight. The most lifelike, and the darkest.',
    icoDetail: 2,
    radial: 12,
    material(colour, role) {
      if (role === 'wing') {
        return new THREE.MeshPhysicalMaterial({
          color: colour, transparent: true, opacity: 0.22, roughness: 0.1,
          metalness: 0, side: THREE.DoubleSide, depthWrite: false,
        });
      }
      return new THREE.MeshPhysicalMaterial({
        color: colour,
        roughness: role === 'eye' ? 0.08 : 0.24,
        metalness: 0.16,
        // A clear lacquer layer over the pigment is what makes a shell look wet.
        clearcoat: 0.8,
        clearcoatRoughness: 0.15,
      });
    },
  },

  /** Flat bands of colour and a black outline. */
  toon: {
    id: 'toon',
    name: 'Toon',
    blurb: 'Cel-shaded bands with an ink outline. Bold and readable, more cartoon than creature.',
    icoDetail: 2,
    radial: 10,
    material(colour, role) {
      if (role === 'wing') {
        return new THREE.MeshBasicMaterial({
          color: colour, transparent: true, opacity: 0.32,
          side: THREE.DoubleSide, depthWrite: false,
        });
      }
      return new THREE.MeshToonMaterial({ color: colour });
    },
    finish(group) {
      outline(group, '#1a1410', 0.07);
    },
  },

  /** Pale body under dark hatching, like a specimen drawn for a monograph. */
  plate: {
    id: 'plate',
    name: 'Naturalist plate',
    blurb: 'Ivory body under dark hatching, like an engraved specimen. Unmistakably a study.',
    icoDetail: 1,
    radial: 8,
    material(colour, role, palette) {
      if (role === 'wing') {
        return new THREE.MeshBasicMaterial({
          color: '#f4ecd8', transparent: true, opacity: 0.24,
          side: THREE.DoubleSide, depthWrite: false,
        });
      }
      if (role === 'eye') return new THREE.MeshStandardMaterial({ color: '#2a2118', roughness: 0.5 });
      // Ink-washed ivory: the species' own colour only tints it.
      const tint = new THREE.Color('#efe6cf').lerp(new THREE.Color(colour), role === 'accent' ? 0.28 : 0.12);
      void palette;
      return new THREE.MeshStandardMaterial({ color: tint, roughness: 0.9, metalness: 0 });
    },
    finish(group, palette) {
      hatch(group, palette.carapace);
    },
  },
};

export const STYLE_ORDER: StyleId[] = ['faceted', 'organic', 'carapace', 'toon', 'plate'];

// ── the chosen style ──────────────────────────────────────────────────────────

const KEY = 'cc:rig-style';
const listeners = new Set<(id: StyleId) => void>();

let current: StyleId = read();

function read(): StyleId {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved && saved in RIG_STYLES) return saved as StyleId;
  } catch {
    // A browser refusing localStorage still gets the default.
  }
  return 'faceted';
}

export function rigStyle(): RigStyle {
  return RIG_STYLES[current];
}

export function rigStyleId(): StyleId {
  return current;
}

export function setRigStyle(id: StyleId): void {
  if (!(id in RIG_STYLES) || id === current) return;
  current = id;
  try {
    localStorage.setItem(KEY, id);
  } catch {
    // Not worth failing the choice over.
  }
  for (const listener of listeners) listener(id);
}

export function onRigStyleChange(listener: (id: StyleId) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
