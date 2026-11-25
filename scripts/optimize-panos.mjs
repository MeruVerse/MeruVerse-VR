import { mkdir, readdir, stat } from 'node:fs/promises';
import { basename, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const SOURCE_DIR = fileURLToPath(new URL('../assets-src/panos/', import.meta.url));
const OUTPUT_DIR = fileURLToPath(new URL('../public/panos/', import.meta.url));
const SOURCE_EXTENSION = /^\.jpe?g$/i;
const BYTES_PER_KB = 1024;

const FULL = {
  width: 4096,
  height: 2048,
  quality: 85,
  maxBytes: 1.5 * BYTES_PER_KB * BYTES_PER_KB,
};
const PREVIEW = { width: 1024, height: 512, quality: 60, maxBytes: 80 * BYTES_PER_KB };
const EXPECTED_RATIO = 2;
const RATIO_TOLERANCE = 0.01;
const SWAPPED_ORIENTATIONS = [5, 6, 7, 8];

const formatSize = (bytes) =>
  bytes >= BYTES_PER_KB * BYTES_PER_KB
    ? `${(bytes / BYTES_PER_KB / BYTES_PER_KB).toFixed(2)} MB`
    : `${(bytes / BYTES_PER_KB).toFixed(1)} KB`;

const write = (line) => process.stdout.write(`${line}\n`);

async function readDimensions(file) {
  const { width, height, orientation } = await sharp(file).metadata();
  return SWAPPED_ORIENTATIONS.includes(orientation)
    ? { width: height, height: width }
    : { width, height };
}

async function exportVariant(file, target, outputPath) {
  await sharp(file)
    .rotate()
    .resize(target.width, target.height, { fit: 'fill' })
    .webp({ quality: target.quality })
    .toFile(outputPath);
  return (await stat(outputPath)).size;
}

function collectWarnings({ id, dimensions, fullBytes, previewBytes }) {
  const warnings = [];
  const ratio = dimensions.width / dimensions.height;
  if (Math.abs(ratio - EXPECTED_RATIO) > RATIO_TOLERANCE) {
    warnings.push(`${id}: rasio ${ratio.toFixed(3)}:1, bukan 2:1 (hasil akan terdistorsi)`);
  }
  if (dimensions.width < FULL.width) {
    warnings.push(`${id}: lebar sumber ${dimensions.width}px lebih kecil dari ${FULL.width}px`);
  }
  if (fullBytes > FULL.maxBytes) {
    warnings.push(`${id}: ${formatSize(fullBytes)} melebihi ${formatSize(FULL.maxBytes)}`);
  }
  if (previewBytes > PREVIEW.maxBytes) {
    warnings.push(`${id}-lq: ${formatSize(previewBytes)} melebihi ${formatSize(PREVIEW.maxBytes)}`);
  }
  return warnings;
}

async function processPanorama(fileName) {
  const id = basename(fileName, extname(fileName)).toLowerCase();
  const file = join(SOURCE_DIR, fileName);
  const dimensions = await readDimensions(file);
  const sourceBytes = (await stat(file)).size;
  const fullBytes = await exportVariant(file, FULL, join(OUTPUT_DIR, `${id}.webp`));
  const previewBytes = await exportVariant(file, PREVIEW, join(OUTPUT_DIR, `${id}-lq.webp`));
  const row = { id, dimensions, sourceBytes, fullBytes, previewBytes };
  return { row, warnings: collectWarnings(row) };
}

function printTable(rows) {
  const header = ['id', 'sumber', 'ukuran awal', 'full', 'lq'];
  const lines = rows.map((row) => [
    row.id,
    `${row.dimensions.width}x${row.dimensions.height}`,
    formatSize(row.sourceBytes),
    formatSize(row.fullBytes),
    formatSize(row.previewBytes),
  ]);
  const widths = header.map((title, column) =>
    Math.max(title.length, ...lines.map((line) => line[column].length)),
  );
  const render = (cells) => cells.map((cell, column) => cell.padEnd(widths[column])).join('  ');
  write(render(header));
  write(widths.map((width) => '-'.repeat(width)).join('  '));
  for (const line of lines) write(render(line));
}

function printTotals(rows) {
  const total = (key) => rows.reduce((sum, row) => sum + row[key], 0);
  write(
    `\nTotal: ${formatSize(total('sourceBytes'))} -> ${formatSize(total('fullBytes') + total('previewBytes'))}`,
  );
}

async function main() {
  const entries = await readdir(SOURCE_DIR);
  const files = entries.filter((name) => SOURCE_EXTENSION.test(extname(name))).sort();
  if (files.length === 0) {
    write(`Tidak ada file JPG di ${SOURCE_DIR}`);
    process.exitCode = 1;
    return;
  }
  await mkdir(OUTPUT_DIR, { recursive: true });
  const rows = [];
  const warnings = [];
  for (const fileName of files) {
    const result = await processPanorama(fileName);
    rows.push(result.row);
    warnings.push(...result.warnings);
  }
  printTable(rows);
  printTotals(rows);
  if (warnings.length > 0) {
    write('\nPeringatan:');
    for (const warning of warnings) write(`- ${warning}`);
  }
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error}\n`);
  process.exitCode = 1;
});
