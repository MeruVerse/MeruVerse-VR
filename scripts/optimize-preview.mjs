import { mkdir, readdir, stat } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const SOURCE_DIR = fileURLToPath(new URL('../assets-src/preview/', import.meta.url));
const OUTPUT_DIR = fileURLToPath(new URL('../public/preview/', import.meta.url));
const SOURCE_EXTENSION = /^\.jpe?g$/i;
const LONGEST_SIDE = 1280;
const SMALL_SIDE = 640;
const WEBP_QUALITY = 80;
const BYTES_PER_KB = 1024;

const write = (line) => process.stdout.write(`${line}\n`);

async function main() {
  const files = (await readdir(SOURCE_DIR))
    .filter((name) => SOURCE_EXTENSION.test(extname(name)))
    .sort();
  if (files.length === 0) {
    write(`Tidak ada JPG di ${SOURCE_DIR}`);
    process.exitCode = 1;
    return;
  }
  await mkdir(OUTPUT_DIR, { recursive: true });
  for (const [index, name] of files.entries()) {
    const target = join(OUTPUT_DIR, `preview-${index + 1}.webp`);
    await sharp(join(SOURCE_DIR, name))
      .rotate()
      .resize(LONGEST_SIDE, LONGEST_SIDE, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toFile(target);
    const small = join(OUTPUT_DIR, `preview-${index + 1}-640.webp`);
    await sharp(join(SOURCE_DIR, name))
      .rotate()
      .resize(SMALL_SIDE, SMALL_SIDE, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toFile(small);
    const size = (await stat(target)).size;
    const smallSize = (await stat(small)).size;
    write(
      `preview-${index + 1}.webp  ${(size / BYTES_PER_KB).toFixed(1)} KB, 640 px ${(smallSize / BYTES_PER_KB).toFixed(1)} KB  <- ${name}`,
    );
  }
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error}\n`);
  process.exitCode = 1;
});
