import { describe, expect, it } from 'vitest';
import karya from '../content/karya.json';
import { SCENES, START_SCENE_ID, ZONES } from '../src/tour/data/scenes';
import {
  type Hotspot,
  type NavHotspot,
  SCENE_IDS,
  type SceneId,
  ZONE_IDS,
} from '../src/tour/data/types';

const publicFiles = new Set(Object.keys(import.meta.glob('/public/**/*')));
const sceneIds = SCENES.map((scene) => scene.id);
const allHotspots = SCENES.flatMap((scene) => scene.hotspots);
const isNav = (hotspot: Hotspot): hotspot is NavHotspot => hotspot.type === 'nav';
const duplicates = (values: readonly string[]) =>
  values.filter((value, index) => values.indexOf(value) !== index);

function collectReachable(start: SceneId): Set<SceneId> {
  const reachable = new Set<SceneId>([start]);
  const queue: SceneId[] = [start];
  while (queue.length > 0) {
    const current = queue.shift();
    const scene = SCENES.find((candidate) => candidate.id === current);
    for (const hotspot of scene?.hotspots.filter(isNav) ?? []) {
      if (reachable.has(hotspot.target)) continue;
      reachable.add(hotspot.target);
      queue.push(hotspot.target);
    }
  }
  return reachable;
}

describe('identitas scene dan hotspot', () => {
  it('tidak ada id scene ganda', () => {
    expect(duplicates(sceneIds)).toEqual([]);
  });

  it('tidak ada id hotspot ganda', () => {
    expect(duplicates(allHotspots.map((hotspot) => hotspot.id))).toEqual([]);
  });

  it('daftar scene sama dengan SCENE_IDS', () => {
    expect([...sceneIds].sort()).toEqual([...SCENE_IDS].sort());
  });

  it('daftar zona sama dengan ZONE_IDS', () => {
    expect(ZONES.map((zone) => zone.id).sort()).toEqual([...ZONE_IDS].sort());
  });
});

describe('graf ruang', () => {
  it('semua target hotspot nav menunjuk scene yang ada', () => {
    const targets = allHotspots.filter(isNav).map((hotspot) => hotspot.target);
    expect(targets.filter((target) => !sceneIds.includes(target))).toEqual([]);
  });

  it('tidak ada hotspot nav yang menunjuk scene pemiliknya sendiri', () => {
    const selfLinks = SCENES.flatMap((scene) =>
      scene.hotspots.filter(isNav).filter((hotspot) => hotspot.target === scene.id),
    );
    expect(selfLinks).toEqual([]);
  });

  it('dari scene awal hanya bisa ke Pintu Galeri, tidak langsung ke A-Merch', () => {
    const start = SCENES.find((scene) => scene.id === START_SCENE_ID);
    const targets = (start?.hotspots ?? []).filter(isNav).map((hotspot) => hotspot.target);
    expect(targets).toEqual(['pintu-galeri']);
  });

  it('Pintu Galeri menjadi pintu ke A-Merch dan Ruang Pamer 1, dengan info kasir', () => {
    const lobby = SCENES.find((scene) => scene.id === 'pintu-galeri');
    const targets = (lobby?.hotspots ?? []).filter(isNav).map((hotspot) => hotspot.target);
    expect(targets).toContain('a-merch');
    expect(targets).toContain('ruang-pamer-1-part-1');
    expect(lobby?.hotspots.some((hotspot) => hotspot.id === 'info-pintu-galeri-kasir')).toBe(true);
  });

  it('urutan zona di Peta: Pintu Masuk, Pintu Galeri, lalu A-Merch', () => {
    expect(ZONES.slice(0, 3).map((zone) => zone.id)).toEqual([
      'pintu-masuk',
      'pintu-galeri',
      'a-merch',
    ]);
  });

  it('zona A-Merch dibuka di scene A-Merch, bukan di Pintu Galeri', () => {
    expect(ZONES.find((zone) => zone.id === 'a-merch')?.entry).toBe('a-merch');
    expect(ZONES.find((zone) => zone.id === 'pintu-galeri')?.entry).toBe('pintu-galeri');
  });

  it('semua scene bisa dicapai dari scene awal', () => {
    expect([...collectReachable(START_SCENE_ID)].sort()).toEqual([...sceneIds].sort());
  });

  it('Ruang Pamer 1 dan 3 terhubung melalui Ruang Pamer 2 tanpa jalan pintas', () => {
    const targets = (id: SceneId) =>
      SCENES.find((scene) => scene.id === id)
        ?.hotspots.filter(isNav)
        .map((hotspot) => hotspot.target);
    expect(targets('ruang-pamer-2')?.sort()).toEqual([
      'ruang-pamer-1-part-2',
      'ruang-pamer-3-part-1',
    ]);
    expect(targets('ruang-pamer-1-part-2')).toContain('ruang-pamer-2');
    expect(targets('ruang-pamer-3-part-1')).toContain('ruang-pamer-2');
    expect(targets('ruang-pamer-1-part-2')).not.toContain('ruang-pamer-3-part-1');
    expect(targets('ruang-pamer-3-part-1')).not.toContain('ruang-pamer-1-part-2');
  });

  it('semua sambungan dua arah', () => {
    const edges = new Set(
      SCENES.flatMap((scene) =>
        scene.hotspots.filter(isNav).map((hotspot) => `${scene.id}>${hotspot.target}`),
      ),
    );
    const missingReturns = [...edges].filter((edge) => {
      const [from, to] = edge.split('>');
      return !edges.has(`${to}>${from}`);
    });
    expect(missingReturns).toEqual([]);
  });
});

describe('zona', () => {
  it('setiap zone.entry ada dan berzona sama', () => {
    for (const zone of ZONES) {
      const entry = SCENES.find((scene) => scene.id === zone.entry);
      expect(entry, `entry zona ${zone.id}`).toBeDefined();
      expect(entry?.zone).toBe(zone.id);
    }
  });

  it('setiap scene memakai zona yang terdaftar', () => {
    const zoneIds = ZONES.map((zone) => zone.id);
    expect(SCENES.filter((scene) => !zoneIds.includes(scene.zone))).toEqual([]);
  });
});

describe('berkas panorama', () => {
  it('file full dan preview setiap scene ada di public/', () => {
    const missing = SCENES.flatMap((scene) => [scene.panorama.full, scene.panorama.preview]).filter(
      (path) => !publicFiles.has(`/public${path}`),
    );
    expect(missing).toEqual([]);
  });

  it('pose istirahat dan efek suara bangun ada di public/ untuk scene yang memilikinya', () => {
    const poses = SCENES.flatMap((scene) => (scene.rest ? [scene.rest] : []));
    expect(poses.length).toBeGreaterThan(0);
    const soundFiles = new Set(Object.keys(import.meta.glob('/public/sfx/*')));
    const missing = poses.flatMap((pose) => [
      ...[pose.panorama, ...(pose.wakePanorama ? [pose.wakePanorama] : [])]
        .flatMap((panorama) => [panorama.full, panorama.preview])
        .filter((path) => !publicFiles.has(`/public${path}`)),
      ...(soundFiles.has(`/public${pose.wakeSound}`) ? [] : [pose.wakeSound]),
    ]);
    expect(missing).toEqual([]);
  });
});

describe('hotspot', () => {
  it('setiap artworkIds ada di karya.json', () => {
    const knownIds = new Set(karya.artworks.map((artwork) => artwork.id));
    const unknown = allHotspots.flatMap((hotspot) =>
      hotspot.type === 'info' && 'artworkIds' in hotspot
        ? hotspot.artworkIds.filter((id) => !knownIds.has(id))
        : [],
    );
    expect(unknown).toEqual([]);
  });

  it('hotspot info bertulis punya judul', () => {
    const notes = allHotspots.filter((hotspot) => hotspot.type === 'info' && 'title' in hotspot);
    expect(notes.length).toBeGreaterThan(0);
    for (const note of notes) {
      expect('title' in note && note.title.trim().length).toBeGreaterThan(0);
    }
  });

  it('info kasir memuat biaya masuk dan jam tutup dari pemilik proyek', () => {
    const cashier = allHotspots.find((hotspot) => hotspot.id === 'info-pintu-galeri-kasir');
    expect(cashier && 'body' in cashier ? cashier.body : '').toContain('Rp 15.000');
    expect(cashier && 'body' in cashier ? cashier.body : '').toContain('22.00');
  });

  it('A-Merch dan Ruang Pamer 1 terhubung melalui Pintu Galeri tanpa panah keluar ganda', () => {
    const merch = SCENES.find((scene) => scene.id === 'a-merch');
    const navs = (merch?.hotspots ?? []).filter(isNav);
    const toGallery = navs.filter((hotspot) => hotspot.target === 'ruang-pamer-1-part-1');
    const toLobby = navs.filter((hotspot) => hotspot.target === 'pintu-galeri');
    expect(toGallery).toHaveLength(0);
    expect(toLobby).toHaveLength(1);
    expect(toLobby[0]?.pending).toBeUndefined();
    const gallery = SCENES.find((scene) => scene.id === 'ruang-pamer-1-part-1');
    const galleryTargets = gallery?.hotspots.filter(isNav).map((hotspot) => hotspot.target);
    expect(galleryTargets).toContain('pintu-galeri');
    expect(galleryTargets).not.toContain('a-merch');
  });

  it('A-Merch punya hotspot info bertulis tanpa harga untuk isi ruangannya', () => {
    const merch = SCENES.find((scene) => scene.id === 'a-merch');
    const notes = (merch?.hotspots ?? []).filter(
      (hotspot) => hotspot.type === 'info' && 'title' in hotspot,
    );
    expect(notes.length).toBeGreaterThanOrEqual(3);
    for (const note of notes) {
      const body = 'body' in note ? note.body : '';
      expect(`${note.id} ${body}`, note.id).not.toMatch(/Rp|\d{3}/);
      expect(body.length, note.id).toBeGreaterThanOrEqual(60);
      expect(note.id).not.toMatch(/spanduk|teks-dinding|first-passage/);
    }
  });

  it('yaw dan pitch berada dalam rentang yang sah', () => {
    for (const hotspot of allHotspots) {
      expect(Math.abs(hotspot.yaw)).toBeLessThanOrEqual(180);
      expect(Math.abs(hotspot.pitch)).toBeLessThanOrEqual(90);
    }
  });

  it('yaw hotspot dalam satu scene tidak bertumpuk', () => {
    for (const scene of SCENES) {
      const yaws = scene.hotspots.map((hotspot) => String(hotspot.yaw));
      expect(duplicates(yaws), `yaw ganda di ${scene.id}`).toEqual([]);
    }
  });

  it.runIf(String(import.meta.env.RELEASE) === '1')('rilis: tidak ada hotspot pending', () => {
    expect(allHotspots.filter((hotspot) => hotspot.pending)).toEqual([]);
  });
});
