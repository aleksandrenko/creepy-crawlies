/**
 * Living Card — gives a flat piece of card art depth and motion without redrawing it.
 *
 * The artwork is never regenerated. It stays a static texture, and every bit of movement
 * comes from a camera and a fragment shader in front of it:
 *
 *   1. a depth map displaces the UVs, so near geometry slides against far geometry;
 *   2. a passive idle loop (breathing, sway, dust, rim light, foil) keeps the card alive;
 *   3. ability clips key-frame both the CSS 3D rig and the shader uniforms.
 *
 * It is deliberately art-source agnostic: hand it a painted canvas or a photograph. See
 * `cardArt.ts` for the species → canvas step.
 */

import './livingCard.css';

/* ────────────────────────────────────────────────────────────── public API */

export type ClipId =
  | 'lunge' | 'slash' | 'charge' | 'stomp'
  | 'empower' | 'shield' | 'heal'
  | 'poison' | 'freeze' | 'burn' | 'stun';

export type TexSource = HTMLCanvasElement | HTMLImageElement;

export interface LivingCardOptions {
  /** Peak tilt in degrees as the pointer crosses the card. */
  tiltDeg?: number;
  /** Fire an occasional idle bob so a resting card still reads as alive. */
  idleAccents?: boolean;
  /**
   * Scales every rig translation. Clips are authored for a full-size (~700px tall) card;
   * a thumbnail wants roughly its own height / 700, or a lunge will fly off the panel.
   */
  motionScale?: number;
}

export interface LivingCard {
  /** The mountable element. Contains the canvas; put card furniture on top of it. */
  readonly el: HTMLElement;
  play(clip: ClipId): void;
  /** Currently playing clip, or null when idling. */
  current(): ClipId | null;
  destroy(): void;
}

export const CLIP_GROUP: Record<ClipId, 'attack' | 'buff' | 'debuff'> = {
  lunge: 'attack', slash: 'attack', charge: 'attack', stomp: 'attack',
  empower: 'buff', shield: 'buff', heal: 'buff',
  poison: 'debuff', freeze: 'debuff', burn: 'debuff', stun: 'debuff',
};

/**
 * Pick the clip that best matches a skill's rules text.
 *
 * The catalogue writes its effects out in plain words ("Applies Burn for 2 turns",
 * "60% chance to Stun", "+20% ATK"), so the text itself is a good enough signal and no
 * species data has to carry presentation concerns. Most specific wins; falls back to the
 * generic attack.
 */
export function clipForSkill(text: string, name = ''): ClipId {
  const s = `${name} ${text}`.toLowerCase();
  const has = (...words: string[]): boolean => words.some((w) => s.includes(w));

  if (has('freeze', 'frozen', 'chill', 'slow ', 'cannot act', 'immobil')) return 'freeze';
  if (has('burn', 'scald', 'sear', 'ignite', 'fire')) return 'burn';
  if (has('stun', 'sleep', 'daze', 'seize', 'blind')) return 'stun';
  if (has('poison', 'venom', 'toxin', 'corrode', 'disease')) return 'poison';

  if (has('heal', 'revive', 'restore', 'regenerat', 'cleanse')) return 'heal';
  if (has('shield', 'block', 'absorb', 'immun', 'def ', '+def', 'armour', 'armor')) return 'shield';
  if (has('ally', 'allies', 'team gains', 'buff', '+20%', 'atk up', 'increase')) return 'empower';

  if (has('aoe', 'all enemies', 'team-wide')) return 'stomp';
  if (has('rapid', 'volley', 'multi', 'split among', 'hits')) return 'slash';
  if (has('charge', 'ram', 'crush', 'slam', 'strongest')) return 'charge';
  return 'lunge';
}

/* ─────────────────────────────────────────────────────────────── internals */

const VERT = `attribute vec2 aPos; varying vec2 vUv;
void main(){ vUv = aPos*0.5+0.5; gl_Position = vec4(aPos,0.0,1.0); }`;

const FRAG = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uImg, uDepth;
uniform vec2  uPar, uShockC;
uniform vec3  uFlashCol, uTint, uMoteCol, uRayCol;
uniform float uTime, uAspect;
uniform float uParallax, uSway, uBreath, uRim, uDust, uFoil, uIdle;
uniform float uFlash, uTintAmt, uSat, uBright, uChroma, uRadial;
uniform float uShockAmt, uShockR, uWobble, uFreeze, uBurn, uEmber;
uniform float uMotes, uRays, uSlash, uDark, uZoom;

float hash21(vec2 p){ p = fract(p*vec2(123.34,456.21)); p += dot(p,p+45.32); return fract(p.x*p.y); }

float vnoise(vec2 p){
  vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(hash21(i), hash21(i+vec2(1,0)), f.x),
             mix(hash21(i+vec2(0,1)), hash21(i+vec2(1,1)), f.x), f.y);
}

float voronoiEdge(vec2 p){
  vec2 n = floor(p), f = fract(p);
  float f1 = 8.0, f2 = 8.0;
  for (int j=-1;j<=1;j++) for (int i=-1;i<=1;i++){
    vec2 g = vec2(float(i), float(j));
    vec2 o = vec2(hash21(n+g), hash21(n+g+31.7));
    float d = length(g+o-f);
    if (d < f1){ f2 = f1; f1 = d; } else if (d < f2){ f2 = d; }
  }
  return f2 - f1;
}

float particles(vec2 uv, float scale, float speed, float seed, float size, float dir){
  vec2 q  = uv*vec2(uAspect,1.0)*scale + vec2(sin(uTime*0.2+seed)*0.5, uTime*speed*dir) + seed;
  vec2 id = floor(q), f = fract(q);
  if (hash21(id+seed) < 0.80) return 0.0;
  vec2 c = vec2(hash21(id+1.7), hash21(id+9.1));
  return smoothstep(size, 0.0, length(f-c));
}

float slashFX(vec2 p, float prog){
  float s = 0.0;
  for (int i=0;i<3;i++){
    float fi  = float(i);
    float ang = 0.95 + fi*0.14;
    float d   = abs(p.x*cos(ang) + p.y*sin(ang) - (0.30 + fi*0.24));
    float on  = smoothstep(fi*0.16, fi*0.16+0.10, prog) * (1.0 - smoothstep(fi*0.16+0.28, 1.0, prog));
    s += (smoothstep(0.009, 0.0, d) + smoothstep(0.055, 0.0, d)*0.22) * on;
  }
  return s;
}

vec3 sampleImg(vec2 uv){
  vec2 c = clamp(uv, 0.002, 0.998);
  if (uChroma < 0.0004) return texture2D(uImg, c).rgb;
  vec2 dir = (uv-0.5) * uChroma;
  return vec3(texture2D(uImg, clamp(uv+dir,0.002,0.998)).r,
              texture2D(uImg, c).g,
              texture2D(uImg, clamp(uv-dir,0.002,0.998)).b);
}

void main(){
  float breath = 1.0 - uBreath*uIdle*0.010*(0.5+0.5*sin(uTime*0.9));
  vec2 base = (vUv-0.5) * breath / uZoom + 0.5;

  if (uShockAmt > 0.0005){
    vec2  dv   = (base - uShockC) * vec2(uAspect, 1.0);
    float ring = smoothstep(0.16, 0.0, abs(length(dv) - uShockR));
    base += normalize(dv + 1e-5) * ring * uShockAmt * 0.05;
  }

  base.x += sin(base.y*26.0 + uTime*7.0) * 0.0035 * uWobble;
  base.y += sin(base.x*19.0 + uTime*5.3) * 0.0022 * uWobble;

  // fixed-point iteration, otherwise silhouettes smear under displacement
  vec2 uv = base; float d = 0.5;
  for (int i=0;i<4;i++){
    d  = texture2D(uDepth, uv).r;
    uv = base + uPar * uParallax * (d - 0.40);
  }
  d = texture2D(uDepth, uv).r;

  float s1 = sin(uTime*0.61 + base.y*4.0);
  float s2 = sin(uTime*0.37 + base.x*6.0 + 1.7);
  uv += vec2(s1*0.6 + s2*0.4, s2*0.35) * uSway * uIdle * 0.004 * d;

  vec3 col = vec3(0.0); float wsum = 0.0;
  for (int i=0;i<5;i++){
    float f = float(i)/4.0, w = 1.0 - f*0.55;
    col  += sampleImg(0.5 + (uv-0.5) * (1.0 - f*uRadial*0.30)) * w;
    wsum += w;
  }
  col /= wsum;

  float e  = 1.0/512.0;
  float gx = texture2D(uDepth, uv+vec2(e,0.0)).r - texture2D(uDepth, uv-vec2(e,0.0)).r;
  float gy = texture2D(uDepth, uv+vec2(0.0,e)).r - texture2D(uDepth, uv-vec2(0.0,e)).r;
  float edge = clamp(length(vec2(gx,gy))*14.0, 0.0, 1.0);
  float lit  = clamp(-gx*0.75 - gy*0.65 + uPar.x*0.25, 0.0, 1.0);
  col += edge * lit * uRim * vec3(0.55,0.72,1.0) * (0.65 + 0.35*sin(uTime*1.3));

  float band = pow(max(sin((base.x*1.6 + base.y)*4.0 - uTime*0.7 + uPar.x*3.0), 0.0), 10.0);
  vec3  holo = 0.5 + 0.5*cos(6.2831*(vec3(0.0,0.33,0.67) + base.x*0.9 + uTime*0.05));
  col += band * uFoil * holo * (0.25 + 0.75*d);

  float amb = particles(base, 9.0, 0.030, 0.0, 0.11, -1.0)*0.55
            + particles(base,16.0, 0.055, 3.3, 0.09, -1.0)*0.35;
  col += amb * uDust * uIdle * vec3(1.0,0.96,0.85) * (0.4 + 0.6*(1.0-d));

  if (uRays > 0.0005){
    float r = pow(vnoise(vec2(base.x*8.0 - uTime*0.12, uTime*0.30)), 2.2);
    col += r * (1.0 - base.y*0.65) * uRays * uRayCol * (0.35 + 0.65*d);
  }

  if (uMotes > 0.0005){
    float m = particles(base, 7.0, 0.16, 11.0, 0.14, -1.0)
            + particles(base,13.0, 0.24, 27.0, 0.10, -1.0)*0.7;
    col += m * uMotes * uMoteCol * (0.45 + 0.55*d);
  }

  if (uBurn > 0.0005){
    float n    = vnoise(base*6.0 + vec2(0.0, -uTime*0.55));
    float heat = smoothstep(0.52, 0.86, n) * uBurn;
    col = mix(col, col*vec3(1.5,0.62,0.26), heat*0.75);
    col += heat * vec3(1.0,0.42,0.10) * 0.55 * d;
  }
  if (uEmber > 0.0005){
    col += particles(base, 10.0, 0.30, 5.5, 0.09, -1.0) * uEmber * vec3(1.0,0.48,0.14);
  }

  if (uFreeze > 0.0005){
    float ice = smoothstep(0.42, 0.0, voronoiEdge(base*vec2(uAspect,1.0)*9.0));
    vec3  frozen = mix(vec3(dot(col, vec3(0.299,0.587,0.114))), col, 0.35) * vec3(0.78,0.90,1.12);
    col = mix(col, frozen + ice*0.30*d, uFreeze);
  }

  if (uSlash > 0.0005) col += slashFX(base, uSlash) * vec3(1.0,0.93,0.86) * 1.8;

  float lum = dot(col, vec3(0.299,0.587,0.114));
  col = mix(vec3(lum), col, uSat);
  col = mix(col, lum * uTint * 1.35, uTintAmt);
  col *= uBright;
  col += uFlashCol * uFlash;

  float vig = smoothstep(1.05, 0.35, length((base-0.5)*vec2(1.0,1.15))*1.6);
  col *= mix(0.85, 1.0, vig) * (1.0 - uDark*0.55);

  gl_FragColor = vec4(col, 1.0);
}`;

/** Every animatable channel, at rest. Clips override a subset of these. */
interface Channels {
  flash: number; tintAmt: number; sat: number; bright: number; chroma: number; radial: number;
  shockAmt: number; shockR: number; shockX: number; shockY: number;
  wobble: number; freeze: number; burn: number; ember: number;
  motes: number; rays: number; slash: number; dark: number;
  idle: number; zoom: number;
  rigX: number; rigY: number; rigZ: number; rigRot: number; rigScale: number; shake: number;
}

type ChannelName = keyof Channels;
type Easing = 'lin' | 'in' | 'out' | 'io' | 'exp' | 'back' | 'snap';
type Keyframe = [time: number, value: number, easing?: Easing];

interface Clip {
  dur: number;
  /** Non-animated values for the clip's lifetime — colours, mostly. */
  colors?: Partial<Record<'flashCol' | 'tint' | 'moteCol' | 'rayCol', [number, number, number]>>;
  tracks: Partial<Record<ChannelName, Keyframe[]>>;
}

const REST: Channels = {
  flash: 0, tintAmt: 0, sat: 1, bright: 1, chroma: 0, radial: 0,
  shockAmt: 0, shockR: 0, shockX: 0.5, shockY: 0.52,
  wobble: 0, freeze: 0, burn: 0, ember: 0,
  motes: 0, rays: 0, slash: 0, dark: 0,
  idle: 1, zoom: 1,
  rigX: 0, rigY: 0, rigZ: 0, rigRot: 0, rigScale: 1, shake: 0,
};

const EASE: Record<Easing, (t: number) => number> = {
  lin: (t) => t,
  in: (t) => t * t,
  out: (t) => 1 - (1 - t) * (1 - t),
  io: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  exp: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -9 * t)),
  back: (t) => 1 + 2.4 * Math.pow(t - 1, 3) + 1.6 * Math.pow(t - 1, 2),
  snap: (t) => Math.pow(t, 0.35),
};

function sampleTrack(track: Keyframe[], t: number): number {
  const first = track[0]!;
  if (t <= first[0]) return first[1];
  const last = track[track.length - 1]!;
  if (t >= last[0]) return last[1];
  for (let i = 0; i < track.length - 1; i++) {
    const [t0, v0] = track[i]!;
    const [t1, v1, e] = track[i + 1]!;
    if (t >= t0 && t <= t1) return v0 + (v1 - v0) * EASE[e ?? 'io']((t - t0) / (t1 - t0 || 1e-6));
  }
  return last[1];
}

const CLIPS: Record<ClipId, Clip> = {
  /* ── attack ────────────────────────────────────────────────────────── */
  lunge: {
    dur: 1.0,
    colors: { flashCol: [1, 0.93, 0.85] },
    tracks: {
      rigZ: [[0, 0], [0.18, -55, 'out'], [0.3, 210, 'snap'], [0.4, 190], [0.85, 0, 'io']],
      rigScale: [[0, 1], [0.18, 0.97], [0.3, 1.05, 'snap'], [0.85, 1, 'io']],
      rigRot: [[0, 0], [0.18, 1.6], [0.3, -2.2, 'snap'], [0.6, 0.6], [0.9, 0]],
      zoom: [[0, 1], [0.18, 0.985], [0.3, 1.06, 'snap'], [0.85, 1, 'io']],
      shake: [[0, 0], [0.29, 0], [0.32, 14, 'lin'], [0.62, 0, 'out']],
      flash: [[0, 0], [0.29, 0], [0.33, 0.55, 'lin'], [0.55, 0, 'out']],
      radial: [[0, 0], [0.26, 0], [0.32, 1.6, 'lin'], [0.6, 0, 'out']],
      chroma: [[0, 0], [0.3, 0.01, 'lin'], [0.6, 0, 'out']],
      shockAmt: [[0, 0], [0.31, 1.2, 'lin'], [0.7, 0, 'out']],
      shockR: [[0, 0], [0.31, 0], [0.7, 0.85, 'out']],
      idle: [[0, 1], [0.2, 0.25], [0.75, 1]],
    },
  },
  slash: {
    dur: 0.95,
    colors: { flashCol: [1, 0.96, 0.92] },
    tracks: {
      rigRot: [[0, 0], [0.16, -3.2, 'out'], [0.3, 4, 'snap'], [0.55, -1.2], [0.9, 0]],
      rigX: [[0, 0], [0.16, 14], [0.3, -22, 'snap'], [0.9, 0, 'io']],
      rigZ: [[0, 0], [0.16, -20], [0.3, 90, 'snap'], [0.9, 0, 'io']],
      slash: [[0, 0], [0.26, 0], [0.3, 0.02, 'lin'], [0.8, 1, 'lin']],
      flash: [[0, 0], [0.3, 0.35, 'lin'], [0.5, 0, 'out']],
      shake: [[0, 0], [0.3, 9, 'lin'], [0.58, 0, 'out']],
      chroma: [[0, 0], [0.32, 0.008, 'lin'], [0.62, 0]],
      bright: [[0, 1], [0.31, 1.35, 'lin'], [0.55, 1, 'out']],
      idle: [[0, 1], [0.18, 0.3], [0.78, 1]],
    },
  },
  charge: {
    dur: 1.85,
    colors: { flashCol: [1, 0.85, 0.65], moteCol: [0.85, 0.72, 0.5] },
    tracks: {
      dark: [[0, 0], [0.55, 0.55, 'io'], [0.95, 0.45], [1.05, 0, 'out']],
      rigZ: [[0, 0], [0.7, -95, 'io'], [0.95, 340, 'snap'], [1.1, 300], [1.75, 0, 'io']],
      rigScale: [[0, 1], [0.7, 0.94, 'io'], [0.95, 1.09, 'snap'], [1.75, 1, 'io']],
      zoom: [[0, 1], [0.7, 0.96, 'io'], [0.95, 1.1, 'snap'], [1.75, 1, 'io']],
      rigY: [[0, 0], [0.7, 10], [0.95, -16, 'snap'], [1.75, 0, 'io']],
      motes: [[0, 0], [0.65, 0.55, 'io'], [1.0, 0.2], [1.5, 0]],
      shake: [[0, 0], [0.35, 3, 'io'], [0.7, 7], [0.94, 0], [0.98, 26, 'lin'], [1.45, 0, 'out']],
      flash: [[0, 0], [0.94, 0], [0.99, 0.85, 'lin'], [1.3, 0, 'out']],
      radial: [[0, 0], [0.9, 0], [0.98, 2.4, 'lin'], [1.4, 0, 'out']],
      chroma: [[0, 0], [0.96, 0.018, 'lin'], [1.4, 0, 'out']],
      shockAmt: [[0, 0], [0.97, 1.9, 'lin'], [1.6, 0, 'out']],
      shockR: [[0, 0], [0.97, 0], [1.6, 1.1, 'out']],
      ember: [[0, 0], [0.98, 0.8, 'lin'], [1.7, 0, 'out']],
      idle: [[0, 1], [0.4, 0.15], [1.5, 1]],
    },
  },
  stomp: {
    dur: 1.3,
    colors: { flashCol: [0.95, 0.88, 0.75], moteCol: [0.72, 0.66, 0.55] },
    tracks: {
      rigY: [[0, 0], [0.3, -48, 'out'], [0.46, 34, 'snap'], [0.6, 20], [1.1, 0, 'back']],
      rigScale: [[0, 1], [0.3, 1.03], [0.46, 0.965, 'snap'], [1.1, 1, 'io']],
      rigZ: [[0, 0], [0.3, 40], [0.46, -10, 'snap'], [1.1, 0]],
      shockX: [[0, 0.5]],
      shockY: [[0, 0.12]],
      shockAmt: [[0, 0], [0.47, 1.7, 'lin'], [1.05, 0, 'out']],
      shockR: [[0, 0], [0.47, 0], [1.05, 1, 'out']],
      shake: [[0, 0], [0.46, 0], [0.49, 20, 'lin'], [0.95, 0, 'out']],
      flash: [[0, 0], [0.47, 0.4, 'lin'], [0.7, 0, 'out']],
      motes: [[0, 0], [0.5, 0.7, 'lin'], [1.25, 0, 'out']],
      dark: [[0, 0], [0.47, 0.25, 'lin'], [0.85, 0]],
      idle: [[0, 1], [0.25, 0.2], [1.0, 1]],
    },
  },

  /* ── buff ──────────────────────────────────────────────────────────── */
  empower: {
    dur: 2.2,
    colors: { flashCol: [1, 0.85, 0.45], tint: [1, 0.82, 0.42], moteCol: [1, 0.82, 0.35], rayCol: [1, 0.78, 0.32] },
    tracks: {
      rigY: [[0, 0], [0.55, -22, 'out'], [1.55, -22], [2.15, 0, 'io']],
      rigScale: [[0, 1], [0.55, 1.045, 'out'], [1.55, 1.03], [2.15, 1, 'io']],
      rays: [[0, 0], [0.45, 0.55, 'out'], [1.5, 0.45], [2.2, 0, 'io']],
      motes: [[0, 0], [0.35, 0.85, 'out'], [1.6, 0.6], [2.2, 0, 'io']],
      tintAmt: [[0, 0], [0.45, 0.28, 'out'], [1.6, 0.22], [2.2, 0, 'io']],
      bright: [[0, 1], [0.3, 1.3, 'out'], [0.7, 1.12], [1.7, 1.1], [2.2, 1, 'io']],
      flash: [[0, 0], [0.28, 0.3, 'lin'], [0.6, 0, 'out']],
      sat: [[0, 1], [0.5, 1.25], [1.7, 1.2], [2.2, 1]],
    },
  },
  shield: {
    dur: 1.6,
    colors: { flashCol: [0.6, 0.85, 1], tint: [0.55, 0.78, 1], rayCol: [0.5, 0.8, 1] },
    tracks: {
      rigScale: [[0, 1], [0.14, 0.975, 'out'], [0.34, 1.05, 'back'], [1.0, 1.01], [1.55, 1, 'io']],
      shockAmt: [[0, 0], [0.2, 1.4, 'lin'], [0.95, 0, 'out']],
      shockR: [[0, 0], [0.2, 0], [0.95, 1.15, 'out']],
      flash: [[0, 0], [0.18, 0.45, 'lin'], [0.55, 0, 'out']],
      tintAmt: [[0, 0], [0.25, 0.32, 'out'], [1.1, 0.24], [1.6, 0, 'io']],
      bright: [[0, 1], [0.22, 1.18], [1.1, 1.06], [1.6, 1]],
      sat: [[0, 1], [0.3, 0.75], [1.1, 0.85], [1.6, 1]],
      rays: [[0, 0], [0.3, 0.3, 'out'], [1.1, 0.2], [1.6, 0]],
      chroma: [[0, 0], [0.2, 0.006, 'lin'], [0.7, 0, 'out']],
    },
  },
  heal: {
    dur: 2.3,
    colors: { flashCol: [0.6, 1, 0.7], tint: [0.55, 1, 0.62], moteCol: [0.55, 1, 0.6], rayCol: [0.5, 1, 0.6] },
    tracks: {
      rigScale: [[0, 1], [0.9, 1.028, 'io'], [1.7, 1.02], [2.3, 1, 'io']],
      rigY: [[0, 0], [0.9, -9, 'io'], [2.3, 0, 'io']],
      motes: [[0, 0], [0.4, 0.9, 'out'], [1.7, 0.55], [2.3, 0, 'io']],
      rays: [[0, 0], [0.5, 0.32, 'out'], [1.7, 0.22], [2.3, 0]],
      tintAmt: [[0, 0], [0.5, 0.22, 'out'], [1.7, 0.16], [2.3, 0, 'io']],
      bright: [[0, 1], [0.45, 1.16, 'io'], [1.7, 1.1], [2.3, 1, 'io']],
      sat: [[0, 1], [0.6, 1.15], [1.7, 1.12], [2.3, 1]],
    },
  },

  /* ── debuff ────────────────────────────────────────────────────────── */
  poison: {
    dur: 2.6,
    colors: { tint: [0.42, 1, 0.48], moteCol: [0.45, 0.95, 0.4] },
    tracks: {
      rigY: [[0, 0], [0.7, 14, 'io'], [2.0, 16], [2.55, 0, 'io']],
      rigScale: [[0, 1], [0.7, 0.985, 'io'], [2.55, 1, 'io']],
      tintAmt: [[0, 0], [0.6, 0.5, 'io'], [1.9, 0.45], [2.6, 0, 'io']],
      sat: [[0, 1], [0.6, 0.55, 'io'], [1.9, 0.6], [2.6, 1, 'io']],
      bright: [[0, 1], [0.6, 0.86, 'io'], [1.9, 0.9], [2.6, 1, 'io']],
      wobble: [[0, 0], [0.5, 1, 'io'], [2.0, 0.85], [2.6, 0, 'io']],
      motes: [[0, 0], [0.4, 0.55, 'out'], [2.0, 0.4], [2.6, 0, 'io']],
      dark: [[0, 0], [0.7, 0.28, 'io'], [2.0, 0.24], [2.6, 0]],
      idle: [[0, 1], [0.7, 0.55], [2.2, 1]],
    },
  },
  freeze: {
    dur: 2.6,
    colors: { flashCol: [0.75, 0.9, 1], tint: [0.6, 0.8, 1] },
    tracks: {
      freeze: [[0, 0], [0.22, 1, 'snap'], [2.0, 0.95], [2.6, 0, 'out']],
      idle: [[0, 1], [0.2, 0.04, 'snap'], [1.9, 0.1], [2.6, 1, 'io']], // the passive loop locks up
      flash: [[0, 0], [0.18, 0.5, 'lin'], [0.45, 0, 'out']],
      rigScale: [[0, 1], [0.2, 0.985, 'snap'], [2.6, 1, 'io']],
      sat: [[0, 1], [0.22, 0.35, 'snap'], [2.0, 0.4], [2.6, 1, 'out']],
      bright: [[0, 1], [0.22, 1.1, 'snap'], [2.6, 1]],
      shake: [[0, 0], [0.2, 7, 'lin'], [0.45, 0, 'out'], [1.5, 0], [1.62, 2.5, 'lin'], [1.9, 0, 'out']],
      chroma: [[0, 0], [0.2, 0.01, 'lin'], [0.55, 0, 'out']],
      dark: [[0, 0], [0.3, 0.18], [2.0, 0.15], [2.6, 0]],
    },
  },
  burn: {
    dur: 2.6,
    colors: { flashCol: [1, 0.55, 0.2], tint: [1, 0.5, 0.2] },
    tracks: {
      burn: [[0, 0], [0.35, 1, 'out'], [1.9, 0.85], [2.6, 0, 'io']],
      ember: [[0, 0], [0.3, 0.9, 'out'], [2.0, 0.7], [2.6, 0, 'io']],
      wobble: [[0, 0], [0.3, 1.5, 'out'], [2.0, 1.2], [2.6, 0, 'io']],
      flash: [[0, 0], [0.16, 0.4, 'lin'], [0.45, 0, 'out']],
      bright: [[0, 1], [0.4, 1.12], [2.0, 1.08], [2.6, 1]],
      tintAmt: [[0, 0], [0.4, 0.2, 'io'], [2.0, 0.16], [2.6, 0]],
      rigY: [[0, 0], [0.5, -6, 'io'], [1.4, 4], [2.6, 0, 'io']],
      shake: [[0, 0], [0.3, 2.5, 'io'], [2.0, 1.5], [2.6, 0, 'out']],
      idle: [[0, 1], [0.4, 0.6], [2.3, 1]],
    },
  },
  stun: {
    dur: 2.2,
    colors: { tint: [0.75, 0.75, 0.8] },
    tracks: {
      rigRot: [[0, 0], [0.2, 7, 'snap'], [0.65, -5, 'io'], [1.15, 3.5, 'io'], [1.6, -2, 'io'], [2.15, 0, 'io']],
      rigY: [[0, 0], [0.2, 12, 'snap'], [2.15, 0, 'io']],
      rigScale: [[0, 1], [0.2, 0.97, 'snap'], [2.15, 1, 'io']],
      sat: [[0, 1], [0.25, 0.25, 'out'], [1.8, 0.35], [2.2, 1, 'io']],
      bright: [[0, 1], [0.25, 0.82, 'out'], [1.8, 0.88], [2.2, 1, 'io']],
      dark: [[0, 0], [0.3, 0.42, 'out'], [1.8, 0.35], [2.2, 0, 'io']],
      wobble: [[0, 0], [0.3, 0.6, 'out'], [1.8, 0.5], [2.2, 0]],
      chroma: [[0, 0], [0.22, 0.012, 'lin'], [1.0, 0.005], [2.2, 0, 'out']],
      shake: [[0, 0], [0.2, 10, 'lin'], [0.6, 2, 'out'], [1.8, 1], [2.2, 0]],
      idle: [[0, 1], [0.3, 0.35], [2.0, 1]],
    },
  },
};

/** Clip lengths in seconds, for callers that need to time UI against a playing ability. */
export const CLIP_DURATION: Record<ClipId, number> = {
  lunge: CLIPS.lunge.dur, slash: CLIPS.slash.dur, charge: CLIPS.charge.dur, stomp: CLIPS.stomp.dur,
  empower: CLIPS.empower.dur, shield: CLIPS.shield.dur, heal: CLIPS.heal.dur,
  poison: CLIPS.poison.dur, freeze: CLIPS.freeze.dur, burn: CLIPS.burn.dur, stun: CLIPS.stun.dur,
};

/** A tiny bob so a resting card still reads as alive. Not addressable as an ability. */
const ACCENT: Clip = {
  dur: 0.9,
  tracks: {
    rigZ: [[0, 0], [0.25, 26, 'out'], [0.9, 0, 'io']],
    rigY: [[0, 0], [0.25, -5, 'out'], [0.9, 0, 'io']],
    rigRot: [[0, 0], [0.3, 0.8, 'out'], [0.9, 0, 'io']],
  },
};

const UNIFORM_NAMES = [
  'uImg', 'uDepth', 'uPar', 'uShockC', 'uFlashCol', 'uTint', 'uMoteCol', 'uRayCol',
  'uTime', 'uAspect', 'uParallax', 'uSway', 'uBreath', 'uRim', 'uDust', 'uFoil', 'uIdle',
  'uFlash', 'uTintAmt', 'uSat', 'uBright', 'uChroma', 'uRadial', 'uShockAmt', 'uShockR',
  'uWobble', 'uFreeze', 'uBurn', 'uEmber', 'uMotes', 'uRays', 'uSlash', 'uDark', 'uZoom',
] as const;

/** Channels that map 1:1 onto a `u<Name>` float uniform. */
const SHADER_CHANNELS = [
  'flash', 'tintAmt', 'sat', 'bright', 'chroma', 'radial', 'shockAmt', 'shockR',
  'wobble', 'freeze', 'burn', 'ember', 'motes', 'rays', 'slash', 'dark', 'idle', 'zoom',
] as const satisfies readonly ChannelName[];

const PASSIVE = { parallax: 0.022, sway: 1, breath: 1, rim: 0.45, dust: 0.55, foil: 0.22 };

function compile(gl: WebGLRenderingContext, type: number, src: string): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error('createShader failed');
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader) ?? 'shader compile failed');
  }
  return shader;
}

function upload(gl: WebGLRenderingContext, unit: number, source: TexSource): WebGLTexture {
  const tex = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0 + unit);
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
  return tex!;
}

/**
 * Mount an animating card. Falls back to a plain static image of `art` wherever WebGL
 * is unavailable, so a card always renders.
 */
export function createLivingCard(art: TexSource, depth: TexSource, opts: LivingCardOptions = {}): LivingCard {
  const tiltDeg = opts.tiltDeg ?? 8;
  const idleAccents = opts.idleAccents ?? true;
  const motion = opts.motionScale ?? 1;

  const root = document.createElement('div');
  root.className = 'living-card';

  const canvas = document.createElement('canvas');
  canvas.width = art.width;
  canvas.height = art.height;
  root.appendChild(canvas);

  const gl = canvas.getContext('webgl', { antialias: false, alpha: false });
  if (!gl) {
    root.classList.add('living-card--static');
    canvas.getContext('2d')?.drawImage(art, 0, 0);
    return { el: root, play: () => {}, current: () => null, destroy: () => {} };
  }

  const program = gl.createProgram()!;
  gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERT));
  gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program) ?? 'program link failed');
  }
  gl.useProgram(program);

  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(program, 'aPos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const U = {} as Record<(typeof UNIFORM_NAMES)[number], WebGLUniformLocation | null>;
  for (const name of UNIFORM_NAMES) U[name] = gl.getUniformLocation(program, name);

  upload(gl, 0, art);
  upload(gl, 1, depth);
  gl.uniform1i(U.uImg, 0);
  gl.uniform1i(U.uDepth, 1);
  gl.uniform1f(U.uAspect, canvas.width / canvas.height);
  gl.viewport(0, 0, canvas.width, canvas.height);

  let activeId: ClipId | null = null;
  let active: Clip | null = null;
  let activeT = 0;
  let nextAccent = 4 + Math.random() * 4;

  let targetX = 0, targetY = 0, curX = 0, curY = 0;
  let lastMove = -1e9;
  const clamp1 = (v: number): number => Math.max(-1, Math.min(1, v));

  // Tracked on the card itself, and clamped — the pointer roams the page, the tilt must not.
  const onMove = (e: PointerEvent): void => {
    const r = canvas.getBoundingClientRect();
    targetX = clamp1(((e.clientX - r.left) / r.width - 0.5) * 2);
    targetY = clamp1(((e.clientY - r.top) / r.height - 0.5) * 2);
    lastMove = performance.now();
  };
  root.addEventListener('pointermove', onMove);

  const t0 = performance.now();
  let prev = t0;
  let raf = 0;

  const frame = (now: number): void => {
    raf = requestAnimationFrame(frame);
    const t = (now - t0) / 1000;
    const dt = Math.min(0.05, (now - prev) / 1000);
    prev = now;

    if (now - lastMove > 1800) {
      targetX = Math.sin(t * 0.42) * 0.72;
      targetY = Math.sin(t * 0.29 + 1.1) * 0.55;
    }
    curX += (targetX - curX) * 0.06;
    curY += (targetY - curY) * 0.06;

    if (idleAccents && !active) {
      nextAccent -= dt;
      if (nextAccent <= 0) {
        active = ACCENT;
        activeT = 0;
        nextAccent = 5 + Math.random() * 5;
      }
    }

    const s: Channels = { ...REST };
    let flashCol: [number, number, number] = [1, 1, 1];
    let tint: [number, number, number] = [1, 1, 1];
    let moteCol: [number, number, number] = [1, 0.85, 0.4];
    let rayCol: [number, number, number] = [1, 0.85, 0.5];

    if (active) {
      activeT += dt;
      if (activeT >= active.dur) {
        active = null;
        activeId = null;
      } else {
        const c = active.colors;
        if (c?.flashCol) flashCol = c.flashCol;
        if (c?.tint) tint = c.tint;
        if (c?.moteCol) moteCol = c.moteCol;
        if (c?.rayCol) rayCol = c.rayCol;
        for (const key of Object.keys(active.tracks) as ChannelName[]) {
          const track = active.tracks[key];
          if (track) s[key] = sampleTrack(track, activeT);
        }
      }
    }

    const shx = s.shake * Math.sin(t * 137);
    const shy = s.shake * Math.sin(t * 103.7 + 2.1);
    root.style.setProperty(
      '--living-card-transform',
      `translate3d(${(s.rigX + shx) * motion}px, ${(s.rigY + shy) * motion}px, ${s.rigZ * motion}px)` +
        ` rotateY(${curX * tiltDeg}deg) rotateX(${-curY * tiltDeg}deg)` +
        ` rotateZ(${s.rigRot}deg) scale(${s.rigScale})`,
    );

    gl.uniform2f(U.uPar, curX, curY);
    gl.uniform2f(U.uShockC, s.shockX, s.shockY);
    gl.uniform3fv(U.uFlashCol, flashCol);
    gl.uniform3fv(U.uTint, tint);
    gl.uniform3fv(U.uMoteCol, moteCol);
    gl.uniform3fv(U.uRayCol, rayCol);
    gl.uniform1f(U.uTime, t);
    gl.uniform1f(U.uParallax, PASSIVE.parallax);
    gl.uniform1f(U.uSway, PASSIVE.sway);
    gl.uniform1f(U.uBreath, PASSIVE.breath);
    gl.uniform1f(U.uRim, PASSIVE.rim);
    gl.uniform1f(U.uDust, PASSIVE.dust);
    gl.uniform1f(U.uFoil, PASSIVE.foil);
    for (const key of SHADER_CHANNELS) {
      gl.uniform1f(U[`u${key[0]!.toUpperCase()}${key.slice(1)}` as keyof typeof U], s[key]);
    }

    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };
  raf = requestAnimationFrame(frame);

  return {
    el: root,
    play(clip) {
      activeId = clip;
      active = CLIPS[clip];
      activeT = 0;
      nextAccent = active.dur + 3.5 + Math.random() * 4;
    },
    current: () => activeId,
    destroy() {
      cancelAnimationFrame(raf);
      root.removeEventListener('pointermove', onMove);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      root.remove();
    },
  };
}
