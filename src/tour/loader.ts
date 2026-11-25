import { gsap } from 'gsap';
import { HOME_URL } from '../shared/base-url';
import { prefersReducedMotion } from '../shared/motion/reduced-motion';
import { DURATION } from '../shared/motion/tokens';
import { create } from '../shared/ui/dom';

const LOADER_SELECTOR = '[data-tour-loading]';

export function hasWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

export function hideLoader(): void {
  const loader = document.querySelector<HTMLElement>(LOADER_SELECTOR);
  if (!loader) return;
  gsap.to(loader, {
    autoAlpha: 0,
    duration: prefersReducedMotion() ? 0 : DURATION.base,
    onComplete: () => loader.remove(),
  });
}

export function showUnsupported(): void {
  const loader = document.querySelector<HTMLElement>(LOADER_SELECTOR);
  if (!loader) return;
  const link = create(
    'a',
    'mt-4 inline-flex h-11 items-center rounded-sm bg-accent px-5 text-sm font-semibold text-jet',
    'Kembali ke beranda',
  );
  link.href = HOME_URL;
  loader.replaceChildren(
    create('h1', 'text-2xl font-bold tracking-[-0.02em]', 'Perangkat ini belum bisa membuka tur.'),
    create(
      'p',
      'max-w-md text-paper/80',
      'Tur 360° membutuhkan WebGL. Coba buka lewat peramban lain atau perangkat lain.',
    ),
    link,
  );
}
