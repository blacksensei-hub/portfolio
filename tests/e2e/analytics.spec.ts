import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/*
 * Spec 0010, cookie free analytics, checked against the built site. The
 * beacon tag must match the env the build used, and no test ever reaches
 * Cloudflare: every request to it is counted and aborted.
 */

const token = process.env['PUBLIC_CF_BEACON_TOKEN']?.trim();
const BEACON_SRC = 'https://static.cloudflareinsights.com/beacon.min.js';
// Spec 0012: the owner dropped the analytics notice; the footer now signs the page.
const COPYRIGHT = `© ${new Date().getFullYear()} Jeffrey Nii Akwei Ankrah`;

let beaconRequests = 0;

test.beforeEach(async ({ page }) => {
  beaconRequests = 0;
  await page.route('**/*cloudflareinsights.com/**', (route) => {
    beaconRequests += 1;
    return route.abort();
  });
});

test('the beacon tag matches the build env', async ({ page }) => {
  // covers: AC-1, AC-2
  await page.goto('/');
  const beacons = page.locator('head script[data-cf-beacon]');

  if (token) {
    await expect(beacons).toHaveCount(1);
    await expect(beacons).toHaveAttribute('src', BEACON_SRC);
    await expect(beacons).toHaveAttribute('defer', '');
    await expect(beacons).toHaveAttribute('data-cf-beacon', JSON.stringify({ token }));
  } else {
    await expect(beacons).toHaveCount(0);
    await page.waitForLoadState('load');
    expect(beaconRequests).toBe(0);
  }
});

test('the beacon comes after the theme script', async ({ page }) => {
  // covers: AC-5
  test.skip(!token, 'Only production builds carry the beacon');
  await page.goto('/');
  const order = await page.evaluate(() =>
    [...document.head.querySelectorAll('script')].map((s) => s.hasAttribute('data-cf-beacon')),
  );
  expect(order[0]).toBe(false);
});

test('a blocked beacon leaves the page working', async ({ page }) => {
  // covers: AC-5
  const errors: Error[] = [];
  page.on('pageerror', (error) => errors.push(error));

  await page.goto('/');
  await page.waitForLoadState('load');
  const toggle = page.getByRole('button', { name: /^Theme:/ });
  await toggle.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

  expect(errors).toEqual([]);
});

test('no cookies and no consent prompt', async ({ page, context }) => {
  // covers: AC-3
  await page.goto('/');
  await page.waitForLoadState('load');

  expect(await context.cookies()).toEqual([]);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('alertdialog')).toHaveCount(0);
});

test('the footer notice sits after main', async ({ page }) => {
  // covers: AC-4
  await page.goto('/');
  const footer = page.locator('main ~ footer');

  await expect(footer).toHaveCount(1);
  await expect(footer.getByText(COPYRIGHT, { exact: true })).toBeVisible();
});

for (const theme of ['light', 'dark'] as const) {
  test(`the footer passes axe in ${theme}`, async ({ page }) => {
    // covers: AC-4
    await page.addInitScript((t) => localStorage.setItem('theme', t), theme);
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);

    const results = await new AxeBuilder({ page }).include('body > footer').analyze();
    expect(results.violations).toEqual([]);
  });
}
