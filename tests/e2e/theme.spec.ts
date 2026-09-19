import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';

/*
 * Spec 0008, the three state theme toggle, checked against the built site:
 * first visit, the cycle, persistence, no flash, live OS changes, blocked
 * storage, no JavaScript, the keyboard path, and axe for each forced theme.
 */

const bodyBackground = (page: Page) =>
  page.evaluate(() => getComputedStyle(document.body).backgroundColor);
const html = (page: Page) => page.locator('html');
const toggle = (page: Page) => page.getByRole('button', { name: /^Theme:/ });
const stored = (page: Page) => page.evaluate(() => localStorage.getItem('theme'));

/** The body background for a page view with no stored choice. */
async function osBackground(page: Page, colorScheme: 'light' | 'dark') {
  const other = await page.context().browser()?.newPage({ colorScheme });
  if (!other) throw new Error('No browser');
  await other.goto('/');
  const bg = await bodyBackground(other);
  await other.close();
  return bg;
}

test.describe('light OS', () => {
  test.use({ colorScheme: 'light' });

  test('first visit follows the OS with no data-theme', async ({ page }) => {
    // covers: AC-1, AC-2
    await page.goto('/');

    await expect(html(page)).not.toHaveAttribute('data-theme', /.*/);
    await expect(html(page)).toHaveAttribute('data-theme-choice', 'system');
    await expect(toggle(page)).toHaveAccessibleName('Theme: system. Switch to light.');
  });

  test('each click cycles system, light, dark, system and saves it', async ({ page }) => {
    // covers: AC-3, AC-6
    await page.goto('/');
    const lightBg = await bodyBackground(page);

    await toggle(page).click();
    await expect(html(page)).toHaveAttribute('data-theme', 'light');
    await expect(toggle(page)).toHaveAccessibleName('Theme: light. Switch to dark.');
    expect(await stored(page)).toBe('light');

    await toggle(page).click();
    await expect(html(page)).toHaveAttribute('data-theme', 'dark');
    await expect(toggle(page)).toHaveAccessibleName('Theme: dark. Switch to system.');
    expect(await stored(page)).toBe('dark');
    expect(await bodyBackground(page)).not.toBe(lightBg);

    await toggle(page).press('Enter');
    await expect(html(page)).not.toHaveAttribute('data-theme', /.*/);
    await expect(toggle(page)).toHaveAccessibleName('Theme: system. Switch to light.');
    expect(await stored(page)).toBe('system');
    expect(await bodyBackground(page)).toBe(lightBg);
  });

  test('the choice survives a reload', async ({ page }) => {
    // covers: AC-4
    await page.goto('/');
    await toggle(page).click();
    await toggle(page).click();
    await page.reload();

    await expect(html(page)).toHaveAttribute('data-theme', 'dark');
    await expect(toggle(page)).toHaveAccessibleName('Theme: dark. Switch to system.');
    await expect(html(page)).toHaveCSS('color-scheme', 'dark');
  });

  test('a stored dark theme applies before first paint', async ({ page }) => {
    // covers: AC-2
    const darkBg = await osBackground(page, 'dark');
    await page.addInitScript(() => localStorage.setItem('theme', 'dark'));

    await page.goto('/', { waitUntil: 'domcontentloaded' });

    expect(await bodyBackground(page)).toBe(darkBg);
    const visible = await page
      .locator('[data-theme-toggle] svg')
      .evaluateAll((icons) =>
        icons
          .filter((icon) => getComputedStyle(icon).display !== 'none')
          .map((icon) => icon.getAttribute('data-icon')),
      );
    expect(visible).toEqual(['dark']);
  });

  test('system mode follows an OS change without a reload', async ({ page }) => {
    // covers: AC-5
    await page.goto('/');
    const before = await bodyBackground(page);

    await page.emulateMedia({ colorScheme: 'dark' });

    expect(await bodyBackground(page)).not.toBe(before);
  });

  test('blocked storage falls back to the OS and still cycles', async ({ page }) => {
    // covers: AC-7
    const errors: Error[] = [];
    page.on('pageerror', (error) => errors.push(error));
    await page.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', {
        get() {
          throw new DOMException('Blocked', 'SecurityError');
        },
      });
    });

    await page.goto('/');
    await expect(html(page)).toHaveAttribute('data-theme-choice', 'system');

    await toggle(page).click();
    await expect(html(page)).toHaveAttribute('data-theme', 'light');
    await toggle(page).click();
    await expect(html(page)).toHaveAttribute('data-theme', 'dark');
    expect(errors).toEqual([]);
  });

  test('keyboard reaches the toggle right after the skip link', async ({ page }) => {
    // covers: AC-6
    await page.goto('/');

    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(toggle(page)).toBeFocused();
    await expect(toggle(page)).toHaveCSS('outline-width', '2px');
    await expect(toggle(page)).toHaveAttribute('type', 'button');

    const box = await toggle(page).boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(44);
    expect(box?.height).toBeGreaterThanOrEqual(44);
    await expect(page.locator('[data-theme-toggle] svg[aria-hidden="true"]')).toHaveCount(3);
  });
});

test('without JavaScript the toggle is hidden and the OS scheme applies', async ({ browser }) => {
  // covers: AC-7
  const page = await browser.newPage({ colorScheme: 'dark', javaScriptEnabled: false });
  await page.goto('/');

  await expect(page.locator('[data-theme-toggle]')).toBeHidden();
  expect(await bodyBackground(page)).toBe(await osBackground(page, 'dark'));
  await page.close();
});

for (const path of ['/', '/styleguide/']) {
  test(`at phone width the toggle clears the ${path} heading with room to spare`, async ({
    page,
  }) => {
    // spec 0008 consequences: the fixed button must not overlap the first
    // heading. A 16px margin keeps zoom or font differences from closing it.
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto(path);

    const button = await toggle(page).boundingBox();
    if (!button) throw new Error('Missing box');
    // The top of the heading text, not its box: padding on the h1 is empty space.
    const textTop = await page.getByRole('heading', { level: 1 }).evaluate((h) => {
      const range = document.createRange();
      range.selectNodeContents(h);
      return range.getBoundingClientRect().top;
    });
    expect(button.y + button.height + 16).toBeLessThanOrEqual(textTop);
  });
}

for (const [forced, colorScheme] of [
  ['light', 'dark'],
  ['dark', 'light'],
] as const) {
  test.describe(`${forced} forced on a ${colorScheme} OS`, () => {
    test.use({ colorScheme });

    for (const path of ['/', '/styleguide/']) {
      test(`${path} has no axe violations`, async ({ page }) => {
        // covers: AC-8
        await page.addInitScript((value) => localStorage.setItem('theme', value), forced);
        await page.goto(path);

        await expect(page.locator('html')).toHaveCSS('color-scheme', forced);
        const results = await new AxeBuilder({ page }).analyze();
        expect(results.violations).toEqual([]);
      });
    }
  });
}
