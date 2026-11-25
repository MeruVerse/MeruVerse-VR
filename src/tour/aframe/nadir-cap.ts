import type { Entity } from 'aframe';
import { NADIR, RENDER_ORDER } from './constants';
import { readThemeColors, type ThemeColors } from './theme-colors';
import type { CanvasTexture } from './three-types';

const COMPONENT_NAME = 'nadir-cap';
const FULL_CIRCLE = Math.PI * 2;
const HALF = 2;
const DEGREES_TO_RADIANS = Math.PI / 180;

interface NadirCapController {
  dispose(): void;
}

interface NadirCapState {
  controller: NadirCapController | null;
}

function drawCap(canvas: HTMLCanvasElement, colors: ThemeColors): void {
  const context = canvas.getContext('2d');
  if (!context) return;
  const size = canvas.width;
  const center = size / HALF;
  const gradient = context.createRadialGradient(center, center, 0, center, center, center);
  gradient.addColorStop(0, colors.ink);
  gradient.addColorStop(NADIR.fadeStart, colors.ink);
  gradient.addColorStop(1, 'transparent');
  context.clearRect(0, 0, size, size);
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);
  context.strokeStyle = colors.accent;
  context.lineWidth = NADIR.ringWidth;
  context.beginPath();
  context.arc(center, center, center * NADIR.ringRadius, 0, FULL_CIRCLE);
  context.stroke();
  context.fillStyle = colors.paper;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.font = `${Math.round(size * NADIR.fontRatio)}px ${colors.displayFont}`;
  context.fillText(NADIR.label, center, center);
}

function createNadirCapController(el: Entity, distance: number, angle: number): NadirCapController {
  const THREE = AFRAME.THREE;
  const colors = readThemeColors();
  const canvas = document.createElement('canvas');
  canvas.width = NADIR.textureSize;
  canvas.height = NADIR.textureSize;
  drawCap(canvas, colors);
  const texture: CanvasTexture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const radius = distance * Math.tan(angle * DEGREES_TO_RADIANS);
  const geometry = new THREE.CircleGeometry(radius, 64);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    toneMapped: false,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = -Math.PI / HALF;
  mesh.position.y = -distance;
  mesh.renderOrder = RENDER_ORDER.nadirCap;
  mesh.frustumCulled = false;
  el.setObject3D('mesh', mesh);

  let disposed = false;
  const fontReady = document.fonts
    .load(`${NADIR.fontSample}px ${colors.displayFont}`)
    .then(() => {
      if (disposed) return;
      drawCap(canvas, colors);
      texture.needsUpdate = true;
    })
    .catch(() => undefined);
  void fontReady;

  return {
    dispose() {
      disposed = true;
      el.removeObject3D('mesh');
      geometry.dispose();
      material.dispose();
      texture.dispose();
    },
  };
}

export function registerNadirCap(): void {
  if (AFRAME.components[COMPONENT_NAME]) return;
  AFRAME.registerComponent<NadirCapState>(COMPONENT_NAME, {
    schema: {
      distance: { type: 'number', default: NADIR.distance },
      angle: { type: 'number', default: NADIR.halfAngleDegrees },
    },
    controller: null,
    init() {
      const { distance, angle } = this.data as { distance: number; angle: number };
      this.controller = createNadirCapController(this.el, distance, angle);
    },
    remove() {
      this.controller?.dispose();
      this.controller = null;
    },
  });
}
