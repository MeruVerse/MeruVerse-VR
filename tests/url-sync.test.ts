import { describe, expect, it } from 'vitest';
import { createBrowserUrlSync } from '../src/tour/state/url-sync';

function createFakeWindow(href: string) {
  let current = new URL(href);
  const listeners = new Set<() => void>();
  const apply = (url: string) => {
    current = new URL(url, current);
  };
  const win = {
    location: {
      get href() {
        return current.href;
      },
    },
    history: {
      pushState: (_state: unknown, _title: string, url: string) => apply(url),
      replaceState: (_state: unknown, _title: string, url: string) => apply(url),
      back: () => undefined,
    },
    addEventListener: (_type: string, listener: () => void) => listeners.add(listener),
    removeEventListener: (_type: string, listener: () => void) => listeners.delete(listener),
  };
  return {
    win: win as unknown as Window,
    firePopState: () => {
      for (const listener of listeners) listener();
    },
    listenerCount: () => listeners.size,
    getUrl: () => current,
  };
}

describe('createBrowserUrlSync', () => {
  it('membaca ?scene= dari URL', () => {
    const { win } = createFakeWindow('https://meru.test/tour.html?scene=a-merch');
    expect(createBrowserUrlSync(win).read()).toBe('a-merch');
  });

  it('push mengisi ?scene= dan mempertahankan parameter lain serta hash', () => {
    const fake = createFakeWindow('https://meru.test/tour.html?lang=id#x');
    createBrowserUrlSync(fake.win).push('lorong');
    expect(fake.getUrl().search).toBe('?lang=id&scene=lorong');
    expect(fake.getUrl().hash).toBe('#x');
  });

  it('replace menimpa ?scene= yang lama', () => {
    const fake = createFakeWindow('https://meru.test/tour.html?scene=a-merch');
    createBrowserUrlSync(fake.win).replace('lorong');
    expect(fake.getUrl().search).toBe('?scene=lorong');
  });

  it('onChange meneruskan nilai terkini dan bisa dilepas', () => {
    const fake = createFakeWindow('https://meru.test/tour.html?scene=a-merch');
    const sync = createBrowserUrlSync(fake.win);
    const received: (string | null)[] = [];
    const stop = sync.onChange((value) => received.push(value));
    fake.firePopState();
    stop();
    fake.firePopState();
    expect(received).toEqual(['a-merch']);
    expect(fake.listenerCount()).toBe(0);
  });
});
