import { describe, expect, it } from 'vitest';
import karya from '../content/karya.json';
import { ARTISTS, ARTWORKS } from '../src/tour/data/artworks';

const publicFiles = new Set(Object.keys(import.meta.glob('/public/karya/*')));
const USABLE_MATCHES = ['high', 'medium'];

describe('artworks.ts dari content/karya.json', () => {
  it('jumlah dan urutan karya sama', () => {
    expect(ARTWORKS.map((artwork) => artwork.id)).toEqual(karya.artworks.map((item) => item.id));
  });

  it('semua teks dan angka identik dengan sumber, selain field sumber', () => {
    for (const source of karya.artworks) {
      const { labelPhoto: _labelPhoto, photos: _photos, note: _note, ...expected } = source;
      const actual = ARTWORKS.find((artwork) => artwork.id === source.id);
      const { image: _image, ...actualWithoutImage } = actual ?? {};
      expect(actualWithoutImage, source.id).toStrictEqual(expected);
    }
  });

  it('tidak ada field sumber yang ikut ke klien', () => {
    for (const artwork of ARTWORKS) {
      expect(artwork).not.toHaveProperty('labelPhoto');
      expect(artwork).not.toHaveProperty('photos');
      expect(artwork).not.toHaveProperty('note');
    }
  });

  it('karya tanpa harga tidak mendapat harga dan status tetap dari sumber', () => {
    const unpriced = ARTWORKS.filter((artwork) => artwork.price === undefined);
    expect(unpriced.map((artwork) => artwork.id)).toEqual(
      karya.artworks.filter((item) => !('price' in item)).map((item) => item.id),
    );
  });
});

describe('gambar karya', () => {
  it('hanya karya photoMatch high atau medium yang punya gambar', () => {
    for (const artwork of ARTWORKS) {
      expect(artwork.image !== undefined, artwork.id).toBe(
        USABLE_MATCHES.includes(artwork.photoMatch),
      );
    }
  });

  it('setiap gambar yang dirujuk ada di public/karya', () => {
    const missing = ARTWORKS.flatMap((artwork) => (artwork.image ? [artwork.image] : [])).filter(
      (path) => !publicFiles.has(`/public${path}`),
    );
    expect(missing).toEqual([]);
  });
});

describe('seniman', () => {
  it('nama dan daftar karya sama dengan sumber, tanpa roomHint', () => {
    expect(ARTISTS).toStrictEqual(
      karya.artists.map(({ id, name, artworkIds }) => ({ id, name, artworkIds })),
    );
  });

  it('relasi seniman dan karya konsisten dua arah', () => {
    const artworkIds = new Set(ARTWORKS.map((artwork) => artwork.id));
    const artistIds = new Set(ARTISTS.map((artist) => artist.id));
    expect(
      ARTISTS.flatMap((artist) => artist.artworkIds).filter((id) => !artworkIds.has(id)),
    ).toEqual([]);
    expect(ARTWORKS.filter((artwork) => !artistIds.has(artwork.artistId))).toEqual([]);
  });
});
