import type { Scene } from 'aframe';
import { createPanoramaCache, type PanoramaCache } from './panorama-cache';
import { loadPanoramaTexture } from './texture-loader';

const SYSTEM_NAME = 'panorama-cache';

interface PanoramaCacheSystem {
  cache: PanoramaCache | null;
}

export function registerPanoramaCacheSystem(): void {
  if (AFRAME.systems[SYSTEM_NAME]) return;
  AFRAME.registerSystem<PanoramaCacheSystem>(SYSTEM_NAME, {
    cache: null,
    init() {
      const sceneEl = this.el as unknown as Scene;
      this.cache = createPanoramaCache({
        loadTexture: loadPanoramaTexture,
        upload: (texture) => sceneEl.renderer.initTexture(texture),
      });
    },
  });
}

export function getPanoramaCache(sceneEl: Scene): PanoramaCache {
  const system = sceneEl.systems[SYSTEM_NAME] as unknown as PanoramaCacheSystem | undefined;
  if (!system?.cache) throw new Error('Sistem panorama-cache belum terdaftar');
  return system.cache;
}
