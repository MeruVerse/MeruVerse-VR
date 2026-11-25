import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';
import type { Cleanup } from '../../shared/cleanup';
import { onIdle } from '../../shared/idle';
import { hasFinePointer } from '../../shared/motion/pointer';
import { prefersReducedMotion } from '../../shared/motion/reduced-motion';
import { DISTANCE, DURATION, EASE, LANDING, SCALE, STAGGER } from '../../shared/motion/tokens';
import { create } from '../../shared/ui/dom';
import { HERO_PICKS, PREVIEW } from '../content';

export interface Hero {
  readonly ready: Promise<void>;
  intro(): void;
  dispose: Cleanup;
}

const HALF = 2;
const MS_PER_SECOND = 1000;
const PAN_RATIO = 0.04;

function query<T extends HTMLElement>(root: HTMLElement, selector: string): T | null {
  return root.querySelector<T>(selector);
}

const SLIDE_CLASS =
  'absolute inset-0 size-full object-cover object-[50%_42%] contrast-[1.1] saturate-[1.2]';
const IMAGE_SIZE = 1280;

function buildSlides(container: HTMLElement): HTMLImageElement[] {
  const picks = HERO_PICKS.flatMap((index) => (PREVIEW[index] ? [PREVIEW[index]] : []));
  const first = container.querySelector<HTMLImageElement>('[data-hero-first]');
  const slides = picks.map((item, index) => {
    const image = index === 0 && first ? first : create('img', SLIDE_CLASS);
    image.alt = '';
    image.decoding = 'async';
    image.width = IMAGE_SIZE;
    image.height = IMAGE_SIZE;
    if (index === 0) image.src = item.src;
    else image.dataset.src = item.src;
    image.style.opacity = index === 0 ? '1' : '0';
    return image;
  });
  container.append(...slides.filter((image) => image !== first));
  return slides;
}

export function initHero(): Hero | null {
  const root = document.querySelector<HTMLElement>('[data-hero]');
  const stage = root && query(root, '[data-hero-stage]');
  const container = root && query(root, '[data-hero-slides]');
  const title = root && query(root, '[data-hero-title]');
  const tagline = root && query(root, '[data-hero-tagline]');
  const button = root && query(root, '[data-portal]');
  const badge = root && query(root, '[data-hero-badge]');
  if (!root || !stage || !container || !title || !tagline || !button || !badge) return null;

  gsap.registerPlugin(SplitText);
  const slides = buildSlides(container);
  const ready = (slides[0]?.decode() ?? Promise.resolve()).then(
    () => undefined,
    () => undefined,
  );
  const load = (slide: HTMLImageElement | undefined) => {
    if (slide?.dataset.src) {
      slide.src = slide.dataset.src;
      delete slide.dataset.src;
    }
  };
  let cancelIdle: Cleanup = () => undefined;
  void ready.then(() => {
    cancelIdle = onIdle(() => load(slides[1]));
  });
  const reduced = prefersReducedMotion();
  const context = gsap.context(() => {
    gsap.set([title, tagline, button, badge], { autoAlpha: 0 });
    if (reduced) return;
    gsap.to(stage, {
      yPercent: 14,
      ease: EASE.linear,
      scrollTrigger: { trigger: root, start: 'top top', end: 'bottom top', scrub: true },
    });
  }, root);

  let current = 0;
  let slideTimer = 0;
  const hold = () => window.setTimeout(advance, LANDING.slideHold * MS_PER_SECOND);
  const advance = () => {
    const next = (current + 1) % slides.length;
    load(slides[next]);
    load(slides[(next + 1) % slides.length]);
    context.add(() => {
      gsap.to(slides[current] ?? [], {
        opacity: 0,
        duration: LANDING.slideFade,
        ease: EASE.linear,
      });
      gsap.to(slides[next] ?? [], { opacity: 1, duration: LANDING.slideFade, ease: EASE.linear });
      gsap.fromTo(
        slides[next] ?? [],
        { scale: 1.08 },
        { scale: 1, duration: LANDING.slideZoom, ease: EASE.linear },
      );
    });
    current = next;
    slideTimer = hold();
  };
  if (!reduced && slides.length > 1) slideTimer = hold();

  const settings = { duration: LANDING.heroPan, ease: EASE.out };
  const moveX = gsap.quickTo(container, 'x', settings);
  const moveY = gsap.quickTo(container, 'y', settings);
  const handleMove = (event: PointerEvent) => {
    const nx = (event.clientX / window.innerWidth) * HALF - 1;
    const ny = (event.clientY / window.innerHeight) * HALF - 1;
    moveX(-nx * stage.offsetWidth * PAN_RATIO);
    moveY(-ny * DISTANCE.parallaxMax);
  };
  if (hasFinePointer() && !reduced) root.addEventListener('pointermove', handleMove);

  let split: SplitText | null = null;
  return {
    ready,
    intro() {
      context.add(() => {
        if (reduced) {
          gsap.to([title, tagline, button, badge], {
            autoAlpha: 1,
            duration: DURATION.reducedFade,
          });
          return;
        }
        split = SplitText.create(title, { type: 'chars,lines', mask: 'lines' });
        gsap.set(title, { autoAlpha: 1 });
        gsap.fromTo(
          badge,
          { autoAlpha: 0, y: DISTANCE.revealY / HALF },
          { autoAlpha: 1, y: 0, duration: DURATION.base, ease: EASE.out, delay: 0.3 },
        );
        gsap.fromTo(
          slides[0] ?? [],
          { scale: 1.08 },
          { scale: 1, duration: LANDING.slideZoom, ease: EASE.linear },
        );
        gsap.from(split.chars, {
          yPercent: 110,
          duration: DURATION.slow,
          ease: EASE.out,
          stagger: STAGGER.items / HALF,
        });
        gsap.fromTo(
          tagline,
          { autoAlpha: 0, y: DISTANCE.revealY },
          { autoAlpha: 1, y: 0, duration: DURATION.base, ease: EASE.out, delay: 0.5 },
        );
        gsap.fromTo(
          button,
          { autoAlpha: 0, scale: SCALE.popFrom },
          { autoAlpha: 1, scale: 1, duration: DURATION.base, ease: EASE.out, delay: 0.7 },
        );
      });
    },
    dispose() {
      root.removeEventListener('pointermove', handleMove);
      window.clearTimeout(slideTimer);
      cancelIdle();
      split?.revert();
      context.revert();
    },
  };
}
