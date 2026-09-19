# 0008. Three state theme toggle with an inline head script

**Date**: 2026-09-18
**Status**: Accepted

## Summary

A small round button in the top right corner of every page lets visitors pick the theme: follow the system, always light, or always dark. Each click moves to the next choice. The choice is saved in the browser (`localStorage`, a small key and value store) and applied by a tiny script in `<head>` before the page paints, so there is never a flash of the wrong theme. The button is a plain Astro component with a small script, not a React island, and both color sets already exist from spec 0003, so this feature adds the toggle, the head script, and one CSS block.

## Context

This is feature 11 in the scope (Release 2). Its done line: the theme matches the system on first visit, the toggle persists, there is no flash of the wrong theme, and both themes meet AA contrast.

Spec 0003 already did most of the ground work. `src/styles/global.css` holds the light colors in `@theme` and the dark colors in an unlayered `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { … } }` block. The contrast test (`src/styles/tokens.test.ts`) parses both sets and proves AA. Spec 0003 reserved two things for this feature: a `:root[data-theme="dark"]` block with the same dark values, and the inline `<head>` script. `CLAUDE.md` makes the second one a rule: the theme setter is an inline head script, never a React island.

The site has no header or nav, so the toggle needs its own home. The build approach is Skateboard. The site is fully static, so all of this runs in the browser; nothing is known about the visitor's choice at build time.

## Requirements

**User stories**:
- As a visitor, I want the site to match my system theme on first visit, so it feels right without doing anything.
- As a visitor, I want to force light or dark, or go back to following my system, and have the site remember it next time.
- As a keyboard or screen reader user, I want the toggle to be a clearly named button I can reach and use.

**Acceptance criteria**:
- **AC-1**: On a first visit (no `theme` key in `localStorage`), `<html>` has no `data-theme` attribute and the page renders with the OS color scheme (light OS gives the light `surface`, dark OS gives the dark `surface`).
- **AC-2**: An inline, render blocking script sits right after `<meta charset>` in `<head>` on every page, before any stylesheet. It reads `localStorage["theme"]`, sets `data-theme-choice` on `<html>` to the validated choice (`"system"` for missing or invalid), and sets `data-theme="light"` or `data-theme="dark"` for those two choices; for system it leaves `data-theme` off. There is no flash of either the colors or the toggle icon: with `"dark"` stored and the OS set to light, at `domcontentloaded` the body background is already the dark `surface` and the visible toggle icon is the moon.
- **AC-3**: A toggle button, fixed to the top right of the viewport on every page, cycles system → light → dark → system on each click (or Enter/Space). Each step updates `data-theme` on `<html>` at once (removing it for system) and writes the new choice (`"system"`, `"light"`, or `"dark"`) to `localStorage["theme"]`.
- **AC-4**: The choice persists: after picking light or dark and reloading, the same theme applies and the button shows the same state.
- **AC-5**: In system mode, a change of the OS color scheme during the visit restyles the page without a reload.
- **AC-6**: The toggle is a native `<button type="button">` whose accessible name (its `aria-label`) states the current choice and the next one (for example `Theme: system. Switch to light.`). It shows one icon for the current choice (monitor, sun, moon), marked `aria-hidden="true"`. It shows the global focus ring, its target is at least 44 by 44 CSS px, and it comes right after the SkipLink in tab order.
- **AC-7**: When `localStorage` is unavailable or throws (blocked storage, some private modes), the page renders by the OS scheme, the toggle still cycles the theme for the current page view, and no uncaught error reaches the console. With JavaScript disabled, the button is not shown (it renders `hidden` and the script reveals it) and the page follows the OS scheme.
- **AC-8**: With a forced theme, the browser UI matches it: `color-scheme` is `light` under `data-theme="light"` and `dark` under `data-theme="dark"`. axe reports zero violations on `/` and `/styleguide` for light forced on a dark OS and dark forced on a light OS, and the contrast test covers the `[data-theme="dark"]` block.

## Options considered

### Option 1: Astro component with a small script, plus an inline head script (chosen)
A `ThemeToggle.astro` button with inline SVG icons and a processed `<script>` for clicks. A separate inline script in `<head>` applies the saved choice before paint.
**Pros**: No framework JavaScript. Follows the `CLAUDE.md` rule for the head script. Reuses the spec 0003 CSS hook as is.
**Cons**: The dark values live in two CSS blocks, because a media query and a plain selector cannot share one rule.

### Option 2: React island toggle
The same behavior in a `client:load` React component.
**Pros**: Follows the "events mean an island" rule literally.
**Cons**: Ships React to a page that has no other islands, for one button. It still needs the inline head script to avoid a flash, so it adds weight and saves no code.

### Option 3: Two state toggle (light and dark only)
**Pros**: Simpler to use and test.
**Cons**: Once you click, you can never go back to following the system, which you asked to keep.

## Decision

**Chosen option**: Option 1: Astro component with a small script, plus an inline head script.

Build a three state cycling icon button as `src/components/ui/ThemeToggle.astro`, fixed top right in `BaseLayout`, backed by pure theme logic in `src/lib/theme.ts` and an inline head script whose source lives in that same module.

**Implementation skills**: `astro` (`astrolicious/agent-skills`, `.agents/skills/astro/`) · `tailwind-4-docs` (`lombiq/tailwind-agent-skills`, `.agents/skills/tailwind-4-docs/`) · `vitest` (`antfu/skills`, `.agents/skills/vitest/`) · `playwright-cli` (`microsoft/playwright-cli`, `.agents/skills/playwright-cli/`)

## Rationale

The expensive work (two AA checked color sets and a CSS override hook) is done, so the right design is the thinnest layer on top. A toggle that flips an attribute and writes one key holds no rendered state, so an `.astro` component with a small script meets the `CLAUDE.md` island rule in spirit, and it keeps the page free of React. The no flash requirement can only be met by a script that runs before first paint, which is why the head script is inline and render blocking, and separate from the button's deferred script.

Three states keep "follow my system" reachable after a click. A single cycling button keeps the corner control small. Storing `"system"` explicitly makes the saved state readable, while a missing or invalid key still means system, so first visits and corrupt values behave the same. In system mode `data-theme` is removed, so the existing media query handles live OS changes (AC-5) with no listener.

## Feature design

**Data model sketch**:
One browser value, no server data.
- `localStorage["theme"]`: string, optional. Valid values `"system" | "light" | "dark"`. Missing or anything else is read as `"system"`.
- `<html data-theme>`: attribute, optional. `"light"` or `"dark"` when forced, absent in system mode. Drives the colors.
- `<html data-theme-choice>`: attribute, `"system" | "light" | "dark"`, set by the head script and by every click. Drives which toggle icon CSS shows, so the icon is right on first paint.
- In code: `type ThemeChoice = 'system' | 'light' | 'dark'`.

**State transitions**:
choice: system → light → dark → system (each click moves one step; there is no other transition).

**API surface** (no network endpoints; the module and component contracts):
| Unit | Kind | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| `readChoice(raw)` in `src/lib/theme.ts` | function | `raw: string \| null` | `ThemeChoice` (`"system"` for null or invalid) | none | none, never throws |
| `nextChoice(choice)` | function | `ThemeChoice` | the next `ThemeChoice` in the cycle | none | none |
| `applyChoice(root, choice)` | function | `root: HTMLElement`, `ThemeChoice` | sets `data-theme-choice`; sets or removes `data-theme` | none | none |
| `THEME_HEAD_SCRIPT` | exported string | none | self contained JS source for the head script (try/catch around storage); same result as `applyChoice(document.documentElement, readChoice(stored))` | none | storage throws: swallowed, treated as system |
| `ThemeToggle.astro` | component | no props | `<button type="button" hidden aria-label="Theme: system. Switch to light.">` with three SVGs; CSS keyed on `:root[data-theme-choice=…]` shows one | none | storage throws on read or write: swallowed, theme still applies for the page view |

`BaseLayout.astro` renders `<script is:inline set:html={THEME_HEAD_SCRIPT} />` right after `<meta charset>` (before the viewport meta and any stylesheet), and `<ThemeToggle />` right after `<SkipLink />`. Keeping the head script as a string in `theme.ts` means one copy, which the unit test can execute.

The toggle's click logic is a normal processed Astro `<script>` (bundled, deduped, runs as a deferred module), not `is:inline`. On load it reads `data-theme-choice` from `<html>`, sets the matching `aria-label`, and removes `hidden`. The server render is the system state, and the label is corrected before the button becomes visible.

**Value sourcing**:
| Action | Value produced / displayed | Source |
|---|---|---|
| Page load (head script) | `data-theme` on `<html>` | `localStorage["theme"]` through the same validation as `readChoice`; absent for system |
| Page load (head script) | `data-theme-choice` on `<html>`, hence the visible icon | the validated stored choice, `"system"` if missing, invalid, or storage throws |
| Page load (toggle script) | the button's `aria-label` and visibility | `data-theme-choice` on `<html>` through the name map; `hidden` removed |
| Click | the next choice | `nextChoice(current)`; current is `<html>`'s `data-theme-choice` |
| Click | the stored value | the next choice, written to `localStorage["theme"]` (write failure swallowed) |
| Render | the colors | `data-theme` block when set, else the OS `prefers-color-scheme` media query (spec 0003) |
| Render | the accessible name text | a fixed map in the component: `system` → `Theme: system. Switch to light.`, `light` → `Theme: light. Switch to dark.`, `dark` → `Theme: dark. Switch to system.` |
| Render | the icons | three inline SVG paths copied from Lucide (`monitor`, `sun`, `moon`, ISC licence), `currentColor` stroke |

**Key invariants**:
- The `:root[data-theme="dark"]` block and the dark media block hold identical token values (enforced by `tokens.test.ts`).
- `data-theme` is only ever `"light"`, `"dark"`, or absent.
- No storage call anywhere is outside a try/catch.
- The head script stays inline and synchronous (no `defer`, no `type="module"`), right after `<meta charset>` and before any stylesheet.
- `data-theme-choice` on `<html>` is always the one source of the current choice once the head script has run.

**Security model**:
Public, no personal data. The stored value is validated against three literals before use and never inserted as HTML. The head script is a build time constant, so it cannot inject anything. No new CSP needs arise because the site sets no CSP today; if one is added later, it must allow this inline script (hash).

**Configuration required**: none.

**Styling** (tokens per spec 0003): fixed `top-4 right-4`, `size-11` (44px), `rounded-full`, `bg-surface-raised`, `text-on-surface`, `border border-border`, hover uses `text-accent`. Stacking uses `z-50`, the one raw utility allowed here because the site has no z-index scale; `design.md` records this exception. CSS in `global.css`, one block per selector so the test parser finds exactly one match:
```css
:root[data-theme="dark"] {
  color-scheme: dark;
  /* same --color-* values as the dark media block */
}
:root[data-theme="light"] { color-scheme: light; }
```
Both are unlayered so they beat `@layer base`'s `color-scheme: light dark`. The unit test proves the dark values match and pass contrast; only the e2e and axe runs prove the cascade actually applies them.

**Critical test scenarios**:
- Happy path: first visit on a light OS, click three times, see light, dark, then system, with `data-theme` and the stored key updated each step, verifies **AC-1**, **AC-3**.
- Persistence: pick dark, reload, still dark and the button says dark, verifies **AC-4**.
- No flash: `"dark"` stored through `addInitScript`, OS light, at `domcontentloaded` the body background equals dark `surface` and only the moon icon is visible, verifies **AC-2**.
- No JavaScript: with JS disabled the toggle is not visible and the page follows the OS scheme, verifies **AC-7**.
- Live OS change: in system mode, `page.emulateMedia({ colorScheme: 'dark' })` changes the background without reload, verifies **AC-5**.
- Failure case: `addInitScript` makes `localStorage` throw, page loads by OS scheme, toggle still cycles, no `pageerror`, verifies **AC-7**.
- Unit: `readChoice` (valid, null, junk), `nextChoice` full cycle, `applyChoice` set and remove, and `THEME_HEAD_SCRIPT` run against a fake document and storage for each stored value and for throwing storage, verifies **AC-2**, **AC-3**, **AC-7**.
- Accessibility: keyboard reaches the toggle right after the SkipLink, name text per state, 44px box, axe on both forced cross states, verifies **AC-6**, **AC-8**.

## Build plan

Skateboard: step 1 alone gives a working, flash free saved theme (settable from devtools); step 2 adds the button; step 3 locks it down.

1. In `src/lib/theme.ts`, add `ThemeChoice`, `readChoice`, and `THEME_HEAD_SCRIPT`, with unit tests in `theme.test.ts`. Render the head script first in `BaseLayout`'s `<head>`. Add the `:root[data-theme="dark"]` block and both `color-scheme` rules to `global.css`, and extend `tokens.test.ts` to check the new block matches the dark media block and passes contrast, satisfies **AC-1**, **AC-2**, **AC-5**, **AC-8**.
2. Add `nextChoice` and `applyChoice` with unit tests. Build `src/components/ui/ThemeToggle.astro` (button, three SVGs, name map, processed `<script>` with guarded storage) and render it after `<SkipLink />` in `BaseLayout`, satisfies **AC-3**, **AC-4**, **AC-6**, **AC-7**.
3. Add `tests/e2e/theme.spec.ts` covering the scenarios above, including axe for the two forced cross states on `/` and `/styleguide`. Add `ThemeToggle` to `design.md` and show it on the styleguide, satisfies **AC-1** to **AC-8**.

## Consequences

**Positive**:
- Full theme control with no framework JavaScript and no flash.
- System mode tracks OS changes live for free.

**Negative / tradeoffs**:
- The dark values are written twice in `global.css`; a test keeps them equal, but a token change touches both blocks.
- A fixed button floats over content; at narrow widths it can overlap the first heading, so `BaseLayout`'s `<main>` reserves extra top space below `sm` (the e2e checks a 16px margin at 375px on every page).

**Neutral**:
- Other open tabs pick up a new choice only on their next load (no cross tab sync, by choice).
- No `meta theme-color`; mobile browser chrome keeps its default tint.

## Follow-up

- [ ] If a site header is added later, consider moving the toggle into it.
- [ ] If a Content Security Policy is added, allow the inline head script by hash.
