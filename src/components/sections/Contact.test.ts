import type { CollectionEntry } from 'astro:content';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { beforeEach, describe, expect, it } from 'vitest';

import Contact from './Contact.astro';

/*
 * The real content has links and no resume, so the e2e suite can not reach the
 * empty, unsorted, or resume states. These feed fixture entries through the
 * Container API instead, leaving the content files alone.
 */

type Fixture = { label: string; href: string; icon: 'github' | 'email'; order: number };

// Same single cast as Skills.test.ts: the catchall's `never` index signature
// means no object literal satisfies the entry type.
function entry(fixture: Fixture): CollectionEntry<'links'> {
  return {
    id: fixture.label,
    collection: 'links',
    data: fixture,
  } as unknown as CollectionEntry<'links'>;
}

let container: AstroContainer;

beforeEach(async () => {
  container = await AstroContainer.create();
});

describe('Contact', () => {
  it('renders nothing at all with no links and no resume', async () => {
    const html = await container.renderToString(Contact, { props: { links: [] } });

    expect(html).not.toContain('<section');
    expect(html).not.toContain('id="contact"');
  });

  it('sorts links by order and names each by its label', async () => {
    const html = await container.renderToString(Contact, {
      props: {
        links: [
          entry({ label: 'Second', href: 'mailto:a@b.co', icon: 'email', order: 5 }),
          entry({ label: 'First', href: 'https://github.com/x', icon: 'github', order: 1 }),
        ],
      },
    });

    expect(html.indexOf('First')).toBeGreaterThan(-1);
    expect(html.indexOf('First')).toBeLessThan(html.indexOf('Second'));
    expect(html).toContain('aria-hidden="true"');
  });

  it('opens only http links in a new tab', async () => {
    const html = await container.renderToString(Contact, {
      props: {
        links: [
          entry({ label: 'GitHub', href: 'https://github.com/x', icon: 'github', order: 0 }),
          entry({ label: 'Email', href: 'mailto:a@b.co', icon: 'email', order: 1 }),
        ],
      },
    });

    expect(html.match(/target="_blank"/g)).toHaveLength(1);
    expect(html).toMatch(/href="https:\/\/github\.com\/x"[^>]*target="_blank"/);
  });

  it('shows no resume button without a resume, and a download link with one', async () => {
    const links = [entry({ label: 'Email', href: 'mailto:a@b.co', icon: 'email', order: 0 })];

    const without = await container.renderToString(Contact, { props: { links } });
    expect(without).not.toContain('Download resume');

    const withResume = await container.renderToString(Contact, {
      props: { links: [], resume: '/resume.pdf' },
    });
    expect(withResume).toContain('id="contact"');
    expect(withResume).toMatch(/href="\/resume\.pdf"[^>]*download/);
    expect(withResume).toContain('Download resume (PDF)');
  });
});
