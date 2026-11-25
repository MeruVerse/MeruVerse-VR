import type { Texture } from './three-types';

export interface PanoramaCache {
  load(url: string): Promise<Texture>;
  peek(url: string): Texture | undefined;
  retain(urls: ReadonlySet<string>): void;
  size(): number;
  dispose(): void;
}

export interface PanoramaCacheOptions {
  loadTexture(url: string): Promise<Texture>;
  upload?(texture: Texture): void;
}

export function createPanoramaCache(options: PanoramaCacheOptions): PanoramaCache {
  const loaded = new Map<string, Texture>();
  const pending = new Map<string, Promise<Texture>>();
  let disposed = false;

  function startLoading(url: string): Promise<Texture> {
    const promise = options.loadTexture(url).then(
      (texture) => {
        pending.delete(url);
        if (disposed) {
          texture.dispose();
          return texture;
        }
        options.upload?.(texture);
        loaded.set(url, texture);
        return texture;
      },
      (error: unknown) => {
        pending.delete(url);
        throw error;
      },
    );
    pending.set(url, promise);
    return promise;
  }

  function disposeTexture(url: string, texture: Texture): void {
    texture.dispose();
    loaded.delete(url);
  }

  return {
    load(url) {
      const cached = loaded.get(url);
      if (cached) return Promise.resolve(cached);
      return pending.get(url) ?? startLoading(url);
    },
    peek: (url) => loaded.get(url),
    retain(urls) {
      for (const [url, texture] of loaded) {
        if (!urls.has(url)) disposeTexture(url, texture);
      }
    },
    size: () => loaded.size,
    dispose() {
      disposed = true;
      for (const [url, texture] of loaded) disposeTexture(url, texture);
    },
  };
}
