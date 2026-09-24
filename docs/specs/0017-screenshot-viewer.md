# 0017 Full-screen screenshot viewer

Status: accepted

Case study screenshots were too small to read. Clicking one now opens it full screen.

- Each screenshot is a real link to its full-size WebP (via `getImage`), so with no JavaScript a click still opens the image.
- `src/lib/lightbox.ts` turns those links into a native `<dialog>` viewer: modal, focus trapped, Esc and the close button close it, a click on the dimmed area closes it, and focus returns to the screenshot that opened it. Arrow keys, on-screen arrows, and horizontal swipes step through every shot on the page (desktop, then phone), wrapping round. Neighbours preload. Ctrl or Cmd click still opens the image in a new tab.
- Themed with tokens: the backdrop is the page surface at 95 percent with a blur, controls use the glass style.
- A "View" chip appears on hover and focus; the link's accessible name is the image's alt text plus ", open full size".

Verification: `lightbox.test.ts` (index wrapping, swipe direction); e2e covers open, counter, arrows and wrap, the next button, Esc with focus return, axe with the viewer open, and the no-JavaScript link.
