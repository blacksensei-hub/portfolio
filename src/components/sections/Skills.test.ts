import type { CollectionEntry } from 'astro:content';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { beforeEach, describe, expect, it } from 'vitest';

import Skills from './Skills.astro';

/*
 * The real skills.yaml is never empty and is already in order, so the e2e suite
 * can not reach those states. These tests feed fixture entries through the
 * Container API instead, leaving the content files alone (spec 0005, AC-1, AC-4).
 */

type Fixture = { group: string; items: string[]; order: number };

// The schema's catchall gives the entry type a `never` index signature, which no
// object literal satisfies, so fixtures use the plain fields and cast once, here.
function entry(fixture: Fixture): CollectionEntry<'skills'> {
  return {
    id: fixture.group,
    collection: 'skills',
    data: fixture,
  } as unknown as CollectionEntry<'skills'>;
}

let container: AstroContainer;

beforeEach(async () => {
  container = await AstroContainer.create();
});

describe('Skills', () => {
  it('renders nothing at all for an empty collection (AC-4)', async () => {
    const html = await container.renderToString(Skills, { props: { skills: [] } });

    expect(html).not.toContain('<section');
    expect(html).not.toContain('id="skills"');
    expect(html).not.toContain('Skills');
  });

  it('sorts groups by order and numbers heading ids from 0 (AC-1)', async () => {
    const html = await container.renderToString(Skills, {
      props: {
        skills: [
          entry({ group: 'Second', items: ['B'], order: 5 }),
          entry({ group: 'First', items: ['A'], order: 1 }),
        ],
      },
    });

    expect(html.indexOf('>First<')).toBeGreaterThan(-1);
    expect(html.indexOf('>First<')).toBeLessThan(html.indexOf('>Second<'));
    expect(html).toMatch(/id="skill-group-0"[^>]*>\s*First/);
    expect(html).toMatch(/id="skill-group-1"[^>]*>\s*Second/);
    expect(html).toContain('aria-labelledby="skill-group-0"');
  });

  it('keeps items in their data order (AC-1)', async () => {
    const html = await container.renderToString(Skills, {
      props: { skills: [entry({ group: 'Tools', items: ['Zed', 'Git'], order: 0 })] },
    });

    expect(html.indexOf('>Zed<')).toBeLessThan(html.indexOf('>Git<'));
  });
});
