import { type Direction, positionToSpherical } from '../aframe/spherical';
import type { Camera } from '../aframe/three-types';

export function pointerToDirection(
  event: MouseEvent,
  canvas: HTMLCanvasElement,
  camera: Camera,
): Direction {
  const THREE = AFRAME.THREE;
  const rect = canvas.getBoundingClientRect();
  const ndc = new THREE.Vector2(
    ((event.clientX - rect.left) / rect.width) * 2 - 1,
    -((event.clientY - rect.top) / rect.height) * 2 + 1,
  );
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(ndc, camera);
  const { x, y, z } = raycaster.ray.direction;
  return positionToSpherical(x, y, z);
}
