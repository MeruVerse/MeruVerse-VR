import { gsap } from 'gsap';
import type { Cleanup } from '../../shared/cleanup';
import { hasFinePointer } from '../../shared/motion/pointer';
import { prefersReducedMotion } from '../../shared/motion/reduced-motion';
import { EASE, LANDING } from '../../shared/motion/tokens';
import { create } from '../../shared/ui/dom';
import { createCompass } from '../compass';
import { PREVIEW, PREVIEW_SECTION } from '../content';
import { createRing } from '../preview-ring';

const DEGREES = 360;
const IMAGE_SIZE = 1280;
const HEADING_CLASS =
  'text-balance text-[clamp(2.5rem,6vw,5.5rem)] font-extrabold leading-[0.9] tracking-[-0.045em]';

function buildHeading(): HTMLElement {
  const heading = create('div', 'relative z-10 px-gutter');
  heading.append(create('h2', HEADING_CLASS, PREVIEW_SECTION.title));
  return heading;
}

function buildStrip(): HTMLElement {
  const region = create('div', 'preview-scroller mt-12 snap-x overflow-x-auto');
  region.setAttribute('role', 'region');
  region.setAttribute('aria-label', PREVIEW_SECTION.title);
  region.tabIndex = 0;
  const track = create('ul', 'flex w-max gap-5 px-gutter');
  for (const item of PREVIEW) {
    const card = create('li', 'shrink-0 snap-start');
    const frame = create(
      'div',
      'aspect-square h-[min(56svh,28rem)] overflow-hidden rounded-[30px]',
    );
    const image = create('img', 'size-full object-cover');
    image.src = item.src;
    image.srcset = `${item.small} 640w, ${item.src} 1280w`;
    image.sizes = '(min-width: 1024px) 448px, 80vw';
    image.alt = item.alt;
    image.loading = 'lazy';
    image.width = IMAGE_SIZE;
    image.height = IMAGE_SIZE;
    frame.append(image);
    card.append(frame);
    track.append(card);
  }
  region.append(track);
  return region;
}

export function initPreview(): Cleanup {
  const section = document.querySelector<HTMLElement>('[data-preview]');
  if (!section) return () => undefined;

  const stage = create('div', 'relative overflow-hidden py-24');
  stage.append(buildHeading());
  if (prefersReducedMotion()) {
    stage.append(buildStrip());
    section.append(stage);
    return () => stage.remove();
  }

  stage.className = 'relative h-svh overflow-hidden pt-24';
  const ring = createRing(PREVIEW);
  ring.element.className = 'absolute inset-x-0 bottom-28 top-40';
  const compass = createCompass(PREVIEW_SECTION.heading);
  const compassHolder = create('div', 'absolute inset-x-0 bottom-8 z-10');
  compassHolder.append(compass.element);
  stage.append(ring.element, compassHolder);
  section.append(stage);

  const handleResize = () => ring.layout();
  const handleMove = (event: PointerEvent) => {
    ring.tilt(
      (event.clientX / window.innerWidth) * 2 - 1,
      (event.clientY / window.innerHeight) * 2 - 1,
    );
  };
  ring.layout();
  window.addEventListener('resize', handleResize);
  if (hasFinePointer()) stage.addEventListener('pointermove', handleMove);

  const context = gsap.context(() => {
    const turn = { angle: 0 };
    ring.setAngle(0);
    gsap.to(turn, {
      angle: DEGREES,
      ease: EASE.linear,
      onUpdate: () => {
        ring.setAngle(turn.angle);
        compass.setHeading(turn.angle);
      },
      scrollTrigger: {
        trigger: stage,
        start: 'top top',
        end: () => `+=${window.innerHeight * LANDING.ringScroll}`,
        pin: true,
        scrub: LANDING.scrub,
        invalidateOnRefresh: true,
      },
    });
  }, section);
  return () => {
    window.removeEventListener('resize', handleResize);
    stage.removeEventListener('pointermove', handleMove);
    context.revert();
    ring.dispose();
    stage.remove();
  };
}
