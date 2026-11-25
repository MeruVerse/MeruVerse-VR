import type { Cleanup } from '../shared/cleanup';
import { onIdle } from '../shared/idle';
import type { PanoramaCache } from './aframe/panorama-cache';
import type { Scene, SceneId } from './data/types';
import { neighborIds, panoramaUrls, retainedUrls } from './state/graph';

export interface Preloader {
  settle(activeId: SceneId): void;
  dispose: Cleanup;
}

export function createPreloader(cache: PanoramaCache, scenes: readonly Scene[]): Preloader {
  const byId = new Map(scenes.map((scene) => [scene.id, scene]));
  let cancelIdle: Cleanup | null = null;

  function preloadSequentially(urls: string[]): void {
    const next = urls.shift();
    if (next === undefined) return;
    cancelIdle = onIdle(() => {
      cache
        .load(next)
        .catch(() => undefined)
        .then(() => preloadSequentially(urls));
    });
  }

  return {
    settle(activeId) {
      cancelIdle?.();
      const active = byId.get(activeId);
      if (!active) return;
      cache.retain(retainedUrls(active, (id) => byId.get(id)));
      const neighbors = neighborIds(active).flatMap((id) => {
        const scene = byId.get(id);
        return scene ? panoramaUrls(scene) : [];
      });
      preloadSequentially(neighbors.filter((url) => !cache.peek(url)));
    },
    dispose() {
      cancelIdle?.();
      cancelIdle = null;
    },
  };
}
