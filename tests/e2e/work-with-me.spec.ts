import { readFileSync } from 'node:fs';

import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';
import { load } from 'js-yaml';

// Expected values come from the content files, so editing a service needs no test edit.
type Service = { title: string; blurb: string; order: number };
type Profile = { profile: { availability?: { status: string; note: string } } };

const services = (load(readFileSync('src/content/services.yaml', 'utf8')) as Service[]).toSorted(
  (a, b) => a.order - b.order,
);
const { availability } = (load(readFileSync('src/content/profile.yaml', 'utf8')) as Profile)
  .profile;
const labels: Record<string, string> = {
  open: 'Available',
  limited: 'Limited availability',
  closed: 'Booked',
};

const region = (page: Page) => page.getByRole('region', { name: 'Work with me' });

// Distinct left edges among the cards sharing the first card's row = the column count.
async function columnsInFirstRow(page: Page): Promise<number> {
  const boxes = await Promise.all(
    (await region(page).getByRole('article').all()).map((c) => c.boundingBox()),
  );
  const top = boxes[0]?.y ?? 0;
  return new Set(boxes.filter((b) => Math.abs((b?.y ?? 0) - top) < 1).map((b) => b?.x)).size;
}

test.describe('work with me section', () => {
  test('renders one card per service, in order (AC-1)', async ({ page }) => {
    await page.goto('/');

    const section = region(page);
    await expect(section.getByRole('heading', { level: 3 })).toHaveText(
      services.map((s) => s.title),
    );
    for (const { blurb } of services) {
      await expect(section.getByText(blurb, { exact: true })).toBeVisible();
    }
  });

  test('shows the availability badge from the profile (AC-3)', async ({ page }) => {
    test.skip(availability === undefined, 'profile.yaml sets no availability');
    await page.goto('/');

    const section = region(page);
    await expect(section.locator('strong')).toHaveText(labels[availability?.status ?? ''] ?? '');
    await expect(section.getByText(availability?.note ?? '')).toBeVisible();
  });

  test('links "Get in touch" to the contact section (AC-4)', async ({ page }) => {
    await page.goto('/');

    const cta = region(page).getByRole('link', { name: 'Get in touch' });
    await expect(cta).toHaveAttribute('href', '#contact');
    await expect(page.locator('#contact')).toHaveCount(1);
  });

  test('sits after Skills and before Contact (AC-8)', async ({ page }) => {
    await page.goto('/');

    const ordered = await page.evaluate(() => {
      const ids = ['skills', 'work-with-me', 'contact'].map((id) => document.getElementById(id));
      const [a, b, c] = ids;
      if (!a || !b || !c) return false;
      const follows = (x: Element, y: Element) =>
        (x.compareDocumentPosition(y) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
      return follows(a, b) && follows(b, c);
    });
    expect(ordered).toBe(true);
  });

  test('stacks on a phone without horizontal scroll (AC-6)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    expect(await columnsInFirstRow(page)).toBe(1);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBe(0);
  });

  test('shows two columns on a tablet (AC-6)', async ({ page }) => {
    await page.setViewportSize({ width: 900, height: 800 });
    await page.goto('/');

    expect(await columnsInFirstRow(page)).toBe(2);
  });

  test('shows three columns on desktop (AC-6)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');

    expect(await columnsInFirstRow(page)).toBe(3);
  });

  for (const theme of ['light', 'dark'] as const) {
    test(`has no axe violations with ${theme} forced (AC-7)`, async ({ page }) => {
      await page.addInitScript((value) => localStorage.setItem('theme', value), theme);
      await page.goto('/');

      await expect(page.locator('html')).toHaveCSS('color-scheme', theme);
      const results = await new AxeBuilder({ page })
        .include('#work-with-me')
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze();
      expect(results.violations).toEqual([]);
    });
  }
});
