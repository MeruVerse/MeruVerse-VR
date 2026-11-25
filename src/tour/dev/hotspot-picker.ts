import type { Scene as AFrameScene } from 'aframe';
import type { Cleanup } from '../../shared/cleanup';
import { cameraDirection } from '../aframe/camera-direction';
import type { Hotspot, InfoHotspot, Scene } from '../data/types';
import type { TourStore } from '../state/tour-store';
import {
  formatHotspotSnippet,
  formatInitialYaw,
  formatPoint,
  roundCoordinate,
} from './picker-format';
import { createPickerMarker } from './picker-marker';
import { createPickerPanel, type PickerPendingItem } from './picker-panel';
import { createPickerResults, INITIAL_YAW_SLOT } from './picker-results';
import { pointerToDirection } from './pointer-direction';

const CLICK_TOLERANCE_PX = 4;
const PICKING_ATTRIBUTE = 'data-picking';
const PRIMARY_BUTTON = 0;

export interface PickerOptions {
  readonly sceneEl: AFrameScene;
  readonly store: TourStore;
  readonly scenes: readonly Scene[];
}

const isPending = (hotspot: Hotspot): boolean => hotspot.pending === true;

const infoLabel = (hotspot: InfoHotspot): string =>
  'artworkIds' in hotspot ? `info (${hotspot.artworkIds.length} karya)` : `info: ${hotspot.title}`;

export function installHotspotPicker(options: PickerOptions): Cleanup {
  const { sceneEl, store, scenes } = options;
  const sceneById = new Map(scenes.map((scene) => [scene.id, scene]));
  const results = createPickerResults();
  const marker = createPickerMarker(sceneEl);
  let active = false;
  let selectedId: string | null = null;
  let lastPoint: string | null = null;
  let status = '';
  let pressStart: { x: number; y: number } | null = null;

  const activeScene = () => sceneById.get(store.getState().activeId);

  function pendingItems(scene: Scene): PickerPendingItem[] {
    return scene.hotspots.filter(isPending).map((hotspot) => {
      const label =
        hotspot.type === 'nav'
          ? `nav ke ${sceneById.get(hotspot.target)?.title ?? hotspot.target}`
          : infoLabel(hotspot);
      return { id: hotspot.id, label, done: results.has(scene.id, hotspot.id) };
    });
  }

  function refresh(): void {
    const scene = activeScene();
    panel.render({
      active,
      sceneId: scene?.id ?? '-',
      pending: scene ? pendingItems(scene) : [],
      selectedId,
      lastPoint,
      groups: results.groups(),
      status,
    });
  }

  function copy(text: string, message: string): void {
    status = message;
    refresh();
    navigator.clipboard?.writeText(text).catch(() => {
      status = 'Gagal menyalin otomatis, salin manual dari panel';
      refresh();
    });
  }

  function pick(event: MouseEvent): void {
    const direction = pointerToDirection(event, sceneEl.canvas, sceneEl.camera);
    const point = { yaw: roundCoordinate(direction.yaw), pitch: roundCoordinate(direction.pitch) };
    lastPoint = formatPoint(point.yaw, point.pitch);
    marker.place(point);
    const scene = activeScene();
    const target = scene?.hotspots.find((hotspot) => hotspot.id === selectedId);
    if (scene && target) {
      const line = formatHotspotSnippet(target, point.yaw, point.pitch);
      results.set(scene.id, target.id, line);
      selectedId = null;
      copy(line, `Hotspot ${target.id} ditempatkan dan disalin`);
      return;
    }
    copy(lastPoint, 'Titik disalin');
  }

  function saveInitialYaw(): void {
    const scene = activeScene();
    if (!scene) return;
    const line = formatInitialYaw(cameraDirection(sceneEl.camera).yaw);
    results.set(scene.id, INITIAL_YAW_SLOT, line);
    copy(line, `Arah awal ${scene.id} disimpan dan disalin`);
  }

  function setActive(next: boolean): void {
    active = next;
    sceneEl.toggleAttribute(PICKING_ATTRIBUTE, next);
    if (!next) {
      selectedId = null;
      marker.clear();
    }
    status = next ? 'Mode penempatan aktif' : 'Mode penempatan nonaktif';
    refresh();
  }

  const panel = createPickerPanel(document.body, {
    onSelect(hotspotId) {
      selectedId = hotspotId;
      refresh();
    },
    onCopyAll: () => copy(results.asText(), 'Semua hasil disalin'),
    onClear() {
      results.clear();
      status = 'Hasil dikosongkan';
      refresh();
    },
  });

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if ((event.target as HTMLElement).matches('input, textarea, select, [contenteditable]')) return;
    const key = event.key.toLowerCase();
    if (key === 'h') setActive(!active);
    else if (key === 'i' && active) saveInitialYaw();
  };
  const handleMouseDown = (event: MouseEvent) => {
    pressStart = { x: event.clientX, y: event.clientY };
  };
  const handleMouseUp = (event: MouseEvent) => {
    const start = pressStart;
    pressStart = null;
    if (!active || !start || event.button !== PRIMARY_BUTTON) return;
    if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > CLICK_TOLERANCE_PX) return;
    pick(event);
  };
  const blockHotspotSelect = (event: Event) => {
    if (active) event.stopPropagation();
  };

  window.addEventListener('keydown', handleKeyDown);
  sceneEl.canvas.addEventListener('mousedown', handleMouseDown);
  sceneEl.canvas.addEventListener('mouseup', handleMouseUp);
  sceneEl.addEventListener('hotspot-select', blockHotspotSelect, true);
  const unsubscribe = store.subscribe(() => {
    selectedId = null;
    marker.clear();
    refresh();
  });
  refresh();

  return () => {
    unsubscribe();
    window.removeEventListener('keydown', handleKeyDown);
    sceneEl.canvas.removeEventListener('mousedown', handleMouseDown);
    sceneEl.canvas.removeEventListener('mouseup', handleMouseUp);
    sceneEl.removeEventListener('hotspot-select', blockHotspotSelect, true);
    sceneEl.removeAttribute(PICKING_ATTRIBUTE);
    marker.clear();
    panel.dispose();
  };
}
