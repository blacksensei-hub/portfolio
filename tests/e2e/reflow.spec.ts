import { expect, test } from '@playwright/test';

/*
 * Spec 0024: reflow (WCAG 1.4.10). At 320 CSS pixels wide, the width of a
 * 1280 pixel window zoomed to 400 percent, nothing scrolls sideways, and long
 * addresses wrap instead of being cut off.
 */

for (const path of ['/', '/projects/attendx/', '/projects/urbanpulse/', '/styleguide/']) {
  test(`${path} fits 320px without horizontal scroll`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto(path);

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBe(0);
  });
}

for (const width of [320, 375]) {
  test(`at ${width}px every contact address shows in full`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/');

    const clipped = await page.locator('#contact li a, #about dd').evaluateAll((els) =>
      els.flatMap((root) =>
        [root, ...root.querySelectorAll('*')]
          .filter((el) => {
            // Screen reader only text is clipped on purpose.
            if (el.closest('.sr-only')) return false;
            const cs = getComputedStyle(el);
            return cs.textOverflow === 'ellipsis' || el.scrollWidth > el.clientWidth + 1;
          })
          .map((el) => el.textContent?.trim()),
      ),
    );
    expect(clipped).toEqual([]);
  });
}
