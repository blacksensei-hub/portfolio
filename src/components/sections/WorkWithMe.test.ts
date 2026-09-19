import type { CollectionEntry } from 'astro:content';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { beforeEach, describe, expect, it } from 'vitest';

import WorkWithMe from './WorkWithMe.astro';

/*
 * The real content is never empty, already in order, and in one availability
 * state, so the e2e suite can not reach the other states. These feed fixtures
 * through the Container API instead (spec 0009, AC-1, AC-3 to AC-5).
 */

type Fixture = { title: string; blurb: string; order: number };

// Same cast as Skills.test.ts: the catchall's `never` index signature defeats literals.
function entry(fixture: Fixture): CollectionEntry<'services'> {
  return {
    id: fixture.title,
    collection: 'services',
    data: fixture,
  } as unknown as CollectionEntry<'services'>;
}

const services = [
  entry({ title: 'Second', blurb: 'Two', order: 5 }),
  entry({ title: 'First', blurb: 'One', order: 1 }),
];

let container: AstroContainer;

beforeEach(async () => {
  container = await AstroContainer.create();
});

describe('WorkWithMe', () => {
  it('renders nothing at all for an empty collection (AC-5)', async () => {
    const html = await container.renderToString(WorkWithMe, {
      props: { services: [], availability: { status: 'open', note: 'Taking work.' } },
    });

    expect(html).not.toContain('<section');
    expect(html).not.toContain('work-with-me');
    expect(html).not.toContain('Get in touch');
    expect(html).not.toContain('Available');
  });

  it('sorts services by order, each as an h3 with its blurb (AC-1)', async () => {
    const html = await container.renderToString(WorkWithMe, { props: { services } });

    expect(html).toContain('id="work-with-me"');
    expect(html).toMatch(/<h3[^>]*>First<\/h3>\s*<p[^>]*>One<\/p>/);
    expect(html.indexOf('>First<')).toBeLessThan(html.indexOf('>Second<'));
  });

  it.each([
    ['open', 'Available', 'bg-status-open'],
    ['limited', 'Limited availability', 'bg-status-limited'],
    ['closed', 'Booked', 'bg-status-closed'],
  ] as const)(
    'shows %s as "%s" with its token class and the CTA (AC-3, AC-4)',
    async (status, label, token) => {
      const html = await container.renderToString(WorkWithMe, {
        props: { services, availability: { status, note: 'A note.' } },
      });

      expect(html).toContain(`<strong>${label}</strong>`);
      expect(html).toContain(token);
      expect(html).toContain('A note.');
      expect(html).toMatch(/href="#contact"[^>]*>\s*Get in touch/);
    },
  );

  it('omits the badge but keeps cards and CTA without availability (AC-3, AC-4)', async () => {
    const html = await container.renderToString(WorkWithMe, { props: { services } });

    expect(html).not.toContain('<strong>');
    expect(html).not.toContain('bg-status-');
    expect(html).toContain('>First<');
    expect(html).toContain('Get in touch');
  });
});
