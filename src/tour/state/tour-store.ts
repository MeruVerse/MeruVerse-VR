import type { Cleanup } from '../../shared/cleanup';
import type { SceneId } from '../data/types';
import type { UrlSync } from './url-sync';

export interface TourState {
  readonly activeId: SceneId;
  readonly history: readonly SceneId[];
}

export type TourListener = (state: TourState, previous: TourState) => void;

export interface TourStoreOptions {
  readonly sceneIds: readonly SceneId[];
  readonly startId: SceneId;
  readonly urlSync: UrlSync;
}

export interface TourStore {
  getState(): TourState;
  subscribe(listener: TourListener): Cleanup;
  goTo(sceneId: SceneId): void;
  goBack(): void;
  dispose: Cleanup;
}

export function createTourStore(options: TourStoreOptions): TourStore {
  const { sceneIds, startId, urlSync } = options;
  const listeners = new Set<TourListener>();

  const parseSceneId = (value: string | null): SceneId | null =>
    sceneIds.find((id) => id === value) ?? null;

  const initialId = parseSceneId(urlSync.read()) ?? startId;
  let state: TourState = { activeId: initialId, history: [initialId] };
  urlSync.replace(initialId);

  function activate(sceneId: SceneId): void {
    if (sceneId === state.activeId) return;
    const previous = state;
    state = { activeId: sceneId, history: [...previous.history, sceneId] };
    for (const listener of listeners) listener(state, previous);
  }

  const stopListeningToUrl = urlSync.onChange((value) => {
    const sceneId = parseSceneId(value);
    if (sceneId) {
      activate(sceneId);
      return;
    }
    urlSync.replace(state.activeId);
  });

  return {
    getState: () => state,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    goTo(sceneId) {
      if (!parseSceneId(sceneId) || sceneId === state.activeId) return;
      urlSync.push(sceneId);
      activate(sceneId);
    },
    goBack: () => urlSync.back(),
    dispose() {
      stopListeningToUrl();
      listeners.clear();
    },
  };
}
