import { gsap } from 'gsap';
import type { Cleanup } from '../shared/cleanup';
import { DURATION } from '../shared/motion/tokens';
import { writeHandoff } from '../shared/transition/handoff';
import { createPortal, type Portal } from '../shared/transition/portal';
import { SCENES, START_SCENE_ID } from '../tour/data/scenes';

const PRELOAD_LIMIT_SECONDS = 1.5;
let active: Portal | null = null;

function preload(sceneId: string | null): Promise<unknown> {
  const scene = SCENES.find((candidate) => candidate.id === (sceneId ?? START_SCENE_ID));
  if (!scene) return Promise.resolve();
  const sources = [scene.panorama.preview, scene.panorama.full];
  return Promise.all(
    sources.map((source) => {
      const image = new Image();
      image.src = source;
      return image.decode().catch(() => undefined);
    }),
  );
}

async function enter(link: HTMLAnchorElement): Promise<void> {
  if (active) return;
  const box = link.getBoundingClientRect();
  const origin = { x: box.left + box.width / 2, y: box.top + box.height / 2 };
  writeHandoff(origin);
  active = createPortal(origin, false);
  gsap.to('main, footer', { opacity: 0, duration: DURATION.base });
  const sceneId = new URL(link.href).searchParams.get('scene');
  const limit = new Promise((resolve) => {
    gsap.delayedCall(PRELOAD_LIMIT_SECONDS, resolve);
  });
  await Promise.all([active.cover(), Promise.race([preload(sceneId), limit])]);
  window.location.assign(link.href);
}

export function bindPortalLinks(): Cleanup {
  const handleClick = (event: MouseEvent) => {
    const link = (event.target as Element).closest<HTMLAnchorElement>('a[data-portal]');
    const modified = event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
    if (!link || modified || event.button !== 0) return;
    event.preventDefault();
    void enter(link);
  };
  const handlePageShow = (event: PageTransitionEvent) => {
    if (!event.persisted) return;
    active?.dispose();
    active = null;
    gsap.set('main, footer', { opacity: 1 });
  };
  document.addEventListener('click', handleClick);
  window.addEventListener('pageshow', handlePageShow);
  return () => {
    document.removeEventListener('click', handleClick);
    window.removeEventListener('pageshow', handlePageShow);
  };
}
