import type { Quaternion } from './three-types';

const COMPONENT_NAME = 'billboard';

interface BillboardState {
  cameraQuaternion: Quaternion | null;
  parentQuaternion: Quaternion | null;
}

export function registerBillboard(): void {
  if (AFRAME.components[COMPONENT_NAME]) return;
  AFRAME.registerComponent<BillboardState>(COMPONENT_NAME, {
    cameraQuaternion: null,
    parentQuaternion: null,
    init() {
      this.cameraQuaternion = new AFRAME.THREE.Quaternion();
      this.parentQuaternion = new AFRAME.THREE.Quaternion();
    },
    tick() {
      const camera = this.el.sceneEl?.camera;
      const { cameraQuaternion, parentQuaternion } = this;
      if (!camera || !cameraQuaternion || !parentQuaternion) return;
      camera.getWorldQuaternion(cameraQuaternion);
      const object = this.el.object3D;
      object.parent?.getWorldQuaternion(parentQuaternion);
      object.quaternion.copy(parentQuaternion.invert().multiply(cameraQuaternion));
    },
    remove() {
      this.cameraQuaternion = null;
      this.parentQuaternion = null;
    },
  });
}
