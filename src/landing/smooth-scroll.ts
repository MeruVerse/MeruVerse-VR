import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import type { Cleanup } from '../shared/cleanup';
import { prefersReducedMotion } from '../shared/motion/reduced-motion';

export interface SmoothScroll {
  start(): void;
  stop(): void;
  dispose: Cleanup;
}

const idle = () => undefined;

export function createSmoothScroll(): SmoothScroll {
  gsap.registerPlugin(ScrollTrigger);
  if (prefersReducedMotion()) return { start: idle, stop: idle, dispose: idle };
  const lenis = new Lenis();
  lenis.on('scroll', ScrollTrigger.update);
  const tick = (time: number) => lenis.raf(time * 1000);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);
  return {
    start: () => lenis.start(),
    stop: () => lenis.stop(),
    dispose() {
      gsap.ticker.remove(tick);
      lenis.destroy();
    },
  };
}
