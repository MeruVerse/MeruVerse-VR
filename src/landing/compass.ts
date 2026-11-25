import { gsap } from 'gsap';
import { create } from '../shared/ui/dom';

const DEGREES = 360;
const PIXELS_PER_DEGREE = 6;
const STRIP_DEGREES = DEGREES * 3;

export interface Compass {
  readonly element: HTMLElement;
  setHeading(degrees: number): void;
}

export function createCompass(label: string): Compass {
  const element = create('div', 'mx-auto w-[min(32rem,86vw)]');
  element.setAttribute('aria-hidden', 'true');
  const readout = create(
    'p',
    'text-center text-sm font-semibold tabular-nums tracking-[0.24em]',
    `${label.toUpperCase()} 000°`,
  );
  const window_ = create('div', 'relative mt-3 h-8 overflow-hidden');
  const strip = create('div', 'compass-strip absolute inset-y-0');
  strip.style.width = `${STRIP_DEGREES * PIXELS_PER_DEGREE}px`;
  strip.style.left = `calc(50% - ${(STRIP_DEGREES / 2) * PIXELS_PER_DEGREE}px)`;
  const marker = create('span', 'absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-flame');
  window_.append(strip, marker);
  element.append(readout, window_);

  return {
    element,
    setHeading(degrees) {
      const heading = ((degrees % DEGREES) + DEGREES) % DEGREES;
      const rounded = String(Math.round(heading) % DEGREES).padStart(3, '0');
      readout.textContent = `${label.toUpperCase()} ${rounded}°`;
      gsap.set(strip, { x: -heading * PIXELS_PER_DEGREE });
    },
  };
}
