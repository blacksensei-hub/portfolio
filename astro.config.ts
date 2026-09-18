import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';

// SITE_URL is the public origin, used for canonical links and the sitemap.
// It stays a placeholder until the deploy feature sets the real URL.
const { SITE_URL } = loadEnv(process.env['NODE_ENV'] ?? '', process.cwd(), '');

// https://astro.build/config
export default defineConfig({
  site: SITE_URL || 'https://example.com',
  output: 'static',
  integrations: [react(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
