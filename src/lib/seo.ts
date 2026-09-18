/*
 * The home page's JSON-LD graph, per spec 0006 (AC-5, AC-7). Pure, so the
 * layout only serializes what this returns.
 */

/** Link icons that name a profile of you elsewhere, and so belong in `sameAs`. */
export const SAME_AS_ICONS = ['github', 'linkedin', 'x'] as const;

export interface SeoProfile {
  name: string;
  role: string;
  email: string;
}

export interface SeoLink {
  href: string;
  icon: string;
  order: number;
}

export function buildJsonLd(profile: SeoProfile, links: readonly SeoLink[], siteUrl: URL) {
  const url = siteUrl.href;
  const sameAs = links
    .filter((link) => (SAME_AS_ICONS as readonly string[]).includes(link.icon))
    .toSorted((a, b) => a.order - b.order)
    .map((link) => link.href);

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Person',
        name: profile.name,
        jobTitle: profile.role,
        email: profile.email,
        url,
        ...(sameAs.length > 0 && { sameAs }),
      },
      { '@type': 'WebSite', url, name: profile.name },
    ],
  };
}
