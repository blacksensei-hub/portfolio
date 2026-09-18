# 0001. Adopt Astro 7 as a fully static site with React islands and Tailwind 4

**Date**: 2026-09-17
**Status**: Accepted

## Summary

The portfolio will be built with Astro 7 and TypeScript. It outputs plain HTML files (a static site), so it can live on any free host and search engines read it easily. Sections are written as Astro components with no JavaScript by default. React is used only for a piece that truly needs interactivity (an "island"). Styling is Tailwind CSS 4, content lives in data files the build checks, and tests use Vitest and Playwright.

## Decision

**Chosen option**: Option 1: Astro 7 static site, React islands, Tailwind CSS 4

Build the portfolio as a single Astro 7 project with `output: 'static'` and no server adapter, writing `.astro` components by default and React only for stateful islands.

**Implementation skills**: `astro` (`astrolicious/agent-skills`, `.claude/skills/astro/`) · `tailwind-4-docs` (`lombiq/tailwind-agent-skills`, `.claude/skills/tailwind-4-docs/`) · `vitest` (`antfu/skills`, `.claude/skills/vitest/`) · `playwright-cli` (`microsoft/playwright-cli`, `.claude/skills/playwright-cli/`)

## Proposed stack

| Layer | Choice | Reason |
|---|---|---|
| Pattern | One static site, no backend (a monolith with nothing to run in production) | A one page portfolio has no server work, so there is nothing to operate. |
| Language | TypeScript with Astro's `strictest` tsconfig | You know TypeScript, and strict checks catch bad content data before it ships. |
| Framework | Astro 7 | Renders static HTML by default and validates content at build time. |
| Components | `.astro` components; React islands (`@astrojs/react`, hydrated with a `client:*` directive) only when a component needs state | Ships zero JavaScript unless a piece needs it, while you keep React for those pieces. |
| Styling | Tailwind CSS 4 via its Vite plugin, design tokens (named colors, spacing, type) as CSS variables in `@theme` | Tokens become the base for the design system (feature 4) and dark/light theme (feature 11). |
| Content | Astro content collections in `src/content/`, schemas in `src/content.config.ts` (Zod) | A bad data entry fails the build; exact schema is feature 3's decision. |
| Images | `astro:assets` with local files in `src/assets/` | Optimized to modern formats at build time with sizes set, no image service needed. |
| Output | `output: 'static'`, no adapter, build to `dist/` | Plain files deploy to any free host, so hosting stays open until feature 10. |
| SEO base | `@astrojs/sitemap`; `site` read from `SITE_URL`, default `https://example.com` | Canonical URLs and the sitemap work now; feature 9 adds metadata and structured data. |
| Runtime and packages | Node 24 LTS (pinned in `.nvmrc`), pnpm (pinned in `package.json` `packageManager`) | Every machine and host build uses the same versions. |
| Testing | Vitest (config from Astro's `getViteConfig`) for schemas and helpers; Playwright with axe (automated accessibility checks) against the built site | This feature is Beta tier, so `/test` runs; unit tests stay fast and end to end tests check the real page. |
| Version control | git, `main` branch, GitHub remote | Push to deploy (feature 10) needs a remote. |

Not needed for this product, so omitted: database, auth, background jobs, file storage, observability. Lint and format are decided by feature 2 (`/audit`), hosting by feature 10, analytics by feature 13.

**Configuration required**:
- `SITE_URL`: the public origin of the site, used for canonical links and the sitemap. Production sets it to `https://jeffrey-ankrah.pages.dev` in `.github/workflows/deploy.yml` (mirrored in `.env.example`). Optional; local builds without it fall back to `https://example.com`. Not a secret.

**Constraints the build must honor**:
- No server adapter and no on demand rendered routes. Anything dynamic runs in the browser inside an island.
- Default to `.astro`. Reach for React only when a component holds state or handles events beyond a plain link.
- Content is read through `getCollection` and `getEntry`, never by importing raw data files.
- `pnpm build` must succeed with no type errors (`astro check` runs before `astro build`).
- The dark/light theme setter (feature 11) is an inline script in the layout `<head>`, never a React island, so the right theme applies before first paint (no flash).
- Analytics (feature 13) must be a client side script, since there is no server.

**Scaffold conventions** (so the build invents nothing):

| Item | Decision |
|---|---|
| Folder layout | `src/pages/`, `src/layouts/`, `src/components/`, `src/content/`, `src/assets/`, `src/styles/global.css` (Tailwind import and `@theme` tokens) |
| Scripts | `dev` (`astro dev`), `build` (`astro check && astro build`), `preview` (`astro preview`), `test` (Vitest), `test:e2e` (Playwright) |
| TypeScript | `tsconfig.json` extends `astro/tsconfigs/strictest` |
| Versions | React 19 (the major `@astrojs/react` supports); latest stable patches of every package, locked by `pnpm-lock.yaml`; pnpm pinned with `corepack use pnpm@latest`; `.nvmrc` holds the full Node 24 LTS version |
| `SITE_URL` | Read in `astro.config.ts` at build time (via Vite `loadEnv`), fallback `https://example.com`; commit `.env.example`, ignore `.env` |
| Unit tests | `*.test.ts` next to the code they test under `src/`; Vitest config built with `getViteConfig` |
| End to end tests | `tests/e2e/`; Playwright `webServer` runs `pnpm build && pnpm preview` and tests hit the built site |
| Accessibility tests | `@axe-core/playwright` |

## Consequences

**Positive**:
- Pages ship as HTML with little or no JavaScript, which is good for load speed and search ranking.
- Any free static host works, so the host choice stays reversible.
- Content mistakes fail the build instead of breaking the live page.

**Negative / tradeoffs**:
- Two component syntaxes (`.astro` and React) to learn and choose between; props cannot pass functions from Astro into an island.
- Astro 7 is a recent major, so some third party integrations and tutorials may still target older versions.
- Tailwind 4 configures in CSS (`@theme`), not `tailwind.config.js`, so many older guides do not apply.
- `strictest` TypeScript adds friction (indexed access returns `T | undefined`).
- Builds without `SITE_URL` (local builds and tests) point the sitemap and canonical links at `https://example.com`; production sets the real origin, so only local output carries the fallback.
- No server means a future contact form or CMS (deferred in scope) needs an external service or a later spec to add an adapter.

**Neutral**:
- Scaffold steps are derived by `/develop` from this table; this spec holds no build plan.

## Follow-up

- [ ] Feature 2 (`/audit`) should record this stack and its conventions in root `AGENTS.md`, and pick lint and format tooling.
- [ ] `astro`, `tailwind-4-docs`, `vitest`, and `playwright-cli` skills are installed but not yet in root `AGENTS.md` `## Agent skills`; they apply project wide and belong at root. The `astro` and `tailwind-4-docs` skills are community made: check they match Astro 7 and Tailwind 4 before trusting them.
- [ ] MCP servers not connected yet (your choice for now): Astro Docs MCP (`https://mcp.docs.astro.build/mcp`) for live Astro docs, Playwright MCP (`npx @playwright/mcp@latest`) for browser driven checks.
- [ ] Feature 10: Vercel Hobby is limited to non commercial use, and freelance work may count as commercial. Weigh that when choosing the host.
- [x] Feature 10: replace the `SITE_URL` placeholder with the real URL (done, `https://jeffrey-ankrah.pages.dev`).
- [ ] Feature 3: content validation runs at build time only; if content ever comes from a remote source, that source needs its own validation.

## Rationale

Reasoning and options: see [rationale.md](rationale.md).
