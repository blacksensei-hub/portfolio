/*
 * Perpetual animations rest while they are off screen (spec 0022). The aurora
 * blobs, the marquee, the pinging status dots, the blinking carets and the
 * scroll cue loop forever; without this they keep repainting below the fold
 * and under other sections. An IntersectionObserver marks each one
 * `data-offscreen` when it leaves the viewport (with a little margin), and a
 * global rule pauses its animation until it comes back. The typewriter checks
 * the same mark before each keystroke.
 */

export const PERPETUAL =
  '.animate-aurora, .animate-marquee, .animate-ping, .animate-scroll-cue, .caret';

export function initOffscreenPause(root: Document = document): void {
  if (typeof IntersectionObserver !== 'function') return;
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries)
        entry.target.toggleAttribute('data-offscreen', !entry.isIntersecting);
    },
    { rootMargin: '120px 0px' },
  );
  for (const el of root.querySelectorAll(PERPETUAL)) observer.observe(el);
}
