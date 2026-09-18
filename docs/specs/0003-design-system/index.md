# 0003. Build a token based design system with hand built Astro components

**Date**: 2026-09-18
**Status**: Proposed

## Summary

This spec sets the look of the portfolio before any section is built: the colors, the font, the spacing, and a small kit of shared building blocks (a content column, a section, links, a button style link, tags, cards, and a skip link). Every value is a design token (a named CSS variable, like `--color-accent`), defined once in `src/styles/global.css`, with a light set and a dark set that follows your system setting. The style is clean and editorial: Inter as the only typeface, an indigo accent, and a narrow column. Tests prove that text contrast meets WCAG 2.2 AA in both themes and that everything works with the keyboard, so the Release 1 sections only compose these parts and never invent their own look.

## Requirements

**User stories**:
- As a visitor, I want text that is easy to read in light or dark mode, so that I can scan the portfolio comfortably on any device.
- As a keyboard or screen reader user, I want to skip to the content and always see where focus is, so that I can use the site without a mouse.
- As a section builder (features 5 to 8, 12), I want ready tokens and base components, so that every section looks consistent and I never pick colors or spacing by hand.
- As the builder of the theme toggle (feature 11), I want both color sets already defined and checked, so that the toggle only switches between them.

**Acceptance criteria**:
- **AC-1**: `src/styles/global.css` defines every token in the token table below (color, type, spacing, radius, motion). Each color token has a light value and a dark value. No component uses a raw color, font size, or radius value in place of a token.
- **AC-2**: A Vitest test reads the token values from `global.css` and proves, for both themes: `on-surface` and `muted` on `surface` and on `surface-raised` are at least 4.5:1; `accent` on `surface` and `surface-raised` is at least 4.5:1 (it is used as link text); `on-accent` on `accent` is at least 4.5:1; `focus` on `surface` and `surface-raised` is at least 3:1.
- **AC-3**: With the OS set to dark, the page renders with the dark tokens and no JavaScript runs to do it. Setting `data-theme="light"` on `<html>` forces the light tokens even when the OS is dark.
- **AC-4**: Inter Variable is bundled from the `@fontsource-variable/inter` package and served from the site's own origin. The built page makes no request to a third party font host.
- **AC-5**: Every base component (Container, Section, Link, ButtonLink, Tag, Card, SkipLink) renders on `/styleguide`. Every Link and ButtonLink is reachable with Tab in DOM order and shows a visible `:focus-visible` outline (2px, `focus` token, 2px offset). The SkipLink is the first Tab stop, appears when focused, and on Enter moves focus to `<main id="main">`.
- **AC-6**: axe (through `@axe-core/playwright`) reports zero violations on `/` and `/styleguide`, run once with the light color scheme and once with the dark.
- **AC-7**: `/styleguide` carries `<meta name="robots" content="noindex">` and does not appear in the generated sitemap.
- **AC-8**: Color and underline transitions last 150ms, and under `prefers-reduced-motion: reduce` every transition is removed.
- **AC-9**: A `design.md` at the repo root lists every token (name, light value, dark value, purpose) and every base component (props, when to use it, a usage snippet), and states that `global.css` is the source of truth.
- **AC-10**: An external Link (an absolute `http` or `https` URL) opens in a new tab with `rel="noopener noreferrer"`, and its accessible name ends with "(opens in a new tab)" through visually hidden text.

## Decision

**Chosen option**: Option 1: semantic CSS variable tokens in Tailwind's `@theme`, plus hand built `.astro` base components

Define a small set of semantic tokens (named by role, like `surface` and `accent`, not by hue) in `global.css`, redefine the color tokens for dark mode in a media query that feature 11 can override, self host Inter through Fontsource, and build seven zero JavaScript `.astro` components that every section composes.

**Implementation skills**: `tailwind-4-docs` (`lombiq/tailwind-agent-skills`, `.agents/skills/tailwind-4-docs/`) · `astro` (`astrolicious/agent-skills`, `.agents/skills/astro/`) · `vitest` (`antfu/skills`, `.agents/skills/vitest/`) · `playwright-cli` (`microsoft/playwright-cli`, `.agents/skills/playwright-cli/`)

## Rationale

See [rationale.md](rationale.md) for the context, the options weighed, and the reasoning.

## Feature design

**Direction** (chosen with you, no external design source): clean and editorial. Lots of white space, strong type, one indigo accent (OKLCH hue about 262), a narrow column of 48rem, subtle 150ms transitions and no scroll animation.

**Token table** (the data model of this feature; all live in `src/styles/global.css`):

Color tokens are semantic. Values are OKLCH (a color format where the first number is perceived lightness, which makes contrast tuning predictable). The values below are the starting point; the AC-2 test is the judge, and if a pair fails, adjust only the lightness until it passes.

| Token | Light | Dark | Used for |
|---|---|---|---|
| `--color-surface` | `oklch(99% 0 0)` | `oklch(17% 0.015 260)` | page background |
| `--color-surface-raised` | `oklch(97% 0.005 260)` | `oklch(22% 0.02 260)` | Card and Tag background |
| `--color-on-surface` | `oklch(22% 0.02 260)` | `oklch(94% 0.01 260)` | body text, headings |
| `--color-muted` | `oklch(45% 0.02 260)` | `oklch(72% 0.02 260)` | secondary text, meta lines |
| `--color-accent` | `oklch(50% 0.19 262)` | `oklch(75% 0.13 262)` | link text, primary ButtonLink fill |
| `--color-on-accent` | `oklch(99% 0 0)` | `oklch(17% 0.015 260)` | text on an accent fill |
| `--color-border` | `oklch(88% 0.01 260)` | `oklch(32% 0.02 260)` | Card and Tag outline (decorative, not a contrast target) |
| `--color-focus` | `var(--color-accent)` | inherits the dark accent through the `var()` | focus outline |

Non color tokens (one value, both themes):

| Token | Value | Used for |
|---|---|---|
| `--font-sans` | `'Inter Variable', 'Inter Fallback', ui-sans-serif, system-ui, sans-serif` | all text |
| `--text-display` | `clamp(2.25rem, 1.6rem + 3vw, 3.5rem)`, with `--text-display--line-height: 1.1` | the hero name (feature 5), utility `text-display` |
| `--text-h2` | `clamp(1.5rem, 1.25rem + 1.2vw, 2rem)`, with `--text-h2--line-height: 1.25` | Section headings, utility `text-h2` |
| `--text-h3` | `1.25rem`, with `--text-h3--line-height: 1.4` | Card titles, utility `text-h3` |
| body | Tailwind's default `text-base` (1rem), line height 1.6 | paragraphs |
| small | Tailwind's default `text-sm` | Tag text, meta lines |
| `--spacing-gutter` | `1.5rem` (kept from the starter) | Container side padding |
| `--spacing-section` | `clamp(4rem, 3rem + 4vw, 7rem)` | vertical gap between Sections |
| `--container-content` | `48rem` | Container max width, utility `max-w-content` |
| `--radius-card` | `0.75rem` | Card corners |
| `--radius-tag` | `9999px` | Tag pill shape |
| `--default-transition-duration` | `150ms` | all transitions |

Spacing inside components uses Tailwind's default 0.25rem scale.

**Theme mechanism** (CSS structure feature 11 builds on):
```css
@theme { /* light values + all non color tokens */ }
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) { /* dark color values */ }
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { transition: none !important; }
}
```
This works because Tailwind emits `@theme` values inside `@layer theme`, and an unlayered rule always beats a layered one, whatever the source order. Feature 11 adds `:root[data-theme="dark"] { … }` (the same dark values) and the inline `<head>` script. This feature adds no toggle and no script.

**Font loading**: `pnpm add @fontsource-variable/inter`, imported once in `global.css` (latin subset only, the full variable weight axis in one woff2 file). Fontsource ships `font-display: swap`. Add an `@font-face` named `Inter Fallback` over `local('Arial')` with `size-adjust: 107%`, `ascent-override: 90%`, `descent-override: 22.5%`, `line-gap-override: 0%` as the starting metrics. Tune them by eye in the build so the swap causes minimal layout shift.

**Component inventory** (all in `src/components/ui/`, `.astro`, no islands, no client JavaScript):

| Component | Props | Renders | Notes |
|---|---|---|---|
| `Container` | none, default slot | `<div>` with `max-w-content mx-auto px-gutter` | the one width wrapper |
| `Section` | `id: string`, `title: string`, default slot | `<section id aria-labelledby>` wrapping a Container, an `<h2>` with id `${id}-heading`, then the slot | vertical padding `--spacing-section`; anchors for in page nav |
| `Link` | `href: string`, rest attrs, default slot | `<a>` in accent, underlined, underline offset grows on hover | external when `href` starts with `http://` or `https://` (AC-10); `mailto:` and relative links are not external |
| `ButtonLink` | `href: string`, `variant?: 'primary' \| 'secondary'` (default primary), `download?: boolean`, default slot | `<a>` styled as a button: primary is accent fill with `on-accent` text, secondary is an accent outline | a link, never a `<button>`, because every call to action here navigates or downloads; same external rule as Link |
| `Tag` | default slot | `<span>` pill, `surface-raised` fill, `border` outline, `text-sm`, `muted` text | not interactive; the parent wraps a group in a `<ul>` |
| `Card` | `as?: 'article' \| 'div'` (default `article`), default slot | a `surface-raised` box with `border` and `--radius-card` | never wraps the whole card in a link; links inside stay separate Tab stops. Making a whole card clickable (a "stretched link") is feature 6's call, not this one |
| `SkipLink` | none | `<a href="#main">Skip to content</a>`, visually hidden until focused | placed first in `<body>` by BaseLayout |

**BaseLayout changes** (`src/layouts/BaseLayout.astro`): render `SkipLink` first in `<body>`, and wrap the default slot in `<main id="main" tabindex="-1">`. If `src/pages/index.astro` already renders its own `<main>`, remove it there so there is exactly one. Add a global `:focus-visible` rule (2px solid `--color-focus`, 2px offset) in `global.css` so every focusable element gets it, not just the components. Add `main:focus { outline: none }`: `#main` is a skip target, not a control, so it must not draw a ring around the whole page. AC-5 checks that focus lands on it, not that a ring shows. Add an optional `noindex?: boolean` prop that emits the robots meta.

**`/styleguide` page** (`src/pages/styleguide.astro`): uses BaseLayout with `noindex`, and shows every color token as a swatch with its name, the type scale, and each component in each variant, including one external Link, one `download` ButtonLink, and a Card holding Tags and two Links. It is the e2e target before any real section exists. Exclude it from the sitemap with `sitemap({ filter: (page) => !new URL(page).pathname.startsWith('/styleguide') })` in `astro.config.ts` (`filter` receives the full absolute URL).

**State transitions**: none. Components are static markup; the only runtime states are CSS `:hover`, `:focus-visible`, and the color scheme.

**API surface**: none (static site, no endpoints). The interface is the component props above and the token names, consumed by every section at build time.

**Value sourcing**:

| Action | Value produced / displayed | Source |
|---|---|---|
| Render any colored element | its color | a `--color-*` token; the theme block that applies decides light or dark |
| Pick light or dark | the active token set | the OS `prefers-color-scheme`, overridden by `data-theme` on `<html>` (set only by feature 11) |
| Render text | font family, size, line height | `--font-sans` and the `--text-*` tokens or Tailwind's default `base`/`sm` |
| Render Section | heading text and anchor id | the `title` and `id` props, supplied by each section feature |
| Render Link / ButtonLink | whether it is external | derived from `href` (starts with `http://` or `https://`) |
| Render external link | the new tab notice text | fixed string "(opens in a new tab)", in the component |
| Render SkipLink | label and target | fixed string "Skip to content", target `#main` from BaseLayout |
| Contrast test | token values for each theme | parsed from `global.css` (the `@theme` block for light, the dark media block for dark), so the test cannot drift from the shipped values. The parser reads `oklch(L% C H)` literals and resolves one level of `var(--color-*)` (for `--color-focus`); anything else fails the test loudly rather than being skipped |
| Contrast test | the pairs to check and their minimums | the fixed list in AC-2 |
| Transitions | duration | `--default-transition-duration` |

**Key invariants**:
- `global.css` is the only place a color, font, radius, or type size value is written. Components use Tailwind utilities that resolve to tokens.
- Every color token has both a light and a dark value, and every AC-2 pair passes in both themes.
- There is exactly one `<main id="main">` per page, and SkipLink is the first focusable element.
- No component in `src/components/ui/` ships client JavaScript.
- `design.md` documents; it never defines a value that `global.css` lacks.

**Security model**: no data, no user input, no secrets. External links use `rel="noopener noreferrer"` so the opened page cannot reach `window.opener`.

**Configuration required**: none. One new dependency, `@fontsource-variable/inter`; no environment variables.

**Critical test scenarios**:
- Happy path: `/styleguide` renders every component in both color schemes with zero axe violations, verifies **AC-5**, **AC-6**.
- Contrast: the unit test parses both token sets and every AC-2 pair meets its minimum; a deliberately lowered `muted` lightness makes it fail, verifies **AC-1**, **AC-2**.
- Keyboard: Tab from page load lands on SkipLink first, it becomes visible, Enter moves focus to `#main`; tabbing through `/styleguide` shows a focus outline on each link, verifies **AC-5**.
- Theme: with `colorScheme: 'dark'` the body background equals the dark `surface` value; with `data-theme="light"` added it equals the light value, verifies **AC-3**.
- Font: the built page requests the Inter file from its own origin, and no request goes to another host, verifies **AC-4**.
- Robots: `/styleguide` has the noindex meta and `sitemap-0.xml` does not list it, verifies **AC-7**.
- Motion: under `reducedMotion: 'reduce'` a Link's computed `transition-duration` is `0s`, verifies **AC-8**.
- External link: the styleguide's external Link has `target="_blank"`, `rel="noopener noreferrer"`, and an accessible name ending "(opens in a new tab)", verifies **AC-10**.

## Build plan

Skateboard: step 1 alone makes the whole existing site themed, readable, and keyboard usable. Each later step grows it without redoing earlier work.

1. Install `@fontsource-variable/inter`. Replace the starter `@theme` in `src/styles/global.css` with the full token table, the dark media block, the reduced motion block, the global `:focus-visible` rule, and the `Inter Fallback` face, satisfies **AC-1**, **AC-3**, **AC-4**, **AC-8**.
2. Build `SkipLink` and update `BaseLayout.astro` (SkipLink first, one `<main id="main" tabindex="-1">`, the `noindex` prop), then check `index.astro` has no second `<main>`. Update `BaseLayout.test.ts` for the new markup, satisfies **AC-5**.
3. Build `Container`, `Section`, `Link`, `ButtonLink`, `Tag`, and `Card` in `src/components/ui/`, satisfies **AC-1**, **AC-5**, **AC-10**.
4. Build `src/pages/styleguide.astro` and add the sitemap `filter` in `astro.config.ts`, satisfies **AC-5**, **AC-7**.
5. Write `src/styles/contrast.ts` (OKLCH to sRGB conversion and the WCAG contrast ratio, about 30 lines, no dependency) and `src/styles/tokens.test.ts`, which parses `global.css` and checks every AC-2 pair in both themes. Tune any failing lightness in `global.css`, satisfies **AC-2**.
6. Add `tests/e2e/design-system.spec.ts`: axe on `/` and `/styleguide` in light and dark, the keyboard and SkipLink path, the theme and `data-theme` check, the font origin check, reduced motion, the external link attributes, and the sitemap/noindex check, satisfies **AC-3** to **AC-8**, **AC-10**.
7. Write `design.md` at the repo root from the final `global.css` and components, satisfies **AC-9**.

## Consequences

**Positive**:
- Every section after this composes finished parts, so the page looks consistent and no section picks its own colors.
- Dark mode works now for anyone whose OS is dark, and feature 11 shrinks to a toggle and a head script.
- Contrast is proven by a test over all token pairs, not just what one page happens to show, so a later color tweak that breaks AA fails the build.
- Zero client JavaScript is added.

**Negative / tradeoffs**:
- Two color sets must be kept in step by hand; a new color token means adding both values and, if it carries text, a new AC-2 pair.
- The contrast test depends on parsing `global.css` with a simple pattern, so restructuring that file (for example moving the dark values into another file) means updating the parser.
- Inter is about 50 to 70 KB (latin variable woff2) that a system font stack would avoid, and there is a brief font swap on a slow first load.
- `/styleguide` ships in the public build. It is noindexed and out of the sitemap, but anyone who guesses the URL can open it.
- One typeface and one accent give a restrained look; a more expressive brand later means revisiting this spec.

**Neutral**:
- The dark values are written once now; feature 11 duplicates them into a `[data-theme="dark"]` block (CSS cannot share one rule between a media query and a plain selector).
- Section specific composites (project card layout, skills grid, contact list) belong to features 5 to 8, not here.
- `design.md` becomes a new root document that later UI changes should keep current.

## Follow-up

- [ ] Feature 11 (dark/light theme) adds `:root[data-theme="dark"]` with the same dark values plus the inline `<head>` setter, and reruns the AC-2 and AC-6 checks.
- [ ] Once `design.md` exists, `/sync` can add a one line pointer to it in root `AGENTS.md` so every UI task reads it.
