import type { Cleanup } from '../cleanup';

const FOCUSABLE_SELECTOR = 'a[href], button, input, select, textarea, [tabindex]';

export function nextFocusIndex(current: number, count: number, backwards: boolean): number {
  if (count === 0) return -1;
  if (current < 0) return backwards ? count - 1 : 0;
  const step = backwards ? -1 : 1;
  return (current + step + count) % count;
}

function isFocusable(element: HTMLElement): boolean {
  const disabled = (element as HTMLButtonElement).disabled === true;
  return !disabled && element.tabIndex >= 0 && element.getClientRects().length > 0;
}

export function getFocusable(container: HTMLElement): HTMLElement[] {
  return [...container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)].filter(isFocusable);
}

export function trapTabKey(container: HTMLElement): Cleanup {
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Tab') return;
    const items = getFocusable(container);
    const current = items.indexOf(document.activeElement as HTMLElement);
    const next = nextFocusIndex(current, items.length, event.shiftKey);
    event.preventDefault();
    items[next]?.focus();
  };
  container.addEventListener('keydown', handleKeyDown);
  return () => container.removeEventListener('keydown', handleKeyDown);
}
