import { describe, expect, it } from 'vitest';
import { positionToSpherical, sphericalToPosition } from '../src/tour/aframe/spherical';
import type { Hotspot } from '../src/tour/data/types';
import {
  formatHotspotSnippet,
  formatInitialYaw,
  formatPoint,
  roundCoordinate,
} from '../src/tour/dev/picker-format';

describe('positionToSpherical', () => {
  it('arah depan, kanan, kiri, belakang', () => {
    expect(positionToSpherical(0, 0, -1).yaw).toBeCloseTo(0, 6);
    expect(positionToSpherical(1, 0, 0).yaw).toBeCloseTo(90, 6);
    expect(positionToSpherical(-1, 0, 0).yaw).toBeCloseTo(-90, 6);
    expect(Math.abs(positionToSpherical(0, 0, 1).yaw)).toBeCloseTo(180, 6);
  });

  it('pitch atas dan bawah', () => {
    expect(positionToSpherical(0, 1, 0).pitch).toBeCloseTo(90, 6);
    expect(positionToSpherical(0, -1, 0).pitch).toBeCloseTo(-90, 6);
    expect(positionToSpherical(0, 0, -1).pitch).toBeCloseTo(0, 6);
  });

  it('tidak bergantung pada panjang vektor', () => {
    const near = positionToSpherical(1, 2, -3);
    const far = positionToSpherical(100, 200, -300);
    expect(far.yaw).toBeCloseTo(near.yaw, 6);
    expect(far.pitch).toBeCloseTo(near.pitch, 6);
  });

  it('vektor nol tidak menghasilkan NaN', () => {
    expect(positionToSpherical(0, 0, 0)).toEqual({ yaw: 0, pitch: 0 });
  });

  it('kebalikan sempurna dari sphericalToPosition', () => {
    for (const [yaw, pitch] of [
      [0, 0],
      [12.5, -3.2],
      [-120, 45],
      [170, -80],
      [-35, 89],
    ] as const) {
      const { x, y, z } = sphericalToPosition(yaw, pitch, 8);
      const back = positionToSpherical(x, y, z);
      expect(back.yaw).toBeCloseTo(yaw, 6);
      expect(back.pitch).toBeCloseTo(pitch, 6);
    }
  });
});

describe('roundCoordinate dan formatPoint', () => {
  it('membulatkan ke satu desimal', () => {
    expect(roundCoordinate(12.4567)).toBe(12.5);
    expect(roundCoordinate(-3.2499)).toBe(-3.2);
  });

  it('tidak menghasilkan -0', () => {
    expect(Object.is(roundCoordinate(-0.01), 0)).toBe(true);
    expect(formatPoint(-0.01, 0.02)).toBe('{ yaw: 0, pitch: 0 }');
  });

  it('formatnya sesuai contoh di dokumen', () => {
    expect(formatPoint(12.5, -3.2)).toBe('{ yaw: 12.5, pitch: -3.2 }');
  });

  it('bilangan bulat tanpa desimal berlebih', () => {
    expect(formatPoint(10, -5)).toBe('{ yaw: 10, pitch: -5 }');
  });
});

describe('formatInitialYaw', () => {
  it('berbentuk objek yang bisa ditempel sebagai argumen scene()', () => {
    expect(formatInitialYaw(37.46)).toBe('{ initialYaw: 37.5 }');
    expect(formatInitialYaw(-90)).toBe('{ initialYaw: -90 }');
  });
});

describe('formatHotspotSnippet', () => {
  const nav: Hotspot = {
    id: 'nav-a-to-b',
    type: 'nav',
    yaw: 0,
    pitch: 0,
    pending: true,
    target: 'pintu-galeri',
  };

  it('hotspot nav menjadi objek lengkap tanpa pending', () => {
    expect(formatHotspotSnippet(nav, 12.5, -3.2)).toBe(
      "{ id: 'nav-a-to-b', type: 'nav', yaw: 12.5, pitch: -3.2, target: 'pintu-galeri' },",
    );
  });

  it('hotspot info membawa artworkIds', () => {
    const info: Hotspot = {
      id: 'info-1',
      type: 'info',
      yaw: 0,
      pitch: 0,
      pending: true,
      artworkIds: ['a--x', 'a--y'],
    };
    expect(formatHotspotSnippet(info, 1, 2)).toBe(
      "{ id: 'info-1', type: 'info', yaw: 1, pitch: 2, artworkIds: ['a--x', 'a--y'] },",
    );
  });

  it('menyertakan label bila ada dan meloloskan tanda kutip', () => {
    const labeled: Hotspot = { ...nav, label: "Lihat sisi lain 'ruang'" };
    expect(formatHotspotSnippet(labeled, 0, 0)).toContain("label: 'Lihat sisi lain \\'ruang\\''");
  });

  it('keluaran tidak pernah memuat yang placeholder lama', () => {
    expect(formatHotspotSnippet(nav, 5, 5)).not.toContain('pending');
  });
});

describe('formatHotspotSnippet untuk info bertulis', () => {
  it('membawa title dan body menggantikan artworkIds', () => {
    const note: Hotspot = {
      id: 'info-kasir',
      type: 'info',
      yaw: 0,
      pitch: 0,
      pending: true,
      title: 'Kasir',
      body: 'Biaya masuk Rp 15.000.',
    };
    expect(formatHotspotSnippet(note, 80, -2)).toBe(
      "{ id: 'info-kasir', type: 'info', yaw: 80, pitch: -2, title: 'Kasir', body: 'Biaya masuk Rp 15.000.' },",
    );
  });
});
