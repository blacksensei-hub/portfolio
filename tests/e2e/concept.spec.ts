import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/*
 * Spec 0019: the Keynote redesign concept at /concept/. A proposal, so it is
 * checked for the basics only: every section, phone width, accessibility in
 * both themes, and staying out of search and the sitemap.
 */

const path = '/concept/';

test('shows every section of the concept', async ({ page }) => {
  await page.goto(path);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  for (const name of [
    'The short version.',
    'Work, shipped and in use.',
    'Inside the apps.',
    'Built with.',
    'Work with me.',
    "Let's build your next idea.",
  ]) {
    await expect(page.getByRole('heading', { level: 2, name })).toBeAttached();
  }
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
});

test('fits a phone without horizontal scroll', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(path);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBe(0);
});

for (const colorScheme of ['light', 'dark'] as const) {
  test(`has no accessibility violations in ${colorScheme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
    await page.goto(path);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });
}

test('stays out of the sitemap', async ({ request }) => {
  const sitemap = await (await request.get('/sitemap-0.xml')).text();
  expect(sitemap).not.toContain('/concept/');
});
