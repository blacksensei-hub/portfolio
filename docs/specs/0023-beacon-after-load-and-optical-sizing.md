# 0023 Analytics after load, and Inter's optical sizes

Status: accepted

## 1. The analytics beacon waits for the page

The live site measured slower than previews of the same code: Lighthouse mobile put the home page's LCP at about 3.3 s on https://jeffrey-ankrah.pages.dev against about 1.7 s on a preview. The LCP element is the hero tagline, and the whole gap was render delay. Production is the only build with the Cloudflare Web Analytics beacon (spec 0010). Re-running Lighthouse on production with only `*cloudflareinsights.com*` blocked confirmed it:

| Live home page, mobile | Perf | LCP | LCP render delay |
|---|---|---|---|
| With the beacon (4 runs) | 67–85 | 3.2–4.5 s | 2.6–3.7 s |
| Beacon blocked (4 runs) | 86–92 | 2.0–2.2 s | 1.1–1.5 s |

The beacon was a deferred `<script>` in `<head>`, so it was fetched from a new origin during the first render. It is now added by a tiny inline loader (`BEACON_LOADER` in `src/lib/analytics.ts`), which runs once the page has loaded and the browser is idle. It still reads the page's load timing and Web Vitals, which the browser buffers. The loader carries the token in `data-cf-beacon-token`. It is the only beacon markup in the HTML, and it appears only in production builds, as before (AC-1, AC-2).

## 2. Inter with optical sizing

Inter is served with its optical size axis (`@fontsource-variable/inter/opsz.css`), and the first-screen preload points at the same file. With `font-optical-sizing: auto`, the browser's default, small text uses Inter's more open text cut and larger text its tighter display cut. That's the way Apple's system font behaves (spec 0018). Headings use Space Grotesk and are unaffected.

The cost: the Latin file grows from 48 KB to 73 KB. Item 1 more than pays for it on the critical path.

## Also produced, outside the site

A 1584×396 LinkedIn banner in the dark palette, drawn with the same satori and resvg pipeline. It has the tagline, the role, the availability chip, the site address, and the AttendX screens, with key content kept clear of where LinkedIn places the profile photo.

## Verification

- `analytics.spec.ts` (run with a token to test the production path, as well as without):
  - the loader carries the token
  - the beacon is added only after `load`
  - the HTML itself never carries the beacon's `src`
  - no request is made without a token
- `analytics.test.ts`: the loader is plain ES5, and loads on `load` plus idle.
- `design-system.spec.ts`: Inter's opsz file is the one requested.
- **After merge:** Lighthouse on the live site, to compare with the "with the beacon" row.
