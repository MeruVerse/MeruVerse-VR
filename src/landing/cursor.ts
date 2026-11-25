import { gsap } from 'gsap';
import type { Cleanup } from '../shared/cleanup';
import { hasFinePointer } from '../shared/motion/pointer';
import { prefersReducedMotion } from '../shared/motion/reduced-motion';
import { DURATION, EASE, LANDING } from '../shared/motion/tokens';
import { create } from '../shared/ui/dom';

const INTERACTIVE = 'a, button';

export function createCursor(): Cleanup {
  if (!hasFinePointer() || prefersReducedMotion()) return () => undefined;
  const ring = create(
    'div',
    'pointer-events-none fixed left-0 top-0 z-[120] size-9 rounded-full border border-paper/80 mix-blend-difference',
  );
  ring.setAttribute('aria-hidden', 'true');
  document.body.append(ring);
  gsap.set(ring, { xPercent: -50, yPercent: -50, opacity: 0 });
  const settings = { duration: LANDING.ringFollow, ease: EASE.out };
  const moveX = gsap.quickTo(ring, 'x', settings);
  const moveY = gsap.quickTo(ring, 'y', settings);

  const handleMove = (event: PointerEvent) => {
    moveX(event.clientX);
    moveY(event.clientY);
    gsap.to(ring, { opacity: 1, duration: DURATION.fast, overwrite: 'auto' });
  };
  const handleOver = (event: PointerEvent) => {
    const over = (event.target as Element).closest(INTERACTIVE) !== null;
    gsap.to(ring, {
      scale: over ? LANDING.ringGrow : 1,
      duration: DURATION.fast,
      ease: EASE.out,
      overwrite: 'auto',
    });
  };
  document.addEventListener('pointermove', handleMove);
  document.addEventListener('pointerover', handleOver);
  return () => {
    document.removeEventListener('pointermove', handleMove);
    document.removeEventListener('pointerover', handleOver);
    gsap.killTweensOf(ring);
    ring.remove();
  };
}
