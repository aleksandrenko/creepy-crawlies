/**
 * Which representation of an insect the player wants to see: the photograph, or the 3D rig.
 *
 * Stored per browser and applied everywhere at once. The choice is the player's, so nothing
 * here decides for them beyond falling back to photos when WebGL is missing — a blank hole
 * would be worse than either option.
 */

import { is3dSupported } from './insect3d';

export type DisplayMode = 'photo' | 'model';

const KEY = 'cc:display-mode';
const listeners = new Set<(mode: DisplayMode) => void>();

let mode: DisplayMode = read();

function read(): DisplayMode {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === 'model' && is3dSupported()) return 'model';
  } catch {
    // A browser that refuses localStorage still gets to play.
  }
  return 'photo';
}

export function displayMode(): DisplayMode {
  return mode;
}

export function setDisplayMode(next: DisplayMode): void {
  const wanted = next === 'model' && !is3dSupported() ? 'photo' : next;
  if (wanted === mode) return;
  mode = wanted;
  try {
    localStorage.setItem(KEY, mode);
  } catch {
    // Not worth failing the switch over.
  }
  document.documentElement.dataset.display = mode;
  for (const listener of listeners) listener(mode);
}

export function toggleDisplayMode(): DisplayMode {
  setDisplayMode(mode === 'photo' ? 'model' : 'photo');
  return mode;
}

/** Called when the mode changes, so open screens can redraw themselves. */
export function onDisplayModeChange(listener: (mode: DisplayMode) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Sets the attribute once at boot so CSS can react before anything renders. */
export function initDisplayMode(): void {
  document.documentElement.dataset.display = mode;
}
