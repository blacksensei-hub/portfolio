import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';

/*
 * Spec 0024: "Pause animations" (WCAG 2.2.2 Pause, Stop, Hide). One button
 * beside the theme toggle holds every endless loop, remembers it, and stays
 * out of the way where nothing loops anyway.
 */

const html = (page: Page) => page.locator('html');
const pause = (page: Page) => page.getByRole('button', { name: 'Pause animations' });

/** Every infinite animation on the page, element or pseudo element, still running. */
const runningLoops = (page: Page) =>
  page.evaluate(() => {
    const running: string[] = [];
    for (const el of document.querySelectorAll('body *')) {
      for (const pseudo of [null, '::before', '::after']) {
        const cs = getComputedStyle(el, pseudo);
        if (
          cs.animationName !== 'none' &&
          cs.animationIterationCount === 'infinite' &&
          cs.animationPlayState.split(',').some((s) => s.trim() === 'running')
        )
          running.push(`${el.className} ${pseudo ?? ''} ${cs.animationName}`);
      }
    }
    return running;
  });

test('sits in the header beside the theme toggle, not pressed', async ({ page }) => {
  await page.goto('/');
  const button = pause(page);
  await expect(button).toBeVisible();
  await expect(button).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('header').getByRole('button', { name: /^Theme:/ })).toBeVisible();

  // Next in the Tab order after the theme toggle, and just before it on screen.
  await page.keyboard.press('Tab'); // the skip link
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: /^Theme:/ })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(button).toBeFocused();
  const [motion, theme] = await Promise.all([
    button.boundingBox(),
    page.getByRole('button', { name: /^Theme:/ }).boundingBox(),
  ]);
  expect(motion && theme && motion.x < theme.x).toBe(true);
});

test('pausing holds every loop, everywhere on the page', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/');
  expect((await runningLoops(page)).length).toBeGreaterThan(0);

  await pause(page).click();
  await expect(pause(page)).toHaveAttribute('aria-pressed', 'true');
  await expect(html(page)).toHaveAttribute('data-motion', 'paused');
  expect(await runningLoops(page)).toEqual([]);
  // Still held with everything in view, where the off-screen pause lets go.
  await page.locator('#contact').scrollIntoViewIfNeeded();
  expect(await runningLoops(page)).toEqual([]);

  await pause(page).click();
  await expect(pause(page)).toHaveAttribute('aria-pressed', 'false');
  await expect(html(page)).not.toHaveAttribute('data-motion');
  expect((await runningLoops(page)).length).toBeGreaterThan(0);
});

test('the typewriter holds a whole phrase while paused', async ({ page }) => {
  await page.goto('/');
  await pause(page).click();
  const typed = page.locator('[data-typewriter]');
  await typed.scrollIntoViewIfNeeded();
  const phrases: string[] = JSON.parse((await typed.getAttribute('data-typewriter')) ?? '[]');

  await page.waitForTimeout(1000);
  const held = await typed.textContent();
  expect(phrases).toContain(held);
  await page.waitForTimeout(2500);
  await expect(typed).toHaveText(held ?? '');
});

test('the pause is remembered, from the first frame of the next page', async ({ page }) => {
  await page.goto('/');
  await pause(page).click();
  expect(await page.evaluate(() => localStorage.getItem('motion'))).toBe('paused');

  await page.goto('/projects/attendx/', { waitUntil: 'domcontentloaded' });
  await expect(html(page)).toHaveAttribute('data-motion', 'paused');
  await expect(pause(page)).toHaveAttribute('aria-pressed', 'true');
  expect(await runningLoops(page)).toEqual([]);

  await pause(page).click();
  expect(await page.evaluate(() => localStorage.getItem('motion'))).toBe('running');
  await page.reload();
  await expect(html(page)).not.toHaveAttribute('data-motion');
});

test('pages without the site header float it beside the theme toggle', async ({ page }) => {
  await page.goto('/styleguide/');
  await expect(pause(page)).toBeVisible();
  await pause(page).click();
  await expect(html(page)).toHaveAttribute('data-motion', 'paused');
});

test('no accessibility violations, paused or not', async ({ page }) => {
  await page.goto('/');
  const scan = () => new AxeBuilder({ page }).include('header').analyze();
  expect((await scan()).violations).toEqual([]);
  await pause(page).click();
  expect((await scan()).violations).toEqual([]);
});

test.describe('under reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('stays hidden, since nothing loops', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-motion-toggle]')).toBeHidden();
  });
});

test('without JavaScript it never shows', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.locator('[data-motion-toggle]')).toBeHidden();
  await context.close();
});
