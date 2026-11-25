import { describe, expect, it } from 'vitest';
import { nextFocusIndex } from '../src/shared/ui/focus-trap';
import { nextTabIndex } from '../src/tour/ui/tab-navigation';

describe('nextTabIndex', () => {
  it('ArrowRight maju dan kembali ke awal setelah tab terakhir', () => {
    expect(nextTabIndex(0, 3, 'ArrowRight')).toBe(1);
    expect(nextTabIndex(2, 3, 'ArrowRight')).toBe(0);
  });

  it('ArrowLeft mundur dan melompat ke tab terakhir dari tab pertama', () => {
    expect(nextTabIndex(2, 3, 'ArrowLeft')).toBe(1);
    expect(nextTabIndex(0, 3, 'ArrowLeft')).toBe(2);
  });

  it('ArrowDown dan ArrowUp bergerak seperti kanan dan kiri untuk daftar tegak', () => {
    expect(nextTabIndex(0, 3, 'ArrowDown')).toBe(1);
    expect(nextTabIndex(0, 3, 'ArrowUp')).toBe(2);
  });

  it('Home ke tab pertama dan End ke tab terakhir', () => {
    expect(nextTabIndex(1, 4, 'Home')).toBe(0);
    expect(nextTabIndex(1, 4, 'End')).toBe(3);
  });

  it('tombol lain tidak mengubah tab', () => {
    expect(nextTabIndex(1, 3, 'Enter')).toBeNull();
    expect(nextTabIndex(1, 3, 'a')).toBeNull();
  });

  it('tanpa tab tidak ada tujuan', () => {
    expect(nextTabIndex(0, 0, 'ArrowRight')).toBeNull();
  });
});

describe('nextFocusIndex', () => {
  it('Tab berputar dari elemen terakhir ke pertama', () => {
    expect(nextFocusIndex(2, 3, false)).toBe(0);
  });

  it('Shift+Tab berputar dari elemen pertama ke terakhir', () => {
    expect(nextFocusIndex(0, 3, true)).toBe(2);
  });

  it('bergerak satu langkah di tengah daftar', () => {
    expect(nextFocusIndex(1, 3, false)).toBe(2);
    expect(nextFocusIndex(1, 3, true)).toBe(0);
  });

  it('fokus di luar daftar (wadah dialog) masuk ke elemen pertama atau terakhir', () => {
    expect(nextFocusIndex(-1, 3, false)).toBe(0);
    expect(nextFocusIndex(-1, 3, true)).toBe(2);
  });

  it('daftar kosong tidak punya tujuan', () => {
    expect(nextFocusIndex(0, 0, false)).toBe(-1);
  });
});
