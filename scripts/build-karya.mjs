import { access, mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const CONTENT_FILE = fileURLToPath(new URL('../content/karya.json', import.meta.url));
const SOURCE_DIR = fileURLToPath(new URL('../assets-src/karya/', import.meta.url));
const OUTPUT_DIR = fileURLToPath(new URL('../public/karya/', import.meta.url));
const DATA_FILE = fileURLToPath(new URL('../src/tour/data/artworks.ts', import.meta.url));

const LONGEST_SIDE = 800;
const WEBP_QUALITY = 80;
const BYTES_PER_KB = 1024;
const JSON_INDENT = 2;
const USABLE_MATCHES = new Set(['high', 'medium']);

const write = (line) => process.stdout.write(`${line}\n`);
const formatSize = (bytes) => `${(bytes / BYTES_PER_KB).toFixed(1)} KB`;
const exists = (path) =>
  access(path).then(
    () => true,
    () => false,
  );

async function encode(sourceFile) {
  return sharp(sourceFile)
    .rotate()
    .resize(LONGEST_SIDE, LONGEST_SIDE, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();
}

function createImageCache() {
  const cache = new Map();
  return (photo) => {
    if (!cache.has(photo)) cache.set(photo, encode(join(SOURCE_DIR, photo)));
    return cache.get(photo);
  };
}

async function resolveImage(artwork, encodeCached) {
  if (!USABLE_MATCHES.has(artwork.photoMatch)) {
    return { skipped: `photoMatch ${artwork.photoMatch}` };
  }
  const photo = artwork.photos[0];
  if (!photo) return { skipped: 'tidak ada foto' };
  if (!(await exists(join(SOURCE_DIR, photo)))) return { skipped: `file ${photo} tidak ada` };
  const buffer = await encodeCached(photo);
  await writeFile(join(OUTPUT_DIR, `${artwork.id}.webp`), buffer);
  return { path: `/karya/${artwork.id}.webp`, bytes: buffer.length };
}

function toClientArtwork(artwork, imagePath) {
  const { labelPhoto: _labelPhoto, photos: _photos, note: _note, ...rest } = artwork;
  return imagePath ? { ...rest, image: imagePath } : rest;
}

function toClientArtist({ id, name, artworkIds }) {
  return { id, name, artworkIds };
}

function renderDataFile(artists, artworks) {
  const serialize = (value) => JSON.stringify(value, null, JSON_INDENT);
  return [
    "import type { Artist, Artwork } from './types';",
    '',
    `export const ARTISTS: readonly Artist[] = ${serialize(artists)};`,
    '',
    `export const ARTWORKS: readonly Artwork[] = ${serialize(artworks)};`,
    '',
  ].join('\n');
}

function printReport(generated, skipped, totalArtworks) {
  const totalBytes = generated.reduce((sum, item) => sum + item.bytes, 0);
  write(
    `Gambar dibuat: ${generated.length} dari ${totalArtworks} karya (${formatSize(totalBytes)})`,
  );
  write(`\nKarya tanpa gambar (${skipped.length}):`);
  for (const item of skipped) write(`- ${item.id}: ${item.reason}`);
}

async function main() {
  const data = JSON.parse(await readFile(CONTENT_FILE, 'utf8'));
  await mkdir(OUTPUT_DIR, { recursive: true });
  const encodeCached = createImageCache();
  const artworks = [];
  const generated = [];
  const skipped = [];
  for (const artwork of data.artworks) {
    const result = await resolveImage(artwork, encodeCached);
    if (result.path) generated.push({ id: artwork.id, bytes: result.bytes });
    else skipped.push({ id: artwork.id, reason: result.skipped });
    artworks.push(toClientArtwork(artwork, result.path));
  }
  await writeFile(DATA_FILE, renderDataFile(data.artists.map(toClientArtist), artworks));
  printReport(generated, skipped, data.artworks.length);
  const written = await stat(DATA_FILE);
  write(`\n${DATA_FILE}: ${formatSize(written.size)}`);
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error}\n`);
  process.exitCode = 1;
});
