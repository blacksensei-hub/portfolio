/**
 * The `data-cf-beacon` value for Cloudflare Web Analytics (spec 0010), or
 * null when no token is set, which keeps the beacon out of the page.
 */
export function beaconAttr(token: string | undefined): string | null {
  const trimmed = token?.trim();
  return trimmed ? JSON.stringify({ token: trimmed }) : null;
}

export const BEACON_SRC = 'https://static.cloudflareinsights.com/beacon.min.js';

/*
 * Loads the beacon only after the page has finished loading and the browser
 * is idle (spec 0023). As a deferred tag in <head> it was fetched during the
 * first render: on a throttled phone, Lighthouse put the live site's LCP at
 * about 3.3 s with it and 2.1 s without. The beacon still reads the page's
 * load timing and Web Vitals afterwards, since those entries are buffered.
 *
 * Runs inline from the script tag that carries the token in
 * `data-cf-beacon-token`, so it is plain ES5 and never bundled.
 */
export const BEACON_LOADER = `(function () {
  var me = document.currentScript;
  var config = me && me.getAttribute('data-cf-beacon-token');
  if (!config) return;
  function load() {
    var s = document.createElement('script');
    s.defer = true;
    s.src = '${BEACON_SRC}';
    s.setAttribute('data-cf-beacon', config);
    document.head.appendChild(s);
  }
  function whenIdle() {
    if ('requestIdleCallback' in window) window.requestIdleCallback(load, { timeout: 3000 });
    else setTimeout(load, 1);
  }
  if (document.readyState === 'complete') whenIdle();
  else window.addEventListener('load', whenIdle);
})();`;
