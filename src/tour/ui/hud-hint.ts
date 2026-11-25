import { gsap } from 'gsap';
import type { Cleanup } from '../../shared/cleanup';
import { prefersReducedMotion } from '../../shared/motion/reduced-motion';
import { DURATION, EASE } from '../../shared/motion/tokens';
import { create } from '../../shared/ui/dom';

const AUTO_DISMISS_MS = 15000;

export interface HudHint {
  dismiss(): void;
  dispose: Cleanup;
}

function hintText(): string {
  const verb = window.matchMedia('(hover: none)').matches ? 'Ketuk' : 'Klik';
  return `Seret untuk melihat sekeliling. ${verb} panah untuk pindah ruang.`;
}

export function createHudHint(parent: HTMLElement): HudHint {
  const element = create('p', 'hud-hint', hintText());
  parent.append(element);
  let done = false;

  function dismiss(): void {
    if (done) return;
    done = true;
    window.clearTimeout(timer);
    document.removeEventListener('pointerdown', dismiss);
    gsap.to(element, {
      autoAlpha: 0,
      duration: prefersReducedMotion() ? 0 : DURATION.base,
      ease: EASE.out,
      onComplete: () => element.remove(),
    });
  }

  const timer = window.setTimeout(dismiss, AUTO_DISMISS_MS);
  document.addEventListener('pointerdown', dismiss);

  return {
    dismiss,
    dispose() {
      done = true;
      window.clearTimeout(timer);
      document.removeEventListener('pointerdown', dismiss);
      gsap.killTweensOf(element);
      element.remove();
    },
  };
}
