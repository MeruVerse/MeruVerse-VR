import { DURATION } from './tokens';

export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function crossfadeDuration(): number {
  return prefersReducedMotion() ? DURATION.reducedFade : DURATION.crossfade;
}
