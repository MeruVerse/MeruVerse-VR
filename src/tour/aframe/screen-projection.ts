import type { Scene } from 'aframe';
import { HOTSPOT_RADIUS } from './constants';
import { sphericalToPosition } from './spherical';

export interface ScreenPoint {
  readonly x: number;
  readonly y: number;
  readonly visible: boolean;
}

export type ScreenProjector = (yaw: number, pitch: number) => ScreenPoint;

export function createScreenProjector(sceneEl: Scene): ScreenProjector {
  const THREE = AFRAME.THREE;
  const world = new THREE.Vector3();
  const view = new THREE.Vector3();

  return (yaw, pitch) => {
    const camera = sceneEl.camera;
    const position = sphericalToPosition(yaw, pitch, HOTSPOT_RADIUS);
    world.set(position.x, position.y, position.z);
    const inFront = view.copy(world).applyMatrix4(camera.matrixWorldInverse).z < 0;
    world.project(camera);
    const rect = sceneEl.canvas.getBoundingClientRect();
    return {
      x: rect.left + ((world.x + 1) / 2) * rect.width,
      y: rect.top + ((1 - world.y) / 2) * rect.height,
      visible: inFront,
    };
  };
}
