import type { CollectionEntry } from 'astro:content';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { beforeEach, describe, expect, it } from 'vitest';

import projectImage from './__fixtures__/project-image.png';
import ProjectCard from './ProjectCard.astro';
import Projects from './Projects.astro';

/*
 * The real projects.yaml has no image and is never empty, so the e2e suite can
 * not reach those states. These tests feed the components fixture data through
 * the Container API instead, leaving the content files alone (spec 0004, AC-4, AC-6).
 */

type ProjectData = CollectionEntry<'projects'>['data'];

// The schema's catchall gives the entry type a `never` index signature, which no
// object literal satisfies, so fixtures use the plain fields and cast once, here.
type Fixture = {
  slug: string;
  title: string;
  summary: string;
  tech: string[];
  demoUrl?: string;
  repoUrl?: string;
  image?: ProjectData['image'];
  order: number;
};

const asData = (fixture: Fixture) => fixture as unknown as ProjectData;

const base: Fixture = {
  slug: 'fixture',
  title: 'Fixture Project',
  summary: 'A project that only exists in tests.',
  tech: ['Astro'],
  repoUrl: 'https://example.com/fixture',
  order: 0,
};

function entry(fixture: Fixture): CollectionEntry<'projects'> {
  return {
    id: fixture.slug,
    collection: 'projects',
    data: asData(fixture),
  } as CollectionEntry<'projects'>;
}

let container: AstroContainer;

beforeEach(async () => {
  container = await AstroContainer.create();
});

describe('Projects', () => {
  it('renders nothing at all for an empty collection (AC-6)', async () => {
    const html = await container.renderToString(Projects, { props: { projects: [] } });

    expect(html).not.toContain('<section');
    expect(html).not.toContain('id="projects"');
    expect(html).not.toContain('Projects');
  });

  it('sorts cards by order, whatever order they arrive in (AC-1)', async () => {
    const html = await container.renderToString(Projects, {
      props: {
        projects: [
          entry({ ...base, slug: 'second', title: 'Second', order: 5 }),
          entry({ ...base, slug: 'first', title: 'First', order: 1 }),
        ],
      },
    });

    expect(html.indexOf('>First<')).toBeGreaterThan(-1);
    expect(html.indexOf('>First<')).toBeLessThan(html.indexOf('>Second<'));
  });
});

describe('ProjectCard image (AC-4)', () => {
  it('renders one optimised image with the title as alt when set', async () => {
    const html = await container.renderToString(ProjectCard, {
      props: { project: asData({ ...base, image: projectImage }) },
    });

    const images = html.match(/<img\b[^>]*>/g) ?? [];
    expect(images).toHaveLength(1);
    expect(images[0]).toContain('alt="Fixture Project"');
    expect(images[0]).toContain('srcset=');
    expect(images[0]).toContain('sizes=');
  });

  it('renders no image element when unset', async () => {
    const html = await container.renderToString(ProjectCard, { props: { project: asData(base) } });

    expect(html).not.toContain('<img');
  });
});
