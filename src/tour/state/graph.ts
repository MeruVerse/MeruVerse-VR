import type { Scene, SceneId } from '../data/types';

export function neighborIds(scene: Scene): SceneId[] {
  const targets = scene.hotspots.flatMap((hotspot) =>
    hotspot.type === 'nav' ? [hotspot.target] : [],
  );
  return [...new Set(targets)];
}

export function panoramaUrls(scene: Scene): string[] {
  return [scene.panorama.preview, scene.panorama.full];
}

export function retainedUrls(
  active: Scene,
  findScene: (id: SceneId) => Scene | undefined,
): Set<string> {
  const urls = new Set(panoramaUrls(active));
  for (const id of neighborIds(active)) {
    const neighbor = findScene(id);
    if (neighbor) for (const url of panoramaUrls(neighbor)) urls.add(url);
  }
  return urls;
}

export interface LookDirection {
  readonly yaw: number;
  readonly pitch: number;
}

export function directionToward(from: Scene | undefined, targetId: SceneId): LookDirection | null {
  const hotspot = from?.hotspots.find((candidate) => {
    return candidate.type === 'nav' && candidate.target === targetId;
  });
  return hotspot ? { yaw: hotspot.yaw, pitch: hotspot.pitch } : null;
}
