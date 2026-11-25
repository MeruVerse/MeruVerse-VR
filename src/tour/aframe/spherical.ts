export interface Vec3 {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

const DEGREES_TO_RADIANS = Math.PI / 180;
const RADIANS_TO_DEGREES = 180 / Math.PI;

export function sphericalToPosition(yaw: number, pitch: number, radius: number): Vec3 {
  const yawRadians = yaw * DEGREES_TO_RADIANS;
  const pitchRadians = pitch * DEGREES_TO_RADIANS;
  const horizontalRadius = radius * Math.cos(pitchRadians);
  return {
    x: horizontalRadius * Math.sin(yawRadians),
    y: radius * Math.sin(pitchRadians),
    z: -horizontalRadius * Math.cos(yawRadians),
  };
}

export interface Direction {
  readonly yaw: number;
  readonly pitch: number;
}

export function positionToSpherical(x: number, y: number, z: number): Direction {
  const length = Math.hypot(x, y, z);
  if (length === 0) return { yaw: 0, pitch: 0 };
  const sine = Math.max(-1, Math.min(1, y / length));
  return {
    yaw: Math.atan2(x, -z) * RADIANS_TO_DEGREES,
    pitch: Math.asin(sine) * RADIANS_TO_DEGREES,
  };
}

export function yawToCameraRotation(yaw: number): number {
  return -yaw * DEGREES_TO_RADIANS;
}

export function pitchToCameraRotation(pitch: number): number {
  return pitch * DEGREES_TO_RADIANS;
}
