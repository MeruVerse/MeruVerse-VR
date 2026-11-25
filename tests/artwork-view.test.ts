import { describe, expect, it } from 'vitest';
import { ARTISTS, ARTWORKS } from '../src/tour/data/artworks';
import type { Artwork } from '../src/tour/data/types';
import {
  buildArtworkView,
  buildNoteView,
  EMPTY_INFO_TEXT,
  resolveArtworkViews,
} from '../src/tour/ui/artwork-view';

const base: Artwork = {
  id: 'x--y',
  artistId: 'x',
  title: 'Judul',
  size: '10 cm x 10 cm',
  medium: 'Oil on Canvas',
  year: 2026,
  price: 'Rp 1.000.000',
  description: 'Deskripsi asli.',
  image: '/karya/x--y.webp',
  photoMatch: 'high',
};

describe('buildArtworkView', () => {
  it('menyusun fakta karya: media, ukuran, tahun', () => {
    const view = buildArtworkView(base, 'Seniman');
    expect(view.artist).toBe('Seniman');
    expect(view.facts).toEqual([
      { label: 'Media', value: 'Oil on Canvas' },
      { label: 'Ukuran', value: '10 cm x 10 cm' },
      { label: 'Tahun', value: '2026' },
    ]);
  });

  it('tidak pernah menampilkan harga', () => {
    const view = buildArtworkView(base, 'Seniman');
    expect(JSON.stringify(view)).not.toContain('Rp');
    expect(JSON.stringify(view)).not.toContain('1.000.000');
  });

  it('menambahkan fakta panel hanya bila lebih dari satu panel', () => {
    const labels = (panels?: number) =>
      buildArtworkView({ ...base, ...(panels === undefined ? {} : { panels }) }, 'S').facts.map(
        (fact) => fact.label,
      );
    expect(labels(3)).toContain('Panel');
    expect(labels(1)).not.toContain('Panel');
    expect(labels()).not.toContain('Panel');
  });

  it('seniman kosong bila tidak diketahui', () => {
    expect(buildArtworkView(base, undefined).artist).toBeNull();
  });

  it('gambar hanya untuk photoMatch high dan medium', () => {
    const url = '/karya/x--y.webp';
    expect(buildArtworkView({ ...base, photoMatch: 'high' }, 'S').imageUrl).toBe(url);
    expect(buildArtworkView({ ...base, photoMatch: 'medium' }, 'S').imageUrl).toBe(url);
    expect(buildArtworkView({ ...base, photoMatch: 'low' }, 'S').imageUrl).toBeNull();
    expect(buildArtworkView({ ...base, photoMatch: 'none' }, 'S').imageUrl).toBeNull();
  });

  it('karya tanpa file gambar tidak punya imageUrl', () => {
    const { image: _image, ...withoutImage } = base;
    expect(buildArtworkView(withoutImage, 'S').imageUrl).toBeNull();
  });

  it('narasi hanya untuk karya yang ditandai bernarasi', () => {
    expect(buildArtworkView(base, 'S').audioUrl).toBeNull();
    expect(buildArtworkView(base, 'S', false).audioUrl).toBeNull();
    expect(buildArtworkView(base, 'S', true).audioUrl).toBe('/narasi/x--y.mp3');
  });

  it('deskripsi kosong atau spasi saja menjadi "Informasi segera hadir"', () => {
    expect(buildArtworkView({ ...base, description: '' }, 'S').description).toBe(EMPTY_INFO_TEXT);
    expect(buildArtworkView({ ...base, description: '   ' }, 'S').description).toBe(
      EMPTY_INFO_TEXT,
    );
    expect(EMPTY_INFO_TEXT).toBe('Informasi segera hadir');
  });

  it('deskripsi terisi disalin persis tanpa diubah', () => {
    const text = '  Kalimat berhenti di Sahabi  ';
    expect(buildArtworkView({ ...base, description: text }, 'S').description).toBe(text);
  });
});

describe('resolveArtworkViews', () => {
  it('menjaga urutan artworkIds dan membuang id yang tidak dikenal', () => {
    const [first, second] = ARTWORKS;
    if (!first || !second) throw new Error('data karya kosong');
    const views = resolveArtworkViews([second.id, 'tidak-ada', first.id], ARTWORKS, ARTISTS);
    expect(views.map((view) => view.id)).toEqual([second.id, first.id]);
  });

  it('daftar kosong menghasilkan tampilan kosong', () => {
    expect(resolveArtworkViews([], ARTWORKS, ARTISTS)).toEqual([]);
  });

  it('narasi hanya menempel pada karya yang ada di daftar bernarasi', () => {
    const [first, second] = ARTWORKS;
    if (!first || !second) throw new Error('data karya kosong');
    const ids = [first.id, second.id];
    const views = resolveArtworkViews(ids, ARTWORKS, ARTISTS, new Set([second.id]));
    expect(views.map((view) => view.audioUrl)).toEqual([null, `/narasi/${second.id}.mp3`]);
    const silent = resolveArtworkViews(ids, ARTWORKS, ARTISTS);
    expect(silent.map((view) => view.audioUrl)).toEqual([null, null]);
  });
});

describe('seluruh data karya', () => {
  const views = resolveArtworkViews(
    ARTWORKS.map((artwork) => artwork.id),
    ARTWORKS,
    ARTISTS,
  );

  it('setiap karya menghasilkan satu tampilan', () => {
    expect(views).toHaveLength(ARTWORKS.length);
  });

  it('tidak ada tampilan yang memuat harga', () => {
    const priced = ARTWORKS.filter((artwork) => artwork.price);
    expect(priced.length).toBeGreaterThan(0);
    for (const artwork of priced) {
      const view = views.find((candidate) => candidate.id === artwork.id);
      expect(JSON.stringify(view)).not.toContain(artwork.price ?? '');
    }
  });

  it('deskripsi tampil persis seperti di data', () => {
    for (const artwork of ARTWORKS) {
      expect(views.find((view) => view.id === artwork.id)?.description).toBe(artwork.description);
    }
  });

  it('gambar hanya muncul pada karya high atau medium', () => {
    for (const view of views) {
      const artwork = ARTWORKS.find((candidate) => candidate.id === view.id);
      const allowed = artwork?.photoMatch === 'high' || artwork?.photoMatch === 'medium';
      expect(view.imageUrl !== null, view.id).toBe(allowed);
    }
  });
});

describe('buildNoteView', () => {
  it('menyalin judul dan teks persis, tanpa detail dan gambar', () => {
    const view = buildNoteView('note', 'Kasir', 'Teks apa adanya.');
    expect(view).toEqual({
      id: 'note',
      kind: 'note',
      title: 'Kasir',
      artist: null,
      facts: [],
      imageUrl: null,
      audioUrl: null,
      description: 'Teks apa adanya.',
    });
  });

  it('teks kosong menjadi "Informasi segera hadir"', () => {
    expect(buildNoteView('note', 'Kasir', '  ').description).toBe(EMPTY_INFO_TEXT);
  });
});
