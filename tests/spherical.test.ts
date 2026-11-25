import { describe, expect, it } from 'vitest';
import { sphericalToPosition, yawToCameraRotation } from '../src/tour/aframe/spherical';

const RADIUS = 8;

function expectPosition(
  actual: { x: number; y: number; z: number },
  expected: [number, number, number],
) {
  expect(actual.x).toBeCloseTo(expected[0], 6);
  expect(actual.y).toBeCloseTo(expected[1], 6);
  expect(actual.z).toBeCloseTo(expected[2], 6);
}

describe('sphericalToPosition', () => {
  it('yaw 0 pitch 0 berada tepat di depan kamera (arah -Z)', () => {
    expectPosition(sphericalToPosition(0, 0, RADIUS), [0, 0, -RADIUS]);
  });

  it('yaw positif berada di kanan kamera (+X)', () => {
    expectPosition(sphericalToPosition(90, 0, RADIUS), [RADIUS, 0, 0]);
  });

  it('yaw negatif berada di kiri kamera (-X)', () => {
    expectPosition(sphericalToPosition(-90, 0, RADIUS), [-RADIUS, 0, 0]);
  });

  it('yaw 180 berada di belakang kamera (+Z)', () => {
    expectPosition(sphericalToPosition(180, 0, RADIUS), [0, 0, RADIUS]);
  });

  it('pitch 90 tepat di atas dan pitch -90 tepat di bawah', () => {
    expectPosition(sphericalToPosition(0, 90, RADIUS), [0, RADIUS, 0]);
    expectPosition(sphericalToPosition(0, -90, RADIUS), [0, -RADIUS, 0]);
  });

  it('pitch positif menaikkan titik tanpa mengubah sisi kiri atau kanan', () => {
    const point = sphericalToPosition(0, 30, RADIUS);
    expect(point.y).toBeGreaterThan(0);
    expect(point.x).toBeCloseTo(0, 6);
    expect(point.z).toBeLessThan(0);
  });

  it('jarak titik dari kamera selalu sama dengan radius', () => {
    for (const [yaw, pitch] of [
      [0, 0],
      [37, 12],
      [-120, -45],
      [179, 80],
    ] as const) {
      const { x, y, z } = sphericalToPosition(yaw, pitch, RADIUS);
      expect(Math.hypot(x, y, z)).toBeCloseTo(RADIUS, 6);
    }
  });

  it('radius mengecilkan dan membesarkan titik secara linear', () => {
    const near = sphericalToPosition(25, 10, 1);
    const far = sphericalToPosition(25, 10, 5);
    expectPosition(far, [near.x * 5, near.y * 5, near.z * 5]);
  });
});

describe('yawToCameraRotation', () => {
  it('yaw 0 tidak memutar kamera', () => {
    expect(yawToCameraRotation(0)).toBeCloseTo(0, 6);
  });

  it('yaw positif memutar kamera searah jarum jam (rotasi Y negatif)', () => {
    expect(yawToCameraRotation(90)).toBeCloseTo(-Math.PI / 2, 6);
  });

  it('memutar kamera sebesar yaw membuat kamera menghadap titik di yaw itu', () => {
    const yaw = 40;
    const rotationY = yawToCameraRotation(yaw);
    const facing = { x: -Math.sin(rotationY), z: -Math.cos(rotationY) };
    const target = sphericalToPosition(yaw, 0, 1);
    expect(facing.x).toBeCloseTo(target.x, 6);
    expect(facing.z).toBeCloseTo(target.z, 6);
  });
});
