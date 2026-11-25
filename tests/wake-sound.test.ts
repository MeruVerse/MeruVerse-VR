import { describe, expect, it, vi } from 'vitest';
import { createWakeSound, type WakeAudio } from '../src/tour/wake-sound';

const URL_A = '/sfx/a.mp3';
const URL_B = '/sfx/b.mp3';

function createFakeAudio(playFails = false) {
  const audio = {
    src: '',
    currentTime: 0,
    preload: '',
    play: vi.fn(() => (playFails ? Promise.reject(new Error('ditolak')) : Promise.resolve())),
    pause: vi.fn(),
    load: vi.fn(),
  };
  return audio as typeof audio & WakeAudio;
}

describe('createWakeSound', () => {
  it('prepare memuat efek suara sekali untuk alamat yang sama', () => {
    const audio = createFakeAudio();
    const sound = createWakeSound(audio);
    sound.prepare(URL_A);
    sound.prepare(URL_A);
    expect(audio.src).toBe(URL_A);
    expect(audio.preload).toBe('auto');
    expect(audio.load).toHaveBeenCalledTimes(1);
    sound.prepare(URL_B);
    expect(audio.src).toBe(URL_B);
    expect(audio.load).toHaveBeenCalledTimes(2);
  });

  it('play memutar dari awal', () => {
    const audio = createFakeAudio();
    const sound = createWakeSound(audio);
    sound.prepare(URL_A);
    audio.currentTime = 1.5;
    sound.play();
    expect(audio.currentTime).toBe(0);
    expect(audio.play).toHaveBeenCalledTimes(1);
  });

  it('play tanpa prepare tidak melakukan apa pun', () => {
    const audio = createFakeAudio();
    createWakeSound(audio).play();
    expect(audio.play).not.toHaveBeenCalled();
  });

  it('pemutaran yang ditolak browser tidak melempar error', async () => {
    const audio = createFakeAudio(true);
    const sound = createWakeSound(audio);
    sound.prepare(URL_A);
    expect(() => sound.play()).not.toThrow();
    await Promise.resolve();
  });

  it('stop menghentikan suara', () => {
    const audio = createFakeAudio();
    const sound = createWakeSound(audio);
    sound.prepare(URL_A);
    sound.play();
    sound.stop();
    expect(audio.pause).toHaveBeenCalledTimes(1);
  });
});
