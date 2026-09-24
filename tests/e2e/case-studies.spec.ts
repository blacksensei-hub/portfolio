import { readdirSync, readFileSync } from 'node:fs';
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { load } from 'js-yaml';

/*
 * Spec 0016: one case study page per Markdown file in src/content/case-studies,
 * reachable from its project card, accessible in both themes, and wired to the
 * project it references. Expected values come from the content files, so adding
 * a case study needs no test edit.
 */

type Project = { slug: string; title: string; demoUrl?: string; repoUrl?: string; order: number };
type Study = { slug: string; project: string; headline: string; gallery: { alt: string }[] };

const projects = load(readFileSync('src/content/projects.yaml', 'utf8')) as Project[];
const dir = 'src/content/case-studies';
const studies: Study[] = readdirSync(dir)
  .filter((file) => file.endsWith('.md'))
  .map((file) => {
    const text = readFileSync(`${dir}/${file}`, 'utf8');
    const front = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text)?.[1] ?? '';
    return { slug: file.replace(/\.md$/, ''), ...(load(front) as Omit<Study, 'slug'>) };
  });

const projectOf = (study: Study) => {
  const project = projects.find((p) => p.slug === study.project);
  if (!project) throw new Error(`${study.slug} names a missing project`);
  return project;
};

test('there is at least one case study to test', () => {
  expect(studies.length).toBeGreaterThan(0);
});

for (const study of studies) {
  const project = projectOf(study);
  const path = `/projects/${study.slug}/`;

  test.describe(`${project.title} case study`, () => {
    test('shows the project title, headline, and its links', async ({ page }) => {
      await page.goto(path);

      await expect(page.getByRole('heading', { level: 1, name: project.title })).toBeVisible();
      await expect(page.getByText(study.headline, { exact: true }).first()).toBeVisible();
      await expect(page).toHaveTitle(new RegExp(`^${project.title} case study`));

      const facts = page.getByRole('article');
      for (const [name, href] of [
        ['Live demo', project.demoUrl],
        ['Source code', project.repoUrl],
      ] as const) {
        const link = facts.getByRole('link', { name: `${name} (opens in a new tab)` }).first();
        if (!href) {
          await expect(link).toHaveCount(0);
          continue;
        }
        await expect(link).toHaveAttribute('href', href);
        await expect(link).toHaveAttribute('target', '_blank');
        await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      }
    });

    test('renders every gallery image with its alt text, loaded', async ({ page }) => {
      await page.goto(path);

      for (const { alt } of study.gallery) {
        const image = page.getByRole('img', { name: alt, exact: true });
        await image.scrollIntoViewIfNeeded();
        await expect(image).toBeVisible();
        await expect
          .poll(() => image.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth))
          .toBeGreaterThan(0);
      }
    });

    test('its nav points back at the home page sections', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto(path);

      const nav = page.getByRole('navigation', { name: 'Sections' });
      await expect(nav.getByRole('link', { name: 'Projects' })).toHaveAttribute(
        'href',
        '/#projects',
      );
      await expect(page.getByRole('link', { name: /All projects/ })).toHaveAttribute(
        'href',
        '/#projects',
      );
    });

    test('fits a phone without horizontal scroll', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(path);

      await expect(page.getByRole('heading', { level: 1 })).toBeInViewport();
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBe(0);
    });

    for (const colorScheme of ['light', 'dark'] as const) {
      test(`has no accessibility violations in ${colorScheme}`, async ({ page }) => {
        await page.emulateMedia({ colorScheme });
        await page.goto(path);

        const results = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
          .analyze();
        expect(results.violations).toEqual([]);
      });
    }

    test('is linked from its project card on the home page', async ({ page }) => {
      await page.goto('/');

      const link = page
        .getByRole('region', { name: 'Projects' })
        .getByRole('link', { name: new RegExp(`^Read case study\\s*, ${project.title}\\b`) });
      await expect(link).toHaveAttribute('href', path);
      await link.click();
      await expect(page).toHaveURL(new RegExp(`${path}$`));
      await expect(page.getByRole('heading', { level: 1, name: project.title })).toBeVisible();
    });
  });
}

test('each case study links to the next one, wrapping round', async ({ page }) => {
  test.skip(studies.length < 2, 'needs two case studies');
  const ordered = studies.toSorted((a, b) => projectOf(a).order - projectOf(b).order);

  for (const [n, study] of ordered.entries()) {
    const next = ordered[(n + 1) % ordered.length];
    if (!next) throw new Error('unreachable');
    await page.goto(`/projects/${study.slug}/`);
    await expect(
      page.getByRole('link', { name: new RegExp(projectOf(next).title) }).last(),
    ).toHaveAttribute('href', `/projects/${next.slug}/`);
  }
});

test('the sitemap lists every case study', async ({ request }) => {
  const sitemap = await (await request.get('/sitemap-0.xml')).text();
  for (const study of studies) expect(sitemap).toContain(`/projects/${study.slug}/`);
});
