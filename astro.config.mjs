// @ts-check
import { defineConfig, fontProviders } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  // Phase 1: fully static site. Phase 2 adds the Cloudflare adapter and only interactive routes
  // use `export const prerender = false`.
  output: 'static',
  // Fonts are downloaded at build time and self-hosted (no requests to Google from visitors).
  fonts: [
    {
      provider: fontProviders.google(),
      name: 'Unbounded',
      cssVariable: '--font-display',
      weights: ['300 800'],
      styles: ['normal'],
      fallbacks: ['sans-serif'],
    },
    {
      provider: fontProviders.google(),
      name: 'Atkinson Hyperlegible Next',
      cssVariable: '--font-body',
      weights: ['300 800'],
      styles: ['normal', 'italic'],
      fallbacks: ['sans-serif'],
    },
  ],
  i18n: {
    locales: ['es', 'en'],
    defaultLocale: 'es',
    routing: {
      // Spanish at the root (/temas/...), English under /en/temas/...
      prefixDefaultLocale: false,
    },
  },
});
