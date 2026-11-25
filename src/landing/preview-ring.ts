import { gsap } from 'gsap';
import { EASE, LANDING } from '../shared/motion/tokens';
import { create } from '../shared/ui/dom';
import type { PreviewImage } from './content';

const DEGREES = 360;
const IMAGE_SIZE = 1280;
const CARD_GAP = 0.12;
const MIN_CARD = 180;
const MAX_CARD = 400;
const CAMERA_OFFSET = 60;
const PERSPECTIVE_RATIO = 1.1;
const VIEWPORT_SHARE = 0.28;
const HEIGHT_SHARE = 0.72;

export interface Ring {
  readonly element: HTMLElement;
  layout(): void;
  setAngle(degrees: number): void;
  tilt(nx: number, ny: number): void;
  dispose(): void;
}

function buildCard(item: PreviewImage): HTMLElement {
  const card = create(
    'div',
    'absolute inset-0 overflow-hidden rounded-[30px] bg-haze shadow-[0_30px_60px_-20px_rgb(0_0_0/0.35)]',
  );
  card.style.backfaceVisibility = 'hidden';
  const image = create('img', 'size-full object-cover');
  image.src = item.src;
  image.srcset = `${item.small} 640w, ${item.src} 1280w`;
  image.sizes = `(max-width: 767px) 260px, ${MAX_CARD + 40}px`;
  image.alt = item.alt;
  image.loading = 'lazy';
  image.decoding = 'async';
  image.width = IMAGE_SIZE;
  image.height = IMAGE_SIZE;
  card.append(image);
  return card;
}

export function createRing(images: readonly PreviewImage[]): Ring {
  const element = create('div', 'absolute inset-0');
  const tiltEl = create('div', 'absolute inset-0');
  const ringEl = create('div', 'absolute inset-0');
  for (const el of [tiltEl, ringEl]) el.style.transformStyle = 'preserve-3d';
  const slots = images.map((item) => {
    const slot = create('div', 'absolute left-1/2 top-1/2');
    slot.style.transformStyle = 'preserve-3d';
    slot.append(buildCard(item));
    return slot;
  });
  ringEl.append(...slots);
  tiltEl.append(ringEl);
  element.append(tiltEl);

  const tiltX = gsap.quickTo(tiltEl, 'rotationX', { duration: LANDING.heroPan, ease: EASE.out });
  const tiltY = gsap.quickTo(tiltEl, 'rotationY', { duration: LANDING.heroPan, ease: EASE.out });

  return {
    element,
    layout() {
      const count = slots.length;
      const size = Math.min(
        MAX_CARD,
        Math.max(
          MIN_CARD,
          Math.min(element.offsetWidth * VIEWPORT_SHARE, element.offsetHeight * HEIGHT_SHARE),
        ),
      );
      const step = DEGREES / count;
      const radius = (size * (1 + CARD_GAP)) / (2 * Math.tan(Math.PI / count));
      const perspective = (radius + CAMERA_OFFSET) * PERSPECTIVE_RATIO;
      element.style.perspective = `${perspective}px`;
      gsap.set(ringEl, { z: perspective - CAMERA_OFFSET });
      slots.forEach((slot, index) => {
        gsap.set(slot, {
          width: size,
          height: size,
          marginLeft: -size / 2,
          marginTop: -size / 2,
          rotationY: index * step,
        });
        const card = slot.firstElementChild;
        if (card) gsap.set(card, { z: -radius });
      });
    },
    setAngle: (degrees) => {
      gsap.set(ringEl, { rotationY: -degrees });
    },
    tilt(nx, ny) {
      tiltX(-ny * LANDING.ringTilt);
      tiltY(nx * LANDING.ringTilt);
    },
    dispose() {
      gsap.killTweensOf([tiltEl, ringEl]);
      element.remove();
    },
  };
}
