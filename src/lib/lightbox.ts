/*
 * Full-screen screenshot viewer for the case study galleries (spec 0017).
 *
 * Each screenshot is an ordinary link to its full-size image, so without this
 * script a click still opens the image. With it, the click opens a native
 * <dialog> instead: modal, focus trapped, Esc closes, and focus goes back to
 * the screenshot that opened it. Arrow keys and swipes move between shots.
 */

/** The index `delta` steps from `current` in a list of `length`, wrapping round. */
export function stepIndex(current: number, delta: number, length: number): number {
  if (length <= 0) return 0;
  return (((current + delta) % length) + length) % length;
}

/** A horizontal swipe's direction: -1 back, 1 forward, 0 when it was too short or mostly vertical. */
export function swipeDirection(dx: number, dy: number, threshold = 50): -1 | 0 | 1 {
  if (Math.abs(dx) < threshold || Math.abs(dx) < Math.abs(dy)) return 0;
  return dx < 0 ? 1 : -1;
}

export function initLightbox(root: Document = document): void {
  const dialog = root.querySelector<HTMLDialogElement>('[data-lightbox-dialog]');
  const triggers = [...root.querySelectorAll<HTMLAnchorElement>('a[data-lightbox]')];
  if (!dialog || triggers.length === 0 || typeof dialog.showModal !== 'function') return;

  const image = dialog.querySelector<HTMLImageElement>('[data-lightbox-image]');
  const caption = dialog.querySelector<HTMLElement>('[data-lightbox-caption]');
  const counter = dialog.querySelector<HTMLElement>('[data-lightbox-counter]');
  if (!image || !caption || !counter) return;

  let index = 0;
  let opener: HTMLElement | null = null;

  const show = (next: number) => {
    index = stepIndex(next, 0, triggers.length);
    const link = triggers[index];
    if (!link) return;
    image.src = link.href;
    image.alt = link.dataset['alt'] ?? '';
    caption.textContent = link.dataset['caption'] ?? '';
    caption.hidden = !link.dataset['caption'];
    counter.textContent = `${index + 1} / ${triggers.length}`;
    // Warm the neighbours so arrowing through feels instant.
    for (const d of [-1, 1]) {
      const near = triggers[stepIndex(index, d, triggers.length)];
      if (near) new Image().src = near.href;
    }
  };

  triggers.forEach((link, n) => {
    link.addEventListener('click', (event) => {
      // Let modified clicks (new tab, download) do what the visitor asked.
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0)
        return;
      event.preventDefault();
      opener = link;
      show(n);
      dialog.showModal();
      root.documentElement.style.overflow = 'hidden';
    });
  });

  dialog.querySelector('[data-lightbox-prev]')?.addEventListener('click', () => show(index - 1));
  dialog.querySelector('[data-lightbox-next]')?.addEventListener('click', () => show(index + 1));
  dialog.querySelector('[data-lightbox-close]')?.addEventListener('click', () => dialog.close());

  dialog.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') show(index - 1);
    if (event.key === 'ArrowRight') show(index + 1);
  });

  // A click on the dimmed area around the image closes it.
  dialog.addEventListener('click', (event) => {
    if (
      event.target === dialog ||
      (event.target as HTMLElement).hasAttribute('data-lightbox-stage')
    ) {
      dialog.close();
    }
  });

  let startX = 0;
  let startY = 0;
  dialog.addEventListener(
    'touchstart',
    (event) => {
      const t = event.touches[0];
      if (t) [startX, startY] = [t.clientX, t.clientY];
    },
    { passive: true },
  );
  dialog.addEventListener('touchend', (event) => {
    const t = event.changedTouches[0];
    if (!t) return;
    const dir = swipeDirection(t.clientX - startX, t.clientY - startY);
    if (dir !== 0) show(index + dir);
  });

  dialog.addEventListener('close', () => {
    root.documentElement.style.overflow = '';
    image.removeAttribute('src');
    opener?.focus();
  });
}
