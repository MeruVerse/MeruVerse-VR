import { withBase } from '../../shared/base-url';
import type { Hotspot, NavHotspot, Panorama, Scene, SceneId, Zone, ZoneId } from './types';

export const START_SCENE_ID: SceneId = 'pintu-masuk';

function nav(owner: SceneId, target: SceneId, yaw: number, pitch: number): NavHotspot {
  return { id: `nav-${owner}-to-${target}`, type: 'nav', yaw, pitch, target };
}

interface SceneView {
  readonly initialYaw?: number;
  /** Akhiran berkas panorama pose istirahat, misalnya 'baring' untuk `<id>-baring.webp`. */
  readonly rest?: string;
  /** Akhiran berkas panorama pose bangun; tanpa ini karya bangun ke panorama utama. */
  readonly wake?: string;
}

function panoramaAt(name: string): Panorama {
  return { full: withBase(`/panos/${name}.webp`), preview: withBase(`/panos/${name}-lq.webp`) };
}

function scene(
  id: SceneId,
  title: string,
  zone: ZoneId,
  hotspots: readonly Hotspot[],
  view: SceneView = {},
): Scene {
  return {
    id,
    title,
    zone,
    initialYaw: view.initialYaw ?? 0,
    panorama: panoramaAt(id),
    ...(view.rest
      ? {
          rest: {
            panorama: panoramaAt(`${id}-${view.rest}`),
            ...(view.wake ? { wakePanorama: panoramaAt(`${id}-${view.wake}`) } : {}),
            wakeSound: withBase(`/sfx/${id}-bangun.mp3`),
          },
        }
      : {}),
    hotspots,
  };
}

export const ZONES: readonly Zone[] = [
  { id: 'pintu-masuk', label: 'Pintu Masuk', entry: 'pintu-masuk' },
  { id: 'pintu-galeri', label: 'Pintu Galeri', entry: 'pintu-galeri' },
  { id: 'a-merch', label: 'A-Merch', entry: 'a-merch' },
  { id: 'ruang-pamer-1', label: 'Ruang Pamer 1', entry: 'ruang-pamer-1-part-1' },
  { id: 'ruang-pamer-2', label: 'Ruang Pamer 2', entry: 'ruang-pamer-2' },
  { id: 'ruang-pamer-3', label: 'Ruang Pamer 3', entry: 'ruang-pamer-3-part-1' },
  { id: 'lorong-karya', label: 'Lorong Karya', entry: 'lantai-atas' },
  { id: 'ruang-pamer-4', label: 'Ruang Pamer 4', entry: 'patung-gerak' },
  { id: 'ruang-karya-figur', label: 'Ruang Karya Figur', entry: 'ruang-pamer-lantai-atas' },
  { id: 'ruang-komunal', label: 'Ruang Komunal', entry: 'ruang-komunal' },
];

export const SCENES: readonly Scene[] = [
  scene('pintu-masuk', 'Pintu Masuk', 'pintu-masuk', [
    nav('pintu-masuk', 'pintu-galeri', 5.7, -13.3),
  ]),
  scene('pintu-galeri', 'Pintu Galeri', 'pintu-galeri', [
    nav('pintu-galeri', 'a-merch', -29.9, -33.4),
    nav('pintu-galeri', 'ruang-pamer-1-part-1', 13.7, -28.8),
    nav('pintu-galeri', 'pintu-masuk', -94.9, -37.6),
    {
      id: 'info-pintu-galeri-kasir',
      type: 'info',
      yaw: 43.9,
      pitch: -9.2,
      title: 'Kasir',
      body: 'Biaya masuk Rp 15.000. Anda akan mendapat tiket yang bisa dipakai seharian sampai galeri tutup pukul 22.00.',
    },
  ]),
  scene('a-merch', 'A-Merch', 'a-merch', [
    nav('a-merch', 'pintu-galeri', 122.3, -33),
    {
      id: 'info-a-merch-toko',
      type: 'info',
      yaw: 5.7,
      pitch: -1.3,
      title: 'A-Merch (Toko Seni dan Desain)',
      body: 'A-Merch adalah proyek ritel Artmeru yang menjual merchandise resmi hasil kolaborasi dengan para perupa: cetak karya edisi terbatas, kaus seni, dan zine. Penjualannya memakai sistem bagi hasil yang transparan untuk mendukung keberlanjutan ekonomi para seniman.',
    },
    {
      id: 'info-a-merch-kaus',
      type: 'info',
      yaw: -33.2,
      pitch: 20,
      title: 'Kaus Seni',
      body: 'Kaus seni adalah salah satu merchandise resmi A-Merch. Merchandise ini diproduksi bersama para perupa yang terlibat dengan Artmeru.',
    },
    {
      id: 'info-a-merch-zine',
      type: 'info',
      yaw: -148.3,
      pitch: -10.8,
      title: 'Zine dan Cetak Karya',
      body: 'Zine dan cetak karya edisi terbatas termasuk merchandise resmi A-Merch yang dibuat bersama para perupa.',
    },
  ]),
  scene('ruang-pamer-1-part-1', 'Ruang Pamer 1 (sisi 1)', 'ruang-pamer-1', [
    nav('ruang-pamer-1-part-1', 'ruang-pamer-1-part-2', 178.6, -22.5),
    nav('ruang-pamer-1-part-1', 'pintu-galeri', 88.2, -28.5),
    {
      id: 'info-ruang-pamer-1-part-1-sihabudin--parade-laut',
      type: 'info',
      yaw: -147,
      pitch: 3.5,
      artworkIds: ['sihabudin--parade-laut'],
    },
    {
      id: 'info-ruang-pamer-1-part-1-sihabudin--impen',
      type: 'info',
      yaw: -135.6,
      pitch: 4.3,
      artworkIds: ['sihabudin--impen'],
    },
    {
      id: 'info-ruang-pamer-1-part-1-hendung-tunggal-jati--ritual-leluhur',
      type: 'info',
      yaw: -83.8,
      pitch: 0.1,
      artworkIds: ['hendung-tunggal-jati--ritual-leluhur'],
    },
    {
      id: 'info-ruang-pamer-1-part-1-hendung-tunggal-jati--keheningan',
      type: 'info',
      yaw: -58.8,
      pitch: 4.3,
      artworkIds: ['hendung-tunggal-jati--keheningan'],
    },
    {
      id: 'info-ruang-pamer-1-part-1-hendung-tunggal-jati--long-live-show',
      type: 'info',
      yaw: -3.8,
      pitch: 2.9,
      artworkIds: ['hendung-tunggal-jati--long-live-show'],
    },
    {
      id: 'info-ruang-pamer-1-part-1-hendung-tunggal-jati--homo-homini-lupus',
      type: 'info',
      yaw: 22.4,
      pitch: 1.9,
      artworkIds: ['hendung-tunggal-jati--homo-homini-lupus'],
    },
    {
      id: 'info-ruang-pamer-1-part-1-hendung-tunggal-jati--shadow',
      type: 'info',
      yaw: 60,
      pitch: 2.7,
      artworkIds: ['hendung-tunggal-jati--shadow'],
    },
    {
      id: 'info-ruang-pamer-1-part-1-marselina-adeline--batasanku-atau-batasanmu',
      type: 'info',
      yaw: 126.4,
      pitch: 4.1,
      artworkIds: ['marselina-adeline--batasanku-atau-batasanmu'],
    },
    {
      id: 'info-ruang-pamer-1-part-1-marselina-adeline--diktean-masa-depanku',
      type: 'info',
      yaw: 134.8,
      pitch: 4.7,
      artworkIds: ['marselina-adeline--diktean-masa-depanku'],
    },
  ]),
  scene('ruang-pamer-1-part-2', 'Ruang Pamer 1 (sisi 2)', 'ruang-pamer-1', [
    nav('ruang-pamer-1-part-2', 'ruang-pamer-2', 176.5, -17),
    nav('ruang-pamer-1-part-2', 'ruang-pamer-1-part-1', 88, -20.7),
    {
      id: 'info-ruang-pamer-1-part-2-mujib-darjo--jam-7-30',
      type: 'info',
      yaw: -149.6,
      pitch: 0.1,
      artworkIds: ['mujib-darjo--jam-7-30'],
    },
    {
      id: 'info-ruang-pamer-1-part-2-mujib-darjo--cermin-besar',
      type: 'info',
      yaw: -115.8,
      pitch: 0.1,
      artworkIds: ['mujib-darjo--cermin-besar'],
    },
    {
      id: 'info-ruang-pamer-1-part-2-mujib-darjo--tidak-seperti-di-rumah',
      type: 'info',
      yaw: -99.4,
      pitch: 0.7,
      artworkIds: ['mujib-darjo--tidak-seperti-di-rumah'],
    },
    {
      id: 'info-ruang-pamer-1-part-2-mujib-darjo--mencuci-baju-di-hari-lebaran-kedua',
      type: 'info',
      yaw: -82.4,
      pitch: 0.7,
      artworkIds: ['mujib-darjo--mencuci-baju-di-hari-lebaran-kedua'],
    },
    {
      id: 'info-ruang-pamer-1-part-2-mujib-darjo--jeda',
      type: 'info',
      yaw: -42.4,
      pitch: 0.3,
      artworkIds: ['mujib-darjo--jeda'],
    },
    {
      id: 'info-ruang-pamer-1-part-2-mujib-darjo--aku-melihatmu-di-pagi-buta',
      type: 'info',
      yaw: -16.2,
      pitch: 9.3,
      artworkIds: ['mujib-darjo--aku-melihatmu-di-pagi-buta'],
    },
    {
      id: 'info-ruang-pamer-1-part-2-mujib-darjo--peraduan-bertahta-gunung',
      type: 'info',
      yaw: 6.4,
      pitch: 10.3,
      artworkIds: ['mujib-darjo--peraduan-bertahta-gunung'],
    },
    {
      id: 'info-ruang-pamer-1-part-2-tezar-ari-sandy--evening-prayer-1',
      type: 'info',
      yaw: 45.4,
      pitch: 8.1,
      artworkIds: ['tezar-ari-sandy--evening-prayer-1'],
    },
    {
      id: 'info-ruang-pamer-1-part-2-tezar-ari-sandy--evening-prayer-2',
      type: 'info',
      yaw: 54.4,
      pitch: 7.9,
      artworkIds: ['tezar-ari-sandy--evening-prayer-2'],
    },
    {
      id: 'info-ruang-pamer-1-part-2-mujib-darjo--luka',
      type: 'info',
      yaw: 150.2,
      pitch: -0.5,
      artworkIds: ['mujib-darjo--luka'],
    },
  ]),
  scene('ruang-pamer-2', 'Ruang Pamer 2', 'ruang-pamer-2', [
    nav('ruang-pamer-2', 'ruang-pamer-1-part-2', -175.1, -32.6),
    nav('ruang-pamer-2', 'ruang-pamer-3-part-1', 20.5, -29.3),
    {
      id: 'info-ruang-pamer-2-dimas-prayogo--entangled',
      type: 'info',
      yaw: -136.1,
      pitch: 6.2,
      artworkIds: ['dimas-prayogo--entangled'],
    },
    {
      id: 'info-ruang-pamer-2-dimas-prayogo--persuasion',
      type: 'info',
      yaw: -86.9,
      pitch: -4.1,
      artworkIds: ['dimas-prayogo--persuasion'],
    },
    {
      id: 'info-ruang-pamer-2-gatot-kumaidi--kait',
      type: 'info',
      yaw: -42.7,
      pitch: -1.7,
      artworkIds: ['gatot-kumaidi--kait', 'gatot-kumaidi--relax'],
    },
    {
      id: 'info-ruang-pamer-2-dimas-prayogo--merajut-asa',
      type: 'info',
      yaw: 87.9,
      pitch: -1.7,
      artworkIds: ['dimas-prayogo--merajut-asa'],
    },
    {
      id: 'info-ruang-pamer-2-dimas-prayogo--cooporate',
      type: 'info',
      yaw: 115.7,
      pitch: -1.5,
      artworkIds: ['dimas-prayogo--cooporate'],
    },
    {
      id: 'info-ruang-pamer-2-dimas-prayogo--west-wind',
      type: 'info',
      yaw: 151.9,
      pitch: -0.3,
      artworkIds: ['dimas-prayogo--west-wind'],
    },
  ]),
  scene('ruang-pamer-3-part-1', 'Ruang Pamer 3 (sisi 1)', 'ruang-pamer-3', [
    nav('ruang-pamer-3-part-1', 'ruang-pamer-3-part-2', 178.6, -15.7),
    nav('ruang-pamer-3-part-1', 'ruang-pamer-2', 88.4, -10.5),
    {
      id: 'info-ruang-pamer-3-part-1-gatot-kumaidi--menetes-kawan-bergelut',
      type: 'info',
      yaw: 126.8,
      pitch: 0.1,
      artworkIds: ['gatot-kumaidi--menetes', 'gatot-kumaidi--kawan-bergelut'],
    },
    {
      id: 'info-ruang-pamer-3-part-1-andreas-wijaya--drowning-the-death-of-ophelia-2023-ce-in-the-ant',
      type: 'info',
      yaw: -127.3,
      pitch: 0.4,
      artworkIds: ['andreas-wijaya--drowning-the-death-of-ophelia-2023-ce-in-the-ant'],
    },
    {
      id: 'info-ruang-pamer-3-part-1-thariq-ramadhan--safari',
      type: 'info',
      yaw: -96,
      pitch: -1.4,
      artworkIds: ['thariq-ramadhan--safari'],
    },
    {
      id: 'info-ruang-pamer-3-part-1-thariq-ramadhan--monument-of-fragility',
      type: 'info',
      yaw: -68.2,
      pitch: 0.7,
      artworkIds: ['thariq-ramadhan--monument-of-fragility'],
    },
    {
      id: 'info-ruang-pamer-3-part-1-friski-jayantoro--hiduplah-dimasamu-2',
      type: 'info',
      yaw: 36.2,
      pitch: 0.4,
      artworkIds: ['friski-jayantoro--hiduplah-dimasamu-2'],
    },
  ]),
  scene('ruang-pamer-3-part-2', 'Ruang Pamer 3 (sisi 2)', 'ruang-pamer-3', [
    nav('ruang-pamer-3-part-2', 'lantai-atas', -142.9, -23.3),
    nav('ruang-pamer-3-part-2', 'ruang-pamer-3-part-1', -6, -13.3),
    {
      id: 'info-ruang-pamer-3-part-2-thariq-ramadhan--mekar-serumah',
      type: 'info',
      yaw: -115.3,
      pitch: 5.6,
      artworkIds: ['thariq-ramadhan--mekar-serumah'],
    },
    {
      id: 'info-ruang-pamer-3-part-2-bagas-rachelma--katharsis',
      type: 'info',
      yaw: -70,
      pitch: -0.4,
      artworkIds: ['bagas-rachelma--katharsis'],
    },
    {
      id: 'info-ruang-pamer-3-part-2-bagas-rachelma--semaian',
      type: 'info',
      yaw: -57,
      pitch: 5.3,
      artworkIds: ['bagas-rachelma--semaian'],
    },
    {
      id: 'info-ruang-pamer-3-part-2-bagas-rachelma--penyesuaian',
      type: 'info',
      yaw: -49.6,
      pitch: 4.6,
      artworkIds: ['bagas-rachelma--penyesuaian'],
    },
    {
      id: 'info-ruang-pamer-3-part-2-friski-jayantoro--the-morning-after',
      type: 'info',
      yaw: 49.6,
      pitch: 6.7,
      artworkIds: ['friski-jayantoro--the-morning-after'],
    },
    {
      id: 'info-ruang-pamer-3-part-2-kharisma-adi--parimarma',
      type: 'info',
      yaw: 111.4,
      pitch: 14.1,
      artworkIds: ['kharisma-adi--parimarma'],
    },
    {
      id: 'info-ruang-pamer-3-part-2-kharisma-adi--tanpa-palupi',
      type: 'info',
      yaw: 129.4,
      pitch: 13.4,
      artworkIds: ['kharisma-adi--tanpa-palupi'],
    },
    {
      id: 'info-ruang-pamer-3-part-2-kharisma-adi--fragment-energy',
      type: 'info',
      yaw: 130.1,
      pitch: -2.5,
      artworkIds: ['kharisma-adi--fragment-energy'],
    },
  ]),
  scene('lantai-atas', 'Lantai Atas', 'lorong-karya', [
    nav('lantai-atas', 'lorong', -6.6, -24.3),
    nav('lantai-atas', 'ruang-pamer-3-part-2', -132.6, -29.2),
    nav('lantai-atas', 'patung-gerak', -95.6, -10.6),
    {
      id: 'info-lantai-atas-rodlyta-ittabi-ulya--a-fragment-of-landscape',
      type: 'info',
      yaw: 82.3,
      pitch: 27.1,
      artworkIds: ['rodlyta-ittabi-ulya--a-fragment-of-landscape'],
    },
    {
      id: 'info-lantai-atas-hendung-tunggal-jati--koar-koar',
      type: 'info',
      yaw: -73.9,
      pitch: 14.4,
      artworkIds: ['hendung-tunggal-jati--koar-koar'],
    },
  ]),
  scene('lorong', 'Lorong Karya', 'lorong-karya', [
    nav('lorong', 'ruang-komunal', -177.7, -5.3),
    nav('lorong', 'lantai-atas', 17.5, -14.2),
    nav('lorong', 'ruang-pamer-lantai-atas', 95.6, -22),
    {
      id: 'info-lorong-rodlyta-ittabi-ulya--a-fragment-of-landscape',
      type: 'info',
      yaw: -83.3,
      pitch: 28.8,
      artworkIds: ['rodlyta-ittabi-ulya--a-fragment-of-landscape'],
    },
  ]),
  scene(
    'patung-gerak',
    'Patung Gerak',
    'ruang-pamer-4',
    [
      nav('patung-gerak', 'lantai-atas', 162.2, -3.3),
      {
        id: 'info-patung-gerak-anggun-setiawan-nadia-vina-maharani--komponen-no-1-bayang-bayang-dari-instalasi-bayan',
        type: 'info',
        yaw: -8.5,
        pitch: -17,
        artworkIds: [
          'anggun-setiawan-nadia-vina-maharani--komponen-no-1-bayang-bayang-dari-instalasi-bayan',
        ],
      },
    ],
    { rest: 'baring', wake: 'bangun' },
  ),
  scene('ruang-pamer-lantai-atas', 'Ruang Pamer Lantai Atas', 'ruang-karya-figur', [
    nav('ruang-pamer-lantai-atas', 'lorong', 5.7, -26.8),
    {
      id: 'info-ruang-pamer-lantai-atas-bagus-priyo--kecebur-kali',
      type: 'info',
      yaw: -121.3,
      pitch: 10.9,
      artworkIds: ['bagus-priyo--kecebur-kali'],
    },
    {
      id: 'info-ruang-pamer-lantai-atas-bagus-priyo--preman-pasar',
      type: 'info',
      yaw: -104.4,
      pitch: 13,
      artworkIds: ['bagus-priyo--preman-pasar'],
    },
    {
      id: 'info-ruang-pamer-lantai-atas-bagus-priyo--ayam-tarung',
      type: 'info',
      yaw: -74.5,
      pitch: 16.5,
      artworkIds: ['bagus-priyo--ayam-tarung'],
    },
    {
      id: 'info-ruang-pamer-lantai-atas-osyadha-ramadhana--selepas-7-lantas-berlipat-ganda',
      type: 'info',
      yaw: -35.2,
      pitch: 14.1,
      artworkIds: ['osyadha-ramadhana--selepas-7-lantas-berlipat-ganda'],
    },
    {
      id: 'info-ruang-pamer-lantai-atas-victor-syahrul-akbar--reflection-around-us-1-2-3-4-5',
      type: 'info',
      yaw: 121.6,
      pitch: 12,
      artworkIds: ['victor-syahrul-akbar--reflection-around-us-1-2-3-4-5'],
    },
    {
      id: 'info-ruang-pamer-lantai-atas-rizky-alison--climax',
      type: 'info',
      yaw: 175.1,
      pitch: 3.9,
      artworkIds: ['rizky-alison--climax'],
    },
    {
      id: 'info-ruang-pamer-lantai-atas-rizky-alison--the-promise',
      type: 'info',
      yaw: -162.8,
      pitch: 11.3,
      artworkIds: ['rizky-alison--the-promise'],
    },
  ]),
  scene('ruang-komunal', 'Ruang Komunal', 'ruang-komunal', [
    nav('ruang-komunal', 'lorong', -87.4, -22.3),
    {
      id: 'info-ruang-komunal-rodlyta-ittabi-ulya--a-fragment-of-landscape',
      type: 'info',
      yaw: -128.7,
      pitch: 18.3,
      artworkIds: ['rodlyta-ittabi-ulya--a-fragment-of-landscape'],
    },
  ]),
];
