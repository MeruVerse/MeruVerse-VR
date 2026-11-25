/** Bagian HTMLAudioElement yang dipakai, supaya bisa diganti tiruan saat diuji. */
export interface WakeAudio {
  src: string;
  currentTime: number;
  preload: string;
  play(): Promise<void>;
  pause(): void;
  load(): void;
}

export interface WakeSound {
  /** Memuat efek suara lebih dulu supaya langsung berbunyi saat karya bangun. */
  prepare(url: string): void;
  play(): void;
  stop(): void;
}

export function createWakeSound(audio: WakeAudio = new Audio()): WakeSound {
  let preparedUrl = '';
  audio.preload = 'auto';
  return {
    prepare(url) {
      if (preparedUrl === url) return;
      preparedUrl = url;
      audio.src = url;
      audio.load();
    },
    play() {
      if (!preparedUrl) return;
      audio.currentTime = 0;
      void audio.play().catch(() => undefined);
    },
    stop() {
      audio.pause();
    },
  };
}
