import type { Panorama, Scene, SceneId } from '../data/types';

export function neighborIds(scene: Scene): SceneId[] {
  const targets = scene.hotspots.flatMap((hotspot) =>
    hotspot.type === 'nav' ? [hotspot.target] : [],
  );
  return [...new Set(targets)];
}

/** Panorama yang tampil saat scene dimasuki: pose istirahat kalau ada, selain itu panorama utama. */
export function entryPanorama(scene: Scene): Panorama {
  return scene.rest?.panorama ?? scene.panorama;
}

export function panoramaUrls(scene: Scene): string[] {
  const panorama = entryPanorama(scene);
  return [panorama.preview, panorama.full];
}

/** Panorama saat karya bangun dari pose istirahat; null untuk scene tanpa pose istirahat. */
export function wakePanorama(scene: Scene): Panorama | null {
  if (!scene.rest) return null;
  return scene.rest.wakePanorama ?? scene.panorama;
}

/** Panorama "bangun" hanya dipakai selama scene itu aktif, jadi tidak ikut dimuat untuk tetangga. */
export function wakeUrls(scene: Scene): string[] {
  const panorama = wakePanorama(scene);
  return panorama ? [panorama.preview, panorama.full] : [];
}

export function retainedUrls(
  active: Scene,
  findScene: (id: SceneId) => Scene | undefined,
): Set<string> {
  const urls = new Set([...panoramaUrls(active), ...wakeUrls(active)]);
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
