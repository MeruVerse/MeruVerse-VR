import type { Entity } from 'aframe';
import { pitchToCameraRotation, yawToCameraRotation } from './spherical';
import type { Object3D } from './three-types';

interface LookControlsInternals {
  yawObject: Object3D;
  pitchObject: Object3D;
  magicWindowDeltaEuler?: { y: number };
}

export function setCameraLook(cameraEl: Entity, yaw: number, pitch: number): void {
  const lookControls = cameraEl.components['look-controls'] as LookControlsInternals | undefined;
  if (!lookControls) return;
  const sensorYaw = lookControls.magicWindowDeltaEuler?.y ?? 0;
  lookControls.yawObject.rotation.y = yawToCameraRotation(yaw) - sensorYaw;
  lookControls.pitchObject.rotation.x = pitchToCameraRotation(pitch);
}

export function setCameraHeading(cameraEl: Entity, yaw: number): void {
  setCameraLook(cameraEl, yaw, 0);
}
