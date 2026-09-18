# Scope: My Portfolio

A one page personal portfolio that shows recruiters and freelance clients who you are, what you have built, and how to reach you.

**Build approach:** Skateboard (ship the smallest complete site first, then grow it release by release).
**Workflow:** Alpha (`/check verify` runs after `/develop`). This is the default level of rigor for the project. `/architect` is the recommended first stop for a feature with a real decision, but you can skip it when you already know how to build it. Any feature can carry its own tag (for example `· Beta`) to do more or less.

_These are recommendations to keep your build orderly, not requirements. Skip anything that does not fit: if you already know how to build a feature, use `/develop` and skip `/architect`. You decide when a feature is `done`._

## At a glance

| # | Feature | Phase | Status |
|---|---------|-------|--------|
| 1 | Stack & architecture | Foundation | done |
| 2 | Coding standards & tooling | Foundation | done |
| 3 | Content model | Foundation | done |
| 4 | Design system & UI foundation | Foundation | done |
| 5 | Hero & about | Release 1 | done |
| 6 | Projects section | Release 1 | done |
| 7 | Skills section | Release 1 | in-progress |
| 8 | Contact links & resume | Release 1 | planned |
| 9 | SEO & social cards | Release 1 | planned |
| 10 | Deploy to free hosting | Release 1 | planned |
| 11 | Dark/light theme | Release 2 | planned |
| 12 | Work with me section | Release 2 | planned |
| 13 | Visitor analytics | Release 3 | planned |

## Foundations

### 1. Stack & architecture · Beta · done
Decide the framework and rendering approach (static output suits free hosting and SEO), then scaffold a runnable project.
**Done when:** the stack is recorded in a spec and the empty scaffold runs locally and builds to static output.
spec [0001](../specs/0001-astro-static-stack/index.md) · code in `astro.config.ts`, `src/`, `tests/e2e/` (repo root)
- [x] Decide the stack (spec): `/architect stack & architecture`
- [x] Scaffold from the decision: `/develop stack & architecture`
- [x] Verify it: `/check verify stack & architecture`
- [x] Test it: `/test stack & architecture`

### 2. Coding standards & tooling · done
Capture conventions from the real scaffold, then install lint, format, and pre-commit checks.
**Done when:** root `AGENTS.md` reflects the real stack, and lint and format run clean.
code in `AGENTS.md`, `biome.json`, `.prettierrc.json` (repo root)
- [x] Capture conventions + tooling choices: `/audit`

### 3. Content model · done
The shape of the content files in the repo (bio, projects, skills, links) that every section reads from.
**Done when:** adding a project or skill means editing one data file, with no code changes, and a bad entry fails the build.
spec [0002](../specs/0002-content-model/index.md) · code in `src/content.config.ts`, `src/content/`, `image-optimisation.test.ts`
- [x] Design it (spec): `/architect content model`
- [x] Build it: `/develop content model`
  - [x] Spike the image field on the `file()` loader, take the fallback if it does not resolve (AC-8)
  - [x] Four strict Zod schemas in `src/content.config.ts` (AC-1, AC-4 to AC-7, AC-9)
  - [x] The four YAML files filled with your real content, plus assets (AC-2, AC-9, AC-11)
  - [x] The consumer contract recorded in `src/content/AGENTS.md` (AC-7, AC-10)
  - [x] Schema tests, and a deliberate bad entry proving the build fails (AC-3 to AC-7)
- [x] Verify it: `/check verify content model`

### 4. Design system & UI foundation · done
Type, color, spacing, and base components, with color tokens ready for both themes and focus styles that meet AA.
**Done when:** `design.md` covers tokens and components, text contrast meets WCAG 2.2 AA, and base components work with the keyboard.
spec [0003](../specs/0003-design-system/index.md) · code in `src/styles/`, `src/components/ui/`, `src/pages/styleguide.astro`, `design.md`
- [x] Design it (spec): `/architect design system & UI foundation`
- [x] Build it: `/develop design system & UI foundation`
  - [x] Tokens, Inter font, dark media block, focus and reduced motion rules, skip link in BaseLayout (AC-1, AC-3, AC-4, AC-5, AC-8)
  - [x] Base components and the noindexed `/styleguide` page (AC-5, AC-7, AC-10)
  - [x] Contrast unit test and axe/keyboard e2e in both color schemes (AC-2 to AC-8, AC-10)
  - [x] `design.md` at the repo root (AC-9)
- [x] Verify it: `/check verify design system & UI foundation`

## Release 1: the smallest live portfolio

### 5. Hero & about · done
Name, role, a one line pitch, and a short bio at the top of the page.
**Done when:** a visitor sees who you are and what you do before they scroll, on mobile and desktop.
code in `src/components/sections/`, `src/pages/index.astro`
- [x] Build it: `/develop hero & about`

### 6. Projects section · done
Project cards (title, summary, tech, links to live demo and code) read from the content files.
**Done when:** every project in the data file renders as a card with working links, and the layout holds from phone to desktop.
spec [0004](../specs/0004-projects-section.md) · code in `src/components/sections/`, `src/pages/index.astro`, `tests/e2e/projects.spec.ts`
- [x] Design it (spec): `/architect projects section`
- [x] Build it: `/develop projects section`
  - [x] `Projects` and `ProjectCard` components wired into the page (AC-1 to AC-4, AC-6)
  - [x] Responsive one to two column grid (AC-5)
  - [x] E2E for cards, links, layout, and axe in both schemes (AC-1, AC-3, AC-5, AC-7)
  - [x] Container unit tests for image and empty states (AC-1, AC-4, AC-6)
- [x] Verify it: `/check verify projects section`

### 7. Skills section
A grouped list of your skills, read from the content files.
**Done when:** skills render grouped and readable, and screen readers announce the groups.
spec [0005](../specs/0005-skills-section.md) · code in `src/components/sections/Skills.astro`, `src/pages/index.astro`, `tests/e2e/skills.spec.ts`
- [x] Design it (spec): `/architect skills section`
- [x] Build it: `/develop skills section`
  - [x] `Skills` component wired into the page after Projects (AC-1, AC-2, AC-4, AC-6)
  - [x] Responsive one, two, three column grid with wrapping chips (AC-3)
  - [x] E2E for groups, list names, layout, and axe in both schemes (AC-1, AC-2, AC-3, AC-5)
  - [x] Container unit tests for the empty and sort cases (AC-1, AC-4)
- [ ] Verify it: `/check verify skills section`

### 8. Contact links & resume
Email, GitHub, and LinkedIn links plus a resume PDF download.
**Done when:** every link works, the resume downloads, and every link has an accessible name.
- [ ] Build it: `/develop contact links & resume`

### 9. SEO & social cards
Title, description, canonical URL, sitemap, structured data, and link previews.
**Done when:** the page has complete metadata and a sitemap, and a shared link shows a correct preview card.
- [ ] Build it: `/develop seo & social cards`

### 10. Deploy to free hosting · needs a decision
Put the site live on a free host, with automatic deploys when you push.
**Done when:** the site is live at a public URL over HTTPS and a push to the main branch redeploys it.
- [ ] Design it (spec): `/architect deploy to free hosting`

## Release 2: polish and reach clients

### 11. Dark/light theme
A theme toggle that follows the system setting by default and remembers your choice.
**Done when:** the theme matches the system on first visit, the toggle persists, there is no flash of the wrong theme, and both themes meet AA contrast.
- [ ] Build it: `/develop dark/light theme`

### 12. Work with me section
A short services and availability block, so freelance clients know what to hire you for.
**Done when:** services and a call to action render from the content files and link to your contact options.
- [ ] Build it: `/develop work with me section`

## Release 3: learn who visits

### 13. Visitor analytics · needs a decision
Privacy friendly visit counts and referrers, so you see which links bring people in.
**Done when:** page views and referrers show up in a dashboard, and no cookie banner is needed (or consent is handled if one is).
- [ ] Design it (spec): `/architect visitor analytics`

## Deferred
Out of scope for now, kept so the plan stays honest.
- **Project case study pages**: a detail page for each project · needs a decision
- **Blog or writing**: posts and write ups · needs a decision
- **Contact form**: send messages from the site · needs a decision
- **Editable CMS**: edit content in a dashboard · needs a decision
- **GitHub repo feed**: pull repos in automatically · needs a decision
- **Multiple languages**: translations · needs a decision

## Legend

**The decision box.** Every feature carries exactly one, the sub-task whose label ends with `(spec)`. Its wording varies (`Design it (spec)` normally, `Decide the stack (spec)` on Stack & architecture), so skills locate it by that `(spec)` suffix, never by an exact label. Every other box is an execution box and `/architect` never ticks one.

**Feature lifecycle**: the scope updates as a feature moves; each row is what it shows and who sets it:

| State | Set by | The feature shows |
|---|---|---|
| `planned` · needs a decision | `/scope` | one box: `Design it (spec): /architect <feature>` |
| `in-progress` (designed) | **`/architect` at spec capture** | `Design it` ticked; spec linked; `Build it: /develop <feature>` + **2 to 5 milestones**; the tier's closing boxes (`Verify it` Alpha+, `Test it` Beta+, `Review it` + `Document it` GA); any surfaced follow-up enrolled |
| `in-progress` (building) | `/develop` | milestone sub-boxes tick one by one; code pointer filled |
| `in-progress` (verified) | `/check verify` | `Build it` + milestones ticked; `Verify it` ticked |
| `done` | **you, when you decide it is** (any skill sets it when you say so); `/sync` reconciles | boxes you ran ticked, skipped ones marked skipped; the tier's last stage (`Prototype` → after `/develop`; `Alpha` → after `/check verify`; `Beta`/`GA` → after `/test`) is the suggested point to call it done; `/sync` captures conventions |

- **Next step** = the first unticked box (always a command or a tracked milestone).
- **needs a decision** = run `/architect` first; otherwise straight to `/develop` (or `/audit` for standards & tooling). The tag drops once the spec is captured.
- **Atomic build tasks live in the spec's `## Build plan`, not here**: the scope carries only the milestone rollup.
- **Status** `planned` → `in-progress` → `done`, plus `existing` (pre-workflow) and `dropped` (de-scoped, kept for history).
- **Approach tag** beside a heading (e.g. `· Facade`) overrides the project default for that feature; no tag = inherits it.
- **Workflow tier tag** beside a heading (e.g. `· GA`, `· Prototype`) sets that one feature's rigor above or below the project default; no tag inherits the default. It decides the feature's check boxes and each skill's next suggestion.
- **Workflow** (header line) is the project default, what runs after `/develop`: **Prototype** = nothing (trust develop's own build time self check); **Alpha** = `/check verify`; **Beta** = `/check verify` then `/test`; **GA** = adds a fresh model `/check review` then `/document`. A feature built on an unratified decision (an `Assumed` spec) stays flagged, but that never blocks `done`.
- **Pointer line** (`spec <n> · code in <path>`): the spec link added by `/architect`, the code path by `/develop`.
