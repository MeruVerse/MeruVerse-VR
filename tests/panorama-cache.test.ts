import { describe, expect, it, vi } from 'vitest';
import { createPanoramaCache } from '../src/tour/aframe/panorama-cache';
import type { Texture } from '../src/tour/aframe/three-types';

function createFakeTexture(): Texture {
  return { dispose: vi.fn() } as unknown as Texture;
}

function setup() {
  const textures = new Map<string, Texture>();
  const loadTexture = vi.fn(async (url: string) => {
    const texture = createFakeTexture();
    textures.set(url, texture);
    return texture;
  });
  const upload = vi.fn();
  const cache = createPanoramaCache({ loadTexture, upload });
  return { cache, loadTexture, upload, textures };
}

const disposeOf = (texture: Texture | undefined) => texture?.dispose as ReturnType<typeof vi.fn>;

describe('load', () => {
  it('memuat sekali lalu memakai hasil yang tersimpan', async () => {
    const { cache, loadTexture } = setup();
    const first = await cache.load('/a.webp');
    const second = await cache.load('/a.webp');
    expect(second).toBe(first);
    expect(loadTexture).toHaveBeenCalledTimes(1);
  });

  it('permintaan serentak untuk url yang sama berbagi satu pemuatan', async () => {
    const { cache, loadTexture } = setup();
    const [first, second] = await Promise.all([cache.load('/a.webp'), cache.load('/a.webp')]);
    expect(first).toBe(second);
    expect(loadTexture).toHaveBeenCalledTimes(1);
  });

  it('mengunggah tekstur ke GPU tepat sekali per pemuatan', async () => {
    const { cache, upload } = setup();
    await cache.load('/a.webp');
    await cache.load('/a.webp');
    expect(upload).toHaveBeenCalledTimes(1);
  });

  it('peek hanya mengembalikan tekstur yang sudah selesai dimuat', async () => {
    const { cache } = setup();
    expect(cache.peek('/a.webp')).toBeUndefined();
    const texture = await cache.load('/a.webp');
    expect(cache.peek('/a.webp')).toBe(texture);
  });

  it('kegagalan memuat tidak disimpan dan bisa dicoba lagi', async () => {
    const loadTexture = vi
      .fn<(url: string) => Promise<Texture>>()
      .mockRejectedValueOnce(new Error('gagal'))
      .mockResolvedValueOnce(createFakeTexture());
    const cache = createPanoramaCache({ loadTexture });
    await expect(cache.load('/a.webp')).rejects.toThrow('gagal');
    await expect(cache.load('/a.webp')).resolves.toBeDefined();
    expect(cache.size()).toBe(1);
  });
});

describe('retain', () => {
  it('membuang tekstur di luar daftar dan mempertahankan yang di dalam', async () => {
    const { cache, textures } = setup();
    await Promise.all(['/a.webp', '/b.webp', '/c.webp'].map((url) => cache.load(url)));
    cache.retain(new Set(['/b.webp']));
    expect(disposeOf(textures.get('/a.webp'))).toHaveBeenCalledOnce();
    expect(disposeOf(textures.get('/c.webp'))).toHaveBeenCalledOnce();
    expect(disposeOf(textures.get('/b.webp'))).not.toHaveBeenCalled();
    expect(cache.size()).toBe(1);
    expect(cache.peek('/a.webp')).toBeUndefined();
  });

  it('tekstur yang dibuang dimuat ulang bila diminta lagi', async () => {
    const { cache, loadTexture } = setup();
    await cache.load('/a.webp');
    cache.retain(new Set());
    await cache.load('/a.webp');
    expect(loadTexture).toHaveBeenCalledTimes(2);
  });

  it('tidak membuang apa pun bila semua url masih dipertahankan', async () => {
    const { cache, textures } = setup();
    await cache.load('/a.webp');
    cache.retain(new Set(['/a.webp']));
    expect(disposeOf(textures.get('/a.webp'))).not.toHaveBeenCalled();
  });
});

describe('dispose', () => {
  it('membuang semua tekstur yang tersimpan', async () => {
    const { cache, textures } = setup();
    await Promise.all(['/a.webp', '/b.webp'].map((url) => cache.load(url)));
    cache.dispose();
    expect(cache.size()).toBe(0);
    for (const texture of textures.values()) expect(disposeOf(texture)).toHaveBeenCalledOnce();
  });

  it('tekstur yang selesai dimuat setelah dispose langsung dibuang', async () => {
    const { cache, textures } = setup();
    const loading = cache.load('/a.webp');
    cache.dispose();
    await loading;
    expect(disposeOf(textures.get('/a.webp'))).toHaveBeenCalledOnce();
    expect(cache.size()).toBe(0);
  });
});
