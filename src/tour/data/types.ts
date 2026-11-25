export const SCENE_IDS = [
  'pintu-masuk',
  'pintu-galeri',
  'a-merch',
  'ruang-pamer-1-part-1',
  'ruang-pamer-1-part-2',
  'ruang-pamer-2',
  'ruang-pamer-3-part-1',
  'ruang-pamer-3-part-2',
  'lantai-atas',
  'lorong',
  'patung-gerak',
  'ruang-pamer-lantai-atas',
  'ruang-komunal',
] as const;

export const ZONE_IDS = [
  'pintu-masuk',
  'pintu-galeri',
  'a-merch',
  'ruang-pamer-1',
  'ruang-pamer-2',
  'ruang-pamer-3',
  'lorong-karya',
  'ruang-pamer-4',
  'ruang-karya-figur',
  'ruang-komunal',
] as const;

export type SceneId = (typeof SCENE_IDS)[number];
export type ZoneId = (typeof ZONE_IDS)[number];

export interface Zone {
  readonly id: ZoneId;
  readonly label: string;
  readonly entry: SceneId;
}

interface HotspotBase {
  readonly id: string;
  readonly yaw: number;
  readonly pitch: number;
  readonly pending?: true;
  readonly label?: string;
}

export interface NavHotspot extends HotspotBase {
  readonly type: 'nav';
  readonly target: SceneId;
}

export interface ArtworkInfoHotspot extends HotspotBase {
  readonly type: 'info';
  readonly artworkIds: readonly string[];
}

export interface NoteInfoHotspot extends HotspotBase {
  readonly type: 'info';
  readonly title: string;
  readonly body: string;
}

export type InfoHotspot = ArtworkInfoHotspot | NoteInfoHotspot;

export type Hotspot = NavHotspot | InfoHotspot;

export interface Panorama {
  readonly full: string;
  readonly preview: string;
}

/**
 * Pose istirahat karya bergerak, diambil dari titik kamera yang sama dengan panorama utama.
 * Scene dibuka dalam pose ini; saat titik info diklik, karya "bangun" ke `wakePanorama`
 * (atau ke panorama utama kalau tidak diisi) diiringi efek suara.
 */
export interface RestPose {
  readonly panorama: Panorama;
  readonly wakePanorama?: Panorama;
  readonly wakeSound: string;
}

export interface Scene {
  readonly id: SceneId;
  readonly title: string;
  readonly zone: ZoneId;
  readonly initialYaw: number;
  readonly panorama: Panorama;
  readonly rest?: RestPose;
  readonly hotspots: readonly Hotspot[];
}

export type PhotoMatch = 'high' | 'medium' | 'low' | 'none';

export interface Artist {
  readonly id: string;
  readonly name: string;
  readonly artworkIds: readonly string[];
}

export interface Artwork {
  readonly id: string;
  readonly artistId: string;
  readonly title: string;
  readonly size: string;
  readonly medium: string;
  readonly year: number;
  readonly price?: string;
  readonly description: string;
  readonly panels?: number;
  readonly image?: string;
  readonly photoMatch: PhotoMatch;
  readonly status?: 'kemungkinan-terjual';
}
