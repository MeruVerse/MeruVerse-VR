import './tour.css';
import { readHandoff } from '../shared/transition/handoff';
import { createPortal } from '../shared/transition/portal';
import { getPanoramaCache } from './aframe/panorama-cache-system';
import { registerComponents } from './aframe/register-components';
import { createScreenProjector } from './aframe/screen-projection';
import { ARTISTS, ARTWORKS } from './data/artworks';
import { NARRATED_ARTWORK_IDS } from './data/narrations';
import { SCENES, START_SCENE_ID, ZONES } from './data/scenes';
import { playFarewell } from './farewell';
import { hasWebGL, hideLoader, showUnsupported } from './loader';
import { hideHud, playPortalEntry } from './portal-entry';
import { waitForPanorama } from './ready';
import { capPixelRatio, createTourScene, whenLoaded } from './scene-dom';
import { createTourStore } from './state/tour-store';
import { createBrowserUrlSync } from './state/url-sync';
import { createTourUi } from './ui/tour-ui';
import { createViewer } from './viewer';

function requireRoot(): HTMLElement {
  const root = document.querySelector<HTMLElement>('[data-tour-root]');
  if (!root) throw new Error('Elemen [data-tour-root] tidak ditemukan');
  return root;
}

async function startTour(): Promise<void> {
  if (!hasWebGL()) {
    showUnsupported();
    return;
  }
  const origin = readHandoff();
  const portal = origin ? createPortal(origin, true) : null;
  await import('aframe');
  registerComponents();

  const root = requireRoot();
  const tourScene = createTourScene();
  root.append(tourScene.sceneEl);
  await whenLoaded(tourScene.sceneEl);
  capPixelRatio(tourScene.sceneEl);

  const store = createTourStore({
    sceneIds: SCENES.map((scene) => scene.id),
    startId: START_SCENE_ID,
    urlSync: createBrowserUrlSync(),
  });
  const ui = createTourUi({
    root,
    store,
    scenes: SCENES,
    zones: ZONES,
    artworks: ARTWORKS,
    artists: ARTISTS,
    narratedIds: new Set(NARRATED_ARTWORK_IDS),
    project: createScreenProjector(tourScene.sceneEl),
    onEndTour: (origin) => void playFarewell(origin),
  });
  if (portal) hideHud();
  await createViewer({
    tourScene,
    scenes: SCENES,
    store,
    onInfo: ui.openInfo,
    onInfoClosed: ui.onInfoClosed,
    onHover: ui.hover,
  });
  void waitForPanorama(tourScene.sceneEl).then(hideLoader);
  if (portal) void playPortalEntry(portal, tourScene.sceneEl);

  if (import.meta.env.DEV) {
    const { installHotspotPicker } = await import('./dev/hotspot-picker');
    installHotspotPicker({ sceneEl: tourScene.sceneEl, store, scenes: SCENES });
    Object.assign(window, {
      __tour: { store, ui, sceneEl: tourScene.sceneEl, cache: getPanoramaCache(tourScene.sceneEl) },
    });
  }
}

void startTour();
