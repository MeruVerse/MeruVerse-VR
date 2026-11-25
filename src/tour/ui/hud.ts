import { HOME_URL } from '../../shared/base-url';
import type { Cleanup } from '../../shared/cleanup';
import type { PortalOrigin } from '../../shared/transition/handoff';
import { create } from '../../shared/ui/dom';
import { createLogoMark } from '../../shared/ui/logo-mark';
import type { SceneId } from '../data/types';
import { createFullscreenButton } from './fullscreen-button';
import { createHudButton } from './hud-button';
import { createHudHint } from './hud-hint';

export interface HudNeighbor {
  readonly id: SceneId;
  readonly title: string;
}

export interface HudView {
  readonly title: string;
  readonly neighbors: readonly HudNeighbor[];
}

export interface Hud {
  update(view: HudView): void;
  setMapExpanded(expanded: boolean): void;
  dismissHint(): void;
  dispose: Cleanup;
}

export interface HudOptions {
  readonly parent: HTMLElement;
  onEndTour(origin: PortalOrigin): void;
  onNavigate(sceneId: SceneId): void;
  onOpenMap(): void;
}

const TITLE_CLASS =
  'order-3 basis-full min-w-0 text-balance text-2xl font-bold leading-tight tracking-[-0.02em] text-paper drop-shadow-[0_1px_10px_rgb(0_0_0/0.7)] lg:order-none lg:basis-auto';

export function createHud(options: HudOptions): Hud {
  const root = create('div', 'pointer-events-none fixed inset-0 z-10');
  root.dataset.hud = '';
  const top = create('header', 'hud-top');
  const title = create('h1', TITLE_CLASS);
  title.setAttribute('aria-live', 'polite');
  const actions = create('div', 'order-2 flex shrink-0 justify-end gap-2 lg:order-none');
  const map = createHudButton('button', {
    icon: 'map',
    label: 'Peta Ruang',
    ariaLabel: 'Buka Peta Ruang',
    primary: true,
  });
  map.element.setAttribute('aria-haspopup', 'dialog');
  map.element.setAttribute('aria-expanded', 'false');
  const fullscreen = createFullscreenButton();
  const endTour = createHudButton('a', {
    icon: 'exit',
    label: 'Akhiri tur',
    ariaLabel: 'Akhiri tur dan kembali ke halaman utama',
  });
  endTour.element.href = HOME_URL;
  actions.append(map.element, fullscreen.element, endTour.element);
  const brand = create('div', 'hud-brand order-1 lg:order-none');
  const words = create('p', 'flex flex-col gap-1');
  words.append(
    create('span', 'text-[0.9375rem] font-bold leading-none tracking-[0.28em]', 'MERUVERSE'),
    create(
      'span',
      'text-[0.625rem] font-medium leading-none tracking-[0.3em] text-paper/70',
      'TUR VIRTUAL 360°',
    ),
  );
  brand.append(createLogoMark(), words);
  top.append(title, brand, actions);

  const nav = create('nav', 'hud-jump');
  nav.setAttribute('aria-label', 'Pindah ruang');
  root.append(top, nav);
  options.parent.append(root);
  const hint = createHudHint(root);

  let neighbors: readonly HudNeighbor[] = [];
  const handleNavigate = (event: Event) => {
    const button = (event.target as Element).closest<HTMLButtonElement>('button[data-scene-id]');
    const target = neighbors.find((neighbor) => neighbor.id === button?.dataset.sceneId);
    if (target) options.onNavigate(target.id);
  };
  const handleOpenMap = () => options.onOpenMap();
  const handleEndTour = (event: MouseEvent) => {
    const modified = event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
    if (modified || event.button !== 0) return;
    event.preventDefault();
    const box = endTour.element.getBoundingClientRect();
    options.onEndTour({ x: box.left + box.width / 2, y: box.top + box.height / 2 });
  };
  nav.addEventListener('click', handleNavigate);
  map.element.addEventListener('click', handleOpenMap);
  endTour.element.addEventListener('click', handleEndTour);

  return {
    update(view) {
      const hadFocus = nav.contains(document.activeElement);
      neighbors = view.neighbors;
      title.textContent = view.title;
      const buttons = view.neighbors.map((neighbor) => {
        const button = create('button', 'hud-jump-item', neighbor.title);
        button.type = 'button';
        button.dataset.sceneId = neighbor.id;
        button.setAttribute('aria-label', `Pindah ke ${neighbor.title}`);
        return button;
      });
      nav.replaceChildren(...buttons);
      if (hadFocus) buttons[0]?.focus();
    },
    setMapExpanded: (expanded) => map.element.setAttribute('aria-expanded', String(expanded)),
    dismissHint: hint.dismiss,
    dispose() {
      nav.removeEventListener('click', handleNavigate);
      map.element.removeEventListener('click', handleOpenMap);
      endTour.element.removeEventListener('click', handleEndTour);
      fullscreen.dispose();
      hint.dispose();
      root.remove();
    },
  };
}
