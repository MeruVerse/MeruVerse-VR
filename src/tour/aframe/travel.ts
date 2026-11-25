import type { Entity, Scene } from 'aframe';
import { gsap } from 'gsap';
import { EASE, TRAVEL } from '../../shared/motion/tokens';
import { cameraDirection } from './camera-direction';
import { setCameraLook } from './camera-heading';
import type { PanoramaSource } from './pano-sphere';
import type { PanoStage, PreparedPano } from './pano-stage';
import { type Direction, sphericalToPosition, yawToCameraRotation } from './spherical';
import type { PerspectiveCamera } from './three-types';
import { glideOffsets, shortestAngleDelta, steeringYaw, travelFrame } from './travel-math';

const TRAVELING_ATTRIBUTE = 'data-traveling';
const ORIGIN = { x: 0, y: 0, z: 0 } as const;

export interface TravelRequest {
  readonly source: PanoramaSource;
  readonly direction: Direction;
  readonly arrivalYaw: number;
  readonly entryYaw?: number;
  onNearlyThere(): void;
}

export interface Travel {
  go(request: TravelRequest): Promise<boolean>;
  cancel(): void;
  dispose(): void;
}

export interface TravelOptions {
  readonly sceneEl: Scene;
  readonly cameraEl: Entity;
  readonly stage: PanoStage;
  readonly hiddenWhileTraveling: readonly Entity[];
}

export function createTravel(options: TravelOptions): Travel {
  const { sceneEl, cameraEl, stage, hiddenWhileTraveling } = options;
  const camera = sceneEl.camera as PerspectiveCamera;
  let generation = 0;
  let tween: gsap.core.Tween | null = null;
  let active: PreparedPano | null = null;
  let resolveActive: ((completed: boolean) => void) | null = null;
  let restingFov = camera.fov;

  function setHidden(hidden: boolean): void {
    for (const el of hiddenWhileTraveling) el.object3D.visible = !hidden;
  }

  function applyFov(value: number): void {
    camera.fov = value;
    camera.updateProjectionMatrix();
  }

  function finish(completed: boolean): void {
    if (!completed) {
      stage.cancelPreparation();
      active?.outgoing.setOffset(ORIGIN);
      active?.sphere.clear();
    }
    active = null;
    tween = null;
    applyFov(restingFov);
    setHidden(false);
    sceneEl.removeAttribute(TRAVELING_ATTRIBUTE);
    const resolve = resolveActive;
    resolveActive = null;
    resolve?.(completed);
  }

  function go(request: TravelRequest): Promise<boolean> {
    cancel();
    const current = generation;
    restingFov = camera.fov;
    sceneEl.setAttribute(TRAVELING_ATTRIBUTE, '');

    return new Promise((resolve) => {
      resolveActive = resolve;
      void stage
        .prepare(request.source)
        .then((next) => {
          if (current !== generation) return;
          if (!next) {
            finish(false);
            return;
          }
          active = next;
          setHidden(true);
          const start = cameraDirection(camera);
          const targetYaw = steeringYaw(start.yaw, request.direction.yaw);
          const arrivalYaw =
            request.entryYaw === undefined
              ? request.arrivalYaw
              : request.entryYaw + shortestAngleDelta(request.direction.yaw, targetYaw);
          const heading = sphericalToPosition(request.direction.yaw, 0, 1);
          const state = { progress: 0 };
          next.sphere.setYawOffset(yawToCameraRotation(targetYaw - arrivalYaw));
          const render = () => {
            const frame = travelFrame(state.progress);
            const offsets = glideOffsets(heading, TRAVEL.distance, frame.glide);
            setCameraLook(
              cameraEl,
              start.yaw + (targetYaw - start.yaw) * frame.turn,
              start.pitch * (1 - frame.turn),
            );
            next.outgoing.setOffset(offsets.outgoing);
            next.sphere.setOffset(offsets.incoming);
            next.sphere.material.opacity = frame.dissolve;
            applyFov(restingFov - TRAVEL.fovDip * frame.lens);
          };
          render();
          tween = gsap.to(state, {
            progress: 1,
            duration: TRAVEL.duration,
            ease: EASE.linear,
            onUpdate: render,
            onInterrupt: () => finish(false),
            onComplete() {
              if (current !== generation) return;
              next.sphere.setOffset(ORIGIN);
              next.sphere.setYawOffset(0);
              setCameraLook(cameraEl, arrivalYaw, 0);
              next.commit();
              finish(true);
              request.onNearlyThere();
            },
          });
        })
        .catch(() => {
          if (current === generation) finish(false);
        });
    });
  }

  function cancel(): void {
    generation += 1;
    if (!resolveActive && !active && !tween) return;
    tween?.kill();
    finish(false);
  }

  return { go, cancel, dispose: cancel };
}
