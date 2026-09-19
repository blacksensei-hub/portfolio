# 0012 Motion and refinements

Status: accepted

Owner feedback on spec 0011, applied to the visual layer only.

1. **Type**: Space Grotesk for headings, Inter for body text, JetBrains Mono for labels, buttons, and technical details. The OG card already renders in Inter (spec 0006), so all surfaces now agree.
2. **Weave**: moved from behind the name to the hero's bottom edge, where it no longer competes with the h1.
3. **AttendX image**: the owner's logo (`src/assets/logo-full.png`) replaces the login screenshot.
4. **Footer**: one line at one size: "© {year} Jeffrey Nii Akwei Ankrah" and "Built with Astro · GitHub". The analytics notice from spec 0010 is removed at the owner's request; the beacon itself is unchanged and still cookie free.
5. **Nav**: a liquid glass pill that shrinks as the page scrolls (CSS scroll timeline, no script), with the current section highlighted via `:target-current`. The theme toggle matches the glass.
6. **Motion throughout**: word-by-word heading reveals, a reading progress bar, image parallax, button sheen and magnetic lean, card spotlight and glow, a tech stack marquee, ruled rows that shift on hover, contact rows that fill on hover.

Constraints kept: one small vanilla script (`src/lib/interactions.ts`, unit tested) for pointer effects only; no React island; everything rests at its final frame under reduced motion; contrast and axe checks unchanged and passing.
