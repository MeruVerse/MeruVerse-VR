import { describe, expect, it } from 'vitest';
import { ARTWORKS } from '../src/tour/data/artworks';
import { NARRATED_ARTWORK_IDS } from '../src/tour/data/narrations';

const narrationFiles = Object.keys(import.meta.glob('/public/narasi/*.mp3'));

describe('narasi karya', () => {
  it('setiap id bernarasi adalah karya yang punya deskripsi', () => {
    const narratable = new Set(
      ARTWORKS.filter((artwork) => artwork.description.trim() !== '').map((artwork) => artwork.id),
    );
    expect(NARRATED_ARTWORK_IDS.filter((id) => !narratable.has(id))).toEqual([]);
  });

  it('tidak ada id ganda', () => {
    expect(new Set(NARRATED_ARTWORK_IDS).size).toBe(NARRATED_ARTWORK_IDS.length);
  });

  it('berkas di public/narasi sama persis dengan daftar karya bernarasi', () => {
    const expected = NARRATED_ARTWORK_IDS.map((id) => `/public/narasi/${id}.mp3`);
    expect([...narrationFiles].sort()).toEqual([...expected].sort());
  });
});
