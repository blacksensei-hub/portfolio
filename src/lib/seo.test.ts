import { describe, expect, it } from 'vitest';

import { buildJsonLd } from './seo';

const profile = { name: 'Ada Lovelace', role: 'Engineer', email: 'ada@example.com' };
const site = new URL('https://ada.example.dev/');

const person = (graph: ReturnType<typeof buildJsonLd>) =>
  graph['@graph'][0] as Record<string, unknown>;

describe('buildJsonLd', () => {
  it('builds a Person and a WebSite node under the given origin', () => {
    const jsonLd = buildJsonLd(profile, [], site);

    expect(jsonLd['@graph']).toEqual([
      {
        '@type': 'Person',
        name: 'Ada Lovelace',
        jobTitle: 'Engineer',
        email: 'ada@example.com',
        url: 'https://ada.example.dev/',
      },
      { '@type': 'WebSite', url: 'https://ada.example.dev/', name: 'Ada Lovelace' },
    ]);
  });

  it('lists only profile links in sameAs, in order', () => {
    const jsonLd = buildJsonLd(
      profile,
      [
        { href: 'https://x.com/ada', icon: 'x', order: 2 },
        { href: 'mailto:ada@example.com', icon: 'email', order: 0 },
        { href: 'https://github.com/ada', icon: 'github', order: 3 },
        { href: 'https://linkedin.com/in/ada', icon: 'linkedin', order: 1 },
        { href: 'tel:+100', icon: 'phone', order: 4 },
      ],
      site,
    );

    expect(person(jsonLd)['sameAs']).toEqual([
      'https://linkedin.com/in/ada',
      'https://x.com/ada',
      'https://github.com/ada',
    ]);
  });

  it('leaves sameAs out when no profile links exist', () => {
    const jsonLd = buildJsonLd(profile, [{ href: 'tel:+100', icon: 'phone', order: 0 }], site);

    expect(person(jsonLd)).not.toHaveProperty('sameAs');
  });
});
