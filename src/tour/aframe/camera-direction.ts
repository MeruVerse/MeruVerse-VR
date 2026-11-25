import { type Direction, positionToSpherical } from './spherical';
import type { Camera } from './three-types';

export function cameraDirection(camera: Camera): Direction {
  const { x, y, z } = camera.getWorldDirection(new AFRAME.THREE.Vector3());
  return positionToSpherical(x, y, z);
}
