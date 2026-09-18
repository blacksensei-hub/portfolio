import { readFileSync } from 'node:fs';

import { expect, test } from '@playwright/test';
import { load } from 'js-yaml';

// Expected values come from the content files, so editing the profile needs no test edit.
type Profile = { name: string; role: string; tagline: string; email: string };
type Link = { href: string; icon: string; order: number };

const { profile } = load(readFileSync('src/content/profile.yaml', 'utf8')) as {
  profile: Profile;
};
const links = load(readFileSync('src/content/links.yaml', 'utf8')) as Link[];

const title = `${profile.name} · ${profile.role}`;
const alt = `${profile.name}, ${profile.role}`;
const sameAs = links
  .filter((link) => ['github', 'linkedin', 'x'].includes(link.icon))
  .toSorted((a, b) => a.order - b.order)
  .map((link) => link.href);

test.describe('seo and social cards', () => {
  test('home page has the title, description, Open Graph, and X tags', async ({ page }) => {
    await page.goto('/');

    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    const origin = new URL(canonical ?? '').origin;
    const image = `${origin}/og.png`;

    await expect(page).toHaveTitle(title);
    const meta = (attr: string, key: string) => page.locator(`meta[${attr}="${key}"]`);
    const expected: [string, string, string][] = [
      ['name', 'description', profile.tagline],
      ['property', 'og:type', 'website'],
      ['property', 'og:title', title],
      ['property', 'og:description', profile.tagline],
      ['property', 'og:url', canonical ?? ''],
      ['property', 'og:image', image],
      ['property', 'og:image:width', '1200'],
      ['property', 'og:image:height', '630'],
      ['property', 'og:image:type', 'image/png'],
      ['property', 'og:image:alt', alt],
      ['property', 'og:site_name', profile.name],
      ['property', 'og:locale', 'en_US'],
      ['name', 'twitter:card', 'summary_large_image'],
      ['name', 'twitter:title', title],
      ['name', 'twitter:description', profile.tagline],
      ['name', 'twitter:image', image],
      ['name', 'twitter:image:alt', alt],
    ];
    for (const [attr, key, content] of expected) {
      await expect(meta(attr, key), key).toHaveAttribute('content', content);
    }
  });

  test('home page has one JSON-LD graph describing you and the site', async ({ page }) => {
    await page.goto('/');

    const scripts = page.locator('script[type="application/ld+json"]');
    await expect(scripts).toHaveCount(1);
    const jsonLd = JSON.parse((await scripts.textContent()) ?? '');
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    const url = `${new URL(canonical ?? '').origin}/`;

    expect(jsonLd['@graph']).toEqual([
      {
        '@type': 'Person',
        name: profile.name,
        jobTitle: profile.role,
        email: profile.email,
        url,
        ...(sameAs.length > 0 && { sameAs }),
      },
      { '@type': 'WebSite', url, name: profile.name },
    ]);
  });

  test('serves a 1200 by 630 PNG card', async ({ request }) => {
    const response = await request.get('/og.png');

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('image/png');
    // The PNG IHDR chunk holds width and height as big endian ints at bytes 16 and 20.
    const body = await response.body();
    expect(body.readUInt32BE(16)).toBe(1200);
    expect(body.readUInt32BE(20)).toBe(630);
  });

  test('robots.txt allows everything and points at the sitemap', async ({ page, request }) => {
    await page.goto('/');
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    const origin = new URL(canonical ?? '').origin;

    const text = await (await request.get('/robots.txt')).text();

    expect(text.split('\n').filter(Boolean)).toEqual([
      'User-agent: *',
      'Allow: /',
      `Sitemap: ${origin}/sitemap-index.xml`,
    ]);
  });

  test('styleguide stays noindex and has no social tags', async ({ page }) => {
    await page.goto('/styleguide/');

    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
    await expect(page.locator('meta[property^="og:"]')).toHaveCount(0);
    await expect(page.locator('meta[name^="twitter:"]')).toHaveCount(0);
    await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(0);
  });
});
