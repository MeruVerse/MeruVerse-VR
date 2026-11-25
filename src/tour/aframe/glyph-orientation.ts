import type { Entity } from 'aframe';
import { NAV_GLYPH_TILT_DEGREES } from './constants';
import type { Group } from './three-types';

const DEGREES_TO_RADIANS = Math.PI / 180;

export interface GlyphOrienter {
  orient(glyph: Group): void;
}

export function createGlyphOrienter(el: Entity): GlyphOrienter {
  const THREE = AFRAME.THREE;
  const cameraQuaternion = new THREE.Quaternion();
  const cameraPosition = new THREE.Vector3();
  const hotspotPosition = new THREE.Vector3();
  const lookFrame = new THREE.Object3D();
  const tilt = new THREE.Quaternion().setFromAxisAngle(
    new THREE.Vector3(1, 0, 0),
    -NAV_GLYPH_TILT_DEGREES * DEGREES_TO_RADIANS,
  );

  return {
    orient(glyph) {
      const camera = el.sceneEl?.camera;
      if (!camera) return;
      camera.getWorldQuaternion(cameraQuaternion);
      camera.getWorldPosition(cameraPosition);
      el.object3D.getWorldPosition(hotspotPosition);
      lookFrame.position.copy(hotspotPosition);
      lookFrame.lookAt(cameraPosition);
      glyph.quaternion
        .copy(cameraQuaternion)
        .invert()
        .multiply(lookFrame.quaternion)
        .multiply(tilt);
    },
  };
}
