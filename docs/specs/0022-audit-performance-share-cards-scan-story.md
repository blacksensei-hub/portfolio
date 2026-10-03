# 0022 Audit, off-screen pause, share cards, and the scan story

Status: accepted

Four items chosen by the owner from two skill bundles ("AI design slop" audit, web animation performance, banner and social images, scroll-scrubbed visual sequences).

1. **Design audit.** An evidence-based, removal-first review of the live site is in `docs/reviews/2026-10-03-design-audit.md`. It found eight issues, led by 11 perpetual animations, duplicated availability, and decorative stacking on cards. Removals are the owner's call and are not made here. The one quality defect it found, the email address clipped by the copy button, is fixed: the email row in Contact spans both columns.
2. **Off-screen pause.** `src/lib/offscreen.ts` marks perpetual animations `data-offscreen` while they are out of view (an IntersectionObserver with a 120px margin). The aurora blobs, marquee, pings, scroll cue and carets are covered. A global rule pauses their animation while they carry that mark. The Contact typewriter also waits instead of typing for nobody. The fixed background glows are always in view and are left alone.
3. **Share cards per case study.** `/projects/<slug>/og.png` is drawn at build time with the same satori and resvg pipeline as the home card, now shared in `src/lib/og-card.ts`. Each card is 1200×630 in the dark palette and weave:
   - "Case study", the project title and the headline on the left
   - on the right, the project's preview screens (`pickPreview`): a window bleeding off the edge, with the phone resting on it

   Screens are read from their source files and converted to JPEG for satori. The case study pages point `og:image` at their own card, with alt text naming the project and the headline.
4. **"How a scan is checked"** (AttendX, `story: scan` in the frontmatter). After the write-up comes a pinned stage that steps through one scan as the page scrolls. The illustration, labelled as one, has a projector with a changing QR code, a phone, and the live register.
   - **Steps:** the code goes up; a phone scans it; four checks tick off; the name lands on the register; or the scan is refused and a flag is raised.
   - **Scroll mapping:** `src/lib/scan-story.ts` maps native scroll position to the step, the number of checks passed and the code shown, so the sequence plays the same forward and back. The current step is marked `aria-current="step"`.
   - **Without script or with reduced motion:** the steps read as a plain list beside the finished state.

Verification:
- **Unit:** `scan-story.test.ts` covers progress, steps, checks and codes.
- **E2E:**
  - `offscreen.spec.ts`: off-screen loops are paused and resume in view, and none runs off screen at the top of the page
  - case study tests: each page has its own 1200×630 PNG card
  - `scan-story.spec.ts`: the story is on AttendX only, scrolling steps forward and back, and under reduced motion it is a plain list
  - axe and phone-width checks on the case study pages now include the story
- **Manual:** frames of the story at six scroll positions on desktop and phone, and both cards by eye. Lighthouse before (production) and after (the branch preview), run back to back.
