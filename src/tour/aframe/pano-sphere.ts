import type { Entity } from 'aframe';
import { PANO_RADIUS, PANO_SEGMENTS, PANO_YAW_OFFSET_RADIANS } from './constants';
import { getPanoramaCache } from './panorama-cache-system';
import type { Vec3 } from './spherical';
import type { MeshBasicMaterial, Texture } from './three-types';

const COMPONENT_NAME = 'pano-sphere';

export interface PanoramaSource {
  readonly full: string;
  readonly preview: string;
}

export interface PanoSphereController {
  readonly material: MeshBasicMaterial;
  show(source: PanoramaSource): Promise<void>;
  clear(): void;
  setRenderOrder(order: number): void;
  setOffset(offset: Vec3): void;
  setYawOffset(radians: number): void;
  dispose(): void;
}

interface PanoSphereState {
  controller: PanoSphereController | null;
}

export function createPanoSphereController(el: Entity, radius: number): PanoSphereController {
  const THREE = AFRAME.THREE;
  const geometry = new THREE.SphereGeometry(radius, PANO_SEGMENTS.width, PANO_SEGMENTS.height);
  const material = new THREE.MeshBasicMaterial({
    side: THREE.BackSide,
    transparent: true,
    depthWrite: false,
    opacity: 0,
    toneMapped: false,
    fog: false,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.scale.x = -1;
  mesh.rotation.y = PANO_YAW_OFFSET_RADIANS;
  mesh.frustumCulled = false;
  mesh.visible = false;
  el.setObject3D('mesh', mesh);

  const cache = () => (el.sceneEl ? getPanoramaCache(el.sceneEl) : null);
  let token = 0;

  function apply(texture: Texture): void {
    const needsRecompile = material.map === null;
    material.map = texture;
    if (needsRecompile) material.needsUpdate = true;
    mesh.visible = true;
  }

  function clear(): void {
    token += 1;
    material.map = null;
    material.needsUpdate = true;
    material.opacity = 0;
    mesh.visible = false;
    mesh.position.set(0, 0, 0);
    mesh.rotation.y = PANO_YAW_OFFSET_RADIANS;
  }

  async function show(source: PanoramaSource): Promise<void> {
    const textures = cache();
    if (!textures) return;
    token += 1;
    const current = token;
    const ready = textures.peek(source.full);
    if (ready) {
      apply(ready);
      return;
    }
    const preview = await textures.load(source.preview).catch(() => null);
    if (current !== token) return;
    if (preview) apply(preview);
    const upgrade = textures.load(source.full).then((full) => {
      if (current === token) apply(full);
    });
    if (!preview) await upgrade;
    else upgrade.catch(() => undefined);
  }

  return {
    material,
    show,
    clear,
    setRenderOrder: (order) => {
      mesh.renderOrder = order;
    },
    setOffset: (offset) => mesh.position.set(offset.x, offset.y, offset.z),
    setYawOffset: (radians) => {
      mesh.rotation.y = PANO_YAW_OFFSET_RADIANS + radians;
    },
    dispose() {
      clear();
      el.removeObject3D('mesh');
      geometry.dispose();
      material.dispose();
    },
  };
}

export function getPanoSphere(el: Entity): PanoSphereController {
  const component = el.components[COMPONENT_NAME] as PanoSphereState | undefined;
  if (!component?.controller) throw new Error('Komponen pano-sphere belum siap');
  return component.controller;
}

export function registerPanoSphere(): void {
  if (AFRAME.components[COMPONENT_NAME]) return;
  AFRAME.registerComponent<PanoSphereState>(COMPONENT_NAME, {
    schema: { radius: { type: 'number', default: PANO_RADIUS } },
    controller: null,
    init() {
      const radius = (this.data as { radius: number }).radius;
      this.controller = createPanoSphereController(this.el, radius);
    },
    remove() {
      this.controller?.dispose();
      this.controller = null;
    },
  });
}
