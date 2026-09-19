# 0011 Visual redesign: Woven threads

Status: accepted

## Decision

Restyle the Release 1 portfolio so it reads as a designed portfolio, not a design system demo. The visual layer only: no content model, stack, or pipeline changes. The design bar follows the 10k websites skill (one committed direction, one signature element, a display/body/mono trio, the accent in rare doses, a tinted canvas, one fixed background environment layer, no two neighboring sections sharing a skeleton). Its build method (plain HTML, scroll video hero, Hostinger) was deliberately not adopted: the Astro stack, zero client JS by default, Cloudflare Pages, and the test suite stay.

Direction and tokens are documented in `design.md`.

## What changed

1. **Hero**: full viewport height, name at `text-hero`, the Weave behind it, availability pill, two CTAs, a scroll cue.
2. **Project images**: screenshots of both live demos in `src/assets/`, wired through `projects.yaml` `image`. Projects are full width feature rows, image side alternating on desktop.
3. **Typography**: Bricolage Grotesque (display), Instrument Sans (body), JetBrains Mono (labels), self hosted via Fontsource. Inter remains only for the build time OG card (spec 0006 unchanged).
4. **Nav and footer**: fixed SiteHeader from `md` up; footer with name, year, "Built with Astro", GitHub, and the analytics notice.
5. **Motion**: CSS only. Load entrance, scroll driven `.reveal` and `.thread-draw` (transform, never opacity), card lift, image zoom, growing gold rules. Reduced motion stops all of it at the final frame.
6. **Width and balance**: column 48rem to 76rem. Skills are ruled rows (no 3+2 hole), services a 2 by 2 (no 3+1 hole).
7. **Accent**: kente gold, rationed to CTAs, links, focus, chapter numbers, and the Contact closing line.
8. **Void**: the `min-height: 100svh` rule on the last section is removed. Contact is a closing section plus a real footer; `scroll-padding-top` clears the nav.

## Acceptance

- WCAG 2.2 AA contrast in both themes (`tokens.test.ts`), axe clean in light, dark, and forced themes.
- Hero name, role, and tagline visible before scrolling at 375x667 and 1280x800.
- No horizontal scroll at 375px.
- Skills: each group's heading sits above its items on phones and beside them from tablet up.
- Work with me: 1 column on phones, 2 on tablet and desktop.
- Projects: stacked rows on all widths; on desktop the image sits beside the text, alternating sides.
- The page loads only the three self hosted faces and makes no other cross origin request except the production beacon.

## Follow ups

- Resume PDF and LinkedIn remain deferred (content, not visual).
- Screenshots are captures of the live demos on 2026-09-19; retake when the apps change.
