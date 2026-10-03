import { expect, test } from '@playwright/test';

/*
 * Spec 0022: perpetual animations rest while off screen. At the top of the
 * home page the Contact section's loops are paused; scrolled to, they run.
 */

const playState = (el: Element) => getComputedStyle(el).animationPlayState;

test('loops below the fold are paused, and resume in view', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/');
  const loop = page.locator('#contact .animate-aurora').first();

  await expect(loop).toHaveAttribute('data-offscreen', '');
  expect(await loop.evaluate(playState)).toBe('paused');

  await loop.scrollIntoViewIfNeeded();
  await expect(loop).not.toHaveAttribute('data-offscreen');
  expect(await loop.evaluate(playState)).toBe('running');
});

test('no perpetual animation runs off screen at the top of the page', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/');
  await page.waitForTimeout(500);
  const offscreenRunning = await page.evaluate(() => {
    const running: string[] = [];
    for (const el of document.querySelectorAll('body *')) {
      const box = el.getBoundingClientRect();
      const offscreen = box.bottom < -120 || box.top > window.innerHeight + 120;
      if (!offscreen || getComputedStyle(el).position === 'fixed') continue;
      for (const pseudo of [null, '::before', '::after']) {
        const cs = getComputedStyle(el, pseudo);
        if (
          cs.animationIterationCount === 'infinite' &&
          cs.animationPlayState === 'running' &&
          cs.animationName !== 'none'
        )
          running.push(`${el.className} ${pseudo ?? ''} ${cs.animationName}`);
      }
    }
    return running;
  });
  expect(offscreenRunning).toEqual([]);
});
