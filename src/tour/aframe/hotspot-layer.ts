import type { Entity } from 'aframe';
import type { Cleanup } from '../../shared/cleanup';
import type { Hotspot } from '../data/types';
import {
  HOTSPOT_HOVER_EVENT,
  HOTSPOT_SELECT_EVENT,
  type HotspotHoverDetail,
  type HotspotSelectDetail,
} from './hotspot';

export interface HotspotLayer {
  render(hotspots: readonly Hotspot[]): void;
  dispose: Cleanup;
}

function createHotspotEntity(hotspot: Hotspot): HTMLElement {
  const entity = document.createElement('a-entity');
  entity.setAttribute('data-hotspot', '');
  entity.setAttribute('hotspot', {
    id: hotspot.id,
    kind: hotspot.type,
    yaw: hotspot.yaw,
    pitch: hotspot.pitch,
  });
  return entity;
}

export function createHotspotLayer(
  container: Entity,
  onSelect: (hotspotId: string) => void,
  onHover: (hotspotId: string | null) => void,
): HotspotLayer {
  const handleSelect = (event: Event) => {
    onSelect((event as CustomEvent<HotspotSelectDetail>).detail.id);
  };
  const handleHover = (event: Event) => {
    const { id, hovering } = (event as CustomEvent<HotspotHoverDetail>).detail;
    onHover(hovering ? id : null);
  };
  container.addEventListener(HOTSPOT_SELECT_EVENT, handleSelect);
  container.addEventListener(HOTSPOT_HOVER_EVENT, handleHover);

  return {
    render(hotspots) {
      onHover(null);
      container.replaceChildren(...hotspots.map(createHotspotEntity));
    },
    dispose() {
      container.removeEventListener(HOTSPOT_SELECT_EVENT, handleSelect);
      container.removeEventListener(HOTSPOT_HOVER_EVENT, handleHover);
      container.replaceChildren();
    },
  };
}
