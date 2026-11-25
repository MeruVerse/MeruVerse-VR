export const DURATION = {
  fast: 0.25,
  base: 0.6,
  slow: 1.2,
  portal: 0.9,
  reducedFade: 0.3,
  crossfade: 0.8,
} as const;

export const EASE = {
  out: 'expo.out',
  inOut: 'power3.inOut',
  glide: 'sine.inOut',
  linear: 'none',
} as const;

export const DISTANCE = {
  revealY: 40,
  magneticPull: 0.35,
  parallaxMax: 24,
  popRise: 10,
} as const;

export const SCALE = {
  popFrom: 0.94,
} as const;

export const STAGGER = {
  lines: 0.08,
  items: 0.06,
} as const;

export const TRAVEL = {
  duration: 1.15,
  turnEnd: 0.58,
  dissolveStart: 0.24,
  dissolveEnd: 0.72,
  distance: 24,
  maxTurn: 32,
  fovDip: 3.5,
} as const;

export const LANDING = {
  heroPan: 1.1,
  heroPanSpan: 0.9,
  magneticReturn: 0.7,
  preloaderMin: 1.1,
  scrub: 0.7,
  ringFollow: 0.35,
  ringGrow: 2.6,
  slideHold: 4.2,
  slideFade: 1.2,
  slideZoom: 6.5,
  ringScroll: 4,
  ringTilt: 5,
} as const;

export const CAMERA_FOV = {
  portalWide: 120,
  normal: 80,
} as const;
