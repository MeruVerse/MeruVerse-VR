import type { Scene as AFrameScene } from 'aframe';
import type { Cleanup } from '../shared/cleanup';
import { crossfadeDuration, prefersReducedMotion } from '../shared/motion/reduced-motion';
import { DURATION, WAKE } from '../shared/motion/tokens';
import { cameraDirection } from './aframe/camera-direction';
import { setCameraHeading } from './aframe/camera-heading';
import { createHotspotLayer } from './aframe/hotspot-layer';
import { getPanoSphere } from './aframe/pano-sphere';
import { createPanoStage } from './aframe/pano-stage';
import { getPanoramaCache } from './aframe/panorama-cache-system';
import { createPoseLayer } from './aframe/pose-layer';
import { createTravel } from './aframe/travel';
import type { Hotspot, InfoHotspot, Scene, SceneId } from './data/types';
import { createPreloader } from './preloader';
import { type TourScene, whenLoaded } from './scene-dom';
import { directionToward, entryPanorama, wakePanorama } from './state/graph';
import type { TourStore } from './state/tour-store';
import type { TipTarget } from './ui/hotspot-tip';
import { createWakeSound } from './wake-sound';

export interface ViewerOptions {
  readonly tourScene: TourScene;
  readonly scenes: readonly Scene[];
  readonly store: TourStore;
  onInfo(hotspot: InfoHotspot): void;
  /** Mendaftarkan pendengar yang dipanggil setiap kartu info ditutup. */
  onInfoClosed(listener: () => void): Cleanup;
  onHover(target: TipTarget | null): void;
}

export async function createViewer(options: ViewerOptions): Promise<Cleanup> {
  const { tourScene, scenes, store } = options;
  const sceneEl: AFrameScene = tourScene.sceneEl;
  await Promise.all(
    [...tourScene.panoEls, tourScene.poseEl, tourScene.cameraEl, tourScene.hotspotContainer].map(
      whenLoaded,
    ),
  );

  const byId = new Map<SceneId, Scene>(scenes.map((scene) => [scene.id, scene]));
  const cache = getPanoramaCache(sceneEl);
  const stage = createPanoStage({
    spheres: [getPanoSphere(tourScene.panoEls[0]), getPanoSphere(tourScene.panoEls[1])],
    duration: crossfadeDuration,
  });
  const travel = createTravel({
    sceneEl,
    cameraEl: tourScene.cameraEl,
    stage,
    hiddenWhileTraveling: [tourScene.nadirEl],
  });
  const preloader = createPreloader(cache, scenes);
  const poseLayer = createPoseLayer({
    sphere: getPanoSphere(tourScene.poseEl),
    load: cache.load,
  });
  const wakeSound = createWakeSound();
  let activeScene: Scene | undefined;
  let presentation = 0;

  // Scene dengan pose istirahat: pose "bangun" disiapkan tersembunyi supaya bisa muncul seketika.
  function armWake(scene: Scene): void {
    const panorama = wakePanorama(scene);
    if (!scene.rest || !panorama) {
      poseLayer.clear();
      return;
    }
    poseLayer.arm(panorama);
    wakeSound.prepare(scene.rest.wakeSound);
  }

  // Karya yang sedang beristirahat bangun mendadak. Mengembalikan true kalau pengunjung dikejutkan.
  function wake(): boolean {
    if (!activeScene?.rest) return false;
    const reduced = prefersReducedMotion();
    if (!poseLayer.reveal(reduced ? DURATION.reducedFade : WAKE.rise)) return false;
    if (reduced) return false;
    wakeSound.play();
    return true;
  }

  // Kartu info ditutup: karya kembali ke pose istirahat dan siap bangun lagi.
  function rest(): void {
    poseLayer.hide(prefersReducedMotion() ? DURATION.reducedFade : WAKE.settle);
    wakeSound.stop();
  }
  const stopListeningInfoClosed = options.onInfoClosed(rest);

  // Kartu info ditahan sebentar setelah karya bangun, supaya kejutannya sempat terlihat.
  function openInfo(hotspot: InfoHotspot): void {
    if (!wake()) {
      options.onInfo(hotspot);
      return;
    }
    const current = presentation;
    window.setTimeout(() => {
      if (current === presentation) options.onInfo(hotspot);
    }, WAKE.cardDelay * 1000);
  }

  function tipFor(hotspot: Hotspot): TipTarget | null {
    const { yaw, pitch } = hotspot;
    if (hotspot.type === 'nav') {
      const label = byId.get(hotspot.target)?.title;
      return label ? { label, kind: 'nav', yaw, pitch } : null;
    }
    return 'title' in hotspot ? { label: hotspot.title, kind: 'info', yaw, pitch } : null;
  }

  const layer = createHotspotLayer(
    tourScene.hotspotContainer,
    (hotspotId) => {
      const hotspot = activeScene?.hotspots.find((candidate) => candidate.id === hotspotId);
      if (hotspot?.type === 'nav') store.goTo(hotspot.target);
      else if (hotspot?.type === 'info') openInfo(hotspot);
    },
    (hotspotId) => {
      const hotspot = activeScene?.hotspots.find((candidate) => candidate.id === hotspotId);
      options.onHover(hotspot ? tipFor(hotspot) : null);
    },
  );

  function faceStart(scene: Scene): void {
    setCameraHeading(tourScene.cameraEl, scene.initialYaw);
  }

  async function present(sceneId: SceneId): Promise<void> {
    const scene = byId.get(sceneId);
    if (!scene) return;
    sceneEl.canvas?.setAttribute('role', 'img');
    sceneEl.canvas?.setAttribute('aria-label', `Panorama 360° ${scene.title}`);
    const current = ++presentation;
    const previous = activeScene;
    if (previous?.id === scene.id) {
      travel.cancel();
      layer.render(scene.hotspots);
      preloader.settle(scene.id);
      armWake(scene);
      return;
    }
    poseLayer.clear();
    wakeSound.stop();
    const revealHotspots = () => {
      if (current !== presentation) return;
      activeScene = scene;
      layer.render(scene.hotspots);
    };
    const useTravel = previous !== undefined && previous.id !== scene.id && !prefersReducedMotion();
    const departureDirection = directionToward(previous, scene.id);
    const returnDirection =
      previous && departureDirection ? directionToward(scene, previous.id) : null;
    if (useTravel) layer.render([]);
    else travel.cancel();
    const transition = useTravel
      ? travel.go({
          source: entryPanorama(scene),
          direction: departureDirection ?? cameraDirection(sceneEl.camera),
          arrivalYaw: scene.initialYaw,
          ...(returnDirection ? { entryYaw: returnDirection.yaw + 180 } : {}),
          onNearlyThere: revealHotspots,
        })
      : stage.transitionTo(entryPanorama(scene), {
          onReady: () => {
            if (current !== presentation) return;
            faceStart(scene);
            revealHotspots();
          },
        });
    const completed = await transition.catch(() => false);
    if (current !== presentation) return;
    if (completed) {
      preloader.settle(scene.id);
      armWake(scene);
    } else if (previous && previous.id !== scene.id) {
      layer.render(previous.hotspots);
      store.goTo(previous.id);
    }
  }

  const unsubscribe = store.subscribe((state) => void present(state.activeId));
  void present(store.getState().activeId);

  return () => {
    presentation += 1;
    unsubscribe();
    preloader.dispose();
    layer.dispose();
    stopListeningInfoClosed();
    poseLayer.dispose();
    wakeSound.stop();
    travel.dispose();
    stage.dispose();
    cache.dispose();
  };
}
