import { registerBillboard } from './billboard';
import { registerHotspot } from './hotspot';
import { registerNadirCap } from './nadir-cap';
import { registerPanoSphere } from './pano-sphere';
import { registerPanoramaCacheSystem } from './panorama-cache-system';

export function registerComponents(): void {
  registerPanoramaCacheSystem();
  registerBillboard();
  registerPanoSphere();
  registerHotspot();
  registerNadirCap();
}
