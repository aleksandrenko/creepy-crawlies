/**
 * Picks the backend implementation.
 *
 * Set VITE_BACKEND=supabase (plus VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY) once a
 * Supabase project exists. Until then the local implementation is the only one built.
 */

import { LocalBackend } from './local';
import type { Backend } from './types';

export const backend: Backend = new LocalBackend();
export * from './types';
