import { describe, expect, it, vi } from 'vitest';
import type { PanoramaSource, PanoSphereController } from '../src/tour/aframe/pano-sphere';
import { createPoseLayer } from '../src/tour/aframe/pose-layer';

const SOURCE: PanoramaSource = { full: '/bangun.webp', preview: '/bangun-lq.webp' };
const OTHER: PanoramaSource = { full: '/lain.webp', preview: '/lain-lq.webp' };
const RISE = 0.02;
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function createFakeSphere() {
  const material = { opacity: 0 };
  const sphere = {
    material,
    show: vi.fn(async () => undefined),
    clear: vi.fn(() => {
      material.opacity = 0;
    }),
    setRenderOrder: vi.fn(),
    dispose: vi.fn(),
  };
  return sphere as typeof sphere & PanoSphereController;
}

function setup(load: (url: string) => Promise<unknown> = async () => undefined) {
  const sphere = createFakeSphere();
  const loader = vi.fn(load);
  const layer = createPoseLayer({ sphere, load: loader });
  return { sphere, loader, layer };
}

describe('createPoseLayer', () => {
  it('arm memuat tekstur penuh lalu menyiapkan pose kedua dalam keadaan tersembunyi', async () => {
    const { sphere, loader, layer } = setup();
    layer.arm(SOURCE);
    await wait(5);
    expect(loader).toHaveBeenCalledWith(SOURCE.full);
    expect(sphere.show).toHaveBeenCalledWith(SOURCE);
    expect(sphere.material.opacity).toBe(0);
    layer.dispose();
  });

  it('reveal memunculkan pose kedua dengan cepat, sekali saja', async () => {
    const { sphere, layer } = setup();
    layer.arm(SOURCE);
    await wait(5);
    expect(layer.reveal(RISE)).toBe(true);
    await wait(80);
    expect(sphere.material.opacity).toBe(1);
    expect(layer.reveal(RISE)).toBe(false);
    layer.dispose();
  });

  it('reveal ditolak selama pose kedua belum siap', async () => {
    let finish: () => void = () => undefined;
    const pending = new Promise<void>((resolve) => {
      finish = resolve;
    });
    const { sphere, layer } = setup(() => pending);
    layer.arm(SOURCE);
    expect(layer.reveal(RISE)).toBe(false);
    finish();
    await wait(5);
    expect(layer.reveal(RISE)).toBe(true);
    await wait(80);
    expect(sphere.material.opacity).toBe(1);
    layer.dispose();
  });

  it('arm ulang dengan sumber yang sama tidak menyiapkan ulang atau menyembunyikan pose', async () => {
    const { sphere, layer } = setup();
    layer.arm(SOURCE);
    await wait(5);
    layer.reveal(RISE);
    await wait(80);
    layer.arm(SOURCE);
    await wait(5);
    expect(sphere.show).toHaveBeenCalledTimes(1);
    expect(sphere.material.opacity).toBe(1);
    layer.dispose();
  });

  it('clear menyembunyikan pose kedua dan mengizinkan penyiapan baru', async () => {
    const { sphere, layer } = setup();
    layer.arm(SOURCE);
    await wait(5);
    layer.reveal(RISE);
    await wait(80);
    layer.clear();
    expect(sphere.material.opacity).toBe(0);
    expect(layer.reveal(RISE)).toBe(false);
    layer.arm(OTHER);
    await wait(5);
    expect(sphere.show).toHaveBeenLastCalledWith(OTHER);
    expect(layer.reveal(RISE)).toBe(true);
    layer.dispose();
  });

  it('hide menyembunyikan lagi pose kedua dan mengizinkan reveal berikutnya', async () => {
    const { sphere, layer } = setup();
    layer.arm(SOURCE);
    await wait(5);
    expect(layer.hide(RISE)).toBe(false);
    layer.reveal(RISE);
    await wait(80);
    expect(layer.hide(RISE)).toBe(true);
    await wait(80);
    expect(sphere.material.opacity).toBe(0);
    expect(sphere.clear).toHaveBeenCalledTimes(1);
    expect(layer.hide(RISE)).toBe(false);
    expect(layer.reveal(RISE)).toBe(true);
    await wait(80);
    expect(sphere.material.opacity).toBe(1);
    layer.dispose();
  });

  it('reveal di tengah hide langsung memunculkan pose kedua lagi', async () => {
    const { sphere, layer } = setup();
    layer.arm(SOURCE);
    await wait(5);
    layer.reveal(RISE);
    await wait(80);
    layer.hide(0.5);
    await wait(30);
    expect(layer.reveal(RISE)).toBe(true);
    await wait(80);
    expect(sphere.material.opacity).toBe(1);
    layer.dispose();
  });

  it('gagal memuat tidak menampilkan apa pun dan tidak melempar error', async () => {
    const { sphere, layer } = setup(() => Promise.reject(new Error('gagal')));
    layer.arm(SOURCE);
    await wait(5);
    expect(sphere.show).not.toHaveBeenCalled();
    expect(layer.reveal(RISE)).toBe(false);
    layer.dispose();
  });
});
