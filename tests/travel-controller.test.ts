import type { Entity, Scene } from 'aframe';
import { gsap } from 'gsap';
import { Object3D, PerspectiveCamera, Vector3 } from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PanoSphereController } from '../src/tour/aframe/pano-sphere';
import type { PanoStage, PreparedPano } from '../src/tour/aframe/pano-stage';
import { createTravel, type Travel } from '../src/tour/aframe/travel';

const cleanups: Travel[] = [];
const ORIGIN = { x: 0, y: 0, z: 0 };

function sphere() {
  return {
    material: { opacity: 0 },
    show: vi.fn(),
    clear: vi.fn(),
    setRenderOrder: vi.fn(),
    setOffset: vi.fn(),
    setYawOffset: vi.fn(),
    dispose: vi.fn(),
  };
}

function setup() {
  vi.stubGlobal('AFRAME', { THREE: { Vector3 } });
  const camera = new PerspectiveCamera(80);
  const yawObject = new Object3D();
  const pitchObject = new Object3D();
  const cameraEl = { components: { 'look-controls': { yawObject, pitchObject } } };
  const sceneEl = { camera, setAttribute: vi.fn(), removeAttribute: vi.fn() };
  const outgoing = sphere();
  const incoming = sphere();
  const prepared: PreparedPano = {
    outgoing: outgoing as unknown as PanoSphereController,
    sphere: incoming as unknown as PanoSphereController,
    commit: vi.fn(),
  };
  const prepare = vi.fn(async (): Promise<PreparedPano | null> => prepared);
  const stage = { prepare, cancelPreparation: vi.fn() } as unknown as PanoStage;
  const travel = createTravel({
    cameraEl: cameraEl as unknown as Entity,
    sceneEl: sceneEl as unknown as Scene,
    stage,
    hiddenWhileTraveling: [],
  });
  cleanups.push(travel);
  const request = {
    source: { full: '/full.webp', preview: '/preview.webp' },
    direction: { yaw: 70, pitch: -20 },
    arrivalYaw: -40,
    onNearlyThere: vi.fn(),
  };
  return { travel, prepare, prepared, incoming, outgoing, camera, yawObject, request, sceneEl };
}

async function ready(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

function animation(): gsap.core.Animation {
  const running = gsap.globalTimeline.getChildren(false, true, true).at(-1);
  expect(running).toBeDefined();
  return running as gsap.core.Animation;
}

afterEach(() => {
  for (const travel of cleanups.splice(0)) travel.dispose();
  gsap.globalTimeline.clear();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('continuous room travel', () => {
  it('waits for the next panorama before starting movement', async () => {
    const { travel, prepare, prepared, request } = setup();
    let release: (value: PreparedPano) => void = () => undefined;
    prepare.mockImplementation(
      () =>
        new Promise((resolve) => {
          release = resolve;
        }),
    );
    const result = travel.go(request);
    expect(gsap.globalTimeline.getChildren(false, true, true)).toHaveLength(0);
    release(prepared);
    await ready();
    animation().progress(1);
    expect(await result).toBe(true);
  });

  it('reveals hotspots only after the panorama and camera are aligned', async () => {
    const { travel, request, incoming, yawObject } = setup();
    const result = travel.go(request);
    await ready();
    animation().progress(0.85);
    expect(request.onNearlyThere).not.toHaveBeenCalled();
    animation().progress(1);
    expect(await result).toBe(true);
    expect(incoming.setYawOffset).toHaveBeenLastCalledWith(0);
    expect(yawObject.rotation.y).toBeCloseTo((40 * Math.PI) / 180);
    expect(request.onNearlyThere).toHaveBeenCalledOnce();
  });

  it('adds a gentle lens change and restores it exactly on arrival', async () => {
    const { travel, request, camera, incoming, outgoing } = setup();
    const result = travel.go(request);
    await ready();
    animation().progress(0.5);
    expect(camera.fov).toBeLessThan(80);
    expect(camera.fov).toBeGreaterThanOrEqual(76);
    expect(outgoing.setOffset).toHaveBeenCalled();
    animation().progress(1);
    expect(await result).toBe(true);
    expect(camera.fov).toBe(80);
    expect(incoming.setOffset).toHaveBeenLastCalledWith(ORIGIN);
  });

  it('settles cancellation while an image is still loading and ignores its late result', async () => {
    const { travel, request, prepare, prepared } = setup();
    let release: (value: PreparedPano) => void = () => undefined;
    prepare.mockImplementation(
      () =>
        new Promise((resolve) => {
          release = resolve;
        }),
    );
    const settled = vi.fn();
    void travel.go(request).then(settled);
    travel.cancel();
    await ready();
    expect(settled).toHaveBeenCalledWith(false);
    release(prepared);
    await ready();
    expect(prepared.commit).not.toHaveBeenCalled();
    expect(request.onNearlyThere).not.toHaveBeenCalled();
  });

  it('restores the outgoing room and FOV when interrupted during flight', async () => {
    const { travel, request, camera, outgoing, incoming, sceneEl } = setup();
    const result = travel.go(request);
    await ready();
    animation().progress(0.5);
    travel.cancel();
    expect(await result).toBe(false);
    expect(camera.fov).toBe(80);
    expect(outgoing.setOffset).toHaveBeenLastCalledWith(ORIGIN);
    expect(incoming.clear).toHaveBeenCalled();
    expect(sceneEl.removeAttribute).toHaveBeenCalledWith('data-traveling');
  });

  it('recovers from an image failure without leaving navigation locked', async () => {
    const { travel, request, prepare, sceneEl, camera } = setup();
    prepare.mockRejectedValueOnce(new Error('Image unavailable'));
    expect(await travel.go(request)).toBe(false);
    expect(camera.fov).toBe(80);
    expect(sceneEl.removeAttribute).toHaveBeenCalledWith('data-traveling');
    expect(request.onNearlyThere).not.toHaveBeenCalled();
  });

  it('preserves the current lens setting when a new flight starts from idle', async () => {
    const { travel, request, camera } = setup();
    camera.fov = 72;
    const result = travel.go(request);
    await ready();
    expect(camera.fov).toBe(72);
    animation().progress(1);
    expect(await result).toBe(true);
    expect(camera.fov).toBe(72);
  });

  it('keeps the forward bearing through a doorway instead of turning toward the old room', async () => {
    const { travel, request, camera, yawObject } = setup();
    camera.rotation.y = -(178.6 * Math.PI) / 180;
    camera.updateMatrixWorld();
    const throughDoorway = { ...request, direction: { yaw: 178.6, pitch: -15 }, entryYaw: 174 };
    const result = travel.go(throughDoorway);
    await ready();
    animation().progress(1);
    expect(await result).toBe(true);
    expect(yawObject.rotation.y).toBeCloseTo(-(174 * Math.PI) / 180);
  });

  it('commits only the latest navigation when an older image finishes late', async () => {
    const { travel, request, prepare, prepared } = setup();
    let release: (value: PreparedPano) => void = () => undefined;
    prepare.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          release = resolve;
        }),
    );
    const stale = travel.go(request);
    const onLatestArrival = vi.fn();
    const latest = travel.go({ ...request, onNearlyThere: onLatestArrival });
    await ready();
    animation().progress(1);
    release(prepared);
    await ready();
    expect(await stale).toBe(false);
    expect(await latest).toBe(true);
    expect(prepared.commit).toHaveBeenCalledOnce();
    expect(request.onNearlyThere).not.toHaveBeenCalled();
    expect(onLatestArrival).toHaveBeenCalledOnce();
  });
});
