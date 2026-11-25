import { describe, expect, it } from 'vitest';
import { parseOrigin } from '../src/shared/transition/handoff';
import { farthestCorner } from '../src/shared/transition/portal';

describe('parseOrigin', () => {
  it('membaca bendera dari landing beserta titik asal', () => {
    const raw = JSON.stringify({ fromLanding: true, x: 120, y: 340 });
    expect(parseOrigin(raw)).toEqual({ x: 120, y: 340 });
  });

  it('menolak data kosong, rusak, atau tanpa bendera', () => {
    expect(parseOrigin(null)).toBeNull();
    expect(parseOrigin('bukan json')).toBeNull();
    expect(parseOrigin(JSON.stringify({ x: 1, y: 2 }))).toBeNull();
    expect(parseOrigin(JSON.stringify({ fromLanding: false, x: 1, y: 2 }))).toBeNull();
  });

  it('menolak koordinat yang bukan angka terbatas', () => {
    expect(parseOrigin(JSON.stringify({ fromLanding: true, x: '1', y: 2 }))).toBeNull();
    expect(parseOrigin('{"fromLanding":true,"x":null,"y":2}')).toBeNull();
  });
});

describe('farthestCorner', () => {
  it('jarak ke pojok terjauh dari titik di tengah', () => {
    expect(farthestCorner({ x: 50, y: 50 }, 100, 100)).toBeCloseTo(Math.hypot(50, 50), 6);
  });

  it('titik di pojok kiri atas menjangkau pojok kanan bawah', () => {
    expect(farthestCorner({ x: 0, y: 0 }, 300, 400)).toBeCloseTo(500, 6);
  });

  it('selalu cukup besar untuk menutup seluruh layar', () => {
    const radius = farthestCorner({ x: 900, y: 120 }, 1280, 720);
    for (const [x, y] of [
      [0, 0],
      [1280, 0],
      [0, 720],
      [1280, 720],
    ] as const) {
      expect(radius).toBeGreaterThanOrEqual(Math.hypot(x - 900, y - 120) - 1e-6);
    }
  });
});
