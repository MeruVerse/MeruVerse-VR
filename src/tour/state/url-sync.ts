import type { Cleanup } from '../../shared/cleanup';

const SCENE_PARAM = 'scene';

export interface UrlSync {
  read(): string | null;
  push(sceneId: string): void;
  replace(sceneId: string): void;
  back(): void;
  onChange(listener: (sceneId: string | null) => void): Cleanup;
}

function urlWithScene(win: Window, sceneId: string): string {
  const url = new URL(win.location.href);
  url.searchParams.set(SCENE_PARAM, sceneId);
  return `${url.pathname}${url.search}${url.hash}`;
}

export function createBrowserUrlSync(win: Window = window): UrlSync {
  const read = () => new URL(win.location.href).searchParams.get(SCENE_PARAM);
  return {
    read,
    push: (sceneId) => win.history.pushState(null, '', urlWithScene(win, sceneId)),
    replace: (sceneId) => win.history.replaceState(null, '', urlWithScene(win, sceneId)),
    back: () => win.history.back(),
    onChange(listener) {
      const handlePopState = () => listener(read());
      win.addEventListener('popstate', handlePopState);
      return () => win.removeEventListener('popstate', handlePopState);
    },
  };
}
