import { gsap } from 'gsap';
import type { Cleanup } from '../shared/cleanup';
import { prefersReducedMotion } from '../shared/motion/reduced-motion';
import { DURATION, EASE } from '../shared/motion/tokens';
import { create } from '../shared/ui/dom';
import { createLogoMark } from '../shared/ui/logo-mark';
import { COPY } from './content';

const HIDE_AFTER_RATIO = 0.6;
const LIGHT_BEFORE_HERO_END_PX = 70;
const MIN_STEP_PX = 4;

export function createHeader(): Cleanup {
  const header = create(
    'header',
    'pointer-events-none fixed inset-x-0 top-0 z-40 flex items-center justify-between gap-6 bg-linear-to-b from-jet/60 to-transparent px-gutter pb-10 pt-4 text-snow',
  );
  header.dataset.landingHeader = '';
  header.dataset.tone = 'dark';
  const brand = create('p', 'flex items-center gap-3');
  brand.append(
    createLogoMark(),
    create('span', 'text-[0.9375rem] font-bold tracking-[0.28em]', 'MERUVERSE'),
  );
  header.append(brand, create('p', 'hidden text-sm sm:block', COPY.topNote));
  document.body.prepend(header);

  let lastY = window.scrollY;
  let hidden = false;
  const slide = (hide: boolean) => {
    if (hide === hidden) return;
    hidden = hide;
    gsap.to(header, {
      yPercent: hide ? -110 : 0,
      duration: prefersReducedMotion() ? 0 : DURATION.base,
      ease: EASE.out,
      overwrite: 'auto',
    });
  };
  const handleScroll = () => {
    const y = window.scrollY;
    header.dataset.tone = y > window.innerHeight - LIGHT_BEFORE_HERO_END_PX ? 'light' : 'dark';
    const delta = y - lastY;
    if (Math.abs(delta) < MIN_STEP_PX) return;
    slide(y > window.innerHeight * HIDE_AFTER_RATIO && delta > 0);
    lastY = y;
  };
  window.addEventListener('scroll', handleScroll, { passive: true });
  return () => {
    window.removeEventListener('scroll', handleScroll);
    gsap.killTweensOf(header);
    header.remove();
  };
}
