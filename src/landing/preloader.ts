import { gsap } from 'gsap';
import { prefersReducedMotion } from '../shared/motion/reduced-motion';
import { DURATION, EASE, LANDING } from '../shared/motion/tokens';
import { create } from '../shared/ui/dom';
import { createLogoMark } from '../shared/ui/logo-mark';

const PERCENT = 100;

function buildOverlay(): { overlay: HTMLElement; counter: HTMLElement } {
  const overlay = create(
    'div',
    'fixed inset-0 z-[110] flex flex-col justify-between bg-snow p-gutter text-jet',
  );
  overlay.setAttribute('role', 'status');
  overlay.setAttribute('aria-label', 'Memuat halaman');
  const counter = create(
    'p',
    'text-[22vw] font-extrabold leading-[0.8] tracking-[-0.05em] tabular-nums',
    '0',
  );
  overlay.append(createLogoMark(), counter);
  document.body.append(overlay);
  return { overlay, counter };
}

const wait = (seconds: number) =>
  new Promise<void>((resolve) => {
    gsap.delayedCall(seconds, resolve);
  });

export async function runPreloader(tasks: readonly Promise<unknown>[]): Promise<void> {
  const { overlay, counter } = buildOverlay();
  const state = { value: 0 };
  const show = () => {
    counter.textContent = String(Math.round(state.value));
  };
  let done = 0;
  for (const task of tasks) {
    task
      .catch(() => undefined)
      .then(() => {
        done += 1;
        gsap.to(state, {
          value: (done / tasks.length) * PERCENT,
          duration: DURATION.base,
          ease: EASE.out,
          onUpdate: show,
        });
      });
  }
  await Promise.all([Promise.allSettled(tasks), wait(LANDING.preloaderMin)]);
  gsap.to(state, { value: PERCENT, duration: DURATION.fast, onUpdate: show });
  await wait(DURATION.fast);
  await new Promise<void>((resolve) => {
    gsap.to(
      overlay,
      prefersReducedMotion()
        ? { opacity: 0, duration: DURATION.reducedFade, onComplete: resolve }
        : {
            clipPath: 'inset(0 0 100% 0)',
            duration: DURATION.slow,
            ease: EASE.inOut,
            onComplete: resolve,
          },
    );
  });
  overlay.remove();
}
