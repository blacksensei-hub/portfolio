# 0024 Reflow, the scan story on its side, and Pause animations

Status: accepted

Four accessibility fixes from a second pass with the ui-ux-pro-max checklist.

## 1. Nothing scrolls sideways at 320px (WCAG 1.4.10 Reflow)

At 320 CSS pixels, the width of a 1280 pixel window zoomed to 400 percent, the home page scrolled 4px sideways. The About facts list holds the email address, which has no break points, and grid items won't shrink below their content by default, so both About columns grew to fit it.

- The bio and the facts list are `min-w-0`.
- The email wraps (`overflow-wrap: anywhere`, right aligned) instead of being truncated.

**AC-1:** at 320px wide, `/`, both case studies and `/styleguide/` have no horizontal scroll.

## 2. The scan story on a phone on its side

The AttendX scan story (spec 0022) pins a stage that is about 440px tall in its stacked layout. On a phone held sideways (844 by 390) it is taller than the screen. The step text sat below the fold, so it was never read while pinned.

Measured with the stage pinned, the bottom of the step text against the viewport height:

| Viewport | Step bottom / viewport height | Fits |
|---|---|---|
| 375 × 667 | 603 / 667 | yes |
| 768 × 600 | 556 / 600 | yes |
| 1024 × 600 | 452 / 600 | yes |
| 844 × 390 | 428 / 390 | no |

The stage now pins only where `(prefers-reduced-motion: no-preference) and (min-height: 600px)` matches. The same query is used in CSS and as `PINNED` in `scan-story.ts`. Anywhere else it is the plain list beside the finished state, the same as under reduced motion. The script listens for the query to change, so turning the phone moves between the two. When it unpins, it clears the step, checks, code and `aria-current`.

600px is a little conservative for wide screens: side by side, the stage would fit down to about 500px. One threshold keeps it simple, and a window that short still gets the whole story as a list.

**AC-2:** at 844 × 390 nothing pins and every step is visible. Turning to 390 × 844 pins the stage and it follows the scroll. Turning back mid-story returns to the list with no step marked current.

## 3. Pause animations (WCAG 2.2.2 Pause, Stop, Hide)

The site has a number of endless loops that start on their own:
- the drifting background glows
- the aurora
- the skills marquee
- the pinging status dots
- the blinking carets
- the scroll cue
- the Contact typewriter
- the scan beam

The hero's shimmer runs for 12 s. The off-screen pause (spec 0022) saves work but doesn't let a person stop what is in view. The user chose to keep these effects (design audit, 2026-10-03), so they get a pause control rather than being removed.

- **The button:** `MotionToggle` is a round 44px button named "Pause animations", with `aria-pressed`. Its icon is pause, or play once pressed.
- **Placement:** in the header it follows the theme toggle in the Tab order and sits just before it on screen. Pages without a header float it beside the theme toggle.
- **Mechanism:** clicking sets `data-motion="paused"` on `<html>` and stores `localStorage.motion` (`paused` or `running`). `MOTION_HEAD_SCRIPT` (inline, ES5) applies a saved pause before first paint.
- **What pauses:** a global rule sets `animation-play-state: paused` on every loop. The list in global.css is kept in step with `PERPETUAL` in `offscreen.ts`, and a unit test checks this. Entrance animations (rise, mask-up, count-up, type-line, draw) aren't listed, so they still finish.
- **The typewriter:** it shows the whole current phrase and holds it.
- **The scan beam:** pauses from ScanStory's own styles.
- **When it is hidden:** it renders `hidden` and its script reveals it, so without JavaScript it never shows. Under reduced motion it stays hidden, since every animation already rests there.
- **Not paused:** the footer clock, which changes once a minute and is information rather than decoration. The hover-only glow ring, which the user starts.

**AC-3:** pausing leaves no infinite animation running anywhere on the page, including after scrolling everything into view. Resuming starts them again.
**AC-4:** the pause survives navigation and reload and applies before first paint. Resuming is stored as `running`.
**AC-5:** the button is hidden under reduced motion and without JavaScript. The header has no axe violations either way.

## 4. Contact addresses wrap

The detail line under each Contact link (the LinkedIn and GitHub addresses, the email) was `truncate`, so on a phone the LinkedIn address lost its ending. That ending is the useful part, so it now wraps (`overflow-wrap: anywhere`).

**AC-6:** at 320px and 375px no Contact link or About fact is clipped or ellipsized.

## Verification

- `motion.test.ts`:
  - the head script for each stored value, and when storage throws
  - the script is plain ES5
  - the global.css pause rule covers every `PERPETUAL` loop, plus drift and shimmer
- `motion.spec.ts`: covers AC-3 to AC-5, plus the Tab order and placement, and the typewriter holding a whole phrase.
- `scan-story.spec.ts`: covers AC-2.
- `reflow.spec.ts`: covers AC-1 and AC-6.
- `design-system.spec.ts`: the styleguide's focus walk steps over the new button.
