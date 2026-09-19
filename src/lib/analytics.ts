/**
 * The `data-cf-beacon` value for Cloudflare Web Analytics (spec 0010), or
 * null when no token is set, which keeps the beacon out of the page.
 */
export function beaconAttr(token: string | undefined): string | null {
  const trimmed = token?.trim();
  return trimmed ? JSON.stringify({ token: trimmed }) : null;
}
