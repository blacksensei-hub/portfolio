# 0018 Fluid motion

Status: accepted

The owner asked for Apple-style motion and materials on the current design, guided by an "Apple design" skill distilled from WWDC talks (chiefly *Designing Fluid Interfaces*). The look, tokens, and layout from specs 0011 to 0017 stay. What changes is how things move and respond.

## Principles taken from the skill

- **Springs, not durations**, for anything a person can touch. Parameters are Apple's damping ratio and response (seconds). Damping 1 (no overshoot) by default. A spring always starts from the current on-screen value and velocity, so every animation can be interrupted and redirected.
- **Direct manipulation**: a dragged thing follows the finger 1:1 from where it was grabbed, after about 10px of hysteresis decides the direction.
- **Velocity handoff and momentum projection**: on release, the spring continues at the finger's speed, and the landing target is chosen from the projected end point, `x + (v / 1000) * d / (1 - d)` with `d = 0.998`.
- **Rubber-banding** at edges instead of hard stops.
- **Spatial consistency**: things leave the way they came, and open from the element that triggered them.
- **Feedback on press**, not on release.

## Scope

1. **Screenshot viewer** (extends 0017). It opens by growing out of the clicked thumbnail and closes back into the thumbnail of the shot on screen, or shrinks and fades in place if that thumbnail is off screen. While open:
   - **Horizontal drag:** the shot follows the finger, and the neighbour comes in alongside it. Release uses projection to page or settle.
   - **Vertical drag:** the shot follows the finger and the backdrop thins as it goes. A projected throw past a fifth of the screen closes the viewer.
   - **Keys and buttons:** paging slides the shots in from the side they came from.
   - **Interruption:** grabbing the shot while it closes takes it back.
   - **What stays from 0017:** Esc, the buttons, focus return, and the no-JavaScript link. The low-resolution thumbnail shows first, and the full image swaps in when it has loaded.
2. **Phone menu**:
   - **Open and close:** the panel grows out of the menu button (transform origin at the trigger, scale, fade and a short blur together) and closes back the same way.
   - **Ways to close:** Esc (focus returns to the button), a tap outside, choosing a link, or swiping the panel up with a projected throw.
   - **Without JavaScript:** it stays a plain disclosure.
3. **Press feedback**:
   - **Press state:** buttons, nav links, cards' main links, and gallery shots scale slightly on press (`motion-safe:active:`). A no-op touch listener enables `:active` on iOS.
   - **Magnetic lean:** it uses two independent springs (x and y) instead of a CSS transition, so it eases back from wherever it is.
4. **Reduced motion, gently**: under `prefers-reduced-motion: reduce`, keyframe animations still stop at their final frame. Transitions are limited to colour, opacity, and shadow instead of being removed, so feedback stays without movement. Script-driven motion becomes short cross-fades. This replaces AC-8 of spec 0003 ("removes every transition").
5. **Materials**:
   - **Accessibility settings:** `.glass` turns solid under `prefers-reduced-transparency: reduce`. Under `prefers-contrast: more` it gets a solid surface and a contrasting border.
   - **Scroll edge:** a scroll edge effect softens content as it slides under the floating nav: a top band with a light blur and a gradient mask, faded in by the page scroll timeline.
6. **Typography**: size-specific tracking tokens. Hero -0.03em, display -0.022em, h2 -0.015em, h3 -0.01em, xs and sm text slightly positive. Leading already tightens with size and is unchanged. Headings drop their hard-coded `tracking-tight` so the tokens apply.
7. **Theme switch**: the toggle cross-fades between themes with a View Transition (280ms), also under reduced motion, since a fade is not vestibular motion. Browsers without the API switch instantly as before.

## Not in scope

Sound and haptics: they don't earn a place on a portfolio, and iOS Safari has no Vibration API. Also out of scope: any change to colours, layout, content, or the scroll-driven reveals.

## Build

- `src/lib/spring.ts`: a small dependency-free spring (semi-implicit Euler in fixed substeps), a velocity tracker over the last 100ms, `project`, `rubberband`, and `prefersReducedMotion`. Unit tested.
- `src/lib/lightbox.ts` rebuilt on it, keeping `stepIndex` and `swipeDirection` (still used under reduced motion). New pure helpers `fitRect` and `pageDecision` are unit tested.
- `src/lib/menu.ts` for the phone menu, started from `initInteractions`.
- No new dependencies. Script-driven motion animates only `transform`, `translate`, `scale`, `opacity` and `filter`.

## Verification

- **Unit:** spring settling with and without overshoot, retargeting keeps velocity, projection, rubber-band, velocity tracking, `fitRect`, and `pageDecision`.
- **E2E, viewer:** the 0017 tests still pass.
- **E2E, menu:** it opens, closes on a link, closes on Esc with focus return, and closes on an outside tap.
- **E2E, accessibility settings:** reduced motion keeps only colour and opacity transitions, `.glass` is solid under reduced transparency and under more contrast, and the theme toggle still cycles.
- **Manual:** checked in the browser at desktop and phone sizes.
