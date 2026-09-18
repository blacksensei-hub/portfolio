# My Portfolio

A one page personal portfolio, built as a fully static site.

## Stack

- **Language / Runtime**: TypeScript (`astro/tsconfigs/strictest`), Node 24.11.1 (pinned in `.nvmrc`)
- **Framework**: Astro 7, `output: 'static'`, no server adapter
- **Key dependencies**: React 19 (islands only, via `@astrojs/react`), Tailwind CSS 4 (Vite plugin), `@astrojs/sitemap`
- **Package manager**: pnpm 12.4.2 (pinned in `package.json` `packageManager`)
- **Testing**: Vitest (unit), Playwright with `@axe-core/playwright` (end to end and accessibility)

## Build approach

**Skateboard**: ship the thinnest usable whole first, then grow it release by release.

## Commands

```bash
# Install
pnpm install

# Dev server
pnpm dev

# Build (runs `astro check` first, then `astro build` to dist/)
pnpm build

# Lint and format
pnpm lint
pnpm format

# Test
pnpm test        # Vitest, unit
pnpm test:e2e    # Playwright, against the built site
```

## Development

Start the dev server with `pnpm dev` (plain `astro dev`). That is the default.

For an automated check that must not block, append the flag ad-hoc:

```
pnpm dev --background
```

Manage a backgrounded server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Specs

Stored in `docs/specs/`. Format: `docs/specs/NNNN-title/index.md`, with the reasoning in a sibling `rationale.md`.

## Rules

- Default to `.astro`. Reach for a React island only when a piece holds state or handles events, and hydrate it with a `client:*` directive.
- No server adapter and no on demand routes. `output: 'static'` stays; anything dynamic runs in the browser inside an island.
- Read content through `getCollection` and `getEntry`, never by importing a data file directly.
- Design tokens are CSS variables in the `@theme` block of `src/styles/global.css`. Tailwind 4 configures in CSS, so there is no `tailwind.config.js`.
- `pnpm build` must pass with no type errors. `strictest` means indexed access returns `T | undefined`, and env vars need bracket access (`process.env['CI']`).
- Unit tests are `*.test.ts` beside the code they cover. End to end tests live in `tests/e2e/` and run against the built site, never the dev server.
- The dark/light theme setter is an inline `<head>` script, never a React island, so the right theme applies before first paint.
- `SITE_URL` sets the site origin for canonical links and the sitemap. It is not a secret and falls back to `https://example.com` until the deploy feature sets the real one.
- Biome lints and formats `.ts`, `.tsx`, `.json`, and `.css`. Prettier with `prettier-plugin-astro` formats `.astro`, because Biome parses only the frontmatter and reports every template variable as unused. Both run from `pnpm lint`.
- Biome's `complexity/useLiteralKeys` is off on purpose: `strictest` requires bracket access on `process.env`, so the two rules contradict each other.

## Git

- integration: on
- branch prefix: `feat/`
- commit: per-milestone
- style: Conventional Commits

## Agent skills

- [astro](.agents/skills/astro/): `astrolicious/agent-skills`, Astro components, routing, content collections, and CLI.
- [tailwind-4-docs](.agents/skills/tailwind-4-docs/): `lombiq/tailwind-agent-skills`, Tailwind 4 utilities, variants, and CSS first config.
- [vitest](.agents/skills/vitest/): `antfu/skills`, unit tests, mocking, and coverage.
- [playwright-cli](.agents/skills/playwright-cli/): `microsoft/playwright-cli`, browser driven end to end tests.

`astro` and `tailwind-4-docs` are community made: check they match Astro 7 and Tailwind 4 before trusting them.

MCP servers: Astro Docs (recommended), Playwright (recommended)

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)

## Context files

<!-- Nested AGENTS.md files are listed here as they are created -->

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
