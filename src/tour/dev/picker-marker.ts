import type { Entity, Scene } from 'aframe';
import type { Direction } from '../aframe/spherical';

const MARKER_ID = 'picker-marker';

export interface PickerMarker {
  place(point: Direction): void;
  clear(): void;
}

export function createPickerMarker(sceneEl: Scene): PickerMarker {
  let marker: Entity | null = null;

  function clear(): void {
    marker?.remove();
    marker = null;
  }

  return {
    place(point) {
      clear();
      marker = document.createElement('a-entity') as Entity;
      marker.setAttribute('hotspot', {
        id: MARKER_ID,
        kind: 'info',
        yaw: point.yaw,
        pitch: point.pitch,
      });
      sceneEl.append(marker);
    },
    clear,
  };
}
