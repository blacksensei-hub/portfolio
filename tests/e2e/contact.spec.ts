import { readFileSync } from 'node:fs';

import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { load } from 'js-yaml';

// Expected values come from the content files, so adding a link needs no test edit.
type ContactLink = { label: string; href: string; order: number };

const links = (load(readFileSync('src/content/links.yaml', 'utf8')) as ContactLink[]).toSorted(
  (a, b) => a.order - b.order,
);
const profile = (
  load(readFileSync('src/content/profile.yaml', 'utf8')) as {
    profile: { resume?: string };
  }
).profile;

test.describe('contact section', () => {
  test('lists every link in order, each named by its label and pointing at its href', async ({
    page,
  }) => {
    await page.goto('/');

    const items = page.getByRole('region', { name: 'Contact' }).getByRole('listitem');
    await expect(items).toHaveCount(links.length);

    for (const [n, { label, href }] of links.entries()) {
      const link = items.nth(n).getByRole('link');
      await expect(link).toHaveAccessibleName(new RegExp(`^${label}`));
      await expect(link).toHaveAttribute('href', href);
      if (/^https?:\/\//.test(href)) {
        await expect(link).toHaveAttribute('target', '_blank');
        await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      } else {
        await expect(link).not.toHaveAttribute('target', /.*/);
      }
    }
  });

  test('comes after the skills section', async ({ page }) => {
    await page.goto('/');

    const follows = await page.evaluate(() => {
      const skills = document.getElementById('skills');
      const contact = document.getElementById('contact');
      return (
        skills !== null &&
        contact !== null &&
        (skills.compareDocumentPosition(contact) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0
      );
    });
    expect(follows).toBe(true);
  });

  test('offers the resume download only when the profile names one', async ({ page, request }) => {
    await page.goto('/');

    const button = page.getByRole('link', { name: 'Download resume (PDF)' });
    if (profile.resume === undefined) {
      await expect(button).toHaveCount(0);
      return;
    }
    await expect(button).toHaveAttribute('href', profile.resume);
    await expect(button).toHaveAttribute('download', /.*/);
    expect((await request.get(profile.resume)).ok()).toBe(true);
  });

  test('the typewriter goes through its phrases in order from the one shown', async ({ page }) => {
    await page.goto('/');
    const typed = page.locator('[data-typewriter]');
    await typed.scrollIntoViewIfNeeded();
    const phrases: string[] = JSON.parse((await typed.getAttribute('data-typewriter')) ?? '[]');
    const first = ((await typed.textContent()) ?? '').trim();
    expect(phrases).toContain(first);

    // Each finished phrase holds for 1.8s, so polling every 50ms sees every one.
    const next = await typed.evaluate(
      (el, { phrases, first }) =>
        new Promise<string>((resolve) => {
          const poll = setInterval(() => {
            const text = (el.textContent ?? '').trim();
            if (text !== first && phrases.includes(text)) {
              clearInterval(poll);
              resolve(text);
            }
          }, 50);
        }),
      { phrases, first },
    );
    expect(next).toBe(phrases[(phrases.indexOf(first) + 1) % phrases.length]);
  });

  for (const colorScheme of ['light', 'dark'] as const) {
    test(`has no detectable accessibility violations in ${colorScheme}`, async ({ page }) => {
      await page.emulateMedia({ colorScheme });
      await page.goto('/');

      const results = await new AxeBuilder({ page })
        .include('#contact')
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze();

      expect(results.violations).toEqual([]);
    });
  }
});
