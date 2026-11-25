import { describe, expect, it, vi } from 'vitest';
import type { PanoramaSource, PanoSphereController } from '../src/tour/aframe/pano-sphere';
import { createPanoStage } from '../src/tour/aframe/pano-stage';

const SOURCE: PanoramaSource = { full: '/full.webp', preview: '/lq.webp' };
const FAST_DURATION = 0.02;

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

function setup(first = createFakeSphere(), second = createFakeSphere()) {
  const stage = createPanoStage({ spheres: [first, second], duration: () => FAST_DURATION });
  return { stage, first, second };
}

describe('createPanoStage', () => {
  it('transisi pertama menampilkan panorama pada bola cadangan lalu memunculkannya', async () => {
    const { stage, first, second } = setup();
    const completed = await stage.transitionTo(SOURCE);
    expect(completed).toBe(true);
    expect(second.show).toHaveBeenCalledWith(SOURCE);
    expect(second.material.opacity).toBe(1);
    expect(first.show).not.toHaveBeenCalled();
  });

  it('memanggil onReady sebelum fade dimulai', async () => {
    const { stage, second } = setup();
    let opacityAtReady = -1;
    await stage.transitionTo(SOURCE, { onReady: () => (opacityAtReady = second.material.opacity) });
    expect(opacityAtReady).toBe(0);
  });

  it('transisi kedua bergantian memakai bola yang lain dan membersihkan bola lama', async () => {
    const { stage, first, second } = setup();
    await stage.transitionTo(SOURCE);
    await stage.transitionTo(SOURCE);
    expect(first.show).toHaveBeenCalledOnce();
    expect(first.material.opacity).toBe(1);
    expect(second.clear).toHaveBeenCalled();
    expect(second.material.opacity).toBe(0);
  });

  it('bola yang sedang tampil berada di bawah bola yang masuk', async () => {
    const { stage, first, second } = setup();
    await stage.transitionTo(SOURCE);
    const bottom = first.setRenderOrder.mock.calls[0]?.[0] as number;
    const top = second.setRenderOrder.mock.calls[0]?.[0] as number;
    expect(top).toBeGreaterThan(bottom);
  });

  it('transisi yang disusul transisi baru sebelum panorama siap dibatalkan', async () => {
    const pendingShows: (() => void)[] = [];
    const slow = createFakeSphere(
      () =>
        new Promise<void>((resolve) => {
          pendingShows.push(resolve);
        }),
    );
    const { stage } = setup(createFakeSphere(), slow);
    const onReady = vi.fn();
    const stale = stage.transitionTo(SOURCE, { onReady });
    const fresh = stage.transitionTo(SOURCE);
    for (const release of pendingShows) release();
    expect(await stale).toBe(false);
    expect(onReady).not.toHaveBeenCalled();
    expect(await fresh).toBe(true);
  });

  it('transisi baru saat fade berjalan menuntaskan fade lama lebih dulu', async () => {
    const { stage, first, second } = setup();
    const running = stage.transitionTo(SOURCE);
    await Promise.resolve();
    await Promise.resolve();
    const next = stage.transitionTo(SOURCE);
    expect(await running).toBe(false);
    expect(await next).toBe(true);
    expect(first.material.opacity).toBe(1);
    expect(second.material.opacity).toBe(0);
  });

  it('dispose membatalkan transisi dan membersihkan kedua bola', async () => {
    const { stage, first, second } = setup();
    const running = stage.transitionTo(SOURCE);
    stage.dispose();
    expect(await running).toBe(false);
    expect(first.clear).toHaveBeenCalled();
    expect(second.clear).toHaveBeenCalled();
  });
});
