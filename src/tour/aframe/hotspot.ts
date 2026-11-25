import type { Entity } from 'aframe';
import { gsap } from 'gsap';
import { DURATION, EASE } from '../../shared/motion/tokens';
import { HOTSPOT_HOVER_SCALE, HOTSPOT_RADIUS } from './constants';
import { createGlyphOrienter } from './glyph-orientation';
import { createHotspotVisual, type HotspotKind, type HotspotVisual } from './hotspot-visual';
import { sphericalToPosition } from './spherical';
import { readThemeColors } from './theme-colors';

const COMPONENT_NAME = 'hotspot';
export const HOTSPOT_SELECT_EVENT = 'hotspot-select';
export const HOTSPOT_HOVER_EVENT = 'hotspot-hover';
const HOVER_ATTRIBUTE = 'data-hovering';

export interface HotspotData {
  readonly id: string;
  readonly kind: HotspotKind;
  readonly yaw: number;
  readonly pitch: number;
  readonly radius: number;
}

export interface HotspotSelectDetail {
  readonly id: string;
}

export interface HotspotHoverDetail {
  readonly id: string;
  readonly hovering: boolean;
}

interface HotspotController {
  update(data: HotspotData): void;
  tick(): void;
  dispose(): void;
}

interface HotspotState {
  controller: HotspotController | null;
}

function createHotspotController(el: Entity): HotspotController {
  const colors = readThemeColors();
  const orienter = createGlyphOrienter(el);
  let visual: HotspotVisual | null = null;
  let kind: HotspotKind | null = null;
  let currentId = '';
  let hoverTween: gsap.core.Tween | null = null;

  const scaleTo = (value: number) => {
    hoverTween?.kill();
    if (!visual) return;
    hoverTween = gsap.to(visual.group.scale, {
      x: value,
      y: value,
      z: value,
      duration: DURATION.fast,
      ease: EASE.out,
    });
  };
  const handleClick = () => {
    const detail: HotspotSelectDetail = { id: currentId };
    el.emit(HOTSPOT_SELECT_EVENT, detail, true);
  };
  const emitHover = (hovering: boolean) => {
    const detail: HotspotHoverDetail = { id: currentId, hovering };
    el.emit(HOTSPOT_HOVER_EVENT, detail, true);
  };
  const handleEnter = () => {
    scaleTo(HOTSPOT_HOVER_SCALE);
    el.sceneEl?.setAttribute(HOVER_ATTRIBUTE, '');
    emitHover(true);
  };
  const handleLeave = () => {
    scaleTo(1);
    el.sceneEl?.removeAttribute(HOVER_ATTRIBUTE);
    emitHover(false);
  };

  el.addEventListener('click', handleClick);
  el.addEventListener('mouseenter', handleEnter);
  el.addEventListener('mouseleave', handleLeave);

  function rebuildVisual(nextKind: HotspotKind): void {
    hoverTween?.kill();
    visual?.dispose();
    visual = createHotspotVisual(nextKind, colors);
    kind = nextKind;
    el.setObject3D('mesh', visual.group);
  }

  return {
    update(data) {
      currentId = data.id;
      if (kind !== data.kind) rebuildVisual(data.kind);
      const position = sphericalToPosition(data.yaw, data.pitch, data.radius);
      el.object3D.position.set(position.x, position.y, position.z);
    },
    tick() {
      if (visual?.glyph) orienter.orient(visual.glyph);
    },
    dispose() {
      hoverTween?.kill();
      el.removeEventListener('click', handleClick);
      el.removeEventListener('mouseenter', handleEnter);
      el.removeEventListener('mouseleave', handleLeave);
      el.sceneEl?.removeAttribute(HOVER_ATTRIBUTE);
      visual?.dispose();
      el.removeObject3D('mesh');
      visual = null;
    },
  };
}

export function registerHotspot(): void {
  if (AFRAME.components[COMPONENT_NAME]) return;
  AFRAME.registerComponent<HotspotState>(COMPONENT_NAME, {
    schema: {
      id: { type: 'string' },
      kind: { default: 'nav', oneOf: ['nav', 'info'] },
      yaw: { type: 'number' },
      pitch: { type: 'number' },
      radius: { type: 'number', default: HOTSPOT_RADIUS },
    },
    controller: null,
    init() {
      this.controller = createHotspotController(this.el);
      this.el.setAttribute('billboard', '');
    },
    update() {
      this.controller?.update(this.data as HotspotData);
    },
    tick() {
      this.controller?.tick();
    },
    remove() {
      this.controller?.dispose();
      this.controller = null;
    },
  });
}
