import { describe, expect, it, vi } from 'vitest';
import type { PanoramaSource, PanoSphereController } from '../src/tour/aframe/pano-sphere';
import { createPanoStage } from '../src/tour/aframe/pano-stage';
import { pitchToCameraRotation, yawToCameraRotation } from '../src/tour/aframe/spherical';
import {
  glideOffsets,
  shortestAngleDelta,
  steeringYaw,
  travelFrame,
} from '../src/tour/aframe/travel-math';
import { SCENES } from '../src/tour/data/scenes';
import type { Scene } from '../src/tour/data/types';
import { directionToward } from '../src/tour/state/graph';

describe('shortestAngleDelta', () => {
  it('memilih putaran terpendek lewat batas 180', () => {
    expect(shortestAngleDelta(170, -170)).toBe(20);
    expect(shortestAngleDelta(-170, 170)).toBe(-20);
  });

  it('putaran biasa tanpa pembungkus', () => {
    expect(shortestAngleDelta(10, 50)).toBe(40);
    expect(shortestAngleDelta(50, 10)).toBe(-40);
  });

  it('tidak berputar bila sudah menghadap arah yang sama', () => {
    expect(shortestAngleDelta(90, 90)).toBe(0);
    expect(Math.abs(shortestAngleDelta(0, 360))).toBe(0);
  });

  it('tidak pernah lebih dari setengah putaran', () => {
    for (const [from, to] of [
      [0, 179],
      [0, 181],
      [-90, 250],
      [300, -300],
    ] as const) {
      expect(Math.abs(shortestAngleDelta(from, to))).toBeLessThanOrEqual(180);
    }
  });
});

describe('pitchToCameraRotation', () => {
  it('pitch positif mendongak dan berlawanan arah dengan yaw positif', () => {
    expect(pitchToCameraRotation(90)).toBeCloseTo(Math.PI / 2, 6);
    expect(Math.sign(pitchToCameraRotation(20))).toBe(1);
    expect(Math.sign(yawToCameraRotation(20))).toBe(-1);
  });
});

describe('directionToward', () => {
  const lobby = SCENES.find((scene) => scene.id === 'pintu-galeri');

  it('mengembalikan arah hotspot nav yang menuju scene tujuan', () => {
    const hotspot = lobby?.hotspots.find(
      (candidate) => candidate.type === 'nav' && candidate.target === 'ruang-pamer-1-part-1',
    );
    expect(directionToward(lobby, 'ruang-pamer-1-part-1')).toEqual({
      yaw: hotspot?.yaw,
      pitch: hotspot?.pitch,
    });
  });

  it('null bila scene tujuan bukan tetangga', () => {
    expect(directionToward(lobby, 'lorong')).toBeNull();
  });

  it('null bila belum ada scene sebelumnya', () => {
    expect(directionToward(undefined, 'a-merch')).toBeNull();
  });

  it('hotspot info tidak dianggap arah perjalanan', () => {
    const scene: Scene = {
      ...(lobby as Scene),
      hotspots: [{ id: 'i', type: 'info', yaw: 5, pitch: 5, title: 't', body: 'b' }],
    };
    expect(directionToward(scene, 'a-merch')).toBeNull();
  });

  it('setiap tetangga dari setiap scene punya arah perjalanan', () => {
    for (const scene of SCENES) {
      for (const hotspot of scene.hotspots) {
        if (hotspot.type !== 'nav') continue;
        expect(directionToward(scene, hotspot.target), `${scene.id}`).not.toBeNull();
      }
    }
  });
});

const SOURCE: PanoramaSource = { full: '/full.webp', preview: '/lq.webp' };

function createFakeSphere(showImplementation?: () => Promise<void>) {
  const material = { opacity: 0 };
  const sphere = {
    material,
    show: vi.fn(showImplementation ?? (async () => undefined)),
    clear: vi.fn(() => {
      material.opacity = 0;
    }),
    setRenderOrder: vi.fn(),
    dispose: vi.fn(),
  };
  return sphere as typeof sphere & PanoSphereController;
}

describe('PanoStage.prepare', () => {
  it('ignores a cancelled preparation when its image finishes late', async () => {
    let release: () => void = () => undefined;
    const slow = createFakeSphere(
      () =>
        new Promise((resolve) => {
          release = resolve;
        }),
    );
    const stage = createPanoStage({ spheres: [createFakeSphere(), slow], duration: () => 0.01 });
    const pending = stage.prepare(SOURCE);
    stage.cancelPreparation?.();
    release();
    expect(await pending).toBeNull();
    expect(slow.clear.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it('menyiapkan panorama baru di bola belakang tanpa menampilkannya', async () => {
    const first = createFakeSphere();
    const second = createFakeSphere();
    const stage = createPanoStage({ spheres: [first, second], duration: () => 0.01 });
    const prepared = await stage.prepare(SOURCE);
    expect(prepared?.outgoing).toBe(first);
    expect(prepared?.sphere).toBe(second);
    expect(second.show).toHaveBeenCalledWith(SOURCE);
    expect(second.material.opacity).toBe(0);
  });

  it('commit menukar bola, menampilkan yang baru penuh, dan membersihkan yang lama', async () => {
    const first = createFakeSphere();
    const second = createFakeSphere();
    const stage = createPanoStage({ spheres: [first, second], duration: () => 0.01 });
    const prepared = await stage.prepare(SOURCE);
    prepared?.commit();
    expect(first.clear).toHaveBeenCalled();
    expect(second.material.opacity).toBe(1);
  });

  it('persiapan berikutnya bertukar peran setelah commit', async () => {
    const first = createFakeSphere();
    const second = createFakeSphere();
    const stage = createPanoStage({ spheres: [first, second], duration: () => 0.01 });
    (await stage.prepare(SOURCE))?.commit();
    const next = await stage.prepare(SOURCE);
    expect(next?.sphere).toBe(first);
    expect(next?.outgoing).toBe(second);
  });

  it('persiapan yang disusul persiapan baru menghasilkan null', async () => {
    const pending: (() => void)[] = [];
    const slow = createFakeSphere(
      () =>
        new Promise<void>((resolve) => {
          pending.push(resolve);
        }),
    );
    const stage = createPanoStage({ spheres: [createFakeSphere(), slow], duration: () => 0.01 });
    const stale = stage.prepare(SOURCE);
    const fresh = stage.prepare(SOURCE);
    for (const release of pending) release();
    expect(await stale).toBeNull();
    expect(await fresh).not.toBeNull();
  });

  it('commit dari persiapan usang tidak mengubah apa pun', async () => {
    const first = createFakeSphere();
    const second = createFakeSphere();
    const stage = createPanoStage({ spheres: [first, second], duration: () => 0.01 });
    const old = await stage.prepare(SOURCE);
    await stage.prepare(SOURCE);
    second.material.opacity = 0;
    old?.commit();
    expect(second.material.opacity).toBe(0);
  });
});

describe('glideOffsets', () => {
  const heading = { x: 0, y: 0, z: 1 };
  const DISTANCE = 10;

  it('awal: ruang lama diam, ruang baru berada di depan jalur', () => {
    const { outgoing, incoming } = glideOffsets(heading, DISTANCE, 0);
    expect(outgoing.z).toBeCloseTo(0, 6);
    expect(incoming.z).toBeCloseTo(DISTANCE, 6);
  });

  it('akhir: ruang lama terdorong ke belakang, ruang baru tepat di tengah', () => {
    const { outgoing, incoming } = glideOffsets(heading, DISTANCE, 1);
    expect(outgoing.z).toBeCloseTo(-DISTANCE, 6);
    expect(incoming.x).toBeCloseTo(0, 6);
    expect(incoming.y).toBeCloseTo(0, 6);
    expect(incoming.z).toBeCloseTo(0, 6);
  });

  it('selisih kedua ruang selalu sama sehingga gerak maju terasa menyambung', () => {
    for (const glide of [0, 0.25, 0.5, 0.75, 1]) {
      const { outgoing, incoming } = glideOffsets(heading, DISTANCE, glide);
      expect(incoming.z - outgoing.z).toBeCloseTo(DISTANCE, 6);
    }
  });

  it('kedua ruang bergerak searah, menjauh dari arah tujuan', () => {
    const early = glideOffsets(heading, DISTANCE, 0.2);
    const late = glideOffsets(heading, DISTANCE, 0.8);
    expect(late.outgoing.z).toBeLessThan(early.outgoing.z);
    expect(late.incoming.z).toBeLessThan(early.incoming.z);
  });
});

describe('smooth travel motion', () => {
  it('starts and ends at rest without overshooting the destination', () => {
    expect(travelFrame(0).glide).toBe(0);
    expect(travelFrame(1).glide).toBe(1);
    const firstSpeed = (travelFrame(0.001).glide - travelFrame(0).glide) / 0.001;
    const lastSpeed = (travelFrame(1).glide - travelFrame(0.999).glide) / 0.001;
    expect(firstSpeed).toBeLessThan(0.001);
    expect(lastSpeed).toBeLessThan(0.001);
    for (let step = 0; step < 100; step += 1) {
      expect(travelFrame((step + 1) / 100).glide).toBeGreaterThanOrEqual(
        travelFrame(step / 100).glide,
      );
    }
  });

  it('keeps the lens unchanged at departure and arrival with a single gentle pulse', () => {
    expect(travelFrame(0).lens).toBe(0);
    expect(travelFrame(1).lens).toBeCloseTo(0);
    expect(travelFrame(0.5).lens).toBe(1);
    expect(travelFrame(0.25).lens).toBeCloseTo(travelFrame(0.75).lens);
  });

  it('steers gently across the yaw boundary and never forces a half-turn when returning', () => {
    expect(steeringYaw(170, -170)).toBe(190);
    expect(steeringYaw(-170, 170)).toBe(-190);
    expect(Math.abs(steeringYaw(0, 180))).toBeLessThan(45);
    expect(steeringYaw(0, 0)).toBe(0);
  });
});
