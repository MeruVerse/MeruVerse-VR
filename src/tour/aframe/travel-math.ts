import { TRAVEL } from '../../shared/motion/tokens';

const FULL_TURN = 360;
const HALF_TURN = 180;

export function shortestAngleDelta(from: number, to: number): number {
  const wrapped = (((to - from + HALF_TURN) % FULL_TURN) + FULL_TURN) % FULL_TURN;
  return wrapped - HALF_TURN;
}

function smoothProgress(value: number): number {
  const t = Math.min(1, Math.max(0, value));
  return t * t * t * (t * (t * 6 - 15) + 10);
}

export function travelFrame(progress: number) {
  const t = Math.min(1, Math.max(0, progress));
  return {
    glide: smoothProgress(t),
    turn: smoothProgress(t / TRAVEL.turnEnd),
    dissolve: smoothProgress(
      (t - TRAVEL.dissolveStart) / (TRAVEL.dissolveEnd - TRAVEL.dissolveStart),
    ),
    lens: Math.sin(Math.PI * t) ** 2,
  };
}

export function steeringYaw(from: number, toward: number): number {
  const delta = shortestAngleDelta(from, toward);
  return from + Math.min(TRAVEL.maxTurn, Math.max(-TRAVEL.maxTurn, delta));
}

export interface Offset {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export interface GlideOffsets {
  readonly outgoing: Offset;
  readonly incoming: Offset;
}

const scale = (vector: Offset, factor: number): Offset => ({
  x: vector.x * factor,
  y: vector.y * factor,
  z: vector.z * factor,
});

export function glideOffsets(heading: Offset, distance: number, glide: number): GlideOffsets {
  return {
    outgoing: scale(heading, -distance * glide),
    incoming: scale(heading, -distance * (glide - 1)),
  };
}
