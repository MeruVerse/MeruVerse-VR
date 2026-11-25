import { gsap } from 'gsap';
import type { Cleanup } from '../../shared/cleanup';
import { prefersReducedMotion } from '../../shared/motion/reduced-motion';
import { DURATION, EASE } from '../../shared/motion/tokens';
import { create } from '../../shared/ui/dom';
import type { AnchorPoint } from '../../shared/ui/panel';

const GAP_PX = 38;
const MARGIN_PX = 12;

export interface TipTarget {
  readonly label: string;
  readonly kind: 'nav' | 'info';
  readonly yaw: number;
  readonly pitch: number;
}

export interface HotspotTip {
  show(target: TipTarget | null): void;
  dispose: Cleanup;
}

export interface HotspotTipOptions {
  readonly parent: HTMLElement;
  project(yaw: number, pitch: number): AnchorPoint;
}

export function createHotspotTip(options: HotspotTipOptions): HotspotTip {
  const root = create('div', 'hud-tip');
  const arrow = create('span', 'text-accent', '→');
  const text = create('span');
  root.setAttribute('aria-hidden', 'true');
  root.append(arrow, text);
  options.parent.append(root);
  gsap.set(root, { autoAlpha: 0 });

  let target: TipTarget | null = null;
  let fade: gsap.core.Tween | null = null;

  function follow(): void {
    if (!target) return;
    const point = options.project(target.yaw, target.pitch);
    if (!point.visible) {
      gsap.set(root, { autoAlpha: 0 });
      return;
    }
    const width = root.offsetWidth;
    const height = root.offsetHeight;
    const x = Math.min(
      Math.max(point.x - width / 2, MARGIN_PX),
      window.innerWidth - width - MARGIN_PX,
    );
    const above = point.y - GAP_PX - height;
    const y = above < MARGIN_PX ? point.y + GAP_PX : above;
    gsap.set(root, { x, y });
  }

  function fadeTo(alpha: number, onComplete: () => void = () => undefined): void {
    fade?.kill();
    const duration = prefersReducedMotion() ? 0 : DURATION.fast;
    fade = gsap.to(root, { autoAlpha: alpha, duration, ease: EASE.out, onComplete });
  }

  return {
    show(next) {
      target = next;
      if (!next) {
        fadeTo(0, () => gsap.ticker.remove(follow));
        return;
      }
      text.textContent = next.label;
      arrow.hidden = next.kind !== 'nav';
      gsap.ticker.remove(follow);
      gsap.ticker.add(follow);
      follow();
      fadeTo(1);
    },
    dispose() {
      fade?.kill();
      gsap.ticker.remove(follow);
      root.remove();
    },
  };
}
