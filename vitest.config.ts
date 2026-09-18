/// <reference types="vitest/config" />
import { getViteConfig } from 'astro/config';

// Unit tests live as `*.test.ts` next to the code they cover: under `src/`, plus
// the repo root for the config files that sit there.
// End to end tests run under Playwright instead, so they are excluded here.
export default getViteConfig({
  test: {
    include: ['src/**/*.test.ts', '*.test.ts'],
  },
});
