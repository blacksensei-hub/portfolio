# 0003. Design system: rationale

## Context

The site has a scaffold, a content model, and a thin starter `@theme` with four colors, one font, and one spacing value. There is no `design.md`, no base components, and no design file or screenshots to work from. Five Release 1 features (hero, projects, skills, contact, SEO) and two Release 2 features (theme toggle, work with me) all render UI. Without a shared foundation, each would pick its own colors, spacing, and link styles, and contrast would be checked one section at a time, if at all.

Three forces shape the decision. Accessibility is a hard bar: the scope requires WCAG 2.2 AA text contrast and keyboard operable components, and the theme feature later requires AA in both themes. The stack is fixed: Astro 7 static output with no adapter, Tailwind 4 configured in CSS through `@theme`, and a project rule that anything without state is `.astro`, not a React island. And the audience is recruiters and clients skimming on phones and laptops, so readability and fast load matter more than visual novelty.

Not deciding means feature 5 invents the look and every later section copies or diverges from it, and feature 11 has to retrofit a second palette and redo contrast checks across finished sections.

## Options considered

### Option 1: Semantic tokens in `@theme` plus hand built `.astro` components

Role named CSS variable tokens with light and dark values, and seven small zero JavaScript components written for this site.

**Pros**:
- Fits the project rules exactly: tokens in `@theme`, `.astro` by default, no islands.
- Dark mode is a token swap, so components never carry `dark:` classes.
- Small surface that a unit test can fully check for contrast.

**Cons**:
- Every component is written and maintained by hand.
- Two color sets must stay in step.

### Option 2: A Tailwind component library (for example daisyUI or a copied component kit)

Adopt a ready plugin or kit with its own themes and components.

**Pros**:
- Many components and themes immediately.
- Themes are already built for dark mode.

**Cons**:
- Brings far more than a one page site needs, and its own class names and theme conventions to learn.
- Its default themes are not guaranteed to meet AA on every pair, so contrast still has to be checked, now against someone else's values.
- Many kits assume React or interactive JavaScript for pieces this site needs only as static markup.

### Option 3: Tailwind defaults with `dark:` variants, no semantic tokens

Use Tailwind's built in palette (`slate-900`, `indigo-600`) directly in markup, with `dark:` variants per class.

**Pros**:
- No token layer to design; fastest to start.

**Cons**:
- Every element carries doubled color classes, and feature 11's `data-theme` override means reconfiguring the `dark` variant anyway.
- Contrast can only be checked on rendered pages, not over a fixed set of pairs.
- Changing the accent means editing every file.

## Rationale

Option 1 is the only one that matches all three forces at once. The stack rules already put tokens in `@theme` and stateless UI in `.astro`, so this option adds no new pattern. Semantic tokens turn the AA requirement into a closed list of color pairs that a unit test can check in both themes, which is stronger than axe alone (axe only sees what a page happens to render). Defining the dark set now behind `:root:not([data-theme="light"])` means feature 11 adds a toggle rather than a palette.

Option 2 trades a small amount of hand work for a large dependency whose contrast and markup this site would still have to audit. Option 3 is fastest for a day but makes the accent, the dark theme, and contrast checking harder at every later step.

Smaller calls made here, each with its runner up: an in house OKLCH contrast helper rather than `culori` (about 30 lines of well known math, no dependency, runner up `culori` if the conversion proves fiddly); parsing tokens from `global.css` in the test rather than a separate token JSON (one source of truth, runner up a shared TS token module that generates the CSS); a noindexed `/styleguide` in the build rather than a dev only page (the e2e suite runs against the built site, runner up rendering components on `/` temporarily); `ButtonLink` as an anchor rather than a `<button>` (every call to action here navigates or downloads, runner up a real button component when a form arrives); a metric adjusted fallback font rather than preloading Inter (fixes layout shift without an extra request hint, runner up adding a `<link rel="preload">`).
