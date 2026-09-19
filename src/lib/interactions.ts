/*
 * Pointer micro interactions (spec 0012): a spotlight that follows the pointer
 * across `[data-spotlight]` surfaces, and buttons marked `[data-magnetic]` that
 * lean toward the pointer. Pure enhancement: without this script, or under
 * reduced motion or a touch pointer, every element simply rests in place.
 */

type Box = { left: number; top: number; width: number; height: number };

/** How far a magnetic element leans toward the pointer, in px, capped at `max`. */
export function magnetOffset(
  box: Box,
  x: number,
  y: number,
  strength = 0.3,
  max = 10,
): { dx: number; dy: number } {
  const clamp = (v: number) => Math.max(-max, Math.min(max, v));
  return {
    dx: clamp((x - (box.left + box.width / 2)) * strength),
    dy: clamp((y - (box.top + box.height / 2)) * strength),
  };
}

/** The pointer position relative to `box`, for the spotlight's CSS variables. */
export function localPoint(box: Box, x: number, y: number): { mx: number; my: number } {
  return { mx: x - box.left, my: y - box.top };
}

export function initInteractions(root: Document = document): void {
  const fine = window.matchMedia('(pointer: fine) and (prefers-reduced-motion: no-preference)');
  if (!fine.matches) return;

  // The spotlight tracks the pointer over the element's hover target (its parent),
  // so an overlay with pointer-events: none still follows the card it lights.
  for (const light of root.querySelectorAll<HTMLElement>('[data-spotlight]')) {
    const target = light.parentElement ?? light;
    target.addEventListener('pointermove', (event) => {
      const { mx, my } = localPoint(light.getBoundingClientRect(), event.clientX, event.clientY);
      light.style.setProperty('--mx', `${mx}px`);
      light.style.setProperty('--my', `${my}px`);
    });
    target.addEventListener('pointerleave', () => {
      light.style.removeProperty('--mx');
      light.style.removeProperty('--my');
    });
  }

  for (const el of root.querySelectorAll<HTMLElement>('[data-magnetic]')) {
    el.addEventListener('pointermove', (event) => {
      const { dx, dy } = magnetOffset(el.getBoundingClientRect(), event.clientX, event.clientY);
      el.style.translate = `${dx}px ${dy}px`;
    });
    el.addEventListener('pointerleave', () => {
      el.style.translate = '';
    });
  }
}
