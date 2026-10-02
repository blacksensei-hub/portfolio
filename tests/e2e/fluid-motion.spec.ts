import { readdirSync } from 'node:fs';
import { expect, type Page, test } from '@playwright/test';

/*
 * Spec 0018: springs, gestures, materials, and type. The motion itself is
 * judged by eye; these check the behaviour it must not break, and that the
 * accessibility settings are honoured.
 */

const study = readdirSync('src/content/case-studies')
  .find((file) => file.endsWith('.md'))
  ?.replace(/\.md$/, '');
const caseStudy = `/projects/${study}/`;

test.describe('phone menu', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  const menu = (page: Page) => page.locator('details[data-menu]');
  const button = (page: Page) => page.locator('details[data-menu] > summary');
  const panel = (page: Page) => page.getByRole('navigation', { name: 'Menu' });

  test('opens, and closes when a section is chosen', async ({ page }) => {
    await page.goto('/');
    await button(page).click();
    await expect(panel(page)).toBeVisible();

    await panel(page).getByRole('link', { name: 'Projects' }).click();
    await expect(menu(page)).not.toHaveAttribute('open');
    await expect(page).toHaveURL(/#projects$/);
  });

  test('closes on Esc and gives focus back to its button', async ({ page }) => {
    await page.goto('/');
    await button(page).click();
    await expect(panel(page)).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(menu(page)).not.toHaveAttribute('open');
    await expect(button(page)).toBeFocused();
  });

  test('closes on a tap outside it', async ({ page }) => {
    await page.goto('/');
    await button(page).click();
    await expect(panel(page)).toBeVisible();

    await page.locator('h1').click({ position: { x: 8, y: 8 } });
    await expect(menu(page)).not.toHaveAttribute('open');
  });

  test('a second press while it closes opens it again', async ({ page }) => {
    await page.goto('/');
    await button(page).click();
    await expect(panel(page)).toBeVisible();

    await button(page).click();
    await button(page).click();
    await expect(menu(page)).toHaveAttribute('open');
    await expect(panel(page)).toBeVisible();
  });
});

test.describe('screenshot viewer gestures', () => {
  const viewer = (page: Page) => page.getByRole('dialog');
  const counter = (page: Page) => viewer(page).locator('[data-lightbox-counter]');

  async function openFirst(page: Page) {
    await page.goto(caseStudy);
    const first = page.locator('a[data-lightbox]').first();
    await first.scrollIntoViewIfNeeded();
    await first.click();
    await expect(viewer(page)).toBeVisible();
    // Let the shot finish growing out of its thumbnail.
    await page.waitForTimeout(700);
    const box = await viewer(page).locator('[data-lightbox-image]').boundingBox();
    if (!box) throw new Error('no image');
    return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  }

  test('a drag to the left pages to the next shot', async ({ page }) => {
    const centre = await openFirst(page);
    await expect(counter(page)).toHaveText(/^1 \//);

    await page.mouse.move(centre.x, centre.y);
    await page.mouse.down();
    await page.mouse.move(centre.x - 450, centre.y, { steps: 12 });
    await page.mouse.up();
    await expect(counter(page)).toHaveText(/^2 \//);
    await expect(viewer(page)).toBeVisible();
  });

  test('a short drag settles back on the same shot', async ({ page }) => {
    const centre = await openFirst(page);

    await page.mouse.move(centre.x, centre.y);
    await page.mouse.down();
    await page.mouse.move(centre.x - 40, centre.y, { steps: 20 });
    await page.waitForTimeout(150);
    await page.mouse.up();
    await page.waitForTimeout(600);
    await expect(counter(page)).toHaveText(/^1 \//);
    await expect(viewer(page)).toBeVisible();
  });

  test('a drag down closes it and focus returns to the shot', async ({ page }) => {
    const centre = await openFirst(page);

    await page.mouse.move(centre.x, centre.y);
    await page.mouse.down();
    await page.mouse.move(centre.x, centre.y + 320, { steps: 12 });
    await page.mouse.up();
    await expect(viewer(page)).toBeHidden();
    await expect(page.locator('a[data-lightbox]').first()).toBeFocused();
  });

  test('the full-size image replaces the thumbnail once it loads', async ({ page }) => {
    await openFirst(page);
    const first = page.locator('a[data-lightbox]').first();
    const href = await first.getAttribute('href');
    await expect
      .poll(() =>
        viewer(page)
          .locator('[data-lightbox-image]')
          .evaluate((img: HTMLImageElement) => img.src),
      )
      .toContain(href ?? 'missing');
  });

  test.describe('under reduced motion', () => {
    test.use({ reducedMotion: 'reduce' });

    test('still opens, pages, and closes', async ({ page }) => {
      await page.goto(caseStudy);
      await page.locator('a[data-lightbox]').first().click();
      await expect(viewer(page)).toBeVisible();
      await page.keyboard.press('ArrowRight');
      await expect(counter(page)).toHaveText(/^2 \//);
      await page.keyboard.press('Escape');
      await expect(viewer(page)).toBeHidden();
    });
  });
});

test.describe('materials', () => {
  test('the glass goes solid when less transparency is asked for', async ({ page }) => {
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-reduced-transparency', value: 'reduce' }],
    });
    await page.goto('/');
    const glass = page.locator('.glass-nav');
    await expect(glass).toHaveCSS('backdrop-filter', 'none');
  });

  test.describe('with more contrast', () => {
    test.use({ contrast: 'more' });

    test('the glass goes solid with a stronger edge', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('.glass-nav')).toHaveCSS('backdrop-filter', 'none');
    });
  });

  test('content softens under the nav once the page scrolls', async ({ page }) => {
    await page.goto('/');
    const edge = page.locator('.scroll-edge');
    await expect(edge).toHaveCount(1);
    await expect(edge).toHaveAttribute('aria-hidden', 'true');
  });
});

test('large type tightens with its size', async ({ page }) => {
  await page.goto('/');
  const ratio = (selector: string) =>
    page
      .locator(selector)
      .first()
      .evaluate((el) => {
        const cs = getComputedStyle(el);
        return Number.parseFloat(cs.letterSpacing) / Number.parseFloat(cs.fontSize);
      });

  expect(await ratio('h1')).toBeCloseTo(-0.03, 3);
  expect(await ratio('h2')).toBeLessThan(0);
});
