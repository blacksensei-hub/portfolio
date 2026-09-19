import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/*
 * Spec 0003, the design system, checked against the built site: accessibility
 * in both color schemes, the keyboard path, the theme tokens, the self hosted
 * font, reduced motion, external links, and keeping /styleguide unindexed.
 */

const pages = ['/', '/styleguide/'];

for (const colorScheme of ['light', 'dark'] as const) {
  test.describe(`${colorScheme} color scheme`, () => {
    test.use({ colorScheme });

    for (const path of pages) {
      test(`${path} has no axe violations`, async ({ page }) => {
        // covers: AC-6
        await page.goto(path);

        const results = await new AxeBuilder({ page }).analyze();
        expect(results.violations).toEqual([]);
      });
    }
  });
}

test.describe('keyboard', () => {
  test('the skip link is the first Tab stop and moves focus to main', async ({ page }) => {
    // covers: AC-5
    await page.goto('/styleguide/');

    await page.keyboard.press('Tab');
    const skip = page.getByRole('link', { name: 'Skip to content' });
    await expect(skip).toBeFocused();
    await expect(skip).toBeInViewport();

    await page.keyboard.press('Enter');
    await expect(page.locator('main#main')).toBeFocused();
  });

  test('every link shows a 2px focus outline when tabbed to', async ({ page }) => {
    // covers: AC-5, the :focus-visible ring on each Link and ButtonLink
    await page.goto('/styleguide/');
    const count = await page.locator('main a').count();
    expect(count).toBeGreaterThan(0);

    await page.keyboard.press('Tab'); // the skip link
    await page.keyboard.press('Tab'); // the theme toggle (spec 0008)
    for (let i = 0; i < count; i++) {
      await page.keyboard.press('Tab');
      const outline = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el) return null;
        const style = getComputedStyle(el);
        return {
          inMain: el.closest('main') !== null,
          width: style.outlineWidth,
          style: style.outlineStyle,
          offset: style.outlineOffset,
        };
      });
      expect(outline).toEqual({ inMain: true, width: '2px', style: 'solid', offset: '2px' });
    }
  });
});

test.describe('theme', () => {
  const bodyBackground = (page: import('@playwright/test').Page) =>
    page.evaluate(() => getComputedStyle(document.body).backgroundColor);

  test('dark OS setting applies the dark tokens without script', async ({ browser }) => {
    // covers: AC-3
    const light = await browser.newPage({ colorScheme: 'light' });
    await light.goto('/');
    const lightBg = await bodyBackground(light);

    const dark = await browser.newPage({ colorScheme: 'dark', javaScriptEnabled: false });
    await dark.goto('/');
    const darkBg = await bodyBackground(dark);

    expect(darkBg).not.toBe(lightBg);
    await light.close();
    await dark.close();
  });

  test('data-theme="light" forces the light tokens on a dark OS', async ({ browser }) => {
    // covers: AC-3, the hook feature 11 builds on
    const light = await browser.newPage({ colorScheme: 'light' });
    await light.goto('/');
    const lightBg = await bodyBackground(light);

    const dark = await browser.newPage({ colorScheme: 'dark' });
    await dark.goto('/');
    await dark.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));

    expect(await bodyBackground(dark)).toBe(lightBg);
    await light.close();
    await dark.close();
  });
});

test('the three faces load from the site origin and nothing loads from another host', async ({
  page,
}) => {
  // covers: AC-4
  const origin = new URL(test.info().project.use.baseURL ?? '').origin;
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  // The production only analytics beacon (spec 0010) is the one allowed
  // outside host; block it so tests never count a visit.
  const isBeacon = (url: string) => new URL(url).hostname.endsWith('cloudflareinsights.com');
  await page.route('**/*cloudflareinsights.com/**', (route) => route.abort());

  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);

  const fonts = requests.filter((url) => url.includes('.woff2'));
  // Spec 0011: Instrument Sans for body text, Bricolage Grotesque for headings, JetBrains Mono for labels.
  for (const face of ['instrument-sans', 'bricolage-grotesque', 'jetbrains-mono']) {
    expect(fonts.some((url) => url.includes(`${face}-latin-wght-normal`))).toBe(true);
  }
  expect(
    requests.filter((url) => !url.startsWith(origin) && !url.startsWith('data:') && !isBeacon(url)),
  ).toEqual([]);
});

test.describe('motion', () => {
  test('links transition over 150ms by default', async ({ page }) => {
    // covers: AC-8
    await page.goto('/styleguide/');
    const link = page.getByRole('link', { name: 'internal link' });

    await expect(link).toHaveCSS('transition-duration', '0.15s');
  });

  test.describe('reduced motion', () => {
    test.use({ reducedMotion: 'reduce' });

    test('removes every transition', async ({ page }) => {
      // covers: AC-8
      await page.goto('/styleguide/');

      await expect(page.getByRole('link', { name: 'internal link' })).toHaveCSS(
        'transition-duration',
        '0s',
      );
      await expect(page.getByRole('link', { name: 'Primary' })).toHaveCSS(
        'transition-duration',
        '0s',
      );
    });
  });
});

test('external links open in a new tab safely and say so', async ({ page }) => {
  // covers: AC-10
  await page.goto('/styleguide/');

  const external = page.getByRole('link', { name: 'external link (opens in a new tab)' });
  await expect(external).toHaveAttribute('target', '_blank');
  await expect(external).toHaveAttribute('rel', 'noopener noreferrer');

  const internal = page.getByRole('link', { name: 'internal link', exact: true });
  await expect(internal).not.toHaveAttribute('target', /.*/);
});

for (const path of pages) {
  test(`${path} keeps the spaces around links inside sentences`, async ({ page }) => {
    // Astro drops the line break space before a component that starts a new
    // line, so "an\n<Link>" renders as "anexternal link". Catch it on real pages.
    await page.goto(path);

    const glued = await page.locator('p a, li a').evaluateAll((links) =>
      links.flatMap((a) => {
        // Only text neighbors form a sentence; sibling elements are laid out by CSS.
        const text = (n: ChildNode | null) =>
          n?.nodeType === Node.TEXT_NODE ? (n.textContent ?? '') : '';
        const before = text(a.previousSibling).slice(-1);
        const after = text(a.nextSibling).charAt(0);
        return /[\p{L}\p{N}]/u.test(before) || /[\p{L}\p{N}]/u.test(after)
          ? [`${before}|${a.textContent?.trim()}|${after}`]
          : [];
      }),
    );
    expect(glued).toEqual([]);
  });
}

test('the styleguide is noindexed and left out of the sitemap', async ({ page, request }) => {
  // covers: AC-7
  await page.goto('/styleguide/');
  await expect(page.locator('head meta[name="robots"]')).toHaveAttribute('content', 'noindex');

  const sitemap = await (await request.get('/sitemap-0.xml')).text();
  expect(sitemap).toContain('<loc>');
  expect(sitemap).not.toContain('styleguide');
});
