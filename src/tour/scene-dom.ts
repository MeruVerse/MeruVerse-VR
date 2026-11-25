import type { Entity, Scene } from 'aframe';
import { CAMERA_FOV } from '../shared/motion/tokens';
import { MAX_PIXEL_RATIO } from './aframe/constants';
import { readThemeColors } from './aframe/theme-colors';

export interface TourScene {
  readonly sceneEl: Scene;
  readonly cameraEl: Entity;
  readonly panoEls: readonly [Entity, Entity];
  readonly poseEl: Entity;
  readonly hotspotContainer: Entity;
  readonly nadirEl: Entity;
}

function entity(attributes: Record<string, string | object> = {}): Entity {
  const el = document.createElement('a-entity') as Entity;
  for (const [name, value] of Object.entries(attributes)) el.setAttribute(name, value);
  return el;
}

export function createTourScene(): TourScene {
  const colors = readThemeColors();
  const sceneEl = document.createElement('a-scene') as Scene;
  sceneEl.setAttribute('xr-mode-ui', 'enabled: false');
  sceneEl.setAttribute('loading-screen', 'enabled: false');
  sceneEl.setAttribute('keyboard-shortcuts', 'enterVR: false');
  sceneEl.setAttribute('renderer', 'antialias: false');
  sceneEl.setAttribute('background', `color: ${colors.ink}`);
  sceneEl.setAttribute('cursor', 'rayOrigin: mouse');
  sceneEl.setAttribute('raycaster', 'objects: [data-hotspot]');

  const cameraEl = entity({
    camera: `fov: ${CAMERA_FOV.normal}`,
    'look-controls': 'touchEnabled: true; magicWindowTrackingEnabled: true',
  });
  const panoEls: [Entity, Entity] = [entity({ 'pano-sphere': '' }), entity({ 'pano-sphere': '' })];
  const poseEl = entity({ 'pano-sphere': '' });
  const nadirEl = entity({ 'nadir-cap': '' });
  const hotspotContainer = entity();
  sceneEl.append(cameraEl, ...panoEls, poseEl, nadirEl, hotspotContainer);
  return { sceneEl, cameraEl, panoEls, poseEl, hotspotContainer, nadirEl };
}

export function whenLoaded(el: Entity): Promise<void> {
  if (el.hasLoaded) return Promise.resolve();
  return new Promise((resolve) => {
    (el as HTMLElement).addEventListener('loaded', () => resolve(), { once: true });
  });
}

export function capPixelRatio(sceneEl: Scene): void {
  sceneEl.renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO));
  window.dispatchEvent(new Event('resize'));
}
