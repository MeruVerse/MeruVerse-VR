import { RENDER_ORDER } from './constants';
import type { ThemeColors } from './theme-colors';
import type { Group, Material, Mesh } from './three-types';

export type HotspotKind = 'nav' | 'info';

export interface HotspotVisual {
  readonly group: Group;
  readonly glyph: Group | null;
  dispose(): void;
}

type Point = readonly [number, number];

const DISC_RADIUS = 0.5;
const VISUAL_SCALE = 0.65;
const DISC_SEGMENTS = 48;
const GLYPH_Z = 0.01;
const CHEVRON = { halfWidth: 0.28, rise: 0.26, thickness: 0.17 } as const;
const CHEVRON_ROWS: readonly number[] = [0.12, -0.14];
const INFO_DOT = { radius: 0.065, y: 0.2 } as const;
const INFO_STEM = { width: 0.13, height: 0.36, y: -0.08 } as const;

function flatMaterial(color: string): Material {
  const THREE = AFRAME.THREE;
  return new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    depthWrite: false,
    toneMapped: false,
    side: THREE.DoubleSide,
  });
}

function addMesh(group: Group, mesh: Mesh, renderOrder: number): void {
  mesh.renderOrder = renderOrder;
  group.add(mesh);
}

function chevronOutline(baseY: number): Point[] {
  const { halfWidth, rise, thickness } = CHEVRON;
  return [
    [0, baseY + rise],
    [halfWidth, baseY],
    [halfWidth, baseY - thickness],
    [0, baseY + rise - thickness],
    [-halfWidth, baseY - thickness],
    [-halfWidth, baseY],
  ];
}

function addPolygon(group: Group, outline: readonly Point[], color: string, order: number): void {
  const THREE = AFRAME.THREE;
  const shape = new THREE.Shape();
  outline.forEach(([x, y], index) => {
    if (index === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  });
  shape.closePath();
  const mesh = new THREE.Mesh(new THREE.ShapeGeometry(shape), flatMaterial(color));
  mesh.position.z = GLYPH_Z;
  addMesh(group, mesh, order);
}

function addForwardChevrons(group: Group, color: string): Group {
  const glyph = new AFRAME.THREE.Group();
  for (const baseY of CHEVRON_ROWS) {
    addPolygon(glyph, chevronOutline(baseY), color, RENDER_ORDER.hotspot + 1);
  }
  group.add(glyph);
  return glyph;
}

function addInfoGlyph(group: Group, color: string): void {
  const THREE = AFRAME.THREE;
  const order = RENDER_ORDER.hotspot + 1;
  const dot = new THREE.Mesh(new THREE.CircleGeometry(INFO_DOT.radius, 24), flatMaterial(color));
  dot.position.set(0, INFO_DOT.y, GLYPH_Z);
  addMesh(group, dot, order);
  const stem = new THREE.Mesh(
    new THREE.PlaneGeometry(INFO_STEM.width, INFO_STEM.height),
    flatMaterial(color),
  );
  stem.position.set(0, INFO_STEM.y, GLYPH_Z);
  addMesh(group, stem, order);
}

export function createHotspotVisual(kind: HotspotKind, colors: ThemeColors): HotspotVisual {
  const THREE = AFRAME.THREE;
  const group = new THREE.Group();
  const content = new THREE.Group();
  content.scale.set(VISUAL_SCALE, VISUAL_SCALE, VISUAL_SCALE);
  group.add(content);
  const discColor = kind === 'nav' ? colors.accent : colors.info;
  const disc = new THREE.Mesh(
    new THREE.CircleGeometry(DISC_RADIUS, DISC_SEGMENTS),
    flatMaterial(discColor),
  );
  addMesh(content, disc, RENDER_ORDER.hotspot);
  if (kind === 'info') addInfoGlyph(content, colors.paper);
  const glyph = kind === 'nav' ? addForwardChevrons(content, colors.paper) : null;

  return {
    group,
    glyph,
    dispose() {
      group.traverse((object) => {
        const mesh = object as Mesh;
        if (!mesh.isMesh) return;
        mesh.geometry.dispose();
        (mesh.material as Material).dispose();
      });
      group.clear();
    },
  };
}
