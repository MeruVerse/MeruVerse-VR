import { describe, expect, it, vi } from 'vitest';
import type { SceneId } from '../src/tour/data/types';
import { createTourStore } from '../src/tour/state/tour-store';
import type { UrlSync } from '../src/tour/state/url-sync';

const IDS: readonly SceneId[] = ['pintu-masuk', 'pintu-galeri', 'a-merch'];
const START: SceneId = 'pintu-masuk';

function createFakeUrlSync(initial: string | null) {
  let current = initial;
  let popListener: ((value: string | null) => void) | null = null;
  const sync: UrlSync = {
    read: () => current,
    push: vi.fn((id: string) => {
      current = id;
    }),
    replace: vi.fn((id: string) => {
      current = id;
    }),
    back: vi.fn(),
    onChange(listener) {
      popListener = listener;
      return () => {
        popListener = null;
      };
    },
  };
  const pop = (value: string | null) => {
    current = value;
    popListener?.(value);
  };
  return { sync, pop, hasListener: () => popListener !== null };
}

function setup(initial: string | null) {
  const fake = createFakeUrlSync(initial);
  const store = createTourStore({ sceneIds: IDS, startId: START, urlSync: fake.sync });
  return { ...fake, store };
}

describe('keadaan awal', () => {
  it('memakai scene awal bila URL tanpa ?scene=', () => {
    const { store, sync } = setup(null);
    expect(store.getState()).toEqual({ activeId: START, history: [START] });
    expect(sync.replace).toHaveBeenCalledWith(START);
  });

  it('memakai scene dari ?scene= yang sah', () => {
    const { store, sync } = setup('a-merch');
    expect(store.getState().activeId).toBe('a-merch');
    expect(sync.replace).toHaveBeenCalledWith('a-merch');
  });

  it('kembali ke scene awal bila ?scene= tidak dikenal', () => {
    const { store, sync } = setup('ruang-tidak-ada');
    expect(store.getState().activeId).toBe(START);
    expect(sync.replace).toHaveBeenCalledWith(START);
  });
});

describe('goTo', () => {
  it('mengganti scene, menambah riwayat, dan mendorong entri URL baru', () => {
    const { store, sync } = setup(null);
    store.goTo('pintu-galeri');
    expect(store.getState()).toEqual({
      activeId: 'pintu-galeri',
      history: [START, 'pintu-galeri'],
    });
    expect(sync.push).toHaveBeenCalledWith('pintu-galeri');
  });

  it('memberi tahu pelanggan dengan keadaan baru dan lama', () => {
    const { store } = setup(null);
    const listener = vi.fn();
    store.subscribe(listener);
    store.goTo('a-merch');
    expect(listener).toHaveBeenCalledOnce();
    expect(listener.mock.calls[0]?.[0].activeId).toBe('a-merch');
    expect(listener.mock.calls[0]?.[1].activeId).toBe(START);
  });

  it('mengabaikan scene yang sama dan scene tidak dikenal', () => {
    const { store, sync } = setup(null);
    store.goTo(START);
    store.goTo('tidak-ada' as SceneId);
    expect(sync.push).not.toHaveBeenCalled();
    expect(store.getState().history).toEqual([START]);
  });

  it('berhenti memberi tahu setelah berhenti berlangganan', () => {
    const { store } = setup(null);
    const listener = vi.fn();
    store.subscribe(listener)();
    store.goTo('a-merch');
    expect(listener).not.toHaveBeenCalled();
  });
});

describe('tombol back peramban', () => {
  it('popstate mengaktifkan scene dari URL tanpa mendorong entri baru', () => {
    const { store, sync, pop } = setup(null);
    store.goTo('pintu-galeri');
    pop(START);
    expect(store.getState().activeId).toBe(START);
    expect(sync.push).toHaveBeenCalledTimes(1);
  });

  it('popstate dengan ?scene= tidak sah mengembalikan URL ke scene aktif', () => {
    const { store, sync, pop } = setup('a-merch');
    pop('rusak');
    expect(store.getState().activeId).toBe('a-merch');
    expect(sync.replace).toHaveBeenLastCalledWith('a-merch');
  });

  it('goBack meneruskan ke riwayat peramban', () => {
    const { store, sync } = setup(null);
    store.goBack();
    expect(sync.back).toHaveBeenCalledOnce();
  });
});

describe('dispose', () => {
  it('melepas pendengar popstate dan semua pelanggan', () => {
    const { store, hasListener, pop } = setup(null);
    const listener = vi.fn();
    store.subscribe(listener);
    store.dispose();
    pop('a-merch');
    expect(hasListener()).toBe(false);
    expect(listener).not.toHaveBeenCalled();
  });
});
