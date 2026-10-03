/*
 * "On this page" for the case studies (spec 0021): the section being read is
 * marked `aria-current="location"` in every contents list on the page, so it
 * lights up and screen readers hear which one it is. Without this script the
 * lists are still plain links to each section.
 */

/**
 * The section being read: the last heading whose top has passed `line` (the
 * reading line just under the fixed header). -1 above the first heading.
 */
export function activeSection(tops: readonly number[], line: number): number {
  let active = -1;
  for (const [n, top] of tops.entries()) {
    if (top - line <= 1) active = n;
  }
  return active;
}

export function initToc(root: Document = document): void {
  const links = [...root.querySelectorAll<HTMLAnchorElement>('a[data-toc-link]')];
  if (links.length === 0) return;
  // On phones the contents fold away again once a section is chosen.
  for (const menu of root.querySelectorAll<HTMLDetailsElement>('details[data-toc-menu]')) {
    menu.addEventListener('click', (event) => {
      if ((event.target as Element).closest('a')) menu.open = false;
    });
  }
  const ids = [...new Set(links.map((link) => link.hash.slice(1)))];
  const headings = ids
    .map((id) => root.getElementById(decodeURIComponent(id)))
    .filter((el): el is HTMLElement => el !== null);
  if (headings.length === 0) return;

  let current = '';
  let queued = false;
  const update = () => {
    queued = false;
    // The reading line sits just under the fixed header (scroll-padding-top).
    const line = Number.parseFloat(getComputedStyle(root.documentElement).scrollPaddingTop) || 88;
    const n = activeSection(
      headings.map((h) => h.getBoundingClientRect().top),
      line + 8,
    );
    const id = n >= 0 ? (headings[n]?.id ?? '') : '';
    if (id === current) return;
    current = id;
    for (const link of links) {
      if (link.hash.slice(1) === id) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    }
  };
  const schedule = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(update);
  };
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  update();
}
