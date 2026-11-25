import type { Cleanup } from '../../shared/cleanup';
import type { PortalOrigin } from '../../shared/transition/handoff';
import type { AnchorPoint } from '../../shared/ui/panel';
import type { Artist, Artwork, InfoHotspot, Scene, Zone } from '../data/types';
import { neighborIds } from '../state/graph';
import type { TourStore } from '../state/tour-store';
import { createHotspotTip, type TipTarget } from './hotspot-tip';
import { createHud, type HudNeighbor } from './hud';
import { createInfoCard } from './info-card';
import { createRoomMap } from './room-map';

export interface TourUiOptions {
  readonly root: HTMLElement;
  readonly store: TourStore;
  readonly scenes: readonly Scene[];
  readonly zones: readonly Zone[];
  readonly artworks: readonly Artwork[];
  readonly artists: readonly Artist[];
  project(yaw: number, pitch: number): AnchorPoint;
  onEndTour(origin: PortalOrigin): void;
}

export interface TourUi {
  openInfo(hotspot: InfoHotspot): void;
  hover(target: TipTarget | null): void;
  dispose: Cleanup;
}

export function createTourUi(options: TourUiOptions): TourUi {
  const { root, store, scenes } = options;
  const byId = new Map(scenes.map((scene) => [scene.id, scene]));

  const roomMap = createRoomMap({
    parent: root,
    zones: options.zones,
    onSelect: store.goTo,
    onOpenChange(open) {
      hud.setMapExpanded(open);
      if (open) infoCard.close();
    },
  });
  const infoCard = createInfoCard({
    parent: root,
    artworks: options.artworks,
    artists: options.artists,
  });
  const tip = createHotspotTip({ parent: root, project: options.project });
  const hud = createHud({
    parent: root,
    onNavigate: store.goTo,
    onOpenMap: roomMap.open,
    onEndTour: options.onEndTour,
  });

  let shownSceneId = store.getState().activeId;
  const refresh = () => {
    const activeId = store.getState().activeId;
    if (activeId !== shownSceneId) {
      infoCard.close();
      hud.dismissHint();
    }
    shownSceneId = activeId;
    const scene = byId.get(store.getState().activeId);
    if (!scene) return;
    const neighbors = neighborIds(scene).flatMap((id): HudNeighbor[] => {
      const neighbor = byId.get(id);
      return neighbor ? [{ id, title: neighbor.title }] : [];
    });
    hud.update({ title: scene.title, neighbors });
    roomMap.setActiveZone(scene.zone);
  };
  const unsubscribe = store.subscribe(refresh);
  refresh();

  return {
    openInfo(hotspot) {
      const anchor = () => options.project(hotspot.yaw, hotspot.pitch);
      if ('artworkIds' in hotspot) infoCard.open(hotspot.artworkIds, anchor);
      else infoCard.openNote(hotspot.title, hotspot.body, anchor);
    },
    hover: tip.show,
    dispose() {
      unsubscribe();
      tip.dispose();
      hud.dispose();
      roomMap.dispose();
      infoCard.dispose();
    },
  };
}
