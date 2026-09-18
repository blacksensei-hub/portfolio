# 0006. SEO metadata, structured data, and a build time social card

**Date**: 2026-09-18
**Status**: Proposed

## Summary

The home page gets full search and share metadata. That means Open Graph and X tags (the tags chat apps and social sites read to draw a link preview), a JSON-LD block (structured data that tells search engines who you are), and a `robots.txt` that points to the sitemap. The preview image is a 1200 by 630 PNG drawn at build time from `profile.yaml`, so it always matches your name, role, and tagline. Everything stays static, and every absolute URL follows `SITE_URL`, so it is correct once deploy sets the real origin.

## Context

This is feature 9 in the scope (Release 1, Alpha). Spec 0001 already set up the canonical link and `@astrojs/sitemap`, with the origin read from `SITE_URL` (fallback `https://example.com`). `BaseLayout.astro` today renders the title, description, canonical, and an optional `noindex`. Nothing else exists: there is no preview image, no Open Graph or X tags, no structured data, and no `robots.txt`. A shared link today shows a bare URL.

The site is one page, fully static, with no server. All text lives in the content collections from spec 0002 (`profile`, `links`). Design tokens are `oklch()` values in `src/styles/global.css` (spec 0003). The site font is Inter, loaded from `@fontsource-variable/inter`, which ships only woff2. The build approach is Skateboard.

## Requirements

**User stories**:
- As a recruiter who gets your link in a chat, I want a clear preview card with your name and role, so I know what I am opening.
- As you, I want search engines to understand the page is about you, so a search for your name finds it.
- As you, I want the metadata to follow `profile.yaml`, so I never update the same text twice.

**Acceptance criteria**:
- **AC-1**: The home page `<title>` is `{profile.name} · {profile.role}` and the meta description is `profile.tagline`.
- **AC-2**: The home page head has `og:type` = `website`, `og:title` and `og:description` (same text as AC-1), `og:url` equal to the canonical URL, `og:image` as an absolute URL to `/og.png`, `og:image:width` = `1200`, `og:image:height` = `630`, `og:image:type` = `image/png`, `og:image:alt`, `og:site_name` = `profile.name`, and `og:locale` = `en_US`.
- **AC-3**: The home page head has `twitter:card` = `summary_large_image`, plus `twitter:title`, `twitter:description`, `twitter:image` (same absolute URL as `og:image`), and `twitter:image:alt`.
- **AC-4**: `/og.png` is built as a 1200 by 630 PNG. It shows `profile.name`, `profile.role`, and `profile.tagline` in Inter, on the light theme surface color with the accent color, and nothing overflows the frame.
- **AC-5**: The home page has exactly one `<script type="application/ld+json">`. It parses as JSON and holds an `@graph` with a `Person` node (`name`, `jobTitle`, `email`, `url`, `sameAs`) and a `WebSite` node (`url`, `name`). `sameAs` lists the `href` of every `links` entry whose `icon` is `github`, `linkedin`, or `x`, in `order`. It is left out when that list is empty.
- **AC-6**: `/robots.txt` returns `User-agent: *`, `Allow: /`, and `Sitemap: {origin}/sitemap-index.xml`.
- **AC-7**: Every absolute URL (canonical, `og:url`, `og:image`, `twitter:image`, the JSON-LD `url`, the robots sitemap line) uses the `SITE_URL` origin, and falls back to `https://example.com` when it is unset.
- **AC-8**: A missing profile entry fails the build. There is no generic `Portfolio` fallback anymore.
- **AC-9**: `/styleguide` keeps `noindex`, stays out of the sitemap, and renders no `og:*`, `twitter:*`, or JSON-LD.

## Options considered

### Option 1: Build time card with satori and resvg (chosen)
A static endpoint renders a JSX like tree to SVG with satori, then to PNG with `@resvg/resvg-js`, at build.
**Pros**: It always matches the content, needs no image to maintain, and ships no runtime code.
**Cons**: Two new build dependencies and a raw font file. satori supports only a subset of CSS (flexbox, no `oklch`).

### Option 2: Hand made `public/og.png`
**Pros**: No dependencies.
**Cons**: It drifts the moment you change your role or tagline.

### Option 3: A photo of you
**Cons**: There is no photo in the repo, and square portraits crop badly in wide cards.

## Decision

**Chosen option**: Option 1, a build time card.

Extend `BaseLayout` with optional social props, add a pure `src/lib/seo.ts` helper for the JSON-LD graph, and add two static endpoints, `src/pages/og.png.ts` and `src/pages/robots.txt.ts`.

**Implementation skills**: `astro` (`.agents/skills/astro/`) · `vitest` (`.agents/skills/vitest/`) · `playwright-cli` (`.agents/skills/playwright-cli/`)

## Rationale

The profile is already the single source of the page's words, so the title, description, card, and JSON-LD all derive from it. That way there are no new content fields to keep in sync. The one real choice was the card image, and generating it is the only option that cannot go stale. Endpoints in `src/pages/` are prerendered under `output: 'static'`, so this adds no server. A generated `robots.txt` reads `Astro.site`, so the sitemap line fixes itself when deploy sets `SITE_URL`. A static file would hardcode the placeholder.

`Person` plus `WebSite` is the usual graph for a personal site. `sameAs` takes only profile URLs, so the email, WhatsApp, and phone links are left out. The styleguide is a build check page that nobody shares, so it gets no social tags. Failing the build on a missing profile beats shipping a preview that says "Portfolio".

## Feature design

**Data model sketch**: No schema change. It reads `profile` (`name`, `role`, `tagline`, `email`) and `links` (`href`, `icon`, `order`) from `src/content.config.ts`.

**State transitions**: None.

**API surface** (build time only):
| Surface | Inputs | Output | Notes |
|---|---|---|---|
| `BaseLayout.astro` props | existing `title`, `description`, `noindex`, plus new optional `social?: { image: string; imageAlt: string; jsonLd: object }` | When `social` is set: the OG and X tags from AC-2 and AC-3, and one JSON-LD script. When not set: nothing new | `image` is a path (`/og.png`), resolved with `new URL(image, Astro.site)`. JSON-LD is written with `set:html={JSON.stringify(jsonLd)}`, with `<` escaped as `<` |
| `src/lib/seo.ts` `buildJsonLd(profile, links, siteUrl)` | profile data, link entries, site origin `URL` | the `@graph` object from AC-5 | Pure, unit tested beside it |
| `src/lib/seo.ts` `SAME_AS_ICONS` | none | `['github', 'linkedin', 'x']` | The filter for `sameAs` |
| `GET /og.png` (`src/pages/og.png.ts`) | `getEntry('profile', 'profile')` | `Response` with a PNG body, `Content-Type: image/png` | Throws if the profile is missing (AC-8) |
| `GET /robots.txt` (`src/pages/robots.txt.ts`) | `site` from the endpoint context | plain text from AC-6 | `new URL('sitemap-index.xml', site)` |
| `src/pages/index.astro` | profile, links | passes `social` to `BaseLayout` | Throws `Error('profile.yaml is missing')` when the entry is undefined, and the `profile &&` guards go away |

**Value sourcing**:
| Action | Value | Source |
|---|---|---|
| Title, OG and X title | `name · role` | `profile.name`, `profile.role` |
| Description, OG and X description | tagline | `profile.tagline` (max 160, spec 0002) |
| `og:url`, JSON-LD `url` | canonical URL | `new URL(Astro.url.pathname, Astro.site)`, already in `BaseLayout` |
| `og:image`, `twitter:image` | absolute card URL | `new URL('/og.png', Astro.site)` |
| Image alt text | `"{name}, {role}"` | Decided here, from `profile` |
| `og:site_name`, `WebSite.name` | name | `profile.name` |
| `og:locale` | `en_US` | Decided here, matches `<html lang="en">` |
| `Person.jobTitle`, `Person.email` | role, email | `profile.role`, `profile.email` |
| `sameAs` | profile URLs | `links` entries with `icon` in `SAME_AS_ICONS`, sorted by `order` (today only GitHub) |
| Card colors | surface, text, accent | The light theme `--color-surface`, `--color-on-surface`, and `--color-accent` in `src/styles/global.css`. Read that file at build, parse with `parseOklch` from `src/styles/contrast.ts`, and convert with a new `toHex(Oklch)` added there. The hex values are never hand copied |
| Card font | Inter 400 and 700 `.woff` | New dependency `@fontsource/inter`, read from `node_modules/@fontsource/inter/files/inter-latin-{400,700}-normal.woff` with `fs.readFile` at build. No network |
| Card layout | 1200 by 630, 80px padding. Name at 72px bold, role at 40px in accent, tagline at 32px regular (up to 3 lines), a 12px accent bar on the left edge | Decided here |
| Sitemap URL | `{origin}/sitemap-index.xml` | The file name `@astrojs/sitemap` writes by default |

**Key invariants**: One JSON-LD script at most per page. No page without `social` renders OG or X tags. Every absolute URL comes from `Astro.site`, never a hardcoded string.

**Security model**: Public data only, all of it already visible on the page. The JSON-LD escapes `<` so content can never close the script tag early.

**Configuration required**: None new. `SITE_URL` already exists (spec 0001).

**Critical test scenarios**:
- Happy path (e2e, `tests/e2e/seo.spec.ts`, against the built site): read the expected values from `src/content/profile.yaml` and `links.yaml` with `js-yaml`, then check the title, the description, every tag in AC-2 and AC-3, and that the JSON-LD parses and matches. Verifies **AC-1**, **AC-2**, **AC-3**, **AC-5**
- Card: request `/og.png` and check the status, `image/png`, and the PNG header width and height (1200 by 630). Verifies **AC-4**
- Robots: request `/robots.txt` and check the three lines, with the sitemap line under the built origin. Verifies **AC-6**, **AC-7**
- Styleguide: no `meta[property^="og:"]`, no `meta[name^="twitter:"]`, no JSON-LD, and `robots` is `noindex`. Verifies **AC-9**
- Unit (`src/lib/seo.test.ts`): `sameAs` filters and sorts, it is left out when empty, and `url` follows the given origin. Verifies **AC-5**, **AC-7**
- Unit (`src/styles/contrast.test.ts` or beside `toHex`): `toHex` maps known `oklch` values to their hex. Verifies **AC-4**
- Build failure: covered by the throw in `index.astro` and `og.png.ts`, checked by review at `/check verify` (a test that breaks the build is not worth the setup). Verifies **AC-8**

## Build plan

Skateboard, one pass: the page is already live, so the whole feature lands together.

1. Add `toHex` to `src/styles/contrast.ts` and `buildJsonLd` and `SAME_AS_ICONS` to `src/lib/seo.ts`, each with unit tests. Satisfies **AC-4**, **AC-5**, **AC-7**
2. Extend `BaseLayout.astro` with the optional `social` prop (OG, X, JSON-LD), and wire `index.astro` to require the profile and pass `social`. Satisfies **AC-1**, **AC-2**, **AC-3**, **AC-5**, **AC-7**, **AC-8**, **AC-9**
3. Add `satori`, `@resvg/resvg-js`, and `@fontsource/inter`, then build `src/pages/og.png.ts`. Satisfies **AC-4**, **AC-8**
4. Add `src/pages/robots.txt.ts`. Satisfies **AC-6**, **AC-7**
5. Add `tests/e2e/seo.spec.ts` for the scenarios above. Satisfies **AC-1** to **AC-7**, **AC-9**

## Consequences

**Positive**:
- Link previews and search results show your name, role, and tagline, always in sync with `profile.yaml`.

**Negative / tradeoffs**:
- Three new dependencies, one of them a native binary (`@resvg/resvg-js`). It ships prebuilt binaries for Windows, macOS, and Linux, so the build host needs no toolchain.
- The card uses only the light theme colors, whatever the viewer's theme.

**Neutral**:
- Chat apps and social sites cache previews. After deploy, a changed card may need a manual refresh in their debug tools.

## Follow-up

- [ ] After deploy (feature 10), check the live card with a link preview debugger and confirm the real `SITE_URL` flows through.
- [ ] If LinkedIn or X links are added later, they join `sameAs` on their own.
