import { withBase } from '../shared/base-url';
import { SCENES, ZONES } from '../tour/data/scenes';

export interface PreviewImage {
  readonly src: string;
  readonly small: string;
  readonly alt: string;
}

const previewImage = (number: number, alt: string): PreviewImage => ({
  src: withBase(`/preview/preview-${number}.webp`),
  small: withBase(`/preview/preview-${number}-640.webp`),
  alt,
});

const BANNER = previewImage(8, 'Spanduk oranye The First Passage dan sudut cendera mata');

export const PREVIEW: readonly PreviewImage[] = [
  previewImage(1, 'Pengunjung mengamati lukisan di dinding putih'),
  previewImage(2, 'Meja panjang kayu dengan kursi oranye'),
  previewImage(3, 'Ruang putih dengan karya kecil di dinding'),
  previewImage(4, 'Tangga merah dan lantai ubin kuning'),
  previewImage(5, 'Pemandu menjelaskan sebuah lukisan kepada dua pengunjung'),
  previewImage(6, 'Lukisan teal besar di dinding ruang pamer'),
  previewImage(7, 'Ruang pamer berlantai ubin dengan deretan lukisan'),
  BANNER,
  previewImage(9, 'Ruang bernuansa merah dengan gambar arang di dinding'),
];

export const EXHIBITION = {
  label: 'Pameran',
  title: 'The First Passage',
  dates: '24 Oktober – 22 November 2026',
  place: 'Artmeru Gallery',
  address: 'Jl. Semeru No.12, Oro-oro Dowo, Klojen, Malang',
  image: BANNER,
  summary: [
    'The First Passage menghadirkan sembilan belas seniman Jawa Timur. Separuh berasal dari Malang, separuh lainnya dari kota-kota lain di Jawa Timur. Sebagian besar bekerja dengan lukisan, satu dengan patung.',
    'Karya-karya ini lebih dulu diperkenalkan di Jakarta, lalu dibawa pulang untuk publik Malang. Para seniman tidak diikat satu tema, melainkan satu perjalanan yang dilalui bersama.',
  ],
  artistsTitle: 'Seniman yang berpameran',
  artists: [
    'Andreas Wijaya',
    'Bagas Rachelma',
    'Bagus Priyo',
    'Dimas Prayogo',
    'Friski Jayantoro',
    'Gatot Kumaidi',
    'Hendung Tunggal Jati',
    'Kharisma Adi',
    'Marselina Adeline',
    'Mujib Darjo',
    'Osyadha Ramadhana',
    'Rizky Alison',
    "Rodlyta Ittabi' Ulya",
    'Sihabudin',
    'Tezar Ari Sandy',
    'Thariq Ramadhan',
    'Victor Syahrul Akbar',
    'Anggun Setyawan x Nadia Vina',
  ],
} as const;

export const HERO_PICKS: readonly number[] = [3, 7, 5, 6, 4, 0];

export const PREVIEW_SECTION = {
  title: 'Pratinjau galeri.',
  heading: 'Arah',
} as const;

export const INSIDE = {
  title: 'Di dalam tur.',
  rows: [
    {
      term: 'Berjalan',
      text: `${SCENES.length} panorama 360° yang tersambung lewat panah di lantai dan pintu. Arahkan kursor ke panah untuk melihat tujuannya.`,
    },
    {
      term: 'Membaca',
      text: 'Ikon i membuka keterangan karya: seniman, judul, media, ukuran, tahun, dan teks label dari galeri.',
    },
    {
      term: 'Melompat',
      text: `Peta Ruang memuat ${ZONES.length} zona. Pilih salah satunya dan Anda langsung berada di sana.`,
    },
  ],
} as const;

const CASHIER_ID = 'info-pintu-galeri-kasir';

function cashierNote(): string {
  for (const scene of SCENES) {
    for (const hotspot of scene.hotspots) {
      if (hotspot.id === CASHIER_ID && 'body' in hotspot) return hotspot.body;
    }
  }
  return '';
}

export const VISIT = {
  rows: [
    { term: 'Alamat', text: EXHIBITION.address },
    { term: 'Tiket', text: cashierNote() },
  ],
  siteLabel: 'artmeru.com',
} as const;

export const LINKS = {
  ar: 'https://meruverse.github.io/MeruVerse-AR/',
  site: 'https://www.artmeru.com',
} as const;

export const COPY = {
  topNote: 'Tur virtual 360° · Artmeru Gallery, Malang',
} as const;
