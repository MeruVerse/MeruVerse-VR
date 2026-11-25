import type { Cleanup } from '../../shared/cleanup';
import { createHudButton } from './hud-button';

export interface FullscreenButton {
  readonly element: HTMLButtonElement;
  dispose: Cleanup;
}

function label(active: boolean): string {
  return active ? 'Keluar layar penuh' : 'Layar penuh';
}

export function createFullscreenButton(): FullscreenButton {
  const button = createHudButton('button', { icon: 'expand', label: label(false) });
  const { element } = button;
  element.setAttribute('aria-pressed', 'false');
  element.hidden = !document.fullscreenEnabled;

  const handleClick = () => {
    const request = document.fullscreenElement
      ? document.exitFullscreen()
      : document.documentElement.requestFullscreen();
    request.catch(() => undefined);
  };
  const sync = () => {
    const active = document.fullscreenElement !== null;
    button.setLabel(label(active));
    button.setIcon(active ? 'shrink' : 'expand');
    element.setAttribute('aria-pressed', String(active));
  };
  element.addEventListener('click', handleClick);
  document.addEventListener('fullscreenchange', sync);

  return {
    element,
    dispose() {
      element.removeEventListener('click', handleClick);
      document.removeEventListener('fullscreenchange', sync);
    },
  };
}
