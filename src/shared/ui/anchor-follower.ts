import { gsap } from 'gsap';
import { placeAnchored } from './anchor-placement';

export interface AnchorPoint {
  readonly x: number;
  readonly y: number;
  readonly visible: boolean;
}

export type AnchorProvider = () => AnchorPoint;

export interface AnchorFollower {
  setAnchor(next: AnchorProvider | undefined): void;
  stop(): void;
}

const MARGIN_PX = 16;
const GAP_PX = 44;
const TAIL_HALF_PX = 6;

export function createAnchorFollower(
  root: HTMLElement,
  dialog: HTMLElement,
  tail: HTMLElement | null,
): AnchorFollower {
  let anchor: AnchorProvider | null = null;

  function follow(): void {
    if (!anchor) return;
    const point = anchor();
    gsap.set(root, { autoAlpha: point.visible ? 1 : 0 });
    if (!point.visible) return;
    const size = { width: dialog.offsetWidth, height: dialog.offsetHeight };
    const viewport = { width: window.innerWidth, height: window.innerHeight };
    const placement = placeAnchored(point, size, viewport, MARGIN_PX, GAP_PX);
    gsap.set(root, { x: placement.x, y: placement.y });
    const tailY = placement.side === 'above' ? size.height - TAIL_HALF_PX : -TAIL_HALF_PX;
    if (tail) gsap.set(tail, { x: placement.tailX - TAIL_HALF_PX, y: tailY });
  }

  return {
    setAnchor(next) {
      gsap.ticker.remove(follow);
      anchor = next ?? null;
      if (!anchor) return;
      gsap.ticker.add(follow);
      follow();
    },
    stop: () => gsap.ticker.remove(follow),
  };
}
