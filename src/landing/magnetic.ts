import { gsap } from 'gsap';
import type { Cleanup } from '../shared/cleanup';
import { hasFinePointer } from '../shared/motion/pointer';
import { prefersReducedMotion } from '../shared/motion/reduced-motion';
import { DISTANCE, EASE, LANDING } from '../shared/motion/tokens';

const REACH = 0.9;

export function createMagnetic(element: HTMLElement): Cleanup {
  if (!hasFinePointer() || prefersReducedMotion()) return () => undefined;
  const settings = { duration: LANDING.magneticReturn, ease: EASE.out };
  const moveX = gsap.quickTo(element, 'x', settings);
  const moveY = gsap.quickTo(element, 'y', settings);
  let pulled = false;

  const handleMove = (event: PointerEvent) => {
    const box = element.getBoundingClientRect();
    const dx = event.clientX - (box.left + box.width / 2);
    const dy = event.clientY - (box.top + box.height / 2);
    const near = Math.hypot(dx, dy) < box.width * REACH;
    if (near) {
      moveX(dx * DISTANCE.magneticPull);
      moveY(dy * DISTANCE.magneticPull);
    } else if (pulled) {
      moveX(0);
      moveY(0);
    }
    pulled = near;
  };
  document.addEventListener('pointermove', handleMove);
  return () => {
    document.removeEventListener('pointermove', handleMove);
    gsap.killTweensOf(element);
  };
}
