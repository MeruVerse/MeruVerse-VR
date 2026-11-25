import { gsap } from 'gsap';
import { EASE } from '../../shared/motion/tokens';
import { RENDER_ORDER } from './constants';
import type { PanoramaSource, PanoSphereController } from './pano-sphere';

export interface TransitionHooks {
  onReady?(): void;
}

export interface PreparedPano {
  readonly outgoing: PanoSphereController;
  readonly sphere: PanoSphereController;
  commit(): void;
}

export interface PanoStage {
  transitionTo(source: PanoramaSource, hooks?: TransitionHooks): Promise<boolean>;
  prepare(source: PanoramaSource): Promise<PreparedPano | null>;
  cancelPreparation(): void;
  dispose(): void;
}

export interface PanoStageOptions {
  readonly spheres: readonly [PanoSphereController, PanoSphereController];
  duration(): number;
}

export function createPanoStage(options: PanoStageOptions): PanoStage {
  let front = options.spheres[0];
  let back = options.spheres[1];
  let generation = 0;
  let fade: gsap.core.Tween | null = null;
  let fading = false;
  let preparing = false;

  function settleRunningFade(): void {
    if (!fading) return;
    fade?.kill();
    fading = false;
    back.material.opacity = 1;
    front.clear();
    [front, back] = [back, front];
  }

  function fadeInBack(): Promise<void> {
    return new Promise((resolve) => {
      fading = true;
      fade = gsap.to(back.material, {
        opacity: 1,
        duration: options.duration(),
        ease: EASE.inOut,
        onComplete: resolve,
        onInterrupt: resolve,
      });
    });
  }

  async function transitionTo(source: PanoramaSource, hooks?: TransitionHooks): Promise<boolean> {
    settleRunningFade();
    preparing = false;
    generation += 1;
    const current = generation;
    front.setRenderOrder(RENDER_ORDER.panoBottom);
    back.setRenderOrder(RENDER_ORDER.panoTop);
    back.clear();
    await back.show(source);
    if (current !== generation) return false;
    hooks?.onReady?.();
    await fadeInBack();
    if (current !== generation) return false;
    fading = false;
    front.clear();
    [front, back] = [back, front];
    return true;
  }

  async function prepare(source: PanoramaSource): Promise<PreparedPano | null> {
    settleRunningFade();
    preparing = true;
    generation += 1;
    const current = generation;
    front.setRenderOrder(RENDER_ORDER.panoBottom);
    back.setRenderOrder(RENDER_ORDER.panoTop);
    back.clear();
    await back.show(source);
    if (current !== generation) return null;
    const incoming = back;
    const outgoing = front;
    return {
      outgoing,
      sphere: incoming,
      commit() {
        if (current !== generation) return;
        preparing = false;
        incoming.material.opacity = 1;
        front.clear();
        [front, back] = [back, front];
      },
    };
  }

  return {
    transitionTo,
    prepare,
    cancelPreparation() {
      if (!preparing) return;
      generation += 1;
      preparing = false;
      back.clear();
    },
    dispose() {
      generation += 1;
      preparing = false;
      fade?.kill();
      fading = false;
      front.clear();
      back.clear();
    },
  };
}
