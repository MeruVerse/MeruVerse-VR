import type { Scene } from 'aframe';
import { gsap } from 'gsap';
import { prefersReducedMotion } from '../shared/motion/reduced-motion';
import { CAMERA_FOV, DURATION, EASE } from '../shared/motion/tokens';
import type { Portal } from '../shared/transition/portal';
import type { PerspectiveCamera } from './aframe/three-types';
import { waitForPanorama } from './ready';

const HUD_SELECTOR = '[data-hud]';
const HUD_DELAY = 0.6;

function setFov(sceneEl: Scene, value: number): void {
  const camera = sceneEl.camera as PerspectiveCamera;
  camera.fov = value;
  camera.updateProjectionMatrix();
}

export function hideHud(): void {
  gsap.set(HUD_SELECTOR, { autoAlpha: 0 });
}

export async function playPortalEntry(portal: Portal, sceneEl: Scene): Promise<void> {
  await waitForPanorama(sceneEl);
  const reduced = prefersReducedMotion();
  const fov = { value: CAMERA_FOV.portalWide };
  if (!reduced) setFov(sceneEl, fov.value);
  gsap.to(HUD_SELECTOR, {
    autoAlpha: 1,
    duration: DURATION.base,
    ease: EASE.out,
    delay: reduced ? 0 : HUD_DELAY,
  });
  const zoom = reduced
    ? Promise.resolve()
    : new Promise<void>((resolve) => {
        gsap.to(fov, {
          value: CAMERA_FOV.normal,
          duration: DURATION.portal * 1.4,
          ease: EASE.out,
          onUpdate: () => setFov(sceneEl, fov.value),
          onComplete: resolve,
        });
      });
  await Promise.all([portal.reveal(), zoom]);
  portal.dispose();
}
