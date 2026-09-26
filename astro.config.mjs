// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  // Phase 1: fully static site. Phase 2 adds the Cloudflare adapter and only interactive routes
  // use `export const prerender = false`.
  output: 'static',
  i18n: {
    locales: ['es', 'en'],
    defaultLocale: 'es',
    routing: {
      // Spanish at the root (/temas/...), English under /en/temas/...
      prefixDefaultLocale: false,
    },
  },
});
