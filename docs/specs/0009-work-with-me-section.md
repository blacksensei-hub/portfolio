# 0009. Work with me section from a services collection

**Date**: 2026-09-19
**Status**: In Progress

## Summary

A new "Work with me" section lists the freelance services you offer as cards. It also shows your current availability as a small badge and has a "Get in touch" button that jumps to Contact. Services live in a new `src/content/services.yaml` file, and availability is a new optional field on your profile, so updating either one is a YAML edit, not a code change. The section is plain Astro markup built at build time (no React island). It sits between Skills and Contact.

## Context

This is feature 12 in the scope (Release 2). Freelance clients see your projects and skills, but nothing says what they can hire you for or whether you are taking work. The scope's done line is: services and a call to action render from the content files and link to your contact options.

Spec 0002 owns the content model: one strict Zod schema per YAML file, with `keyedList` enforcing unique keys and unique `order`, and a bad entry fails the build. Spec 0003 provides `Section`, `Card`, and `ButtonLink`, but has no status colors. Specs 0004 and 0005 set the section pattern: sort by `order`, hide the section when the list is empty, use a `<ul role="list">` grid. Contact already exists at `#contact`. The build approach is Skateboard and the tier is Alpha.

## Requirements

**User stories**:
- As a freelance client, I want to see the services you offer, so I can tell if you fit my project.
- As a freelance client, I want to know if you are taking work right now, so I don't reach out for nothing.
- As a freelance client, I want one clear next step, so I can contact you without hunting for it.

**Acceptance criteria**:
- **AC-1**: Every entry in `services.yaml` renders as exactly one card with its `title` as an `h3` and its `blurb` as text, in ascending `order`, inside `Section id="work-with-me" title="Work with me"`.
- **AC-2**: A bad services or availability entry fails the build: a duplicate `title`, a duplicate `order`, an empty `title`, an empty `blurb` or one over 280 characters, an unknown key, an `availability.status` outside `open`, `limited`, `closed`, or an empty `availability.note` or one over 160 characters.
- **AC-3**: When `profile.availability` is set, a badge shows the status label (`open` → "Available", `limited` → "Limited availability", `closed` → "Booked") colored by that status's token, followed by the `note`. When `availability` is absent, no badge renders and the services still render.
- **AC-4**: A "Get in touch" `ButtonLink` with `href="#contact"` renders under the cards in every availability state, including `closed`.
- **AC-5**: When the services collection is empty, no `#work-with-me` section, heading, badge, or button renders, and the build still passes.
- **AC-6**: The grid is one column below `md`, two at `md`, and three at `lg`. At 375px wide the page has no horizontal scroll.
- **AC-7**: axe reports no violations in light and dark. Each status token has at least 3:1 contrast against `--color-surface` in every theme block, and the status meaning never relies on color alone.
- **AC-8**: The section renders after Skills and before Contact, with services read through `getCollection('services')` and availability through the existing `getEntry('profile', 'profile')` in `src/pages/index.astro`.

## Options considered

### Option 1: New `services` collection plus `profile.availability` (chosen)
**Pros**: Reuses `keyedList` and `reportDefects` as they are. Availability describes you, so it sits on the profile, like `resume`.
**Cons**: The data for one section is split across two files.

### Option 2: One `work.yaml` singleton holding services and availability
**Pros**: Everything for the section is in one file.
**Cons**: It needs a third parser shape (a mapping holding a list), plus its own duplicate checks, which is new code for no gain.

### Option 3: Everything on `profile`
**Pros**: No new collection.
**Cons**: It puts a list inside the singleton, breaking the one list per collection pattern, and duplicate checks would have to be rewritten in Zod.

## Decision

**Chosen option**: Option 1, a new `services` collection plus an optional `availability` object on `profile`.

Build one `WorkWithMe.astro` component at build time and place it between `<Skills>` and `<Contact>`. Add three status color tokens to the design system.

**Implementation skills**: `astro` (`.agents/skills/astro/`) · `tailwind-4-docs` (`.agents/skills/tailwind-4-docs/`) · `vitest` (`.agents/skills/vitest/`) · `playwright-cli` (`.agents/skills/playwright-cli/`)

## Rationale

Every existing list uses the same parser and error reporting, so a fourth keyed list is the least new code and fails the build in the same readable way (spec 0002). Keying on `title` matches `skills` keying on `group`: titles must be unique anyway, and nothing links to a service, so a `slug` would just be one more field to maintain. The blurb cap is 280 (same as a project summary), not the 160 first proposed, because your real copy runs to about 190 characters and cutting it would make it worse.

Linking the CTA to `#contact` keeps one place for all your contact routes, so adding a channel later means one edit. It stays visible when you are booked, because a booked freelancer still wants enquiries for later work. The badge text carries the meaning and the color only reinforces it, which is what WCAG asks for. That is why new status tokens are worth the small design system cost, and why they only need 3:1 (the non text contrast bar), not 4.5:1.

## Feature design

**Data model sketch** (extends spec 0002):

| Entity | Field | Type | Rules |
|---|---|---|---|
| `services` (new collection, `src/content/services.yaml`, `keyedList('services', 'title')`) | `title` | string | required, non empty, unique (the entry id) |
| | `blurb` | string | required, 1 to 280 chars |
| | `order` | int | required, ≥ 0, unique |
| `profile.availability` (new optional object on `profileSchema`) | `status` | enum `open` \| `limited` \| `closed` | required inside the object |
| | `note` | string | required, 1 to 160 chars |

No relationships. Both objects use the `unknownKey` catchall. `services` uses `reportDefects(serviceSchema, 'services', 'title')`. On `profileSchema` the whole object is optional, `availability: availabilitySchema.optional()`, while `status` and `note` are required inside it; `availabilitySchema` also gets `.catchall(unknownKey)`.

Starting content in `services.yaml` (your copy, as given):

| order | title | blurb |
|---|---|---|
| 0 | Web Application Development | Full-stack web apps built with React, Node.js, and PostgreSQL. From concept to deployment, with a focus on clean code, fast load times, and a UI that feels right. |
| 1 | Mobile App Development | Cross-platform iOS and Android apps with React Native and Expo. One codebase, native feel, and a smooth path from prototype to app store. |
| 2 | API & Backend Development | REST APIs, database design, and backend services with Node.js and PostgreSQL. Built for correctness first: typed inputs, safe migrations, and tests that catch mistakes before your users do. |
| 3 | Technical Consulting | Code reviews, architecture feedback, and pair-programming sessions for teams or solo developers. Practical, specific advice you can act on. |

`profile.yaml` gains `availability: { status: open, note: "Open to freelance projects and part-time contracts." }`.

**State transitions**: None at runtime. `status` is set by hand in YAML.

**API surface** (component props, no HTTP):

| Component | Inputs | Output | Notes |
|---|---|---|---|
| `src/components/sections/WorkWithMe.astro` | `services: CollectionEntry<'services'>[]`, `availability?: { status, note } \| undefined` | `Section id="work-with-me" title="Work with me"` with optional badge, card grid, CTA; or nothing when `services` is empty | Sorts by `data.order` ascending |
| `src/pages/index.astro` | none | `<WorkWithMe services={services} availability={profile.availability} />` between `<Skills>` and `<Contact>` | Adds `const services = await getCollection('services')` |

**Value sourcing**:

| Action | Value | Source |
|---|---|---|
| Render card | title, blurb | `getCollection('services')` entry `data.title`, `data.blurb` |
| Sort cards | order | `data.order` ascending (unique, enforced by `keyedList`) |
| Badge label | "Available" / "Limited availability" / "Booked" | Decided here: a `Record<status, string>` in the component, keyed on the schema enum so a new status fails type checking until it has a label |
| Badge color | status token | `--color-status-open`, `--color-status-limited`, `--color-status-closed` in `src/styles/global.css` (new, in `@theme` and both dark blocks), applied through a literal class map |
| Badge note | note | `profile.availability.note` |
| Section title | "Work with me" | Hardcoded, like "Contact" |
| CTA | "Get in touch", `#contact` | Hardcoded; the target is the `id` of `Contact.astro`'s `Section` |
| Breakpoints, gaps | `md`, `lg`, `gap-6` | Tailwind defaults, same as spec 0005 |

**Build details**:
- Badge (above the grid): `<p class="mb-6 inline-flex items-center gap-2 text-on-surface">` with a decorative `aria-hidden` dot (`size-2.5 rounded-full` plus the status class), then `<strong>{label}</strong>`, then the note. Text uses `--color-on-surface`, so text contrast is already covered by spec 0003.
- The dot class comes from a `Record<status, string>` of full literal class names (`open: 'bg-status-open'`, and so on), next to the label map. Never build it as `bg-status-${status}`: Tailwind 4 only generates classes it finds written out in full in source.
- Tokens: add these to the `@theme` block (light) and to both dark blocks, the `prefers-color-scheme: dark` block and the `[data-theme="dark"]` block, so the parity test in `src/styles/tokens.test.ts` passes (the `[data-theme="light"]` block holds no tokens, so leave it alone). Starting values, which the build nudges only if the contrast test fails:

  | Token | Light | Dark |
  |---|---|---|
  | `--color-status-open` | `oklch(55% 0.15 150)` | `oklch(75% 0.15 150)` |
  | `--color-status-limited` | `oklch(62% 0.15 75)` | `oklch(80% 0.14 80)` |
  | `--color-status-closed` | `oklch(55% 0.19 25)` | `oklch(72% 0.16 25)` |

- Contrast: add `['status-open', 'surface', 3]`, `['status-limited', 'surface', 3]`, and `['status-closed', 'surface', 3]` to the `pairs` table in `src/styles/tokens.test.ts`, which already checks every theme.
- Card: `<li class="grid"><Card><h3 class="text-h3 font-semibold tracking-tight">{title}</h3><p class="mt-2 text-muted">{blurb}</p></Card></li>`, inside `<ul role="list" class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">`.
- CTA: `<div class="mt-8"><ButtonLink href="#contact">Get in touch</ButtonLink></div>`.
- Empty guard wraps everything: `{sorted.length > 0 && (<Section …>…</Section>)}`.
- Update the consumer contract in `src/content/AGENTS.md` with the `services` collection and `profile.availability`.

**Key invariants**: One `h2` for the section, `h3` per service. Status meaning is always in text. `#contact` exists whenever links or a resume exist; if Contact is hidden, the CTA points at nothing (see Consequences).

**Security model**: Public, read only content from the repo. No user input.

**Configuration required**: None.

**Critical test scenarios**:
- Happy path (e2e, `tests/e2e/work-with-me.spec.ts`): the built page shows 4 service headings in YAML order (read from `services.yaml` with `js-yaml`), the "Available" badge with the note, and a "Get in touch" link to `#contact`. `#work-with-me` comes after `#skills` and before `#contact`. Verifies **AC-1**, **AC-3**, **AC-4**, **AC-8**
- Bad data (unit, `src/content.config.test.ts`): duplicate title, duplicate order, 281 char blurb, unknown key, and `status: busy` each fail. Verifies **AC-2**
- States (unit, `src/components/sections/WorkWithMe.test.ts`, Container API like `Skills.test.ts`): empty list gives no section; out of order input renders sorted; each status gives its label and token class; no availability gives no badge but cards and CTA; `closed` still has the CTA. Verifies **AC-1**, **AC-3**, **AC-4**, **AC-5**
- Layout: 1, 2, and 3 columns at 375px, 900px, 1280px, and no horizontal scroll at 375px. Verifies **AC-6**
- Accessibility: axe clean with each theme forced (spec 0008 pattern), plus the status token contrast unit test. Verifies **AC-7**

## Build plan

Skateboard: the data lands first so the section has something real to show, then the section, then the tests that lock it in.

1. Add `serviceSchema` and the `services` collection, the `availability` object on `profileSchema`, `services.yaml` with your four services, the `availability` line in `profile.yaml`, schema tests, and the `src/content/AGENTS.md` contract update. Satisfies **AC-2**
2. Add the three status tokens to all three theme blocks, and the ≥3:1 contrast check. Satisfies **AC-7**
3. Build `WorkWithMe.astro` (sort, empty guard, badge, card grid, CTA), wire it into `index.astro` between Skills and Contact, and add `WorkWithMe.test.ts`. Satisfies **AC-1**, **AC-3**, **AC-4**, **AC-5**, **AC-6**, **AC-8**
4. Add `tests/e2e/work-with-me.spec.ts` (content, order, placement, layout, axe per theme) and a status badge entry in `design.md`. Satisfies **AC-1**, **AC-3**, **AC-4**, **AC-6**, **AC-7**, **AC-8**

## Consequences

**Positive**:
- Changing services or availability is one YAML edit, and a typo fails the build.
- The status tokens are reusable for any later status UI.

**Negative / tradeoffs**:
- Availability goes stale silently: there is no date, so you have to remember to update it.
- If you ever remove every contact link and the resume, Contact hides itself and the CTA jumps nowhere. That is acceptable today (you have four links), but it is not guarded.
- Three more tokens to keep in step across three theme blocks.

**Neutral**:
- Spec 0002's content model gains a fifth collection shape and an optional profile field.
- No JSON-LD change; services are visible HTML only.

## Follow-up

- [ ] Mark spec 0002 as extended by 0009 (new `services` collection and `profile.availability`) when this ships.
- [ ] If a site nav is added later, link it to `#work-with-me`.
