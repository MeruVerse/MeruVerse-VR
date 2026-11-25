import { gsap } from 'gsap';
import { prefersReducedMotion } from '../motion/reduced-motion';
import { DURATION, EASE } from '../motion/tokens';
import { create } from '../ui/dom';
import type { PortalOrigin } from './handoff';

export interface Portal {
  readonly element: HTMLElement;
  cover(): Promise<void>;
  reveal(to?: PortalOrigin): Promise<void>;
  dispose(): void;
}

export function farthestCorner(origin: PortalOrigin, width: number, height: number): number {
  const dx = Math.max(origin.x, width - origin.x);
  const dy = Math.max(origin.y, height - origin.y);
  return Math.hypot(dx, dy);
}

const circle = (radius: number, at: PortalOrigin) => `circle(${radius}px at ${at.x}px ${at.y}px)`;

export type PortalTone = 'ink' | 'snow';

const TONE_CLASS: Record<PortalTone, string> = { ink: 'bg-ink', snow: 'bg-snow' };

export function createPortal(
  origin: PortalOrigin,
  startCovered: boolean,
  tone: PortalTone = 'ink',
): Portal {
  const element = create('div', `pointer-events-none fixed inset-0 z-[100] ${TONE_CLASS[tone]}`);
  element.setAttribute('aria-hidden', 'true');
  const full = () => farthestCorner(origin, window.innerWidth, window.innerHeight);
  const state = { radius: startCovered ? full() : 0 };
  const apply = (at: PortalOrigin) => {
    element.style.clipPath = circle(state.radius, at);
  };
  apply(origin);
  document.body.append(element);

  function play(to: number, at: PortalOrigin, hold: boolean): Promise<void> {
    return new Promise((resolve) => {
      if (prefersReducedMotion()) {
        state.radius = full();
        apply(origin);
        gsap.to(element, {
          opacity: hold ? 1 : 0,
          duration: DURATION.reducedFade,
          onComplete: resolve,
        });
        return;
      }
      gsap.to(state, {
        radius: to,
        duration: DURATION.portal,
        ease: EASE.out,
        onUpdate: () => apply(at),
        onComplete: resolve,
      });
    });
  }

  return {
    element,
    cover() {
      gsap.set(element, { opacity: prefersReducedMotion() ? 0 : 1 });
      return play(full(), origin, true);
    },
    reveal(to = { x: window.innerWidth / 2, y: window.innerHeight / 2 }) {
      gsap.set(element, { opacity: 1 });
      return play(0, to, false);
    },
    dispose() {
      gsap.killTweensOf([element, state]);
      element.remove();
    },
  };
}
