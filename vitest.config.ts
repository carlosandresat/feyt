import { defineConfig } from 'vitest/config';

// Tests cover the pure logic in src/lib (no `astro:*` virtual modules).
// Real content is validated during `astro build` (see src/lib/content.ts).
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
  },
});
