// Membuat narasi suara untuk deskripsi karya di content/karya.json lewat OpenRouter
// (ElevenLabs Eleven v4, suara Matilda). Hasilnya public/narasi/<id>.mp3 dan daftar karya
// bernarasi di src/tour/data/narrations.ts.
//
//   npm run narasi -- --estimasi           hitung karakter dan biaya, tanpa memanggil API
//   OPENROUTER_API_KEY=... npm run narasi  buat narasi yang belum ada
//   ... npm run narasi -- <id> [<id>...]   buat ulang narasi karya tertentu
//   ... npm run narasi -- --semua          buat ulang semua narasi
//
// Teks dibacakan persis seperti "description". Kalau deskripsi diubah, buat ulang narasinya.
// Kalau ffmpeg terpasang, berkas dikecilkan ke 64 kbps mono; kalau tidak, dipakai apa adanya.

import { spawn } from 'node:child_process';
import { access, mkdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const CONTENT_FILE = fileURLToPath(new URL('../content/karya.json', import.meta.url));
const OUTPUT_DIR = fileURLToPath(new URL('../public/narasi/', import.meta.url));
const DATA_FILE = fileURLToPath(new URL('../src/tour/data/narrations.ts', import.meta.url));

const ENDPOINT = 'https://openrouter.ai/api/v1/audio/speech';
const MODEL = 'elevenlabs/eleven-v4';
const VOICE = 'matilda';
const LANGUAGE = 'id';
const USD_PER_MILLION_CHARS = 80;
const CHARS_PER_MILLION = 1_000_000;
const BITRATE = '64k';
const BYTES_PER_MB = 1024 * 1024;

const write = (line) => process.stdout.write(`${line}\n`);
const exists = (path) =>
  access(path).then(
    () => true,
    () => false,
  );
const outputFile = (id) => join(OUTPUT_DIR, `${id}.mp3`);
const formatUsd = (chars) =>
  `US$${((chars * USD_PER_MILLION_CHARS) / CHARS_PER_MILLION).toFixed(2)}`;
const countChars = (artworks) => artworks.reduce((sum, item) => sum + item.description.length, 0);

function parseArgs(argv) {
  const flags = new Set(argv.filter((arg) => arg.startsWith('--')));
  const unknown = [...flags].filter((flag) => flag !== '--estimasi' && flag !== '--semua');
  if (unknown.length > 0) throw new Error(`Opsi tidak dikenal: ${unknown.join(', ')}`);
  return {
    estimateOnly: flags.has('--estimasi'),
    all: flags.has('--semua'),
    ids: argv.filter((arg) => !arg.startsWith('--')),
  };
}

async function selectPending(narratable, { all, ids }) {
  if (ids.length > 0) {
    const byId = new Map(narratable.map((artwork) => [artwork.id, artwork]));
    const missing = ids.filter((id) => !byId.has(id));
    if (missing.length > 0) throw new Error(`Karya tidak ditemukan: ${missing.join(', ')}`);
    return ids.map((id) => byId.get(id));
  }
  if (all) return narratable;
  const present = await Promise.all(narratable.map((artwork) => exists(outputFile(artwork.id))));
  return narratable.filter((_, index) => !present[index]);
}

async function synthesize(text, apiKey) {
  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: MODEL,
      input: text,
      voice: VOICE,
      response_format: 'mp3',
      provider: { options: { elevenlabs: { language_code: LANGUAGE } } },
    }),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  return Buffer.from(await response.arrayBuffer());
}

function runFfmpeg(args) {
  return new Promise((resolve, reject) => {
    const child = spawn('ffmpeg', args, { stdio: ['ignore', 'ignore', 'pipe'] });
    let stderr = '';
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg berhenti dengan kode ${code}: ${stderr.trim()}`));
    });
  });
}

// Mengembalikan false kalau ffmpeg tidak terpasang; berkas sumber lalu dipakai apa adanya.
async function compress(sourceFile, targetFile) {
  try {
    await runFfmpeg([
      '-y',
      '-loglevel',
      'error',
      '-i',
      sourceFile,
      '-ac',
      '1',
      '-b:a',
      BITRATE,
      targetFile,
    ]);
    await rm(sourceFile);
    return true;
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    await rename(sourceFile, targetFile);
    return false;
  }
}

function renderDataFile(ids) {
  const header =
    '// Dibuat oleh scripts/build-narasi.mjs dari berkas di public/narasi. Jangan diubah langsung.';
  const declaration = 'export const NARRATED_ARTWORK_IDS: readonly string[] = [';
  if (ids.length === 0) return `${header}\n${declaration}];\n`;
  return [header, declaration, ...ids.map((id) => `  '${id}',`), '];', ''].join('\n');
}

async function writeDataFile(narratable) {
  const present = await Promise.all(narratable.map((artwork) => exists(outputFile(artwork.id))));
  const ids = narratable.filter((_, index) => present[index]).map((artwork) => artwork.id);
  await writeFile(DATA_FILE, renderDataFile(ids));
  const sizes = await Promise.all(ids.map((id) => stat(outputFile(id))));
  const totalBytes = sizes.reduce((sum, file) => sum + file.size, 0);
  write(`\nKarya bernarasi: ${ids.length} dari ${narratable.length}`);
  write(`Ukuran public/narasi: ${(totalBytes / BYTES_PER_MB).toFixed(1)} MB`);
}

async function generate(pending, apiKey) {
  const failed = [];
  let compressed = true;
  for (const [index, artwork] of pending.entries()) {
    const label = `[${index + 1}/${pending.length}] ${artwork.id}`;
    try {
      const sourceFile = join(OUTPUT_DIR, `${artwork.id}.sumber.mp3`);
      await writeFile(sourceFile, await synthesize(artwork.description, apiKey));
      compressed = (await compress(sourceFile, outputFile(artwork.id))) && compressed;
      write(`${label}: selesai`);
    } catch (error) {
      failed.push(artwork.id);
      write(`${label}: GAGAL (${error.message})`);
    }
  }
  if (!compressed) write('\nffmpeg tidak ditemukan: berkas tidak dikecilkan.');
  return failed;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const data = JSON.parse(await readFile(CONTENT_FILE, 'utf8'));
  const narratable = data.artworks.filter((artwork) => artwork.description.trim() !== '');
  const pending = await selectPending(narratable, options);
  const chars = countChars(pending);
  write(`Narasi yang akan dibuat: ${pending.length} dari ${narratable.length} karya`);
  write(`Jumlah karakter: ${chars} (perkiraan biaya ${formatUsd(chars)})`);
  if (options.estimateOnly) return;

  if (pending.length > 0) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) throw new Error('OPENROUTER_API_KEY belum diisi');
    await mkdir(OUTPUT_DIR, { recursive: true });
    const failed = await generate(pending, apiKey);
    if (failed.length > 0) {
      write(`\nGagal (${failed.length}): ${failed.join(', ')}`);
      process.exitCode = 1;
    }
  }
  await writeDataFile(narratable);
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error}\n`);
  process.exitCode = 1;
});
