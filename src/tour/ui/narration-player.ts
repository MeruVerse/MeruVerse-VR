import type { Cleanup } from '../../shared/cleanup';

/** Bagian HTMLAudioElement yang dipakai pemutar, supaya bisa diganti tiruan saat diuji. */
export interface NarrationAudio {
  src: string;
  currentTime: number;
  readonly paused: boolean;
  readonly ended: boolean;
  readonly error: unknown;
  play(): Promise<void>;
  pause(): void;
  load(): void;
  addEventListener(type: string, listener: () => void): void;
  removeEventListener(type: string, listener: () => void): void;
}

export interface NarrationPlayer {
  /** Memutar narasi dari awal, atau menghentikannya kalau narasi itu sedang berbunyi. */
  toggle(url: string): void;
  stop(): void;
  isPlaying(url: string): boolean;
  subscribe(listener: () => void): Cleanup;
  dispose: Cleanup;
}

const AUDIO_EVENTS = ['play', 'pause', 'ended', 'error'] as const;

/** Satu pemutar untuk semua narasi: memutar narasi lain menghentikan yang sedang berbunyi. */
export function createNarrationPlayer(audio: NarrationAudio = new Audio()): NarrationPlayer {
  const listeners = new Set<() => void>();
  let currentUrl = '';

  const notify = () => {
    for (const listener of listeners) listener();
  };
  const sounding = () => !audio.paused && !audio.ended && !audio.error;

  function stop(): void {
    audio.pause();
    audio.currentTime = 0;
    notify();
  }

  function toggle(url: string): void {
    if (currentUrl === url && sounding()) {
      stop();
      return;
    }
    if (currentUrl !== url) {
      audio.pause();
      currentUrl = url;
      audio.src = url;
    } else if (audio.error) {
      audio.load();
    }
    audio.currentTime = 0;
    void audio.play().catch(notify);
    notify();
  }

  for (const type of AUDIO_EVENTS) audio.addEventListener(type, notify);

  return {
    toggle,
    stop,
    isPlaying: (url) => currentUrl === url && sounding(),
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    dispose() {
      stop();
      for (const type of AUDIO_EVENTS) audio.removeEventListener(type, notify);
      listeners.clear();
    },
  };
}
