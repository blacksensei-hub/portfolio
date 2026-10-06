import { expect, type Page, test } from '@playwright/test';

/*
 * Spec 0022: AttendX's "How a scan is checked". Scroll position picks the
 * step, in both directions; without motion, or on a screen too short for the
 * stage (spec 0024), it is a plain list.
 */

const path = '/projects/attendx/';

async function scrollTrackTo(page: Page, progress: number) {
  await page.evaluate((p) => {
    const track = document.querySelector<HTMLElement>('[data-scan-track]');
    if (!track) throw new Error('no track');
    const top = track.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({
      top: top + p * (track.offsetHeight - window.innerHeight),
      behavior: 'instant',
    });
  }, progress);
}

const current = (page: Page) => page.locator('[data-scan-step][aria-current="step"] h3');

test('appears on the AttendX case study only', async ({ page }) => {
  await page.goto(path);
  await expect(
    page.getByRole('heading', { level: 2, name: 'How a scan is checked' }),
  ).toBeAttached();
  await page.goto('/projects/urbanpulse/');
  await expect(page.locator('[data-scan-story]')).toHaveCount(0);
});

test('scrolling steps through the scan, forward and back', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(path);
  await expect(page.locator('[data-scan-story]')).toHaveAttribute('data-enhanced', '');

  await scrollTrackTo(page, 0.05);
  await expect(current(page)).toHaveText('The code goes up');
  await scrollTrackTo(page, 0.5);
  await expect(current(page)).toHaveText('Four checks');
  await expect(page.locator('[data-scan-stage]')).toHaveAttribute('data-checks', /^[1-4]$/);
  await scrollTrackTo(page, 0.7);
  await expect(current(page)).toHaveText('On the register');
  await scrollTrackTo(page, 0.95);
  await expect(current(page)).toHaveText('Or it’s refused');

  // Back up: the same position gives the same step.
  await scrollTrackTo(page, 0.3);
  await expect(current(page)).toHaveText('A phone scans it');
  await expect(page.locator('[data-scan-stage]')).toHaveAttribute('data-checks', '0');
});

test('a phone on its side reads the list, and turning it back pins the stage', async ({ page }) => {
  // Spec 0024: 390px tall is too short for the stage, so nothing pins there.
  await page.setViewportSize({ width: 844, height: 390 });
  await page.goto(path);
  const story = page.locator('[data-scan-story]');
  const stage = story.locator('[data-scan-stage]');
  await expect(story).not.toHaveAttribute('data-enhanced');
  await expect(stage).toHaveCSS('position', 'static');
  await expect(stage).not.toHaveAttribute('data-step');
  for (const step of await story.locator('[data-scan-step]').all()) {
    await step.scrollIntoViewIfNeeded();
    await expect(step).toBeInViewport({ ratio: 0.95 });
    await expect(step).toHaveCSS('opacity', '1');
  }

  // Upright: the stage pins and follows the scroll.
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(story).toHaveAttribute('data-enhanced', '');
  await scrollTrackTo(page, 0.5);
  await expect(current(page)).toHaveText('Four checks');

  // On its side again, mid story: back to the list, nothing marked current.
  await page.setViewportSize({ width: 844, height: 390 });
  await expect(story).not.toHaveAttribute('data-enhanced');
  await expect(stage).not.toHaveAttribute('data-step');
  await expect(story.locator('[aria-current]')).toHaveCount(0);
});

test.describe('under reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('reads as a plain list of every step, nothing pinned', async ({ page }) => {
    await page.goto(path);
    const story = page.locator('[data-scan-story]');
    await expect(story).not.toHaveAttribute('data-enhanced');
    const steps = story.locator('[data-scan-step]');
    await expect(steps).toHaveCount(5);
    for (const step of await steps.all()) await expect(step).toBeVisible();
    await expect(story.locator('[data-scan-stage]')).toHaveCSS('position', 'static');
  });
});
