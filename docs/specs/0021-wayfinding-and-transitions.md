# 0021 Wayfinding and page transitions

Status: accepted

Four more items from the Apple design skill, chosen by the owner after spec 0018.

1. **Screens carry across pages** (spatial consistency). The case study header now shows the same window-and-phone preview as its home page card, through a shared `DevicePreview` component and `pickPreview` from `src/lib/preview.ts`.
   - **Transition:** both name the same view transitions (`shot-<slug>-window` and `shot-<slug>-phone`), and `@view-transition { navigation: auto }` turns navigations into View Transitions. Following "Read case study" carries the screens from the card into the header; Back or "All projects" carries them home. The rest of the page cross-fades.
   - **Easing:** the groups move on a critically damped spring (damping 1, response 0.42) sampled from `spring.ts` into a `linear()` curve, over 600ms.
   - **Reduced motion:** the screens don't travel, and the page only fades.
   - **Other browsers:** those without cross-document View Transitions navigate as before.
   - **Alt text:** the header copies are decorative (empty alt), because the gallery below shows the same screens with full descriptions.
2. **Solid chip over a translucent layer** (materials). The "Visit live site" chip sat as glass on a blurred, half-transparent overlay, which the skill rules out for legibility. It is now a solid surface with a border.
3. **Copy email, confirmed** (feedback). The email row in Contact gets a copy button. On success it shows a tick and a "Copied" label and announces "Email address copied." politely, then resets after two seconds. It is hidden until the script finds a clipboard, so without JavaScript the plain email link remains.
4. **On this page** (wayfinding). Case studies list their sections.
   - **Wide screens:** a sticky card beside the write-up, above "Built with".
   - **Phones and tablets:** a fold-away list above it that closes once a section is chosen.
   - **Highlighting:** `src/lib/toc.ts` marks the section being read with `aria-current="location"`, using the last heading past the reading line under the fixed header.

Verification:
- **Unit:** `preview.test.ts` covers the shot picking and transition names, and `toc.test.ts` covers the active section.
- **E2E** (`wayfinding.spec.ts`):
  - the card and its case study share transition names, which are dropped under reduced motion
  - the contents list matches the write-up's sections and marks the one jumped to
  - the phone list closes on a choice
  - copy puts the address on the clipboard, confirms it, and resets, and stays hidden without JavaScript
  - the live-site chip is opaque, with no backdrop filter
- **Manual:** frames recorded across the navigation show the screens travelling into place.
