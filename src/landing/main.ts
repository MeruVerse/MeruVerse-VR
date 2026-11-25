import './landing.css';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { Cleanup } from '../shared/cleanup';
import { createCursor } from './cursor';
import { bindPortalLinks } from './enter-gallery';
import { initFooter } from './footer';
import { createHeader } from './header';
import { createMagnetic } from './magnetic';
import { runPreloader } from './preloader';
import { initCta } from './sections/cta';
import { initExhibition } from './sections/exhibition';
import { initHero } from './sections/hero';
import { initInside } from './sections/inside';
import { initPreview } from './sections/preview';
import { createSmoothScroll } from './smooth-scroll';

function initSections(cleanups: Cleanup[]): void {
  cleanups.push(initExhibition(), initPreview(), initInside(), initCta(), initFooter());
  for (const element of document.querySelectorAll<HTMLElement>('[data-magnetic]')) {
    cleanups.push(createMagnetic(element));
  }
}

async function startLanding(): Promise<void> {
  const smooth = createSmoothScroll();
  smooth.stop();
  const cleanups: Cleanup[] = [smooth.dispose, createHeader(), createCursor(), bindPortalLinks()];
  const hero = initHero();
  if (hero) cleanups.push(hero.dispose);
  const sectionsReady = document.fonts.ready.then(() => initSections(cleanups));
  try {
    await runPreloader([sectionsReady, hero?.ready ?? Promise.resolve()]);
  } finally {
    smooth.start();
    hero?.intro();
    ScrollTrigger.refresh();
  }
}

void startLanding();
