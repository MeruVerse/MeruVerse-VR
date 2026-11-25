import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { prefersReducedMotion } from '../shared/motion/reduced-motion';
import { DISTANCE, DURATION, EASE, STAGGER } from '../shared/motion/tokens';

export function revealOnScroll(elements: readonly HTMLElement[]): void {
  if (prefersReducedMotion() || elements.length === 0) return;
  gsap.set(elements, { opacity: 0, y: DISTANCE.revealY });
  ScrollTrigger.batch(elements as HTMLElement[], {
    start: 'top 90%',
    once: true,
    onEnter: (batch) =>
      gsap.to(batch, {
        opacity: 1,
        y: 0,
        duration: DURATION.base,
        ease: EASE.out,
        stagger: STAGGER.items,
        overwrite: true,
      }),
  });
}
