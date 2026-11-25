export const PANO_RADIUS = 100;
export const PANO_SEGMENTS = { width: 64, height: 32 } as const;
export const PANO_YAW_OFFSET_RADIANS = -Math.PI / 2;

export const HOTSPOT_RADIUS = 8;
export const HOTSPOT_HOVER_SCALE = 1.15;
export const NAV_GLYPH_TILT_DEGREES = 58;

export const RENDER_ORDER = {
  panoBottom: -20,
  panoTop: -19,
  nadirCap: -10,
  hotspot: 10,
} as const;

export const MAX_PIXEL_RATIO = 2;

export const NADIR = {
  distance: 6,
  halfAngleDegrees: 32,
  textureSize: 512,
  fadeStart: 0.85,
  ringRadius: 0.62,
  ringWidth: 6,
  fontRatio: 0.15,
  fontSample: 96,
  label: 'MeruVerse',
} as const;
