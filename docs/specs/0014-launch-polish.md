# 0014 Launch polish

Status: accepted

The last gaps before the redesign goes live.

1. **Brand icons.** `public/favicon.svg` is the gold JA badge; `favicon.ico` and `apple-touch-icon.png` are generated from it with sharp, and `theme-color` is set per theme. The Astro scaffolding icon is gone.
2. **Social card.** `og.png.ts` now draws the dark palette card: JA badge, availability chip, name, role, tagline, thread bar. Colors come from the forced dark block in `global.css`, so tokens and card cannot drift.
3. **Phone menu.** The nav pill gains a `<details>` disclosure below `md` listing every section plus the contact links. It works with no JavaScript; the script only closes it after a choice.
4. **Resume.** `pnpm resume` builds `public/resume.pdf` from the content collections (`scripts/build-resume.mjs`), and `profile.yaml` now sets `resume: /resume.pdf`, so the download button appears in Contact. Education is the one hand maintained block, and its placeholder must be filled before launch.
5. **design.md** brought up to date for specs 0012 to 0014.
