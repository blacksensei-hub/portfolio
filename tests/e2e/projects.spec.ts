import { readFileSync } from 'node:fs';

import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { load } from 'js-yaml';

// Expected values come from the content file, so adding a project needs no test edit.
type Project = { title: string; demoUrl?: string; repoUrl?: string; order: number };

const projects = (load(readFileSync('src/content/projects.yaml', 'utf8')) as Project[]).toSorted(
  (a, b) => a.order - b.order,
);

test.describe('projects section', () => {
  test('renders one card per project, in order (AC-1, AC-2)', async ({ page }) => {
    await page.goto('/');

    const section = page.getByRole('region', { name: 'Projects' });
    const titles = section.getByRole('heading', { level: 3 });
    await expect(titles).toHaveText(projects.map((p) => p.title));
    await expect(section.getByRole('list', { name: 'Tech used' })).toHaveCount(projects.length);
  });

  test('links each project with a unique, titled name (AC-3)', async ({ page }) => {
    await page.goto('/');

    for (const { title, demoUrl, repoUrl } of projects) {
      // Chrome puts a space before the sr-only span ("Live demo , AttendX"); it
      // still reads as a pause, so the test allows it.
      const demo = page.getByRole('link', { name: new RegExp(`^Live demo\\s*, ${title}\\b`) });
      const repo = page.getByRole('link', { name: new RegExp(`^Source code\\s*, ${title}\\b`) });

      if (demoUrl) await expect(demo).toHaveAttribute('href', demoUrl);
      else await expect(demo).toHaveCount(0);

      if (repoUrl) await expect(repo).toHaveAttribute('href', repoUrl);
      else await expect(repo).toHaveCount(0);
    }
  });

  test('stacks on a phone without horizontal scroll (AC-5)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    const cards = page.getByRole('region', { name: 'Projects' }).getByRole('article');
    const [first, second] = [await cards.nth(0).boundingBox(), await cards.nth(1).boundingBox()];
    expect(second?.y).toBeGreaterThan((first?.y ?? 0) + (first?.height ?? 0) - 1);

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBe(0);
  });

  test('sits side by side on desktop (AC-5)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');

    const cards = page.getByRole('region', { name: 'Projects' }).getByRole('article');
    const [first, second] = [await cards.nth(0).boundingBox(), await cards.nth(1).boundingBox()];
    expect(second?.y).toBe(first?.y);
    expect(second?.x).toBeGreaterThan(first?.x ?? 0);
  });

  test('reaches every card link with Tab (AC-7)', async ({ page }) => {
    await page.goto('/');

    const expected = projects.flatMap(({ title, demoUrl, repoUrl }) => [
      ...(demoUrl ? [`Live demo, ${title}`] : []),
      ...(repoUrl ? [`Source code, ${title}`] : []),
    ]);
    const reached = new Set<string>();

    for (let i = 0; i < 40 && reached.size < expected.length; i++) {
      await page.keyboard.press('Tab');
      const name = await page.evaluate(() => {
        const el = document.activeElement;
        return el?.closest('#projects')
          ? (el.textContent ?? '').replace(/\s+/g, ' ').replace(' ,', ',').trim()
          : '';
      });
      const match = expected.find((e) => name.startsWith(e));
      if (match) {
        await expect(page.locator(':focus')).toHaveCSS('outline-style', 'solid');
        reached.add(match);
      }
    }

    expect([...reached].sort()).toEqual([...expected].sort());
  });

  for (const colorScheme of ['light', 'dark'] as const) {
    test(`has no detectable accessibility violations in ${colorScheme} (AC-7)`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme });
      await page.goto('/');

      const results = await new AxeBuilder({ page })
        .include('#projects')
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze();

      expect(results.violations).toEqual([]);
    });
  }
});
