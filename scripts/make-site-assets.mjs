import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const PUBLIC_DIR = fileURLToPath(new URL('../public/', import.meta.url));
const ICON_SOURCE = `${PUBLIC_DIR}favicon.svg`;
const OG_SOURCE = `${PUBLIC_DIR}preview/preview-8.webp`;
const OG_SIZE = { width: 1200, height: 630 };
const FAVICON_SIZE = 32;
const TOUCH_SIZE = 180;
const OG_QUALITY = 84;
const ICO_HEADER_BYTES = 6;
const ICO_ENTRY_BYTES = 16;

const write = (line) => process.stdout.write(`${line}\n`);

function buildIco(png, size) {
  const header = Buffer.alloc(ICO_HEADER_BYTES + ICO_ENTRY_BYTES);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);
  header.writeUInt8(size, 6);
  header.writeUInt8(size, 7);
  header.writeUInt16LE(1, 10);
  header.writeUInt16LE(32, 12);
  header.writeUInt32LE(png.length, 14);
  header.writeUInt32LE(ICO_HEADER_BYTES + ICO_ENTRY_BYTES, 18);
  return Buffer.concat([header, png]);
}

async function main() {
  const svg = await readFile(ICON_SOURCE);
  const favicon = await sharp(svg, { density: 384 })
    .resize(FAVICON_SIZE, FAVICON_SIZE)
    .png()
    .toBuffer();
  await writeFile(`${PUBLIC_DIR}favicon.ico`, buildIco(favicon, FAVICON_SIZE));
  await sharp(svg, { density: 384 })
    .resize(TOUCH_SIZE, TOUCH_SIZE)
    .png()
    .toFile(`${PUBLIC_DIR}apple-touch-icon.png`);
  await sharp(OG_SOURCE)
    .resize(OG_SIZE.width, OG_SIZE.height, { fit: 'cover', position: 'centre' })
    .jpeg({ quality: OG_QUALITY, mozjpeg: true })
    .toFile(`${PUBLIC_DIR}og-image.jpg`);
  write('favicon.ico, apple-touch-icon.png, og-image.jpg dibuat di public/');
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error}\n`);
  process.exitCode = 1;
});
