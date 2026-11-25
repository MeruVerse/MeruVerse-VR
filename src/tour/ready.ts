import type { Scene } from 'aframe';
import { getPanoramaCache } from './aframe/panorama-cache-system';

const READY_TIMEOUT_MS = 4000;

export function waitForPanorama(sceneEl: Scene): Promise<void> {
  const cache = getPanoramaCache(sceneEl);
  const start = performance.now();
  return new Promise((resolve) => {
    const check = () => {
      const ready = cache.size() >= 1;
      if (ready || performance.now() - start > READY_TIMEOUT_MS) resolve();
      else requestAnimationFrame(check);
    };
    check();
  });
}
