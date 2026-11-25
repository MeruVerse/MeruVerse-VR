import { gsap } from 'gsap';
import type { Cleanup } from '../cleanup';
import { prefersReducedMotion } from '../motion/reduced-motion';
import { DISTANCE, DURATION, EASE, SCALE } from '../motion/tokens';
import { type AnchorProvider, createAnchorFollower } from './anchor-follower';
import { trapTabKey } from './focus-trap';
import { buildPanelChrome, type PanelVariant } from './panel-chrome';

export type { AnchorPoint, AnchorProvider } from './anchor-follower';
export type { PanelVariant } from './panel-chrome';

export interface PanelOptions {
  readonly title: string;
  readonly variant: PanelVariant;
  onOpenChange?(open: boolean): void;
}

export interface Panel {
  readonly body: HTMLElement;
  readonly closeButton: HTMLButtonElement;
  setTitle(text: string): void;
  open(anchor?: AnchorProvider): void;
  close(): void;
  isOpen(): boolean;
  dispose: Cleanup;
}

const SHOWN_POSE = { opacity: 1, xPercent: 0, y: 0, scale: 1 };
let panelCount = 0;

function hiddenPose(variant: PanelVariant, reduced: boolean) {
  if (reduced) return { ...SHOWN_POSE, opacity: 0 };
  if (variant === 'side') return { ...SHOWN_POSE, opacity: 0, xPercent: 100 };
  return { ...SHOWN_POSE, opacity: 0, y: DISTANCE.popRise, scale: SCALE.popFrom };
}

export function createPanel(parent: HTMLElement, options: PanelOptions): Panel {
  panelCount += 1;
  const { variant } = options;
  const anchored = variant === 'anchored';
  const titleId = `panel-title-${panelCount}`;
  const { root, backdrop, dialog, title, closeButton, body, tail } = buildPanelChrome({
    title: options.title,
    variant,
    titleId,
  });
  parent.append(root);

  const context = gsap.context(() => undefined, root);
  const follower = createAnchorFollower(root, dialog, tail);
  let timeline: gsap.core.Timeline | null = null;
  let opener: HTMLElement | null = null;
  let releaseTrap: Cleanup | null = null;
  let open = false;

  function play(show: boolean): void {
    context.add(() => {
      const reduced = prefersReducedMotion();
      timeline?.kill();
      if (show && root.hidden) {
        root.hidden = false;
        gsap.set(dialog, hiddenPose(variant, reduced));
        if (tail) gsap.set(tail, { opacity: 0 });
      }
      const duration = reduced ? DURATION.reducedFade : show ? DURATION.base : DURATION.fast;
      const pose = show ? SHOWN_POSE : hiddenPose(variant, reduced);
      timeline = gsap.timeline({
        onComplete: () => {
          if (!show) root.hidden = true;
        },
      });
      timeline.to(dialog, { ...pose, duration, ease: EASE.out }, 0);
      if (tail) timeline.to(tail, { opacity: pose.opacity, duration, ease: EASE.out }, 0);
    });
  }

  function closePanel(): void {
    if (!open) return;
    open = false;
    document.removeEventListener('keydown', handleKeyDown);
    releaseTrap?.();
    releaseTrap = null;
    follower.stop();
    play(false);
    opener?.focus({ preventScroll: true });
    opener = null;
    options.onOpenChange?.(false);
  }

  function handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') closePanel();
  }

  function openPanel(next?: AnchorProvider): void {
    if (open) {
      if (next) follower.setAnchor(next);
      return;
    }
    open = true;
    opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    play(true);
    follower.setAnchor(next);
    if (!anchored) releaseTrap = trapTabKey(dialog);
    document.addEventListener('keydown', handleKeyDown);
    dialog.focus({ preventScroll: true });
    options.onOpenChange?.(true);
  }

  backdrop?.addEventListener('click', closePanel);
  closeButton.addEventListener('click', closePanel);

  return {
    body,
    closeButton,
    setTitle(text) {
      title.textContent = text;
      closeButton.setAttribute('aria-label', `Tutup ${text}`);
    },
    open: openPanel,
    close: closePanel,
    isOpen: () => open,
    dispose() {
      releaseTrap?.();
      follower.stop();
      document.removeEventListener('keydown', handleKeyDown);
      backdrop?.removeEventListener('click', closePanel);
      closeButton.removeEventListener('click', closePanel);
      context.revert();
      root.remove();
    },
  };
}
