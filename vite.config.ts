import tailwindcss from '@tailwindcss/vite';
import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';
import { normalizeBase, normalizeSiteUrl, preloadAframe, siteMeta } from './vite-plugins/site-meta';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const siteUrl = normalizeSiteUrl(env.SITE_URL);
  const base = normalizeBase(env.BASE_PATH);
  return {
    base,
    plugins: [tailwindcss(), siteMeta(siteUrl), preloadAframe(base)],
    build: {
      rollupOptions: {
        input: {
          index: 'index.html',
          tour: 'tour.html',
          notFound: '404.html',
        },
      },
    },
    test: {
      include: ['tests/**/*.test.ts'],
      passWithNoTests: true,
    },
  };
});
