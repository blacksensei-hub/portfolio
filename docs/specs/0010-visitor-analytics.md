# 0010. Cookie free visitor analytics with Cloudflare Web Analytics

**Date**: 2026-09-19
**Status**: Accepted

## Summary

The live site gets Cloudflare Web Analytics, a free tool that counts page views and shows where visitors came from without setting any cookies, so no consent banner is needed. A small script tag goes in the page head, but only in the production build on `main`. Previews, local builds, and tests never load it. A short footer line tells visitors that anonymous, cookie free counting is on.

## Context

This is feature 13 in the scope (Release 3). It's done when page views and referrers (the page or site a visitor came from) show up in a dashboard, and no cookie banner is needed. The goal is to see which links bring people to the portfolio.

The site is fully static (spec 0001): no server, no adapter, plain files served by Cloudflare Pages (spec 0007). Spec 0001 already noted that analytics must be a script that runs in the visitor's browser. Spec 0007 set a rule this feature must keep: the `check` job builds `dist/` once, tests it, and the `deploy` job uploads that exact `dist/`. So anything that differs between production and previews has to be decided at build time from the workflow's environment, and the e2e suite on `main` runs against the production build.

The site holds no personal data beyond what it shows on purpose. Adding a tracker that sets cookies or fingerprints visitors would bring a consent banner, which is a poor fit for a one page portfolio. Counting your own previews and test runs would also make the numbers useless.

## Requirements

**User stories**:
- As you, I want to see how many people visit and which sites send them, so you know which links are worth sharing.
- As a visitor, I want to browse without cookies or a consent banner.

**Acceptance criteria**:
- **AC-1**: A production build (token set) has exactly one Cloudflare beacon script in the head of every page, with `defer`, `src="https://static.cloudflareinsights.com/beacon.min.js"`, and `data-cf-beacon` holding `{"token":"<PUBLIC_CF_BEACON_TOKEN>"}`. After deploy, page views and referrers appear in the Cloudflare Web Analytics dashboard.
- **AC-2**: A build without the token (pull request previews, fork runs, local dev and builds) has no beacon script and makes no request to any `cloudflareinsights.com` host.
- **AC-3**: The site sets no cookies and shows no consent banner or prompt.
- **AC-4**: Every page has a site footer, after `<main>`, with the line "Cookie free, anonymous visit counts via Cloudflare Web Analytics." It passes axe in both themes.
- **AC-5**: The beacon never blocks rendering: it loads with `defer`, sits after the inline theme script, and if it fails to load (an ad blocker, a network error) the page still renders and works with no console errors from our own code.

## Options considered

### Option 1: Cloudflare Web Analytics, beacon gated by a build env var (chosen)
A manually added beacon tag in `BaseLayout.astro`, rendered only when `PUBLIC_CF_BEACON_TOKEN` is set, which `deploy.yml` sets only on pushes to `main`.
**Pros**: Free, cookie free, and in the Cloudflare account you already use. Shows page views, referrers, countries, and devices. The gate lives in the repo, where it can be tested.
**Cons**: No custom events. Data is sampled on busy sites. Tracker blockers can hide some visits.

### Option 2: Cloudflare's automatic setup from the Pages dashboard
Turn Web Analytics on for the Pages project and Cloudflare injects the beacon itself.
**Pros**: No code at all.
**Cons**: Nothing in the repo shows it, so tests can't check it, and keeping it off previews is out of your control.

### Option 3: Umami Cloud
**Pros**: Cookie free, clean dashboard, custom events such as outbound link clicks.
**Cons**: A new account and vendor, a monthly free tier limit, and events are out of scope for now anyway.

### Option 4: Plausible or GoatCounter
**Pros**: Plausible is polished, and GoatCounter is tiny and free for personal sites.
**Cons**: Plausible costs money every month. GoatCounter's dashboard is plainer, and both add a new account.

## Decision

**Chosen option**: Option 1, Cloudflare Web Analytics.

`BaseLayout.astro` renders the Cloudflare beacon only when the public build variable `PUBLIC_CF_BEACON_TOKEN` is set. `deploy.yml` sets it only for pushes to `main`. A new site footer carries a one line analytics notice.

**Implementation skills**: `astro` (`astrolicious/agent-skills`, `.agents/skills/astro/`) Â· `vitest` (`antfu/skills`, `.agents/skills/vitest/`) Â· `playwright-cli` (`microsoft/playwright-cli`, `.agents/skills/playwright-cli/`)

## Rationale

The scope asks for views and referrers with no banner, and you chose not to track outbound clicks. That removes the only reason to pick a tool with events. Cloudflare then wins on reuse: it lives in the account that already hosts the site, it costs nothing, and it sets no cookies.

A gate you write yourself beats the dashboard switch because production only is a hard requirement and has to be testable. Deciding at build time from one env var fits spec 0007's "one build, tested then shipped" rule: on `main` the tested `dist/` includes the beacon, so e2e checks the tag against the env and blocks the beacon's network request with `page.route`, instead of building twice.

These are small calls I made:
- **A pure helper, `src/lib/analytics.ts` `beaconAttr(token: string | undefined): string | null`**, returns the JSON string for `data-cf-beacon`, or `null` for a missing or blank token (after trimming). The layout renders the tag only for a non null result. This keeps the gate unit testable, like `src/lib/theme.ts`. The runner up was inlining the condition in the layout, which can only be tested through a build.
- **The token is a literal in `deploy.yml`, not a secret**, because it ships in public HTML anyway. The runner up was a repo secret, which adds setup and hides nothing.
- **The footer goes in `BaseLayout.astro`** (inline markup, or a small `src/components/ui/SiteFooter.astro` if it grows), using the existing `Container` and design tokens. The runner up was small print inside `Contact`, which mixes site info into a content section.

## Feature design

**Data model sketch**: None in this repo. Cloudflare stores the aggregated visit data. The only new state is the Web Analytics site entry in your Cloudflare account, for the host `jeffrey-ankrah.pages.dev`.

**State transitions**: None.

**API surface** (build time inputs and the page output; there is no HTTP API of our own):
| Surface | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| `beaconAttr(token)` in `src/lib/analytics.ts` | function | `token: string \| undefined` | `'{"token":"â€¦"}'` or `null` | none | blank or whitespace token returns `null` |
| `BaseLayout.astro` head | build render | `import.meta.env.PUBLIC_CF_BEACON_TOKEN` | a `<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon=â€¦>` or nothing | none | none (a missing token just means no tag) |
| `BaseLayout.astro` footer | build render | fixed copy | `<footer>` with the notice line | none | none |
| Beacon at runtime | browser GET/POST to Cloudflare | page URL, referrer (sent by the script) | a counted visit | the token | blocked or failed: silently no count |

**Value sourcing**:
| Action | Value produced / displayed | Source |
|---|---|---|
| Build | whether to render the beacon | `PUBLIC_CF_BEACON_TOKEN` set and non blank, through `beaconAttr` |
| Build | the token in `data-cf-beacon` | `PUBLIC_CF_BEACON_TOKEN`, set in the existing top level `env:` block of `deploy.yml` (beside `SITE_URL`) as `${{ github.event_name == 'push' && github.ref == 'refs/heads/main' && '<token>' \|\| '' }}`. Top level, so the `check` job's Playwright `webServer` build inherits it and the `dist/` it uploads is the one deployed. It evaluates empty for every `pull_request` event (same repo or fork), because those are not `push` |
| Build | the token value itself | copied by hand from Cloudflare dashboard â†’ Web Analytics â†’ the site for `jeffrey-ankrah.pages.dev` (build plan step 1) |
| Build | the beacon URL | the literal `https://static.cloudflareinsights.com/beacon.min.js` in the layout |
| Render | the footer notice text | the literal in `BaseLayout.astro` (site chrome, not content, so not in a collection) |
| Dashboard | page views, referrers | Cloudflare, from the beacon's report (page URL, `document.referrer`) |
| E2E | whether to expect the tag | `process.env['PUBLIC_CF_BEACON_TOKEN']` in the test, the same env the build used |

**Key invariants**:
- The beacon renders only when the token is set, and the token is set only on pushes to `main`.
- At most one beacon tag per page.
- The token is assumed to be the plain alphanumeric string Cloudflare issues. `beaconAttr` builds it with `JSON.stringify`, and Astro escapes attribute values, so no extra escaping is needed.
- The inline theme script stays first in `<head>` and the beacon comes after it with `defer`.
- No cookies, no `localStorage` writes for analytics, no consent UI.
- `output: 'static'` and no adapter stay as they are.

**Security model**: The token is public by design (Cloudflare puts it in page HTML), so it is a literal, not a secret. The beacon is a third party script from Cloudflare, loaded only in production. There's no CSP today; if one is added, it must allow `static.cloudflareinsights.com` (script) and `cloudflareinsights.com` (connect). Cloudflare Web Analytics sets no cookies and doesn't fingerprint, so no consent scope applies; the footer line covers transparency.

**Configuration required**:
- `PUBLIC_CF_BEACON_TOKEN`: the Cloudflare Web Analytics site token. Set in `deploy.yml` for pushes to `main` only. Listed in `.env.example` with an empty value and a comment saying to leave it empty locally.
- Prerequisite by hand: add a Web Analytics site in the Cloudflare dashboard for `jeffrey-ankrah.pages.dev` (manual beacon setup, not automatic injection) and copy its token.

**Critical test scenarios**:
- Happy path (unit): `beaconAttr('abc')` returns `'{"token":"abc"}'`. Verifies **AC-1**
- Gate off (unit): `beaconAttr(undefined)`, `beaconAttr('')`, `beaconAttr('  ')` all return `null`. Verifies **AC-2**
- E2E tag matches env: with the token unset, the page has zero `script[data-cf-beacon]`. With it set, exactly one, with `defer` and the right `src`. Verifies **AC-1**, **AC-2**
- E2E no network: `page.route('**/*cloudflareinsights.com/**', â€¦)` on every test, with a handler that increments a counter and then aborts. With the token unset, the test asserts the counter is 0 (no request was even attempted). Verifies **AC-2**
- E2E blocked beacon: with the request aborted, the page renders, the theme toggle works, and `page.on('pageerror')` records nothing. Use `pageerror` (uncaught exceptions), not `console` errors, because Chromium logs its own network error line for the aborted request. Verifies **AC-5**
- E2E cookies: after load, `context.cookies()` is empty and no banner or dialog exists. Verifies **AC-3**
- E2E footer: the notice text is visible inside `footer` after `main`, and axe passes in light and dark. Verifies **AC-4**
- Live (by hand after deploy): view source on production shows the beacon, a preview shows none, and the dashboard shows the visit within minutes. Verifies **AC-1**, **AC-2**

## Build plan

Skateboard: get real counts flowing in production with the thinnest code first, then add the notice and test hardening.

1. Create the Web Analytics site in the Cloudflare dashboard for `jeffrey-ankrah.pages.dev` (manual setup) and copy the token. Satisfies **AC-1** (prerequisite)
2. Add `src/lib/analytics.ts` with `beaconAttr` and its unit test `src/lib/analytics.test.ts`. Satisfies **AC-1**, **AC-2**
3. Render the beacon in `BaseLayout.astro` head after the theme script, gated on `beaconAttr(import.meta.env.PUBLIC_CF_BEACON_TOKEN)`, and declare `readonly PUBLIC_CF_BEACON_TOKEN?: string` on `ImportMetaEnv` in `src/env.d.ts` (always, so the value is typed `string | undefined` under `strictest`). Satisfies **AC-1**, **AC-2**, **AC-5**
4. Set `PUBLIC_CF_BEACON_TOKEN` in `.github/workflows/deploy.yml` (main pushes only) and add it, empty and commented, to `.env.example`. Satisfies **AC-1**, **AC-2**
5. Add the site footer with the notice to `BaseLayout.astro`. Satisfies **AC-3**, **AC-4**
6. Add `tests/e2e/analytics.spec.ts`: route block, tag matches env, cookies empty, blocked beacon is harmless, footer plus axe per theme. Satisfies **AC-1** to **AC-5**
7. Merge, let `main` deploy, and confirm the live checks and the dashboard. Satisfies **AC-1**, **AC-2**

## Consequences

**Positive**:
- You see views and referrers for free, with no banner and no new vendor.
- Previews and tests never pollute the numbers, and tests never send hits.
- The gate is in the repo and covered by tests.

**Negative / tradeoffs**:
- No custom events: outbound click tracking later means switching providers.
- Visitors with tracker blockers aren't counted, so numbers run low.
- A third party script now loads on production pages (small and deferred).
- The token lives in `deploy.yml`, so a new Web Analytics site means editing the workflow.

**Neutral**:
- The site gains its first footer, which later site info (copyright, links) can reuse.
- On `main`, e2e runs against a build that includes the beacon, which is intended.

## Follow-up

- [ ] If you later want outbound click counts, write a new spec that supersedes this one (Umami Cloud was the runner up).
- [ ] If a CSP is ever added, allow `static.cloudflareinsights.com` and `cloudflareinsights.com`.
- [ ] After the first deploy, make sure the dashboard lists only production traffic.
- [ ] `/sync`: add `PUBLIC_CF_BEACON_TOKEN` and the "production only analytics" rule to `CLAUDE.md`/`AGENTS.md`.
