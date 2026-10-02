import { readdirSync, readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { load } from 'js-yaml';

/*
 * Spec 0021: screens that carry across pages, "On this page" for case
 * studies, copying the email address, and solid chips over translucent layers.
 */

const slug = readdirSync('src/content/case-studies')
  .find((file) => file.endsWith('.md'))
  ?.replace(/\.md$/, '');
const body = readFileSync(`src/content/case-studies/${slug}.md`, 'utf8').replace(
  /^---[\s\S]*?---/,
  '',
);
// Markdown renders straight apostrophes as curly ones.
const sectionTitles = [...body.matchAll(/^## (.+)$/gm)].map((m) =>
  (m[1] ?? '').trim().replace(/'/g, '’'),
);
const email = (load(readFileSync('src/content/links.yaml', 'utf8')) as { href: string }[])
  .find((link) => link.href.startsWith('mailto:'))
  ?.href.replace('mailto:', '');

test.describe('screens that carry across pages', () => {
  test('the card and its case study header share their transition names', async ({ page }) => {
    const names = () =>
      page
        .locator('[data-preview-part]')
        .evaluateAll((els) => els.map((el) => getComputedStyle(el).viewTransitionName));
    await page.goto('/');
    const home = await names();
    await page.goto(`/projects/${slug}/`);
    const study = await names();

    expect(study.length).toBeGreaterThan(0);
    for (const name of study) expect(home).toContain(name);
    expect(new Set(home).size).toBe(home.length);
  });

  test.describe('under reduced motion', () => {
    test.use({ reducedMotion: 'reduce' });

    test('the screens stay put; only the page fades', async ({ page }) => {
      await page.goto(`/projects/${slug}/`);
      const names = await page
        .locator('[data-preview-part]')
        .evaluateAll((els) => els.map((el) => getComputedStyle(el).viewTransitionName));
      expect(names.every((name) => name === 'none')).toBe(true);
    });
  });
});

test.describe('on this page', () => {
  test('lists every section of the write-up and lights up the one being read', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`/projects/${slug}/`);
    const toc = page.getByRole('navigation', { name: 'On this page' });
    await expect(toc.getByRole('link')).toHaveText(sectionTitles);

    const third = toc.getByRole('link').nth(2);
    await third.click();
    await expect(third).toHaveAttribute('aria-current', 'location');
    await expect(toc.locator('[aria-current="location"]')).toHaveCount(1);
  });

  test('folds away on a phone and closes once a section is chosen', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/projects/${slug}/`);
    const menu = page.locator('details[data-toc-menu]');
    await menu.locator('summary').click();
    await expect(menu).toHaveAttribute('open');

    await menu.getByRole('link').nth(1).click();
    await expect(menu).not.toHaveAttribute('open');
    await expect(page).toHaveURL(/#.+$/);
  });
});

test.describe('copying the email address', () => {
  test('copies it and says so', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/');
    const button = page.getByRole('button', { name: 'Copy email address' });
    await button.scrollIntoViewIfNeeded();
    await button.click();

    await expect(page.getByRole('button', { name: 'Email address copied' })).toBeVisible();
    await expect(page.locator('[data-copy-status]')).toHaveText('Email address copied.');
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(email);

    // It goes back to its resting state after a moment.
    await expect(page.getByRole('button', { name: 'Copy email address' })).toBeVisible({
      timeout: 4000,
    });
  });

  test('stays hidden without JavaScript, leaving the plain email link', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto('/');
    await expect(page.locator('button[data-copy]')).toBeHidden();
    await expect(page.locator(`a[href="mailto:${email}"]`).first()).toBeAttached();
    await context.close();
  });
});

test('the "Visit live site" chip is solid, not glass on a translucent layer', async ({ page }) => {
  await page.goto('/');
  const chip = page.locator('#projects').getByText('Visit live site ↗').first();
  const style = await chip.evaluate((el) => {
    const cs = getComputedStyle(el);
    return { filter: cs.backdropFilter, background: cs.backgroundColor };
  });
  expect(style.filter).toBe('none');
  // Opaque: no alpha channel below 1, in either rgb() or oklch() notation.
  expect(style.background).not.toMatch(/rgba\(.*, 0(\.\d+)?\)|\/ 0?\.\d+\)|transparent/);
});
