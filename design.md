# Design system

The look of the portfolio: its tokens and base components. Decided in [spec 0003](docs/specs/0003-design-system/index.md). See every token and component live at `/styleguide/` (noindexed, not in the sitemap).

**Source of truth:** `src/styles/global.css`. This file only documents it. If the two ever disagree, `global.css` wins, and this file should be fixed. Never write a color, font size, radius, or duration anywhere else. Use the Tailwind utility the token creates (for example `text-accent`, `bg-surface-raised`, `rounded-card`).

**Direction:** clean and editorial. Lots of white space, Inter as the only typeface, one indigo accent, a 48rem column, and subtle 150ms transitions.

## Color tokens

Named by role, not by hue. Light values live in `@theme`. Dark values override them in `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) }`, so `data-theme="light"` on `<html>` forces light. Feature 11 adds `:root[data-theme="dark"]`.

| Token | Light | Dark | Purpose |
|---|---|---|---|
| `--color-surface` | `oklch(99% 0 0)` | `oklch(17% 0.015 260)` | page background |
| `--color-surface-raised` | `oklch(97% 0.005 260)` | `oklch(22% 0.02 260)` | Card and Tag background |
| `--color-on-surface` | `oklch(22% 0.02 260)` | `oklch(94% 0.01 260)` | body text, headings |
| `--color-muted` | `oklch(45% 0.02 260)` | `oklch(72% 0.02 260)` | secondary text, meta lines |
| `--color-accent` | `oklch(50% 0.19 262)` | `oklch(75% 0.13 262)` | link text, primary ButtonLink fill |
| `--color-on-accent` | `oklch(99% 0 0)` | `oklch(17% 0.015 260)` | text on an accent fill |
| `--color-border` | `oklch(88% 0.01 260)` | `oklch(32% 0.02 260)` | Card and Tag outline (decorative) |
| `--color-focus` | `var(--color-accent)` | follows the dark accent | focus outline |

`src/styles/tokens.test.ts` proves WCAG 2.2 AA for both themes: text pairs at least 4.5:1, focus at least 3:1. If you add a color token, give it both values, keep it an `oklch(L% C H)` literal, and add a pair to that test if it carries text.

## Other tokens

| Token | Value | Utility / use |
|---|---|---|
| `--font-sans` | `'Inter Variable', 'Inter Fallback', ui-sans-serif, system-ui, sans-serif` | all text (Inter self hosted via `@fontsource-variable/inter`) |
| `--text-display` | `clamp(2.25rem, 1.6rem + 3vw, 3.5rem)`, line height 1.1 | `text-display`, the page `<h1>` |
| `--text-h2` | `clamp(1.5rem, 1.25rem + 1.2vw, 2rem)`, line height 1.25 | `text-h2`, Section headings |
| `--text-h3` | `1.25rem`, line height 1.4 | `text-h3`, Card titles |
| body | Tailwind `text-base`, line height 1.6 | paragraphs |
| small | Tailwind `text-sm` | Tag text, meta lines |
| `--spacing-gutter` | `1.5rem` | `px-gutter`, Container side padding |
| `--spacing-section` | `clamp(4rem, 3rem + 4vw, 7rem)` | `py-section`, space between Sections |
| `--container-content` | `48rem` | `max-w-content` |
| `--radius-card` | `0.75rem` | `rounded-card` |
| `--radius-tag` | `9999px` | `rounded-tag` |
| `--default-transition-duration` | `150ms` | every `transition-*` utility |

Spacing inside components uses Tailwind's default 0.25rem scale.

**Global rules in `global.css`:** every focusable element gets a `:focus-visible` outline (2px solid `--color-focus`, 2px offset). `main:focus` draws no outline. Under `prefers-reduced-motion: reduce`, all transitions are removed.

## Components

All live in `src/components/ui/`. They are `.astro` only and ship no client JavaScript.

### Container
The one width wrapper: `max-w-content`, centered, with the side gutter. No props. Use it when content needs the column but not a full Section.
```astro
<Container><p>…</p></Container>
```

### Section
Props: `id: string`, `title: string`, and a default slot. Renders `<section id aria-labelledby>` with a Container and an `<h2 id="${id}-heading">`, padded by `py-section`. Use it for every top level page section. The `id` is the in page anchor.
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
Default slot only. A small pill of muted text on `surface-raised` with a border. Not interactive. Wrap a group in a list.
```astro
<ul class="flex flex-wrap gap-2"><li><Tag>Astro</Tag></li></ul>
```

### Card
Props: `as?: 'article' | 'div'` (default `article`), and a default slot. A `surface-raised` box with a border and `rounded-card`. Never wrap the whole card in a link. Links inside stay separate Tab stops.
```astro
<Card><h3 class="text-h3 font-semibold">Title</h3>…</Card>
```

### SkipLink
No props. "Skip to content", pointing at `#main` and visually hidden until focused. `BaseLayout` renders it first in `<body>`, then wraps the page in `<main id="main" tabindex="-1">`. Pages must not render their own `<main>`.
