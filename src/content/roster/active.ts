/**
 * The species actually in play.
 *
 * The roster files hold 118, which turned out to be far more than the game needs to feel
 * full — and every one of them costs a photo, a set of stats to balance, and a slot in the
 * Codex the player has to scroll past. This is a curated twenty.
 *
 * Reduced by a list rather than by deleting the other files: nothing is lost, and putting a
 * species back is a one-line edit here. A save holding a species that is no longer active
 * heals itself, because the migration in `backend/local.ts` drops unknown species and tops
 * the colony back up.
 *
 * The mix is deliberate — nine strikers, two bulwarks, five tenders, four controllers, and
 * a spread across all four rarities — so a random starting five can still field a coherent
 * team, and the roles the battle engine implements are all represented.
 */

export const ACTIVE_SPECIES: readonly string[] = [
  // ── strikers ──
  'bombardier', // Bombardier Beetle — sprays boiling chemicals
  'mantis', // European Mantis — raptorial ambush
  'mandarinia', // Asian Giant Hornet — decapitates hives
  'lucanus', // European Stag Beetle — antler wrestling
  'hercules', // Hercules Beetle — throws rivals off branches
  'cicindela', // Green Tiger Beetle — runs itself blind
  'anax', // Emperor Dragonfly — intercepts on a predicted course
  'ctenocephalides', // Cat Flea — resilin catapult
  'gryllus', // Field Cricket — sings a victory song

  // ── bulwarks ──
  'phloeodes', // Ironclad Beetle — survives a car
  'taurus', // Taurus Dung Beetle — strongest animal for its mass

  // ── tenders ──
  'apis', // Honey Bee — sacrificial sting
  'coccinella', // Seven-spot Ladybird — reflex bleeding
  'macrotermes', // Termite Queen — the colony's revive
  'bombus', // Buff-tailed Bumblebee — shivers to warm the brood
  'myrmecocystus', // Honeypot Ant — living larder

  // ── controllers ──
  'ampulex', // Jewel Wasp — stings a roach's brain
  'lytta', // Spanish Fly — cantharidin
  'cimex', // Bed Bug — anaesthetic saliva
  'halyomorpha', // Marmorated Stink Bug — defensive spray
];
