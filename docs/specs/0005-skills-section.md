# 0005. Skills section as static group cards

**Date**: 2026-09-18
**Status**: Accepted

## Summary

The skills section shows each group from `src/content/skills.yaml` as a card. Each card has the group name as a heading and the skills as `Tag` chips. It is plain Astro markup built at build time, with no React island, because nothing on it holds state. Cards sit in one column on phones, two from tablet width, and three from laptop width. The section comes right after Projects. If the data file is empty, the whole section is hidden.

## Context

This is feature 7 in the scope. Spec 0002 already fixes the data: each group has `group` (a unique name), `items` (at least one), and a unique `order`. This spec covers only how that data shows on the page. The data model does not change.

The design system (spec 0003) already provides `Section`, `Card`, and `Tag` in `src/components/ui/`. Spec 0004 set the pattern for a section: sort by `order`, hide the section when the list is empty, and use a `<ul role="list">` grid. The build approach is Skateboard and the tier is Alpha. Today there are five groups, with 2 to 6 items each.

## Requirements

**User stories**:
- As a recruiter, I want to scan your skills by area, so I can match them to a role quickly.
- As a screen reader user, I want each group announced by name, so I can jump to the area I care about.

**Acceptance criteria**:
- **AC-1**: Every entry in `skills.yaml` renders as exactly one group card, in ascending `order`. Items inside a group keep their YAML order.
- **AC-2**: Each group shows its name as an `h3`, and its items as a `<ul role="list">` labelled by that heading (`aria-labelledby`), with one `Tag` per item.
- **AC-3**: The grid is one column below `md`, two columns at `md`, and three at `lg`. At 375px wide the page has no horizontal scroll, and long groups wrap their chips.
- **AC-4**: When the collection is empty, no skills section, heading, or `#skills` element renders, and the build still passes.
- **AC-5**: axe reports no violations in the light and dark color schemes.
- **AC-6**: The section renders after Projects, with its data read through `getCollection('skills')` in `src/pages/index.astro`.

## Options considered

### Option 1: Group cards in a grid (chosen)
**Pros**: It matches the project cards, reuses `Card` and `Tag`, and ships no JavaScript.
**Cons**: The cards are short, so they take more vertical space than rows would on phones.

### Option 2: Label rows, no cards
**Pros**: Compact and light.
**Cons**: It looks different from the rest of the page, and a long label column squeezes the chips on phones.

### Option 3: React island with filtering
**Cons**: It adds state and JavaScript for five short lists. That breaks the `.astro` first rule for no benefit.

## Decision

**Chosen option**: Option 1, group cards in a grid.

Build one `Skills.astro` component, rendered at build time from `getCollection('skills')`, and place it after `<Projects>` on the home page.

**Implementation skills**: `astro` (`.agents/skills/astro/`) · `tailwind-4-docs` (`.agents/skills/tailwind-4-docs/`) · `playwright-cli` (`.agents/skills/playwright-cli/`) · `vitest` (`.agents/skills/vitest/`)

## Rationale

Nothing here changes after load, so static markup is enough. Cards keep the page visually consistent with Projects. An `h3` per group gives heading navigation, and a labelled list announces the group name and item count, which is what "screen readers announce the groups" means in the scope. Three columns fit short groups on desktop without leaving empty space. Chips wrap with no cap, because you control the list length in YAML, and a "show more" button would need an island.

## Feature design

**Data model sketch**: No change. It reads the `skills` collection in `src/content.config.ts` (spec 0002).

**State transitions**: None.

**API surface** (component props, no HTTP):
| Component | Inputs | Output | Notes |
|---|---|---|---|
| `src/components/sections/Skills.astro` | `skills: CollectionEntry<'skills'>[]` | `Section id="skills" title="Skills"` with a `<ul>` grid of group cards, or nothing if the list is empty | Sorts by `data.order` ascending |
| `src/pages/index.astro` | none | Renders `<Skills skills={skills} />` after `<Projects>` | Adds `const skills = await getCollection('skills')` |

**Value sourcing**:
| Action | Value | Source |
|---|---|---|
| Render group | group name, items | `getCollection('skills')` entry `data.group`, `data.items` |
| Sort groups | order | `data.order`, ascending (unique, enforced by spec 0002) |
| Heading id | `skill-group-{n}` | Decided here: `n` is the 0 based index after sorting, from `sorted.map((entry, n) => …)`, so today `skill-group-0` to `skill-group-4`. It is always unique and valid, with no slug logic. Runner up: a slug of the group name, which needs handling for `&` and collisions |
| List name | the group name | `aria-labelledby` pointing at the heading id |
| Breakpoints | `md` 768px, `lg` 1024px | Tailwind defaults, not overridden in `src/styles/global.css` |
| Gaps | `gap-6` for the grid, `gap-2` for the chips | Same as spec 0004 |

**Build details**:
- Markup per group: `<li class="grid"><Card><div class="flex h-full flex-col gap-4"><h3 id={headingId} class="text-h3 font-semibold tracking-tight">{group}</h3><ul role="list" aria-labelledby={headingId} class="flex flex-wrap gap-2">{items.map(i => <li><Tag>{i}</Tag></li>)}</ul></div></Card></li>`. `Card` takes no `class`, so the inner flex column spaces the heading and chips (no margins), and the `h3` classes match `ProjectCard.astro`.
- Outer list: `<ul role="list" class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">`. `li class="grid"` stretches cards in a row to equal height.
- Empty guard: wrap the whole output in `{sorted.length > 0 && (<Section …>…</Section>)}`, as in `Projects.astro`.
- The e2e test follows `tests/e2e/projects.spec.ts`: it reads expected groups and items from `src/content/skills.yaml` with `js-yaml`, and uses `page.emulateMedia({ colorScheme })` with the same axe tags.

**Key invariants**: Heading ids are unique on the page. The page keeps one `h1`, the section is an `h2`, and groups are `h3`. No element here is interactive.

**Security model**: Public, read only content. No user input, no links.

**Critical test scenarios**:
- Happy path: the built page shows 5 group headings in YAML order, and each list's accessible name equals its group and holds the right items in order. `#skills` comes after `#projects` in document order. Verifies **AC-1**, **AC-2**, **AC-6**
- Layout: 1 column at 375px (no horizontal scroll), 2 columns at 900px, 3 columns at 1280px (count distinct card left offsets in the first row). Verifies **AC-3**
- Accessibility: axe runs clean in both color schemes. Verifies **AC-5**
- Empty and sort: `src/components/sections/Skills.test.ts` renders with fixture props through the Astro Container API (the pattern in `Projects.test.ts`). It checks that an empty list gives no section, and that out of order input renders sorted. Verifies **AC-1**, **AC-4**

## Build plan

1. Build `Skills.astro` (sort, empty guard, `Section`, a `Card` per group with an `h3` and a labelled chip list) and wire it into `index.astro` after Projects. Satisfies **AC-1**, **AC-2**, **AC-4**, **AC-6**
2. Add the responsive grid: `grid gap-6 md:grid-cols-2 lg:grid-cols-3`, and `flex flex-wrap` chips. Satisfies **AC-3**
3. Add `tests/e2e/skills.spec.ts`: headings, list names, and order against the YAML, `#skills` after `#projects`, the 375px, 900px, and 1280px layout, and axe in both schemes. Satisfies **AC-1**, **AC-2**, **AC-3**, **AC-5**, **AC-6**
4. Add `src/components/sections/Skills.test.ts`: Container API tests for the empty list and the out of order input. Satisfies **AC-1**, **AC-4**

## Consequences

- Adding a skill or group is still one YAML edit, with no code change.
- There are no proficiency levels or icons. Adding either would mean a schema change in spec 0002.

## Follow-up

- If a site nav is added later, link it to `#skills`.
