import type { Cleanup } from './cleanup';

const IDLE_TIMEOUT_MS = 2000;
const FALLBACK_DELAY_MS = 200;

export function onIdle(task: () => void): Cleanup {
  if (typeof window.requestIdleCallback === 'function') {
    const handle = window.requestIdleCallback(task, { timeout: IDLE_TIMEOUT_MS });
    return () => window.cancelIdleCallback(handle);
  }
  const handle = window.setTimeout(task, FALLBACK_DELAY_MS);
  return () => window.clearTimeout(handle);
}
