import { describe, expect, it, vi } from 'vitest';
import { createNarrationPlayer, type NarrationAudio } from '../src/tour/ui/narration-player';

const KAIT = '/narasi/kait.mp3';
const RELAX = '/narasi/relax.mp3';

function createFakeAudio(playFails = false) {
  const listeners = new Map<string, Set<() => void>>();
  const emit = (type: string) => {
    for (const listener of listeners.get(type) ?? []) listener();
  };
  const state = { src: '', currentTime: 0, paused: true, ended: false, error: null as unknown };
  const calls = { play: 0, load: 0 };
  const audio: NarrationAudio = {
    get src() {
      return state.src;
    },
    set src(value) {
      state.src = value;
      state.error = null;
    },
    get currentTime() {
      return state.currentTime;
    },
    set currentTime(value) {
      state.currentTime = value;
    },
    get paused() {
      return state.paused;
    },
    get ended() {
      return state.ended;
    },
    get error() {
      return state.error;
    },
    play() {
      calls.play += 1;
      if (playFails) return Promise.reject(new Error('ditolak'));
      state.paused = false;
      state.ended = false;
      emit('play');
      return Promise.resolve();
    },
    pause() {
      if (state.paused) return;
      state.paused = true;
      emit('pause');
    },
    load() {
      calls.load += 1;
      state.error = null;
    },
    addEventListener(type, listener) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type)?.add(listener);
    },
    removeEventListener(type, listener) {
      listeners.get(type)?.delete(listener);
    },
  };
  return {
    audio,
    calls,
    advance(seconds: number) {
      state.currentTime = seconds;
    },
    finish() {
      state.paused = true;
      state.ended = true;
      emit('ended');
    },
    fail() {
      state.error = new Error('gagal dimuat');
      emit('error');
    },
    listenerCount: () => [...listeners.values()].reduce((sum, set) => sum + set.size, 0),
  };
}

describe('createNarrationPlayer', () => {
  it('memutar narasi dari awal saat tombolnya ditekan', () => {
    const fake = createFakeAudio();
    const player = createNarrationPlayer(fake.audio);
    player.toggle(KAIT);
    expect(fake.audio.src).toBe(KAIT);
    expect(fake.audio.currentTime).toBe(0);
    expect(player.isPlaying(KAIT)).toBe(true);
    expect(player.isPlaying(RELAX)).toBe(false);
  });

  it('menekan lagi narasi yang sedang berbunyi menghentikannya', () => {
    const fake = createFakeAudio();
    const player = createNarrationPlayer(fake.audio);
    player.toggle(KAIT);
    fake.advance(4);
    player.toggle(KAIT);
    expect(fake.audio.paused).toBe(true);
    expect(fake.audio.currentTime).toBe(0);
    expect(player.isPlaying(KAIT)).toBe(false);
  });

  it('narasi lain menggantikan yang sedang berbunyi', () => {
    const fake = createFakeAudio();
    const player = createNarrationPlayer(fake.audio);
    player.toggle(KAIT);
    fake.advance(4);
    player.toggle(RELAX);
    expect(fake.audio.src).toBe(RELAX);
    expect(fake.audio.currentTime).toBe(0);
    expect(player.isPlaying(KAIT)).toBe(false);
    expect(player.isPlaying(RELAX)).toBe(true);
  });

  it('setelah habis, narasi bisa diputar ulang dari awal', () => {
    const fake = createFakeAudio();
    const player = createNarrationPlayer(fake.audio);
    player.toggle(KAIT);
    fake.advance(12);
    fake.finish();
    expect(player.isPlaying(KAIT)).toBe(false);
    player.toggle(KAIT);
    expect(fake.calls.play).toBe(2);
    expect(fake.audio.currentTime).toBe(0);
    expect(player.isPlaying(KAIT)).toBe(true);
  });

  it('setelah gagal dimuat, penekanan berikutnya memuat ulang narasi yang sama', () => {
    const fake = createFakeAudio();
    const player = createNarrationPlayer(fake.audio);
    player.toggle(KAIT);
    fake.fail();
    expect(player.isPlaying(KAIT)).toBe(false);
    player.toggle(KAIT);
    expect(fake.calls.load).toBe(1);
    expect(player.isPlaying(KAIT)).toBe(true);
  });

  it('stop menghentikan dan mengembalikan narasi ke awal', () => {
    const fake = createFakeAudio();
    const player = createNarrationPlayer(fake.audio);
    player.toggle(KAIT);
    fake.advance(4);
    player.stop();
    expect(fake.audio.paused).toBe(true);
    expect(fake.audio.currentTime).toBe(0);
  });

  it('memberi tahu pelanggan setiap keadaan berubah, sampai berhenti berlangganan', () => {
    const fake = createFakeAudio();
    const player = createNarrationPlayer(fake.audio);
    const listener = vi.fn();
    const unsubscribe = player.subscribe(listener);
    player.toggle(KAIT);
    expect(listener).toHaveBeenCalled();
    listener.mockClear();
    fake.finish();
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
    listener.mockClear();
    player.toggle(KAIT);
    expect(listener).not.toHaveBeenCalled();
  });

  it('pemutaran yang ditolak browser tetap memberi tahu pelanggan', async () => {
    const fake = createFakeAudio(true);
    const player = createNarrationPlayer(fake.audio);
    const listener = vi.fn();
    player.subscribe(listener);
    player.toggle(KAIT);
    listener.mockClear();
    await Promise.resolve();
    await Promise.resolve();
    expect(listener).toHaveBeenCalledTimes(1);
    expect(player.isPlaying(KAIT)).toBe(false);
  });

  it('dispose menghentikan narasi dan melepas semua pendengar', () => {
    const fake = createFakeAudio();
    const player = createNarrationPlayer(fake.audio);
    player.toggle(KAIT);
    expect(fake.listenerCount()).toBeGreaterThan(0);
    player.dispose();
    expect(fake.audio.paused).toBe(true);
    expect(fake.listenerCount()).toBe(0);
  });
});
