# 0007. Deploy to Cloudflare Pages behind a GitHub Actions gate

**Date**: 2026-09-18
**Status**: In Progress

## Summary

The site goes live on Cloudflare Pages at `https://jeffrey-ankrah.pages.dev`, which is free, allows commercial use, and has no bandwidth cap. A GitHub Actions workflow (an automated job GitHub runs on every push) lints, tests, and builds the site. It uploads the result to Cloudflare only when every check passes, so a broken change never reaches the live site. Each pull request also gets its own preview URL, which search engines are told to ignore.

## Context

This is feature 10 in the scope (Release 1, Alpha), and it's the last step of Release 1. It's done when the site is live at a public URL over HTTPS and a push to `main` redeploys it. Spec 0001 made the site fully static (`output: 'static'`, no adapter, plain files in `dist/`) so any free host would work, and it left the host choice to this feature. Spec 0001 also flagged that Vercel Hobby forbids commercial use, and you take freelance work.

Today the repo has no git remote. `SITE_URL` still holds the placeholder `https://example.com`, so the canonical link, `og:url`, the social card URL, the JSON-LD, `robots.txt`, and the sitemap all point at the wrong origin (specs 0001 and 0006). The project already has a full check suite: `pnpm lint` (Biome and Prettier), `pnpm test` (Vitest), `pnpm build` (`astro check` then `astro build`), and `pnpm test:e2e` (Playwright with axe, which builds and serves `dist/` itself through its `webServer` command).

One person runs this site. Whatever you pick has to be free, it has to need no server to maintain, and it has to recover by itself (or with one click) when something goes wrong.

## Requirements

**User stories**:
- As a recruiter or client, I want to open your portfolio at a public HTTPS address so I can see your work.
- As you, I want a push to `main` to put the change live without any manual steps, but only if the checks pass.
- As you, I want to see a pull request live on a preview URL before you merge it.

**Acceptance criteria**:
- **AC-1**: The site is served at `https://jeffrey-ankrah.pages.dev` over HTTPS and returns 200 for `/`, `/og.png`, `/robots.txt`, and `/sitemap-index.xml`.
- **AC-2**: A push to `main` where lint, unit tests, and e2e tests all pass deploys that commit to production. No manual step is needed.
- **AC-3**: If any check fails (lint, unit, type check or build, e2e), the deploy step doesn't run, and production keeps serving the last good deploy.
- **AC-4**: A pull request opened from a branch in this repo runs the same checks and, if they pass, deploys a preview to its own `*.jeffrey-ankrah.pages.dev` URL. A pull request from a fork runs the checks but skips the deploy, because it has no access to secrets, and still passes.
- **AC-5**: In production, the canonical link, `og:url`, `og:image`, `twitter:image`, the JSON-LD `url`, the `robots.txt` sitemap line, and the sitemap entries all use `https://jeffrey-ankrah.pages.dev`. None of them use `https://example.com`.
- **AC-6**: Preview URLs respond with an `X-Robots-Tag: noindex` header, so search engines leave them out. Their canonical links point to the production origin.
- **AC-7**: When a newer commit is pushed to the same branch or pull request while an older run is still going, the older run is cancelled, so it can't deploy stale code over newer code.

## Options considered

### Option 1: Cloudflare Pages, deployed by wrangler from GitHub Actions (chosen)
Actions runs the checks, then `cloudflare/wrangler-action` uploads `dist/` with `wrangler pages deploy` (direct upload, meaning Cloudflare stores the files you send and runs no build of its own).
**Pros**: Free, commercial use is allowed, no bandwidth cap, a global CDN (content delivery network, servers near every visitor), and HTTPS set up automatically. The gate is real because only files that passed the checks get uploaded. Previews come per branch. Rollback is one click in the dashboard.
**Cons**: It takes two repo secrets and a Cloudflare account. You own a workflow file. A project made for direct upload can't later be switched to Cloudflare's git build (you'd have to create a new project).

### Option 2: Cloudflare Pages with its own git build
Cloudflare watches the repo and builds on its side.
**Pros**: No workflow file and no secrets.
**Cons**: The tests don't gate the deploy. Branch protection can stop merges, but a direct push to `main` still ships untested code. The e2e suite would also have to run somewhere else anyway.

### Option 3: GitHub Pages from Actions
**Pros**: Everything lives in one place, with no third party account.
**Cons**: No pull request previews, no response headers you control (you can't add noindex to previews), and a `*.github.io` URL.

### Option 4: Netlify or Vercel
**Pros**: Very smooth git deploys and previews.
**Cons**: Netlify's free plan runs on usage credits, so a traffic spike could pause the site. Vercel Hobby forbids commercial use (spec 0001 flagged this).

## Decision

**Chosen option**: Option 1, Cloudflare Pages deployed by wrangler from a GitHub Actions workflow.

A new public GitHub repo holds the code. The workflow `.github/workflows/deploy.yml` checks and then deploys every push to `main` (to production) and every same repo pull request (to a preview), with `SITE_URL=https://jeffrey-ankrah.pages.dev` set for every build.

**Implementation skills**: `astro` (`.agents/skills/astro/`) · `playwright-cli` (`.agents/skills/playwright-cli/`)

## Rationale

The free, commercial and no bandwidth cap requirements rule out Vercel Hobby and make Netlify's credit model a risk for a site you'll put on a CV. That leaves Cloudflare Pages and GitHub Pages. Previews and header control decide between those two, and Cloudflare adds noindex on previews by default, which matters because the previews carry your real name and content.

The gate decides the deploy mechanism. The project already has a strong suite (type check, lint, unit, e2e with accessibility), and the point of it is to stop a broken page from going live. Only a pipeline where the same job both tests and uploads can promise that. Cloudflare's git build runs next to your tests, not after them. Uploading from Actions also means the files that were tested are exactly the files that ship.

These are small calls I made:
- **One workflow file with two jobs**, `check` and `deploy`, where `deploy` has `needs: check`. That's one file to read. The runner up was separate `ci.yml` and `deploy.yml` files linked by `workflow_run`, which is harder to follow and makes fork logic awkward.
- **A `concurrency` group per ref with `cancel-in-progress: true`**, so there's only ever one run per branch. The runner up was queueing, which is slower and never useful here.
- **Pin the action by major version** (`cloudflare/wrangler-action@v3`) and let it bring its own wrangler. There's no wrangler dependency in `package.json`. The runner up was adding `wrangler` as a dev dependency, which bloats installs for every contributor.
- **Previews build with the production `SITE_URL`**, as you chose, so a preview never claims to be the canonical page.

## Feature design

**Data model sketch**: None. The site has no data at runtime. The only "state" is Cloudflare's list of deployments for the project `jeffrey-ankrah`, which Cloudflare manages.

**State transitions** (one workflow run):
`queued → check (install → lint → unit → e2e, which builds dist/) → [fail: stop, production unchanged] → deploy (skipped for fork PRs) → live`. A newer push to the same ref moves any older run to `cancelled`.

**API surface** (the workflow's triggers and steps; there's no HTTP API):
| Trigger / step | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| `push` to `main` | workflow run | the commit | a production deploy | none (runs in your repo) | check fails → no deploy |
| `pull_request` (opened, synchronize, reopened) | workflow run | the PR head | a preview deploy or a skip | fork PRs get no secrets | fork → deploy skipped on purpose |
| `check` job | `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm test --run`, `pnpm exec playwright install --with-deps chromium`, `pnpm test:e2e` | `SITE_URL`, `CI=true` | `dist/` uploaded as an artifact (a file bundle handed between jobs) | none | any nonzero exit fails the job |
| `deploy` job | `wrangler pages deploy dist --project-name=jeffrey-ankrah --branch=<branch>` | `dist/` artifact, both secrets | the deployment URL | `CLOUDFLARE_API_TOKEN` | a bad token (401) fails the job, and production stays unchanged |

**Value sourcing**:
| Action | Value produced / displayed | Source |
|---|---|---|
| Build | the site origin in every absolute URL | the workflow level `env: SITE_URL: https://jeffrey-ankrah.pages.dev` (a literal in `deploy.yml`, not a secret), read by `astro.config.ts` (spec 0001) |
| Deploy | the Cloudflare project | the literal `jeffrey-ankrah` in `deploy.yml` |
| Deploy | the branch, which picks production or preview | `github.head_ref` on a pull request, `github.ref_name` (`main`) on a push. Cloudflare treats the project's production branch (`main`) as production and every other branch as a preview |
| Deploy | the account to deploy into | the repo secret `CLOUDFLARE_ACCOUNT_ID` |
| Deploy | the permission to deploy | the repo secret `CLOUDFLARE_API_TOKEN` (an account token with only `Cloudflare Pages: Edit`) |
| Deploy | the Node and pnpm versions | `.nvmrc` through `actions/setup-node` `node-version-file`, and `package.json` `packageManager` through `pnpm/action-setup` |
| Preview | the noindex header | Cloudflare Pages' default on preview URLs (no code) |
| Fork check | whether to deploy | `github.event_name == 'push' \|\| github.event.pull_request.head.repo.full_name == github.repository` |

**Key invariants**:
- `deploy` runs only when `check` succeeded (`needs: check`), and it uploads the exact `dist/` that `check` tested. There's no second build.
- Production changes only from a push to `main`.
- Secrets are never committed and never exposed to fork pull requests.
- `output: 'static'` and no adapter stay the way they are. The host serves files only.

**Security model**: The repo is public, while the secrets stay in GitHub encrypted secrets. The API token is scoped to Pages edit on one account, with no zone or DNS rights. The workflow sets `permissions: contents: read, deployments: write` (the latter so wrangler can post the deployment status on the PR). The `pull_request` trigger is used, never `pull_request_target`, so fork code never runs with secrets. There's no personal data beyond what the page already shows on purpose, so no compliance scope applies.

**Configuration required**:
- `CLOUDFLARE_API_TOKEN` (GitHub repo secret): lets wrangler upload deployments. Create it in the Cloudflare dashboard with only `Account · Cloudflare Pages · Edit`.
- `CLOUDFLARE_ACCOUNT_ID` (GitHub repo secret): the account that owns the project. It isn't truly secret, but keeping it next to the token is tidy.
- `SITE_URL=https://jeffrey-ankrah.pages.dev`: set in `deploy.yml` and mirrored in `.env.example`.
- Prerequisites to do by hand before the first run: a Cloudflare account, the Pages project `jeffrey-ankrah` created as direct upload with production branch `main`, and a public GitHub repo with `origin` added.

**Critical test scenarios**:
- Happy path: push to `main`, the run goes green, and `curl -I https://jeffrey-ankrah.pages.dev` returns `HTTP/2 200`. Verifies **AC-1**, **AC-2**.
- Origin: view source on production. Canonical, `og:url`, `og:image`, and the JSON-LD `url` all start with `https://jeffrey-ankrah.pages.dev`, and so do `/robots.txt` and `/sitemap-index.xml`. Verifies **AC-5**.
- Failure case: a PR with a test broken on purpose fails `check`, `deploy` is skipped, and production is unchanged. Verifies **AC-3**.
- Preview: a same repo PR posts a preview URL, and `curl -I` on it shows `x-robots-tag: noindex`. Verifies **AC-4**, **AC-6**.
- Fork / permission: a fork PR runs `check`, `deploy` shows as skipped, and the run is green. Verifies **AC-4**.
- Concurrency: two quick pushes to one branch cancel the first run. Verifies **AC-7**.

## Build plan

Skateboard: get the thinnest real site live first, then add the gate and previews on top.

1. Create the public GitHub repo, add `origin`, push `main` (plus this feature branch). Satisfies **AC-2** (prerequisite)
2. Create the Cloudflare account and the Pages project `jeffrey-ankrah` (direct upload, production branch `main`). Create the scoped API token and add `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` as repo secrets. Satisfies **AC-1**
3. Set `SITE_URL=https://jeffrey-ankrah.pages.dev` in `.env.example`, and update the placeholder comment there and the `SITE_URL` fallback wording in `CLAUDE.md`/`AGENTS.md` through `/sync` later. Satisfies **AC-5**
4. Add `.github/workflows/deploy.yml` with triggers, `concurrency`, `permissions`, and the `check` job (setup pnpm and Node, frozen install, lint, `pnpm test --run`, install Playwright chromium, `pnpm test:e2e`, upload `dist/`). Satisfies **AC-3**, **AC-7**
5. Add the `deploy` job (`needs: check`, the fork guard `if`, download `dist/`, `cloudflare/wrangler-action@v3` with `pages deploy dist --project-name=jeffrey-ankrah --branch=...`). Satisfies **AC-2**, **AC-4**
6. Push to `main` and check it live: HTTPS 200 on the four paths, the real origin in the head and the sitemap. Satisfies **AC-1**, **AC-5**
7. Open a test PR: confirm the preview URL, the noindex header, and a skipped deploy on a broken check. Satisfies **AC-3**, **AC-4**, **AC-6**

## Consequences

**Positive**:
- The site is live for free, with HTTPS, a CDN, and no server to run.
- Nothing untested reaches production, and rollback is one click in Cloudflare's deployment list.
- Previews let you review changes on a real URL before you merge them.
- The social card, sitemap, and robots file finally point at the real origin (they close the gaps left open in specs 0001 and 0006).

**Negative / tradeoffs**:
- Each run installs Chromium and builds for e2e, so a deploy takes a few minutes instead of seconds.
- You now depend on two accounts (GitHub and Cloudflare) and have one token to rotate if it leaks.
- `SITE_URL` sits in two places (`deploy.yml` and `.env.example`), and a later custom domain has to change both.
- A direct upload project can't be switched to Cloudflare's git integration later without creating a new project.

**Neutral**:
- The `jeffrey-ankrah.pages.dev` name must be free when you create the project. If it's taken, choose a close variant and use it everywhere `jeffrey-ankrah` appears in this spec.
- Cloudflare also serves every deploy at a hash URL (`<hash>.jeffrey-ankrah.pages.dev`). Those count as previews and get noindex.

## Follow-up

- [ ] Custom domain: add it in Cloudflare Pages, then change `SITE_URL` in `deploy.yml` and `.env.example`.
- [ ] Resume: add `public/resume.pdf` and `resume: /resume.pdf` in `profile.yaml` (feature 8 deferred it to here, and you chose to ship without it).
- [ ] After the first deploy, check the live social card with a link preview debugger (spec 0006 follow up).
- [ ] Tick the spec 0001 feature 10 follow ups (the host chosen with commercial use in mind, and `SITE_URL` replaced).
- [ ] Optional: turn on branch protection for `main` that requires the `check` job, so merges wait for green.
- [ ] Optional: ask whether to look for a Cloudflare or wrangler Agent Skill or MCP server before building.
