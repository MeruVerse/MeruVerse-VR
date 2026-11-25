import type { HtmlTagDescriptor, Plugin } from 'vite';

const OG_IMAGE_PATH = '/og-image.jpg';
const PAGES: Readonly<Record<string, string>> = {
  'index.html': '/',
  'tour.html': '/tour.html',
};

export function normalizeSiteUrl(raw: string | undefined): string | null {
  const value = raw?.trim();
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    return `${url.origin}${url.pathname.replace(/\/+$/, '')}`;
  } catch {
    return null;
  }
}

export function normalizeBase(raw: string | undefined): string {
  const value = raw?.trim();
  if (!value || value === '/') return '/';
  const segments = value.split('/').filter(Boolean);
  return segments.length === 0 ? '/' : `/${segments.join('/')}/`;
}

export function pageUrl(siteUrl: string, path: string): string {
  return path === '/' ? `${siteUrl}/` : `${siteUrl}${path}`;
}

export function buildSocialTags(siteUrl: string | null, path: string): HtmlTagDescriptor[] {
  if (!siteUrl) return [];
  const url = pageUrl(siteUrl, path);
  const image = `${siteUrl}${OG_IMAGE_PATH}`;
  return [
    { tag: 'link', attrs: { rel: 'canonical', href: url }, injectTo: 'head' },
    { tag: 'meta', attrs: { property: 'og:url', content: url }, injectTo: 'head' },
    { tag: 'meta', attrs: { property: 'og:image', content: image }, injectTo: 'head' },
    { tag: 'meta', attrs: { name: 'twitter:image', content: image }, injectTo: 'head' },
  ];
}

export function buildSitemap(siteUrl: string): string {
  const entries = Object.values(PAGES)
    .map((path) => `  <url><loc>${pageUrl(siteUrl, path)}</loc></url>`)
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`;
}

export function preloadAframe(base: string): Plugin {
  return {
    name: 'meruverse-preload-aframe',
    transformIndexHtml: {
      order: 'post',
      handler(_html, context) {
        const isTour = context.filename.endsWith('tour.html');
        const chunk = Object.keys(context.bundle ?? {}).find((name) =>
          /aframe[^/]*\.js$/.test(name),
        );
        if (!isTour || !chunk) return [];
        return [
          {
            tag: 'link',
            attrs: { rel: 'modulepreload', href: `${base}${chunk}` },
            injectTo: 'head',
          },
        ];
      },
    },
  };
}

export function siteMeta(siteUrl: string | null): Plugin {
  return {
    name: 'meruverse-site-meta',
    transformIndexHtml(_html, context) {
      const file = context.filename.split(/[/]/).pop() ?? '';
      const path = PAGES[file];
      return path ? buildSocialTags(siteUrl, path) : [];
    },
    generateBundle() {
      if (!siteUrl) return;
      this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: buildSitemap(siteUrl) });
    },
  };
}
