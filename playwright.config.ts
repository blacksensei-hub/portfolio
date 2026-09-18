import { defineConfig, devices } from '@playwright/test';

// Deliberately not Astro's default 4321. End to end tests get their own port so
// a dev server left running can never be picked up in place of the built site
// (the dev toolbar alone is enough to break the accessibility scan).
const PORT = 4322;
const baseURL = `http://localhost:${PORT}`;

// Tests run against the built site, not the dev server, so what they check is
// what actually ships.
export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env['CI']),
  retries: process.env['CI'] ? 2 : 0,
  reporter: 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    // Vite's preview server, not `astro preview`: Astro 7 daemonizes its
    // preview server, so the foreground command exits and Playwright spends
    // minutes on teardown waiting for a process it no longer owns. This serves
    // the same `dist/` output in the foreground, so runs start and stop cleanly.
    command: `pnpm build && pnpm exec vite preview --outDir dist --port ${PORT} --strictPort`,
    url: baseURL,
    // Always build and serve fresh, so a run never silently tests stale output.
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
