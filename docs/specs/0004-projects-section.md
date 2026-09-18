# 0004. Projects section as a static card grid

**Date**: 2026-09-18
**Status**: In Progress

## Summary

The projects section shows each project from `src/content/projects.yaml` as a card: title, summary, tech tags, and links to the live demo and the code. It is plain Astro markup built at build time (no React island), because nothing on it holds state. Cards sit in one column on phones and two from tablet width up. If the data file is empty, the whole section is hidden.

## Context

Feature 6 in the scope. Spec 0002 already fixes the data. Each project has `slug`, `title`, `summary` (up to 280 characters), `tech` (at least one), `demoUrl` and/or `repoUrl` (at least one is required), an optional `image`, and a unique `order`. This spec covers only how that data shows on the page.

The design system (spec 0003, `design.md`) already provides `Section`, `Card`, `Tag`, and `Link` in `src/components/ui/`. The site is static (`output: 'static'`). The build approach is Skateboard and the tier is Alpha. Today there are two projects and neither has an image.

## Requirements

**User stories**:
- As a recruiter, I want to scan what you built and the tech you used, so I can judge fit quickly.
- As a freelance client, I want to open a live demo or the code in one click, so I can see the work for myself.

**Acceptance criteria**:
- **AC-1**: Every entry in `projects.yaml` renders as exactly one card, in ascending `order`.
- **AC-2**: Each card shows the title as an `h3`, the summary, and the tech as a list of `Tag` chips inside `<ul aria-label="Tech used">`.
- **AC-3**: A "Live demo" link renders only when `demoUrl` is set, and a "Source code" link only when `repoUrl` is set. Each `href` equals the data value. Each accessible name includes the project title (for example "Live demo, AttendX"), so every link name on the page is unique. Both links open in a new tab and announce that, through `Link`.
- **AC-4**: When `image` is set, the card shows an optimised `astro:assets` `<Image>` at its top, with `alt` equal to the title. When `image` is not set, no image element or empty slot renders.
- **AC-5**: The grid is one column below the `md` breakpoint and two columns at `md` and above. At 375px wide the page has no horizontal scroll.
- **AC-6**: When the collection is empty, no projects section, heading, or `#projects` element renders, and the build still passes.
- **AC-7**: axe reports no violations in the light and dark color schemes, and every card link can be reached with Tab and shows the focus style.

## Options considered

### Option 1: Static Astro components (chosen)
`Projects.astro` reads the collection and maps it to `ProjectCard.astro`.
**Pros**: No JavaScript is shipped. It follows the project rule to default to `.astro`. It reuses the existing UI components.
**Cons**: No filtering by tech without adding an island later.

### Option 2: React island with a tech filter
**Pros**: Visitors could filter by tech.
**Cons**: It ships JavaScript and state to handle two projects. It breaks the `.astro` first rule without a need.

## Decision

**Chosen option**: Option 1: Static Astro components.

Build the section as two `.astro` components, rendered at build time from `getCollection('projects')`.

**Implementation skills**: `astro` (`astrolicious/agent-skills`, `.agents/skills/astro/`) · `tailwind-4-docs` (`lombiq/tailwind-agent-skills`, `.agents/skills/tailwind-4-docs/`) · `playwright-cli` (`microsoft/playwright-cli`, `.agents/skills/playwright-cli/`)

## Rationale

Nothing in the section changes after load, so an island would add weight with no benefit. A tech filter only pays off with many projects. It can come later as an island around the same cards, with no change to the data. Two columns match the current two projects and still scale. Hiding an empty section fits the content contract (an empty file is valid, per spec 0002) better than a "coming soon" line on a live portfolio.

## Feature design

**Data model sketch**: No change. It reads the `projects` collection defined in `src/content.config.ts` (spec 0002).

**State transitions**: None.

**API surface** (component props, no HTTP):
| Component | Inputs | Output | Notes |
|---|---|---|---|
| `src/components/sections/Projects.astro` | `projects: CollectionEntry<'projects'>[]` | `Section id="projects" title="Projects"` with a `<ul>` grid of cards, or nothing if the list is empty | Sorts by `data.order` ascending |
| `src/components/sections/ProjectCard.astro` | `project: CollectionEntry<'projects'>['data']` | `Card` (`article`) containing image?, `h3`, summary, tech list, link row | The link row is pinned to the card bottom (`mt-auto` in a flex column), so links line up across cards |
| `src/pages/index.astro` | none | Renders `<Projects>` after `<About>` | Replaces the placeholder `await getCollection('projects')`, and keeps the collection read |

**Value sourcing**:
| Action | Value | Source |
|---|---|---|
| Render card | title, summary, tech, demoUrl, repoUrl, image | `getCollection('projects')` entry `data` |
| Sort cards | order | `data.order`, ascending (unique, enforced by spec 0002) |
| Image alt | alt text | `data.title` (decided here, since the schema has no alt field. Runner up: add an `imageAlt` field later) |
| Link names | "Live demo" / "Source code" + title | Fixed labels + `data.title` in a `sr-only` span |
| New tab notice | "(opens in a new tab)" | `Link` via `isExternal` |
| Grid breakpoint | `md` (768px) | Tailwind default, not overridden in `src/styles/global.css` |
| Card gap | `gap-6` | Decided here: one step wider than the `gap-4` used in `/styleguide` grids, so bordered cards read as separate. Tech tags use `gap-2` and the link row uses `gap-4`, as in the styleguide card sample |

**Build details (settled by the cross check)**:
- `Card` takes no `class`, so `ProjectCard` puts a `<div class="flex h-full flex-col gap-4">` inside the slot. The link row gets `mt-auto`.
- Link markup: `<Link href={demoUrl}>Live demo<span class="sr-only">, {title}</span></Link>`, and the same for "Source code". `Link` then adds " (opens in a new tab)" after it.
- Image: `<Image src={image} alt={title} widths={[400, 800]} sizes="(min-width: 768px) 50vw, 100vw" class="rounded-card aspect-video w-full object-cover" />`. Width and height come from the imported asset.
- Empty guard: `Projects.astro` wraps its whole output in `{sorted.length > 0 && (<Section …>…</Section>)}`.
- `md` is Tailwind's default 768px. `global.css` does not override it.
- The e2e test follows `tests/e2e/hero.spec.ts`: `page.emulateMedia({ colorScheme })` with the same `.withTags([...])` set. Expected titles, hrefs, and order are read from `src/content/projects.yaml` with `js-yaml`, not hardcoded.

**Key invariants**: At least one link per card (enforced by the schema refine). Cards are never wrapped in a link as a whole (the `Card` rule), so each link stays its own Tab stop. The grid is a `<ul role="list">` of `<li>`, so screen readers announce the count.

**Security model**: Public, read only content. No user input. External links use `rel="noopener noreferrer"` through `Link`.

**Critical test scenarios**:
- Happy path: the built page shows 2 cards in YAML order, with correct hrefs, and each link name includes the title. Verifies **AC-1**, **AC-2**, **AC-3**
- Layout: at a 375px viewport there is one column and no horizontal scroll. At 1280px there are two columns (compare card offsets). Verifies **AC-5**
- Accessibility: axe runs clean in both `colorScheme` values, and Tab reaches every card link. Verifies **AC-7**
- Image and empty states: `src/components/sections/Projects.test.ts` renders the components with fixture props through the Astro Container API (the pattern in `src/components/ui/Link.test.ts`). It checks an empty list (no section), a card with a fixture PNG (one optimised `<img>`, alt = title), and a card without one (no `<img>`). The real content files are never touched. Verifies **AC-4**, **AC-6**

## Build plan

1. Build `ProjectCard.astro` (image?, `h3`, summary, tech `ul`, link row) and `Projects.astro` (sort, empty guard, `Section` wrapper). Wire them into `index.astro` after About, replacing the placeholder read. Satisfies **AC-1**, **AC-2**, **AC-3**, **AC-4**, **AC-6**
2. Responsive grid: `grid gap-6 md:grid-cols-2` on the list, with cards as flex columns so the link rows align. Satisfies **AC-5**
3. `tests/e2e/projects.spec.ts`: card count and order against the YAML, hrefs and link names, the 375px / 1280px layout, and axe in both schemes plus keyboard reach. Satisfies **AC-1**, **AC-3**, **AC-5**, **AC-7**
4. `src/components/sections/Projects.test.ts` + `__fixtures__/project-image.png`: Container API tests for the empty list, a card with an image, a card without one, and sorting when given out of order. Satisfies **AC-1**, **AC-4**, **AC-6**

## Consequences

- Adding a project is still a single YAML edit, with no code change.
- There is no filtering or case study page yet. Both can build on these cards later.
- Alt text equals the title, which is adequate but not descriptive. Revisit this when real screenshots are added.

## Follow-up

- When the first project image lands, consider an `imageAlt` field in spec 0002's schema.
- "Project case study pages" (deferred in the scope) would link from these cards.
