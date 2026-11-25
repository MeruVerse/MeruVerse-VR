import { gsap } from 'gsap';
import { EASE } from '../../shared/motion/tokens';
import { RENDER_ORDER } from './constants';
import type { PanoramaSource, PanoSphereController } from './pano-sphere';

export interface PoseLayer {
  /** Menyiapkan pose kedua di atas panorama scene, masih tersembunyi. */
  arm(source: PanoramaSource): void;
  /** Memunculkan pose kedua. Mengembalikan false kalau belum siap atau sudah tampil. */
  reveal(duration: number): boolean;
  /** Menyembunyikan lagi pose kedua tanpa melepasnya, supaya bisa dimunculkan ulang. */
  hide(duration: number): boolean;
  clear(): void;
  dispose(): void;
}

export interface PoseLayerOptions {
  readonly sphere: PanoSphereController;
  /** Memuat tekstur resolusi penuh lebih dulu supaya pose kedua tidak pernah tampil buram. */
  load(url: string): Promise<unknown>;
}

/**
 * Lapisan pose kedua sebuah scene. Kedua panorama diambil dari titik kamera yang sama, jadi saat
 * lapisan ini dimunculkan hanya bagian yang berbeda yang terlihat berubah.
 */
export function createPoseLayer(options: PoseLayerOptions): PoseLayer {
  const { sphere } = options;
  let generation = 0;
  let armedUrl: string | null = null;
  let ready = false;
  let revealed = false;
  let tween: gsap.core.Tween | null = null;

  function clear(): void {
    generation += 1;
    armedUrl = null;
    ready = false;
    revealed = false;
    tween?.kill();
    tween = null;
    sphere.clear();
  }

  async function prepare(source: PanoramaSource, current: number): Promise<void> {
    await options.load(source.full);
    if (current !== generation) return;
    sphere.setRenderOrder(RENDER_ORDER.panoPose);
    await sphere.show(source);
    if (current !== generation) return;
    ready = true;
  }

  return {
    arm(source) {
      if (armedUrl === source.full) return;
      clear();
      armedUrl = source.full;
      void prepare(source, generation).catch(() => undefined);
    },
    reveal(duration) {
      if (!ready || revealed) return false;
      revealed = true;
      tween?.kill();
      tween = gsap.to(sphere.material, { opacity: 1, duration, ease: EASE.out });
      return true;
    },
    hide(duration) {
      if (!ready || !revealed) return false;
      revealed = false;
      tween?.kill();
      tween = gsap.to(sphere.material, { opacity: 0, duration, ease: EASE.inOut });
      return true;
    },
    clear,
    dispose: clear,
  };
}
