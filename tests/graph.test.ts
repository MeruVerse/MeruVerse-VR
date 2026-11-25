import { describe, expect, it } from 'vitest';
import { SCENES } from '../src/tour/data/scenes';
import type { Scene, SceneId } from '../src/tour/data/types';
import {
  entryPanorama,
  neighborIds,
  panoramaUrls,
  retainedUrls,
  wakePanorama,
  wakeUrls,
} from '../src/tour/state/graph';

const byId = new Map<SceneId, Scene>(SCENES.map((scene) => [scene.id, scene]));
const find = (id: SceneId) => byId.get(id);
const UNLINKED_SCENE_IDS: readonly SceneId[] = ['ruang-pamer-2'];
const sceneAt = (index: number): Scene => {
  const scene = SCENES[index];
  if (!scene) throw new Error(`scene ${index} tidak ada`);
  return scene;
};

describe('neighborIds', () => {
  it('berisi target hotspot nav tanpa duplikat', () => {
    for (const scene of SCENES) {
      const ids = neighborIds(scene);
      expect(new Set(ids).size).toBe(ids.length);
      if (!UNLINKED_SCENE_IDS.includes(scene.id)) expect(ids.length).toBeGreaterThan(0);
    }
  });

  it('mengabaikan hotspot info', () => {
    const scene: Scene = {
      ...sceneAt(0),
      hotspots: [{ id: 'info-1', type: 'info', yaw: 0, pitch: 0, artworkIds: ['x'] }],
    };
    expect(neighborIds(scene)).toEqual([]);
  });

  it('menyatukan dua hotspot yang menuju scene yang sama', () => {
    const base = sceneAt(0);
    const target = sceneAt(1).id;
    const scene: Scene = {
      ...base,
      hotspots: [
        { id: 'a', type: 'nav', yaw: 0, pitch: 0, target },
        { id: 'b', type: 'nav', yaw: 40, pitch: 0, target },
      ],
    };
    expect(neighborIds(scene)).toEqual([target]);
  });
});

describe('panoramaUrls', () => {
  it('mengurutkan preview lebih dulu lalu full', () => {
    const scene = sceneAt(0);
    expect(panoramaUrls(scene)).toEqual([scene.panorama.preview, scene.panorama.full]);
  });
});

describe('retainedUrls', () => {
  it('berisi hanya scene aktif dan tetangganya', () => {
    const active = sceneAt(4);
    const expectedScenes = [active, ...neighborIds(active).map((id) => byId.get(id))];
    const expected = expectedScenes.flatMap((scene) => (scene ? panoramaUrls(scene) : []));
    expect([...retainedUrls(active, find)].sort()).toEqual([...new Set(expected)].sort());
  });

  it('tidak memuat scene yang jauh dari scene aktif', () => {
    const urls = retainedUrls(sceneAt(0), find);
    const farthest = SCENES[SCENES.length - 1];
    expect(urls.has(farthest?.panorama.full ?? '')).toBe(false);
  });

  it('jumlahnya terbatas pada scene aktif dan tetangga, bukan seluruh tur', () => {
    for (const scene of SCENES) {
      const limit = (neighborIds(scene).length + 1) * 2 + wakeUrls(scene).length;
      expect(retainedUrls(scene, find).size).toBeLessThanOrEqual(limit);
    }
  });

  it('scene berpose istirahat dimasuki lewat pose itu, bukan panorama utamanya', () => {
    const owner = SCENES.find((scene) => scene.rest);
    if (!owner?.rest) throw new Error('tidak ada scene dengan pose istirahat');
    expect(entryPanorama(owner)).toBe(owner.rest.panorama);
    expect(panoramaUrls(owner)).toEqual([owner.rest.panorama.preview, owner.rest.panorama.full]);
    expect(entryPanorama(sceneAt(0))).toBe(sceneAt(0).panorama);
  });

  it('panorama "bangun" hanya dipertahankan selama scene pemiliknya aktif', () => {
    const owner = SCENES.find((scene) => scene.rest);
    if (!owner?.rest) throw new Error('tidak ada scene dengan pose istirahat');
    const { full, preview } = owner.rest.wakePanorama ?? owner.panorama;
    expect(wakePanorama(owner)).toEqual({ full, preview });
    expect(wakePanorama(sceneAt(0))).toBeNull();
    expect(wakeUrls(owner)).toEqual([preview, full]);
    expect(retainedUrls(owner, find).has(full)).toBe(true);
    expect(retainedUrls(owner, find).has(owner.rest.panorama.full)).toBe(true);
    for (const id of neighborIds(owner)) {
      const neighbor = byId.get(id);
      if (!neighbor) continue;
      expect(retainedUrls(neighbor, find).has(full)).toBe(false);
      expect(retainedUrls(neighbor, find).has(owner.rest.panorama.full)).toBe(true);
    }
  });

  it('melewati tetangga yang tidak ditemukan tanpa error', () => {
    const urls = retainedUrls(sceneAt(0), () => undefined);
    expect(urls.size).toBe(2);
  });
});
