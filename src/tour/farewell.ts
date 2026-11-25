import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { HOME_URL } from '../shared/base-url';
import { prefersReducedMotion } from '../shared/motion/reduced-motion';
import { DISTANCE, DURATION, EASE, STAGGER } from '../shared/motion/tokens';
import type { PortalOrigin } from '../shared/transition/handoff';
import { createPortal, type Portal } from '../shared/transition/portal';
import { create } from '../shared/ui/dom';
import { createLogoMark } from '../shared/ui/logo-mark';

const HOLD_SECONDS = 2.2;
const THANKS = 'Terima kasih.';
const INVITATION = 'Jangan lupa berkunjung ke Artmeru Gallery.';

let active: Portal | null = null;
let listening = false;

function buildContent(): { content: HTMLElement; title: HTMLElement; note: HTMLElement } {
  const content = create(
    'div',
    'flex size-full flex-col items-center justify-center px-gutter text-center text-jet',
  );
  content.style.setProperty('--logo-accent', 'var(--color-flame)');
  const brand = create('p', 'absolute left-gutter top-6 flex items-center gap-3');
  brand.append(
    createLogoMark(),
    create('span', 'text-[0.9375rem] font-bold tracking-[0.28em]', 'MERUVERSE'),
  );
  const title = create(
    'h2',
    'text-[clamp(3.5rem,13vw,12rem)] font-extrabold leading-[0.85] tracking-[-0.055em]',
    THANKS,
  );
  const note = create(
    'p',
    'mt-8 max-w-xl text-balance text-xl text-charcoal sm:text-2xl',
    INVITATION,
  );
  content.append(brand, title, note);
  return { content, title, note };
}

function resetOnReturn(): void {
  if (listening) return;
  listening = true;
  window.addEventListener('pageshow', (event) => {
    if (!event.persisted) return;
    active?.dispose();
    active = null;
  });
}

const wait = (seconds: number) =>
  new Promise<void>((resolve) => {
    gsap.delayedCall(seconds, resolve);
  });

export async function playFarewell(origin: PortalOrigin): Promise<void> {
  if (active) return;
  resetOnReturn();
  const portal = createPortal(origin, false, 'snow');
  active = portal;
  const { content, title, note } = buildContent();
  gsap.set(content, { autoAlpha: 0 });
  portal.element.append(content);
  await portal.cover();

  gsap.set(content, { autoAlpha: 1 });
  if (prefersReducedMotion()) {
    gsap.from([title, note], { autoAlpha: 0, duration: DURATION.reducedFade });
  } else {
    gsap.registerPlugin(SplitText);
    const split = SplitText.create(title, { type: 'chars,lines', mask: 'lines' });
    gsap.from(split.chars, {
      yPercent: 110,
      duration: DURATION.slow,
      ease: EASE.out,
      stagger: STAGGER.items / 2,
    });
    gsap.from(note, {
      autoAlpha: 0,
      y: DISTANCE.revealY,
      duration: DURATION.base,
      ease: EASE.out,
      delay: 0.7,
    });
  }
  await wait(HOLD_SECONDS);
  window.location.assign(HOME_URL);
}
