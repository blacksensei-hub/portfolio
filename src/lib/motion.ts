/*
 * Pause animations (spec 0024, WCAG 2.2.2 Pause, Stop, Hide). The site's
 * endless loops (the drifting glows, aurora, marquee, pinging dots, carets,
 * scroll cue, shimmer, typewriter and the scan beam) can be paused from a
 * button beside the theme toggle. The choice lives in localStorage["motion"]
 * and on <html data-motion="paused">, which a global rule in global.css turns
 * into a held frame. Entrance animations play once and are left alone.
 */

export const MOTION_STORAGE_KEY = 'motion';

/** The button's accessible name; aria-pressed carries the state. */
export const MOTION_LABEL = 'Pause animations';

/** Whether the loops are paused on this page. */
export function isPaused(root: Pick<Element, 'getAttribute'>): boolean {
  return root.getAttribute('data-motion') === 'paused';
}

/** Sets or clears the paused mark. */
export function applyPaused(
  root: Pick<Element, 'setAttribute' | 'removeAttribute'>,
  paused: boolean,
): void {
  if (paused) root.setAttribute('data-motion', 'paused');
  else root.removeAttribute('data-motion');
}

/*
 * Runs inline and render blocking in <head>, beside the theme script, so a
 * saved pause holds from the first frame. Plain ES5 on purpose: it is never
 * bundled. Same result as applyPaused(document.documentElement, stored === 'paused').
 */
export const MOTION_HEAD_SCRIPT = `(function () {
  try {
    if (localStorage.getItem('${MOTION_STORAGE_KEY}') === 'paused')
      document.documentElement.setAttribute('data-motion', 'paused');
  } catch (e) {}
})();`;
