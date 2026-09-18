# 0002. Model site content as four YAML backed content collections

**Date**: 2026-09-17
**Status**: In Progress

## Summary

Every section of the portfolio reads its text from data files instead of having it typed into the page. This spec defines four of them: your profile, your projects, your skills, and your contact links. Each is a YAML file (a plain text format that is easy to hand edit) validated by a schema, so a typo or a missing field fails the build instead of shipping a broken page. Updating the site means editing one file, with no code change.

## Requirements

**User stories**:
- As the site owner, I want to add or edit a project by changing one data file, so that updating my portfolio never means touching component code.
- As the site owner, I want a malformed entry to fail the build, so that a typo cannot reach the live site.
- As a section builder (features 5 to 8), I want typed content read through `getCollection` and `getEntry`, so that I render data without knowing where it is stored.

**Acceptance criteria**:
- **AC-1**: Four collections (`profile`, `projects`, `skills`, `links`) are defined in `src/content.config.ts` and readable through `getCollection` / `getEntry` with full TypeScript types under `strictest`.
- **AC-2**: Adding, editing, or removing a project, skill, or link requires editing exactly one YAML file and no code.
- **AC-3**: An entry that violates its schema fails `pnpm build`, and the error identifies the collection and the offending field. (Astro owns the message format; the build plan verifies the message is good enough to locate the problem, and adds a clearer schema message if it is not.)
- **AC-4**: An unknown key in any entry is an error, not silently ignored.
- **AC-5**: Every `href`, `demoUrl`, and `repoUrl` must be a valid absolute URL, and every project must carry at least one of `demoUrl` or `repoUrl`.
- **AC-6**: Project slugs are unique across the `projects` collection; a duplicate fails the build.
- **AC-7**: Display order for `projects`, `skills`, and `links` is determined solely by each entry's numeric `order` field, ascending. `order` values are unique within a collection, so the ordering is total and no tie break is needed.
- **AC-8**: A project `image` resolves to an optimised build time asset, and a path pointing at a missing file fails the build.
- **AC-9**: `profile` holds exactly one entry, read with `getEntry('profile', 'profile')`. A `profile.yaml` with zero keys, or more than one, fails the build.
- **AC-10**: When a collection is empty, the consuming section renders nothing at all, no heading and no empty container. When an optional field is absent, only that element is omitted.
- **AC-11**: The four YAML files ship containing the owner's real content, not placeholder text.

## Decision

**Chosen option**: Option 1: four YAML data collections, one file per collection, with strict Zod schemas

Define `profile`, `projects`, `skills`, and `links` as Astro content collections, each loaded with the `file()` loader from a single YAML file under `src/content/`, each validated by a strict Zod schema in `src/content.config.ts`.

**Implementation skills**: `astro` (`astrolicious/agent-skills`, `.agents/skills/astro/`) · `vitest` (`antfu/skills`, `.agents/skills/vitest/`)

## Rationale

See [rationale.md](rationale.md) for the context, the options weighed, and the reasoning.

## Feature design

**Data model sketch**:

All four collections are independent. There are no cross collection references, so there are no foreign keys and no join to resolve at render time.

`profile` — `src/content/profile.yaml`, a single entry keyed `profile`

The `file()` loader reads a YAML map of id to entry, so the fields sit **under** a top level `profile` key. That key is the entry id, and the file must contain exactly that one key:

```yaml
profile:
  name: ...
  role: ...
  tagline: ...
  bio: ...
  email: ...
  resume: /resume.pdf
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | string, non-empty | yes | |
| `role` | string, non-empty | yes | e.g. "Full stack developer" |
| `tagline` | string, non-empty, max 160 | yes | the one line pitch in the hero |
| `bio` | string, non-empty | yes | the short about paragraph |
| `email` | string, email format | yes | |
| `resume` | string, must start `/` | no | a path into `public/`, e.g. `/resume.pdf`. Not an `astro:assets` asset: the image pipeline handles images only, and a PDF has nothing to optimise, so it is served as a static file. |

`projects` — `src/content/projects.yaml`, an array; key is `slug`

| Field | Type | Required | Notes |
|---|---|---|---|
| `slug` | string matching `^[a-z0-9]+(-[a-z0-9]+)*$`, unique | yes | the collection key |
| `title` | string, non-empty | yes | |
| `summary` | string, non-empty, max 280 | yes | the card body |
| `tech` | array of non-empty strings, min 1 | yes | |
| `demoUrl` | url | no | at least one of `demoUrl` / `repoUrl` required |
| `repoUrl` | url | no | |
| `image` | `image()` | no | resolved through `astro:assets` |
| `order` | integer >= 0 | yes | ascending |

`skills` — `src/content/skills.yaml`, an array; key is `group`

| Field | Type | Required | Notes |
|---|---|---|---|
| `group` | string, non-empty, unique | yes | the collection key, and the group heading |
| `items` | array of non-empty strings, min 1 | yes | |
| `order` | integer >= 0 | yes | ascending |

`links` — `src/content/links.yaml`, an array; key is `label`

| Field | Type | Required | Notes |
|---|---|---|---|
| `label` | string, non-empty, unique | yes | the collection key, and the accessible name |
| `href` | url | yes | |
| `icon` | `z.enum(['github', 'linkedin', 'email', 'x'])` | yes | an icon key the contact section maps to a glyph. An enum, not a free string, so a typo fails the build instead of rendering a missing glyph. Extend the enum when a link needs a key that is not listed. |
| `order` | integer >= 0 | yes | ascending |

**State transitions**: none. Content entries have no lifecycle; they exist or they do not.

**API surface**: none. `output: 'static'` with no adapter, so there are no endpoints. The interface is the content collection API consumed at build time:

| Consumer | Call | Returns |
|---|---|---|
| Hero & about (feature 5) | `getEntry('profile', 'profile')` | the single profile entry, or `undefined` |
| Projects (feature 6) | `getCollection('projects')` | every project, sorted by the caller on `order` |
| Skills (feature 7) | `getCollection('skills')` | every group, sorted by the caller on `order` |
| Contact (feature 8) | `getCollection('links')` | every link, sorted by the caller on `order` |

Under `strictest`, `getEntry` returns `T | undefined`; consumers must handle the absent case per AC-10 rather than asserting non-null.

**Value sourcing**:

| Action | Value produced / displayed | Source |
|---|---|---|
| Render hero | name, role, tagline, bio | `profile` entry fields |
| Render hero | the email link target | `profile.email`, prefixed `mailto:` by the section |
| Render contact | resume download URL | `profile.resume`, a root relative path into `public/` used verbatim as the `href` |
| Render project card | title, summary, tech list | `projects` entry fields |
| Render project card | which links the card shows | presence of `demoUrl` / `repoUrl`; AC-5 guarantees at least one |
| Render project card | optimised image and its dimensions | `astro:assets` from the `image()` field |
| Render project card | image alt text | exactly `Screenshot of {title}`, built by the section from `title`. No separate alt field, because every image here is a screenshot of the named project, and pinning the template keeps the four sections from inventing different wording. |
| Render any list | display order | the entry's `order` field, ascending. Unique within a collection, so no tie break is required. |
| Render skills | group heading text | `skills` entry `group`, which is also the key |
| Render contact | accessible link name | `links` entry `label` |
| Render contact | the icon glyph | `links` entry `icon`, mapped to a glyph by the section (the map lives in the section, not the data) |
| Any section | whether to render at all | whether its collection or entry is empty or absent (AC-10) |

**Key invariants**:
- `projects[].slug` is unique; it is the collection key, so Astro enforces it and a duplicate is a build error.
- `skills[].group` and `links[].label` are likewise unique keys.
- Every project has at least one of `demoUrl` / `repoUrl`, enforced by a Zod refinement.
- Every schema object is `.strict()`; an unknown key is an error.
- `order` is an integer >= 0 and unique within its collection, enforced by a collection level Zod refinement. A duplicate is a build error, so the ordering is always total.
- `profile.yaml` contains exactly one top level key, `profile`.
- No section may read a YAML file directly. All reads go through `getCollection` / `getEntry`.

**Security model**: every field is public content that ships in the built HTML. Nothing here is a secret, and nothing is user supplied at runtime, so there is no authorisation model and no injection surface. The email address is published deliberately, which is what feature 8 wants.

**Configuration required**: none. No new environment variables and no credentials.

**Critical test scenarios**:
- Happy path: a fully populated entry in each of the four files parses, and `getCollection` / `getEntry` return typed data, verifies **AC-1**, **AC-9**.
- Failure case: a malformed `href`, an unknown key, a duplicate slug, and a project with neither `demoUrl` nor `repoUrl` each fail the build with a locating message, verifies **AC-3**, **AC-4**, **AC-5**, **AC-6**.
- Failure case: an `image` path pointing at a file that does not exist fails the build, verifies **AC-8**.
- Edge case: an empty `skills.yaml` parses cleanly and `getCollection` returns an empty array, so the section can omit itself, verifies **AC-10**.

## Build plan

Skateboard: all four sections land together in Release 1, so the content layer is one thin complete slice rather than four staged ones. There are no migrations; the schemas and their files land in one pass.

1. **Spike first, because it is the one unsettled technical question.** Define `projects` alone with the `file()` loader and an `image()` field, point one entry at a real file, and build. Confirm the image resolves and that a missing path fails the build, and record in `src/content/AGENTS.md` what an image path is relative to. **If it does not resolve cleanly from a YAML data file, take the decided fallback:** move project images to `public/`, change `image` to a string that must start `/`, and note in Consequences that the build time existence check was lost. Everything after this step uses whichever branch held, satisfies **AC-8**.
2. Replace the empty stub in `src/content.config.ts` with all four collections on the `file()` loader, and the strict Zod schemas above: `.strict()` objects, the slug pattern, the `icon` enum, the demo-or-repo refinement, the unique `order` refinement, and the exactly-one-key rule on `profile`, satisfies **AC-1**, **AC-4**, **AC-5**, **AC-6**, **AC-7**, **AC-9**.
3. Create `src/content/profile.yaml` (in the wrapping key shape shown above), `projects.yaml`, `skills.yaml`, and `links.yaml`, populated with the owner's real content, gathered by asking during the build, satisfies **AC-2**, **AC-9**, **AC-11**.
4. Place any supplied project screenshots per step 1's outcome, and the resume PDF at `public/resume.pdf`, then point the matching entries at them, satisfies **AC-8**.
5. Record the consumer contract in `src/content/AGENTS.md`: read through `getCollection` / `getEntry` only, sort ascending on `order`, alt text is `Screenshot of {title}`, and omit a section entirely when its collection is empty or its entry absent, satisfies **AC-7**, **AC-10**.
6. Write `src/content.config.test.ts` with Vitest cases proving a valid entry of each collection parses and each rejection rule rejects: bad url, unknown key, duplicate slug, bad slug pattern, unknown icon, no demo and no repo, duplicate `order`, satisfies **AC-3**, **AC-4**, **AC-5**, **AC-6**, **AC-7**.
7. Prove the loop end to end: read one collection from a page, run `pnpm build`, break one entry on purpose, and confirm the build fails with a message that actually locates the problem. If Astro's own message does not name the collection and field, add a Zod `message` that does, satisfies **AC-3**.

## Consequences

**Positive**:
- Content edits are one file change with no code touched, which is the bar the scope row sets.
- A bad entry is a build failure, not a broken live page.
- Features 5 to 8 start with a settled, typed contract, so none of them has to invent a data shape.
- Strict schemas plus `strictest` types mean a field rename surfaces at every call site immediately.

**Negative / tradeoffs**:
- `.strict()` means adding a field is a two step change: the schema first, then the data. That is deliberate friction, but it is friction.
- An explicit `order` field must be maintained by hand; reordering means renumbering rather than moving lines.
- Storing every entry of a collection in one file means a large projects list becomes a long file, and concurrent edits to it conflict more readily. Acceptable for a one person portfolio.
- Unique `order` values mean inserting a project between two others is a renumber, not a single edit.
- `icon` being an enum means adding a new link type is a schema change, not a data only change. That is the price of catching a typo at build time.
- Whether `image()` works with the `file()` loader is genuinely uncertain, which is why build step 1 is a spike with a decided fallback. If the fallback is taken, a broken image path stops being a build error and becomes a broken image on the page.
- Defining `links` and `profile` as collections is heavier than constants for what may only ever be four links, bought in exchange for one uniform read path.

**Neutral**:
- `services` (feature 12, Release 2) is deliberately not modelled here. It gets its own collection when that feature lands, following the same pattern.
- A future case study page (Deferred) would want a prose body on `projects`, which likely means moving that collection to Markdown with frontmatter. The other three are unaffected.
- The `icon` to glyph mapping lives in the contact section, so adding a new icon key is a code change. That is intentional: a glyph is presentation, not content.

## Follow-up

- [ ] Add a `services` collection when feature 12 (Work with me) is designed.
- [ ] Revisit the `projects` format if project case study pages leave Deferred; long prose wants Markdown frontmatter.
