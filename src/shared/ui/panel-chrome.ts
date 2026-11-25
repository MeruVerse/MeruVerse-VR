import { gsap } from 'gsap';
import { create } from './dom';

export type PanelVariant = 'side' | 'anchored';

export interface PanelChromeOptions {
  readonly title: string;
  readonly variant: PanelVariant;
  readonly titleId: string;
}

export interface PanelChrome {
  readonly root: HTMLElement;
  readonly backdrop: HTMLElement | null;
  readonly dialog: HTMLElement;
  readonly title: HTMLElement;
  readonly closeButton: HTMLButtonElement;
  readonly body: HTMLElement;
  readonly tail: HTMLElement | null;
}

const ROOT_CLASS: Record<PanelVariant, string> = {
  side: 'fixed inset-0 z-20 flex',
  anchored: 'fixed left-0 top-0 z-20',
};
const DIALOG_CLASS: Record<PanelVariant, string> = {
  side: 'panel-plate ml-auto h-full w-full max-w-sm',
  anchored: 'panel-plate w-[min(21rem,calc(100vw-2rem))] max-h-[70dvh] rounded-sm',
};
const TAIL_CLASS = 'pointer-events-none absolute left-0 top-0 size-3 rotate-45 bg-ink-2';

export function buildPanelChrome(options: PanelChromeOptions): PanelChrome {
  const { variant, titleId } = options;
  const anchored = variant === 'anchored';
  const root = create('div', ROOT_CLASS[variant]);
  root.hidden = true;
  const backdrop = anchored ? null : create('div', 'absolute inset-0');
  backdrop?.setAttribute('aria-hidden', 'true');
  const dialog = create('section', DIALOG_CLASS[variant]);
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', String(!anchored));
  dialog.setAttribute('aria-labelledby', titleId);
  dialog.tabIndex = -1;
  gsap.set(dialog, { transformOrigin: '50% 100%' });

  const title = create('h2', 'sr-only', options.title);
  title.id = titleId;
  const closeButton = create('button', 'plate-close', '×');
  closeButton.type = 'button';
  closeButton.setAttribute('aria-label', `Tutup ${options.title}`);
  const body = create('div', 'flex min-h-0 flex-1');
  dialog.append(title, body);
  const tail = anchored ? create('div', TAIL_CLASS) : null;
  root.append(...[backdrop, dialog, tail].filter((node): node is HTMLElement => node !== null));
  return { root, backdrop, dialog, title, closeButton, body, tail };
}
