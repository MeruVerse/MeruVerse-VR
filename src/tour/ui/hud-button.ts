import { create } from '../../shared/ui/dom';
import { createIcon, type IconName, setIcon } from '../../shared/ui/icons';

export interface HudButtonOptions {
  readonly icon: IconName;
  readonly label: string;
  readonly ariaLabel?: string;
  readonly primary?: boolean;
}

export interface HudButton<T extends HTMLElement> {
  readonly element: T;
  setLabel(label: string): void;
  setIcon(name: IconName): void;
}

export function createHudButton<K extends 'button' | 'a'>(
  tag: K,
  options: HudButtonOptions,
): HudButton<HTMLElementTagNameMap[K]> {
  const tone = options.primary ? 'hud-button-primary' : 'hud-button-ghost';
  const element = create(tag, `hud-button-base ${tone}`);
  if (element instanceof HTMLButtonElement) element.type = 'button';
  const glyph = createIcon(options.icon);
  const text = create('span', options.primary ? '' : 'hidden sm:inline', options.label);
  element.append(glyph, text);
  element.setAttribute('aria-label', options.ariaLabel ?? options.label);
  return {
    element,
    setLabel(next) {
      text.textContent = next;
      element.setAttribute('aria-label', next);
    },
    setIcon: (name) => setIcon(glyph, name),
  };
}
