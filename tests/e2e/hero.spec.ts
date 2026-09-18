import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

// Values from src/content/profile.yaml, which the hero and about render verbatim.
const name = 'Jeffrey Nii Akwei Ankrah';
const role = 'Full-Stack Developer';
const tagline = /I build modern, practical web and mobile applications/;

const viewports = [
  { label: 'phone', width: 375, height: 667 },
  { label: 'desktop', width: 1280, height: 800 },
];

test.describe('hero & about', () => {
  for (const { label, width, height } of viewports) {
    test(`shows who you are before scrolling on ${label}`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto('/');

      await expect(page.getByRole('heading', { level: 1, name })).toBeInViewport();
      await expect(page.getByText(role, { exact: true })).toBeInViewport();
      await expect(page.getByText(tagline)).toBeInViewport();
    });
  }

  test('links the email from the profile', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('link', { name: 'Email me' })).toHaveAttribute(
      'href',
      'mailto:jeffreyankrah2004@gmail.com',
    );
  });

  test('announces the bio as the About region', async ({ page }) => {
    await page.goto('/');

    const about = page.getByRole('region', { name: 'About' });
    await expect(about).toBeVisible();
    await expect(about).toContainText('Computer Science student');
  });

  for (const colorScheme of ['light', 'dark'] as const) {
    test(`has no detectable accessibility violations in ${colorScheme}`, async ({ page }) => {
      await page.emulateMedia({ colorScheme });
      await page.goto('/');

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze();

      expect(results.violations).toEqual([]);
    });
  }
});
