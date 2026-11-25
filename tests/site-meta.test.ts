import { describe, expect, it } from 'vitest';
import {
  buildSitemap,
  buildSocialTags,
  normalizeBase,
  normalizeSiteUrl,
  pageUrl,
} from '../vite-plugins/site-meta';

describe('normalizeSiteUrl', () => {
  it('tanpa nilai menghasilkan null agar tidak ada domain karangan', () => {
    expect(normalizeSiteUrl(undefined)).toBeNull();
    expect(normalizeSiteUrl('')).toBeNull();
    expect(normalizeSiteUrl('   ')).toBeNull();
  });

  it('menolak nilai yang bukan URL http atau https', () => {
    expect(normalizeSiteUrl('meruverse.example')).toBeNull();
    expect(normalizeSiteUrl('ftp://meruverse.example')).toBeNull();
  });

  it('membuang garis miring di akhir dan menjaga subpath', () => {
    expect(normalizeSiteUrl('https://meruverse.example/')).toBe('https://meruverse.example');
    expect(normalizeSiteUrl(' https://meruverse.example/galeri/ ')).toBe(
      'https://meruverse.example/galeri',
    );
  });
});

describe('buildSocialTags', () => {
  it('tanpa SITE_URL tidak membuat tag berisi alamat', () => {
    expect(buildSocialTags(null, '/')).toEqual([]);
  });

  it('dengan SITE_URL membuat canonical, og:url, dan gambar absolut', () => {
    const tags = buildSocialTags('https://meruverse.example', '/tour.html');
    const serialized = JSON.stringify(tags);
    expect(serialized).toContain('https://meruverse.example/tour.html');
    expect(serialized).toContain('https://meruverse.example/og-image.jpg');
    expect(tags.some((tag) => tag.attrs?.rel === 'canonical')).toBe(true);
  });
});

describe('pageUrl dan sitemap', () => {
  it('halaman utama berakhir dengan garis miring', () => {
    expect(pageUrl('https://meruverse.example', '/')).toBe('https://meruverse.example/');
  });

  it('sitemap memuat landing dan tur', () => {
    const sitemap = buildSitemap('https://meruverse.example');
    expect(sitemap).toContain('<loc>https://meruverse.example/</loc>');
    expect(sitemap).toContain('<loc>https://meruverse.example/tour.html</loc>');
  });
});

describe('normalizeBase', () => {
  it('tanpa nilai atau garis miring saja berarti akar domain', () => {
    expect(normalizeBase(undefined)).toBe('/');
    expect(normalizeBase('')).toBe('/');
    expect(normalizeBase('/')).toBe('/');
  });

  it('subfolder selalu diapit garis miring', () => {
    expect(normalizeBase('MeruVerse-VR')).toBe('/MeruVerse-VR/');
    expect(normalizeBase('/MeruVerse-VR')).toBe('/MeruVerse-VR/');
    expect(normalizeBase('/MeruVerse-VR/')).toBe('/MeruVerse-VR/');
  });
});
