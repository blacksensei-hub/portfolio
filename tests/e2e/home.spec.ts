import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('home page', () => {
  test('renders the page shell', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle(/Portfolio/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('declares its language and description in the shipped HTML', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('head meta[name="description"]')).toHaveAttribute('content', /.+/);
  });

  test('links a canonical URL on the site origin', async ({ page }) => {
    // covers: `site` from SITE_URL feeds canonical links. The build runs with no
    // SITE_URL set, so the placeholder origin from the spec is what ships.
    await page.goto('/');

    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      'https://example.com/',
    );
  });

  test('publishes a sitemap', async ({ request }) => {
    // covers: @astrojs/sitemap works from the start, ahead of the SEO feature.
    const response = await request.get('/sitemap-index.xml');

    expect(response.status()).toBe(200);
  });

  test('ships no hydrated island', async ({ page }) => {
    // covers: "ships zero JavaScript unless a piece needs it". Nothing on the
    // page holds state yet. The theme toggle feature will add the first island,
    // and this assertion is meant to be replaced then, not deleted quietly.
    await page.goto('/');

    await expect(page.locator('astro-island')).toHaveCount(0);
  });

  test('has no automatically detectable accessibility violations', async ({ page }) => {
    await page.goto('/');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });
});
