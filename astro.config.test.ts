import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

/*
 * Guards the architecture spec 0001 recorded in `astro.config.ts`.
 */

type AstroConfigShape = {
  site?: string | undefined;
  output?: string | undefined;
  adapter?: unknown;
  integrations?: unknown[] | undefined;
};

async function loadConfig(env: Record<string, string | undefined> = {}): Promise<AstroConfigShape> {
  // `loadEnv` runs when the module is first evaluated, so each case needs a
  // fresh module registry to see a different environment.
  vi.resetModules();
  for (const [key, value] of Object.entries(env)) {
    vi.stubEnv(key, value as string);
  }
  const mod = (await import('./astro.config')) as { default: AstroConfigShape };
  return mod.default;
}

// The first import pulls in the Astro, React, sitemap and Tailwind plugins, and
// transforming them cold takes longer than the default per test timeout. Paying
// that cost once up front keeps every case below fast and steady.
beforeAll(async () => {
  await loadConfig();
}, 60_000);

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('astro.config.ts', () => {
  it('builds a fully static site', async () => {
    // covers: "No server adapter and no on demand rendered routes"
    const config = await loadConfig();

    expect(config.output).toBe('static');
  });

  it('declares no server adapter', async () => {
    // covers: "No server adapter"; an adapter here would turn the site into a
    // deployed server and break the free static hosting the spec depends on.
    const config = await loadConfig();

    expect(config.adapter).toBeUndefined();
  });

  it('falls back to the placeholder origin when SITE_URL is unset', async () => {
    // covers: "site read from SITE_URL, default https://example.com"
    const config = await loadConfig({ SITE_URL: '' });

    expect(config.site).toBe('https://example.com');
  });

  it('uses SITE_URL as the site origin when it is set', async () => {
    // covers: the deploy feature sets the real origin through this variable.
    const config = await loadConfig({ SITE_URL: 'https://jeffrey.example.dev' });

    expect(config.site).toBe('https://jeffrey.example.dev');
  });

  it('registers the React and sitemap integrations', async () => {
    // covers: React islands for stateful pieces, @astrojs/sitemap for the SEO base.
    const config = await loadConfig();

    const names = (config.integrations ?? [])
      .flat()
      .map((integration) => (integration as { name?: string }).name);

    expect(names).toContain('@astrojs/react');
    expect(names).toContain('@astrojs/sitemap');
  });
});
