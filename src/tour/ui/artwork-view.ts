import { withBase } from '../../shared/base-url';
import type { Artist, Artwork, PhotoMatch } from '../data/types';

export const EMPTY_INFO_TEXT = 'Informasi segera hadir';

const IMAGE_MATCHES: readonly PhotoMatch[] = ['high', 'medium'];
const MIN_PANELS_LABEL = 1;

export interface ArtworkFact {
  readonly label: string;
  readonly value: string;
}

export interface ArtworkView {
  readonly id: string;
  readonly kind: 'artwork' | 'note';
  readonly title: string;
  readonly artist: string | null;
  readonly facts: readonly ArtworkFact[];
  readonly imageUrl: string | null;
  readonly description: string;
}

function panelsFact(panels: number | undefined): ArtworkFact[] {
  return panels !== undefined && panels > MIN_PANELS_LABEL
    ? [{ label: 'Panel', value: String(panels) }]
    : [];
}

export function buildArtworkView(artwork: Artwork, artistName: string | undefined): ArtworkView {
  const hasImage = IMAGE_MATCHES.includes(artwork.photoMatch);
  return {
    id: artwork.id,
    kind: 'artwork',
    title: artwork.title,
    artist: artistName ?? null,
    facts: [
      { label: 'Media', value: artwork.medium },
      { label: 'Ukuran', value: artwork.size },
      { label: 'Tahun', value: String(artwork.year) },
      ...panelsFact(artwork.panels),
    ],
    imageUrl: hasImage && artwork.image ? withBase(artwork.image) : null,
    description: artwork.description.trim() === '' ? EMPTY_INFO_TEXT : artwork.description,
  };
}

export function buildNoteView(id: string, title: string, body: string): ArtworkView {
  return {
    id,
    kind: 'note',
    title,
    artist: null,
    facts: [],
    imageUrl: null,
    description: body.trim() === '' ? EMPTY_INFO_TEXT : body,
  };
}

export function resolveArtworkViews(
  artworkIds: readonly string[],
  artworks: readonly Artwork[],
  artists: readonly Artist[],
): ArtworkView[] {
  const artworkById = new Map(artworks.map((artwork) => [artwork.id, artwork]));
  const artistById = new Map(artists.map((artist) => [artist.id, artist.name]));
  return artworkIds.flatMap((id) => {
    const artwork = artworkById.get(id);
    return artwork ? [buildArtworkView(artwork, artistById.get(artwork.artistId))] : [];
  });
}
