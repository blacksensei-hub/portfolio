/**
 * True when `href` leaves the site: an absolute `http` or `https` URL. Relative
 * paths, in page anchors, and `mailto:` links stay in the current tab.
 */
export function isExternal(href: string): boolean {
  return /^https?:\/\//i.test(href);
}
