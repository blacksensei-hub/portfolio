import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { beforeEach, describe, expect, it } from 'vitest';

import astroConfig from '../../astro.config';
import BaseLayout from './BaseLayout.astro';

/*
 * Renders the layout to HTML the way a page does, then asserts the document
 * shell every later feature builds on: the head tags, the language, and the
 * two slots. Nothing here asserts styling or content, which features 3 and 4
 * still own.
 */

let container: AstroContainer;

beforeEach(async () => {
  // The container has no project config of its own, and the layout builds its
  // canonical URL from `Astro.site`, so hand it the site the real build uses.
  container = await AstroContainer.create({
    astroConfig: { site: astroConfig.site ?? 'https://example.com' },
  });
});

async function render(
  props: {
    title: string;
    description?: string | undefined;
    noindex?: boolean;
    social?: { image: string; imageAlt: string; siteName: string; jsonLd: object };
  },
  slots: Record<string, string> = {},
): Promise<string> {
  return container.renderToString(BaseLayout, { props, slots });
}

describe('BaseLayout', () => {
  it('puts the title prop in the document title', async () => {
    const html = await render({ title: 'Portfolio' });

    expect(html).toContain('<title>Portfolio</title>');
  });

  it('renders the description prop as the description meta tag', async () => {
    const html = await render({ title: 'Portfolio', description: 'A personal portfolio.' });

    expect(html).toContain('<meta name="description" content="A personal portfolio.">');
  });

  it('renders no description meta tag when no description is passed', async () => {
    // Edge case: the layout guards the tag, so an absent description must not
    // ship an empty one that search engines would read.
    const html = await render({ title: 'Portfolio' });

    expect(html).not.toContain('name="description"');
  });

  it('renders default slot content inside the body', async () => {
    const html = await render({ title: 'Portfolio' }, { default: '<p>Hello</p>' });

    const main = html.slice(html.indexOf('<main'), html.indexOf('</main>'));
    expect(main).toContain('<p>Hello</p>');
  });

  it('renders head slot content inside the head', async () => {
    // Later features (SEO cards, the theme script) inject through this slot,
    // so it has to land before </head> or it is useless to them.
    const html = await render(
      { title: 'Portfolio' },
      { head: '<meta name="theme-color" content="#ffffff">' },
    );

    const head = html.slice(0, html.indexOf('</head>'));
    expect(head).toContain('<meta name="theme-color" content="#ffffff">');
  });

  it('declares the document language as English', async () => {
    // Accessibility: screen readers pick the voice from this attribute.
    const html = await render({ title: 'Portfolio' });

    expect(html).toContain('<html lang="en">');
  });

  it('sets the responsive viewport meta tag', async () => {
    const html = await render({ title: 'Portfolio' });

    expect(html).toContain('name="viewport"');
    expect(html).toContain('width=device-width');
  });

  it('renders a canonical link', async () => {
    // covers: "site read from SITE_URL" feeding canonical URLs. The origin
    // itself is asserted end to end, against the real built output.
    const html = await render({ title: 'Portfolio' });

    expect(html).toMatch(/<link rel="canonical" href="https?:\/\/[^"]+"/);
  });

  it('renders the skip link as the first element in the body', async () => {
    // Keyboard users: the skip link must be the first Tab stop.
    const html = await render({ title: 'Portfolio' });

    const body = html.slice(html.indexOf('<body'));
    expect(body.slice(body.indexOf('>') + 1).trimStart()).toMatch(/^<a href="#main"/);
  });

  it('wraps the page in exactly one focusable main landmark', async () => {
    const html = await render({ title: 'Portfolio' });

    expect(html.match(/<main\b/g)).toHaveLength(1);
    expect(html).toContain('<main id="main" tabindex="-1" class="max-sm:pt-16">');
  });

  it('emits the robots noindex meta only when noindex is set', async () => {
    expect(await render({ title: 'Styleguide', noindex: true })).toContain(
      '<meta name="robots" content="noindex">',
    );
    expect(await render({ title: 'Portfolio' })).not.toContain('name="robots"');
  });

  it('renders no Open Graph, X, or JSON-LD without the social prop', async () => {
    // covers: spec 0006 AC-9, the styleguide passes no social prop.
    const html = await render({ title: 'Styleguide', noindex: true });

    expect(html).not.toContain('og:');
    expect(html).not.toContain('twitter:');
    expect(html).not.toContain('application/ld+json');
  });

  it('renders the social tags and one JSON-LD script with the social prop', async () => {
    // covers: spec 0006 AC-2, AC-3, AC-5.
    const html = await render({
      title: 'Ada · Engineer',
      description: 'Builds engines.',
      social: {
        image: '/og.png',
        imageAlt: 'Ada, Engineer',
        siteName: 'Ada',
        jsonLd: { name: '</script><b>x' },
      },
    });

    expect(html).toContain('<meta property="og:title" content="Ada · Engineer">');
    expect(html).toMatch(/<meta property="og:image" content="https?:\/\/[^"]+\/og\.png">/);
    expect(html).toContain('<meta name="twitter:card" content="summary_large_image">');
    expect(html.match(/application\/ld\+json/g)).toHaveLength(1);
    // A `<` in content never closes the script early.
    expect(html).toContain(String.raw`"\u003c/script>\u003cb>x"`);
  });
});
