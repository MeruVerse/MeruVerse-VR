import type { Texture } from './three-types';

export async function loadPanoramaTexture(url: string): Promise<Texture> {
  const THREE = AFRAME.THREE;
  const texture = await new THREE.TextureLoader().loadAsync(url);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  const image = texture.image;
  if (image instanceof HTMLImageElement) {
    await image.decode().catch(() => undefined);
  }
  return texture;
}
