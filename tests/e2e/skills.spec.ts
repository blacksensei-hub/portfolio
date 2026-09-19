import { readFileSync } from 'node:fs';

import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';
import { load } from 'js-yaml';

// Expected values come from the content file, so adding a skill needs no test edit.
type SkillGroup = { group: string; items: string[]; order: number };

const groups = (load(readFileSync('src/content/skills.yaml', 'utf8')) as SkillGroup[]).toSorted(
  (a, b) => a.order - b.order,
);

// Spec 0011: one ruled row per group. Is each group's heading beside its item list (true) or above it (false)?
async function headingsBesideItems(page: Page): Promise<boolean[]> {
  const section = page.getByRole('region', { name: 'Skills' });
  return Promise.all(
    groups.map(async ({ group }) => {
      const heading = await section
        .getByRole('heading', { level: 3, name: group, exact: true })
        .boundingBox();
      const list = await section.getByRole('list', { name: group, exact: true }).boundingBox();
      if (!heading || !list) throw new Error(`Missing ${group}`);
      return list.x >= heading.x + heading.width && list.y < heading.y + heading.height;
    }),
  );
}

test.describe('skills section', () => {
  test('renders one titled card per group, in order (AC-1, AC-2)', async ({ page }) => {
    await page.goto('/');

    const section = page.getByRole('region', { name: 'Skills' });
    await expect(section.getByRole('heading', { level: 3 })).toHaveText(groups.map((g) => g.group));

    for (const { group, items } of groups) {
      const list = section.getByRole('list', { name: group, exact: true });
      await expect(list.getByRole('listitem')).toHaveText(items);
    }
  });

  test('comes after the projects section (AC-6)', async ({ page }) => {
    await page.goto('/');

    const follows = await page.evaluate(() => {
      const projects = document.getElementById('projects');
      const skills = document.getElementById('skills');
      return (
        projects !== null &&
        skills !== null &&
        (projects.compareDocumentPosition(skills) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0
      );
    });
    expect(follows).toBe(true);
  });

  test('stacks on a phone without horizontal scroll (AC-3)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    expect(await headingsBesideItems(page)).toEqual(groups.map(() => false));
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBe(0);
  });

  for (const [label, width] of [
    ['tablet', 900],
    ['desktop', 1280],
  ] as const) {
    test(`puts each group's name beside its items on ${label}, one row per group (spec 0011)`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto('/');

      expect(await headingsBesideItems(page)).toEqual(groups.map(() => true));
    });
  }

  for (const colorScheme of ['light', 'dark'] as const) {
    test(`has no detectable accessibility violations in ${colorScheme} (AC-5)`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme });
      await page.goto('/');

      const results = await new AxeBuilder({ page })
        .include('#skills')
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze();

      expect(results.violations).toEqual([]);
    });
  }
});
