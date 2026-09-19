# Design system

The look of the portfolio: its tokens and base components. Decided in [spec 0003](docs/specs/0003-design-system/index.md), restyled by [spec 0011](docs/specs/0011-visual-redesign.md). See every token and component live at `/styleguide/` (noindexed, not in the sitemap).

**Source of truth:** `src/styles/global.css`. This file only documents it. If the two ever disagree, `global.css` wins, and this file should be fixed. Never write a color, font size, radius, or duration anywhere else. Use the Tailwind utility the token creates (for example `text-accent`, `bg-surface-raised`, `rounded-card`).

**Direction: Woven threads** (spec 0011). Built on kente weaving: one developer weaving frontend, backend, and mobile into one thing. A deep indigo night canvas (a pale indigo-tinted canvas in light), warm off-white ink, and kente gold as the rare accent: calls to action, focus rings, chapter numbers, one or two emphasis moments. Three faces: Bricolage Grotesque for headings, Instrument Sans for body text, JetBrains Mono for small labels. The **signature** is the Weave: gold, green, and red threads that weave behind the hero name and draw themselves in. One fixed background layer (two soft thread-colored glows drifting over 90s) makes the page feel like one place. No two neighboring sections share a layout: About and Skills pin the heading in a left column, Projects are alternating feature rows, Work with me is a numbered 2 by 2, Contact is a closing line over ruled link rows. Motion is CSS only and rests at its final frame under reduced motion.

## Color tokens

Named by role, not by hue. Light values live in `@theme`. Dark values override them in `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) }`, so `data-theme="light"` on `<html>` forces light. `:root[data-theme="dark"]` forces dark with the same values; the test keeps the two dark blocks equal, so a dark token change touches both. Each forced theme also sets `color-scheme` (spec 0008).

| Token | Light | Dark | Purpose |
|---|---|---|---|
| `--color-surface` | `oklch(97.5% 0.012 280)` | `oklch(19% 0.045 275)` | page background, tinted indigo, never pure white or black |
| `--color-surface-raised` | `oklch(95% 0.018 280)` | `oklch(23.5% 0.05 275)` | Card, status pill |
| `--color-on-surface` | `oklch(22% 0.05 275)` | `oklch(95% 0.015 85)` | body text, headings |
| `--color-muted` | `oklch(44% 0.04 275)` | `oklch(77% 0.03 275)` | secondary text, meta lines |
| `--color-accent` | `oklch(46% 0.1 65)` | `oklch(84% 0.14 85)` | kente gold: CTAs, links, chapter numbers |
| `--color-on-accent` | `oklch(98% 0.01 85)` | `oklch(19% 0.045 275)` | text on an accent fill |
| `--color-border` | `oklch(87% 0.025 280)` | `oklch(35% 0.05 275)` | rules, Card and Tag outline (decorative) |
| `--color-focus` | `var(--color-accent)` | follows the dark accent | focus outline |
| `--color-status-open` | `oklch(55% 0.15 150)` | `oklch(75% 0.15 150)` | status dot, available (non text, 3:1) |
| `--color-status-limited` | `oklch(62% 0.15 75)` | `oklch(80% 0.14 80)` | status dot, limited availability |
| `--color-status-closed` | `oklch(55% 0.19 25)` | `oklch(72% 0.16 25)` | status dot, booked |
| `--color-thread-gold` | `oklch(72% 0.14 80)` | `oklch(80% 0.14 85)` | Weave thread, skill separators, background glow (decorative only) |
| `--color-thread-green` | `oklch(56% 0.12 155)` | `oklch(68% 0.13 155)` | Weave thread, background glow (decorative only) |
| `--color-thread-red` | `oklch(56% 0.17 28)` | `oklch(66% 0.16 28)` | Weave thread (decorative only) |

`src/styles/tokens.test.ts` proves WCAG 2.2 AA for both themes: text pairs at least 4.5:1, focus at least 3:1. If you add a color token, give it both values, keep it an `oklch(L% C H)` literal, and add a pair to that test if it carries text.

## Other tokens

| Token | Value | Utility / use |
|---|---|---|
| `--font-sans` | `'Instrument Sans Variable'`, metric matched Arial fallback | body text (`@fontsource-variable/instrument-sans`) |
| `--font-display` | `'Bricolage Grotesque Variable'` | `font-display`, every h1 to h3 via the base layer |
| `--font-mono` | `'JetBrains Mono Variable'` | `font-mono`, labels, tags, nav |
| `--text-hero` | `clamp(3rem, 1.2rem + 7.4vw, 8.5rem)`, line height 0.92 | `text-hero`, the page `<h1>` |
| `--text-display` | `clamp(2.25rem, 1.4rem + 3.6vw, 4.5rem)`, line height 1 | project titles, the Contact closing line |
| `--text-h2` | `clamp(2rem, 1.3rem + 2.8vw, 3.75rem)`, line height 1.05 | Section headings |
| `--text-h3` | `clamp(1.25rem, 1.1rem + 0.5vw, 1.625rem)`, line height 1.25 | group, service, and link titles |
| `--text-lede` | `clamp(1.25rem, 1.05rem + 0.9vw, 1.875rem)`, line height 1.4 | the tagline and the About bio |
| `--text-label` | `0.75rem`, tracking 0.14em | mono chapter labels and nav links |
| `--spacing-gutter` | `1.5rem` | `px-gutter`, Container side padding |
| `--spacing-section` | `clamp(5rem, 3.5rem + 6vw, 10rem)` | `py-section`, space between Sections |
| `--spacing-header` | `4.75rem` | nav height and `scroll-padding-top` |
| `--container-content` | `76rem` | `max-w-content` |
| `--radius-card` | `1.25rem` | `rounded-card` |
| `--radius-tag` | `9999px` | `rounded-tag`, Tags, pills, buttons |
| `--ease-out-soft` | `cubic-bezier(0.22, 1, 0.36, 1)` | every hover and entrance |
| `--default-transition-duration` | `150ms` | every `transition-*` utility |
| `--duration-hover` | `400ms` | card lift, image zoom, rule growth |
| `--animate-rise` / `--animate-draw` / `--animate-drift` / `--animate-scroll-cue` | keyframes in `global.css` | hero entrance, Weave draw, background glow, scroll cue |

Spacing inside components uses Tailwind's default 0.25rem scale.

**Global rules in `global.css`:** every focusable element gets a `:focus-visible` outline (2px solid `--color-focus`, 2px offset). `main:focus` draws no outline. Under `prefers-reduced-motion: reduce`, all transitions and animations are removed, and every animation is written so its resting state is the final frame. `.reveal` rises content into place as it scrolls into view and `.thread-draw` draws a Weave in (CSS scroll driven animations, transform only, never opacity, so axe always sees real contrast). The last Section has no forced height: the footer closes the page, and an anchor jump to Contact lands as high as the page allows.

## Components

All live in `src/components/ui/`. They are `.astro` only and ship no client JavaScript, except ThemeToggle's small bundled script.

### Container
The one width wrapper: `max-w-content`, centered, with the side gutter. No props. Use it when content needs the column but not a full Section.
```astro
<Container><p>…</p></Container>
```

### Section
Props: `id: string`, `title: string`, `index?: string` (the mono chapter label, e.g. `"02"`), `layout?: 'stack' | 'split'` (default `stack`; `split` pins the heading in a left column from `lg`), and a default slot. Renders `<section id aria-labelledby>` with a Container and an `<h2 id="${id}-heading">`, padded by `py-section`. Use it for every top level page section. The `id` is the in page anchor.
```astro
<Section id="projects" title="Projects">…</Section>
```

### Link
Props: `href: string`, any other `<a>` attributes, and a default slot. Renders accent text with an underline whose offset grows on hover. An absolute `http(s)` URL opens in a new tab with `rel="noopener noreferrer"` and adds visually hidden " (opens in a new tab)". Relative, `#anchor`, and `mailto:` links stay put. Use it for inline text links.
```astro
<Link href="https://github.com/me">GitHub</Link>
```
When a Link starts a new line inside a sentence, end the line before it with `{' '}`. Astro drops the line break space, so without it the words run together ("anexternal link"). Prettier keeps the `{' '}` when it rewraps.
```astro
<p>
  Find the code on{' '}
  <Link href="https://github.com/me">GitHub</Link>.
</p>
```

### ButtonLink
Props: `href: string`, `variant?: 'primary' | 'secondary'` (default `primary`), `download?: boolean`, and a default slot. It is an `<a>` styled as a button: primary is an accent fill, secondary an accent outline. It follows the same external rule as Link. Use it for calls to action. It is always a link, never a `<button>`, because every action here navigates or downloads.
```astro
<ButtonLink href="/resume.pdf" variant="secondary" download>Resume</ButtonLink>
```

### Tag
Default slot only. A small mono pill of muted text with a border. Not interactive. Wrap a group in a list.
```astro
<ul class="flex flex-wrap gap-2"><li><Tag>Astro</Tag></li></ul>
```

### Card
Props: `as?: 'article' | 'div'` (default `article`), and a default slot. A `surface-raised` box with a border and `rounded-card` that lifts and takes a gold edge on hover; `group/card` lets children react (the project image zooms). Never wrap the whole card in a link. Links inside stay separate Tab stops.
```astro
<Card><h3 class="text-h3 font-semibold">Title</h3>…</Card>
```

### StatusPill
Props: `status` (the profile availability enum), `note?: string`. A pill with a decorative `aria-hidden` dot (it pings slowly when open) and a `<strong>` label, then the note. Used in the hero (label only) and Work with me (label and note). The label always carries the meaning; the color only reinforces it. Status to class goes through a `Record` of full literal class names, never `bg-status-${status}`, because Tailwind 4 only generates classes it finds written out.

### Weave
Props: `draw?: 'scroll' | 'load'` (default `scroll`), `height?: number`. The signature: three thread colored waves woven across the full width, `aria-hidden`. `load` draws once on page load (hero); `scroll` draws as it enters the viewport. Also the placeholder for a project without an image.

### SiteHeader
Props: `name`, `sections: { id, label }[]`. Slim fixed nav with the initials mark and mono anchor links, `md` and up only. Rendered by `index.astro` into BaseLayout's `header` slot, so `/styleguide/` has none.

### SkipLink
No props. "Skip to content", pointing at `#main` and visually hidden until focused. `BaseLayout` renders it first in `<body>`, then wraps the page in `<main id="main" tabindex="-1">`. Pages must not render their own `<main>`.

### ThemeToggle
No props. A round 44px icon button fixed to the top right (`top-4 right-4`, `bg-surface-raised`, border, `hover:text-accent`) that cycles the theme: system, light, dark (spec 0008). Its `aria-label` names the current choice and the next one, and one Lucide icon (monitor, sun, moon) shows, picked by CSS from `data-theme-choice` on `<html>`. It renders `hidden` and its script reveals it, so without JavaScript it never shows. `BaseLayout` renders it right after SkipLink, and an inline head script (`THEME_HEAD_SCRIPT` in `src/lib/theme.ts`) applies the saved choice before first paint. It uses `z-50`, the one raw z-index on the site, since there is no z-index scale.
