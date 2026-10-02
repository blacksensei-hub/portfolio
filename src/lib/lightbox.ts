/*
 * Full-screen screenshot viewer for the case study galleries (spec 0017, made
 * fluid by spec 0018).
 *
 * Each screenshot is an ordinary link to its full-size image, so without this
 * script a click still opens the image. With it, the click opens a native
 * <dialog> instead: modal, focus trapped, Esc closes, and focus goes back to
 * the screenshot that opened it.
 *
 * Motion follows Apple's fluid interface rules: the shot grows out of the
 * thumbnail you pressed and goes back into the one on screen; a drag follows
 * the finger 1:1 and hands its speed to a spring on release; flicks are judged
 * by where they would land, not where they let go; and anything moving can be
 * grabbed again. Under reduced motion it all becomes short cross-fades.
 */
import {
  prefersReducedMotion,
  project,
  rubberband,
  Spring,
  type SpringParams,
  VelocityTracker,
} from './spring';

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

/** The largest size of a `w` by `h` image that fits the box, never enlarged. */
export function fitRect(
  boxWidth: number,
  boxHeight: number,
  w: number,
  h: number,
): { width: number; height: number } {
  if (boxWidth <= 0 || boxHeight <= 0 || w <= 0 || h <= 0) return { width: 0, height: 0 };
  const scale = Math.min(boxWidth / w, boxHeight / h, 1);
  return { width: Math.round(w * scale), height: Math.round(h * scale) };
}

/**
 * Where a horizontal drag released at `offset` px with `velocity` px/s lands:
 * 1 the next shot, -1 the previous, 0 back to this one. Judged on the
 * projected resting point, so a short fast flick pages and a long slow drag
 * that drifts back does not.
 */
export function pageDecision(offset: number, velocity: number, width: number): -1 | 0 | 1 {
  const landing = offset + project(velocity);
  if (landing < -width / 4) return 1;
  if (landing > width / 4) return -1;
  return 0;
}

/** Whether a vertical drag should close the viewer, judged the same way. */
export function dismissDecision(offset: number, velocity: number, height: number): boolean {
  return Math.abs(offset + project(velocity)) > height / 5;
}

// Damping 1 everywhere a person didn't throw something; a touch of bounce
// only on the settle after a fling.
const OPEN: SpringParams = { damping: 1, response: 0.42 };
const PAGE: SpringParams = { damping: 1, response: 0.38 };
const SETTLE: SpringParams = { damping: 0.86, response: 0.32 };
const CLOSE: SpringParams = { damping: 1, response: 0.36 };
const FADE: SpringParams = { damping: 1, response: 0.2 };

export function initLightbox(root: Document = document): void {
  const dialog = root.querySelector<HTMLDialogElement>('[data-lightbox-dialog]');
  const triggers = [...root.querySelectorAll<HTMLAnchorElement>('a[data-lightbox]')];
  if (!dialog || triggers.length === 0 || typeof dialog.showModal !== 'function') return;

  const image = dialog.querySelector<HTMLImageElement>('[data-lightbox-image]');
  const stage = dialog.querySelector<HTMLElement>('[data-lightbox-stage]');
  const scrim = dialog.querySelector<HTMLElement>('[data-lightbox-scrim]');
  const caption = dialog.querySelector<HTMLElement>('[data-lightbox-caption]');
  const counter = dialog.querySelector<HTMLElement>('[data-lightbox-counter]');
  const chrome = [...dialog.querySelectorAll<HTMLElement>('[data-lightbox-chrome]')];
  if (!image || !stage || !scrim || !caption || !counter) return;

  let index = 0;
  let opener: HTMLElement | null = null;
  let closing = false;
  let base = { width: 0, height: 0 };
  let ghost: HTMLImageElement | null = null;
  let ghostShift = 0;
  let hiddenThumb: HTMLElement | null = null;

  // The shot's live presentation: offset, scale, and opacity, plus how solid
  // the backdrop is. Every change goes through `render`.
  const render = () => {
    image.style.transform = `translate3d(${x.value}px, ${y.value}px, 0) scale(${s.value})`;
    image.style.opacity = String(o.value);
    if (ghost) {
      ghost.style.transform = `translate3d(${x.value + ghostShift}px, ${y.value}px, 0) scale(${s.value})`;
    }
    scrim.style.opacity = String(fade.value);
    for (const el of chrome) el.style.opacity = String(fade.value);
  };
  const x = new Spring(0, render, PAGE, 0.1);
  const y = new Spring(0, render, PAGE, 0.1);
  const s = new Spring(1, render, PAGE, 0.0005);
  const o = new Spring(1, render, FADE, 0.002);
  const fade = new Spring(0, render, FADE, 0.002);
  const all = [x, y, s, o, fade];

  /** Moves several springs and calls `done` once every one of them has settled. */
  const together = (
    moves: [Spring, number, { velocity?: number; params?: SpringParams }?][],
    done: () => void,
  ) => {
    let left = moves.length;
    for (const [spring, target, options] of moves) {
      spring.to(target, {
        ...options,
        onRest: () => {
          left -= 1;
          if (left === 0) done();
        },
      });
    }
  };

  const thumbOf = (n: number) => triggers[n]?.querySelector<HTMLImageElement>('img') ?? null;
  const hideThumb = (thumb: HTMLElement | null) => {
    if (hiddenThumb) hiddenThumb.style.visibility = '';
    hiddenThumb = thumb;
    if (thumb) thumb.style.visibility = 'hidden';
  };
  const dropGhost = () => {
    ghost?.remove();
    ghost = null;
  };

  // The stage's centre and the fitted size of the current shot.
  const layout = () => {
    const link = triggers[index];
    const cs = getComputedStyle(stage);
    const boxWidth =
      stage.clientWidth - Number.parseFloat(cs.paddingLeft) - Number.parseFloat(cs.paddingRight);
    const boxHeight =
      stage.clientHeight - Number.parseFloat(cs.paddingTop) - Number.parseFloat(cs.paddingBottom);
    base = fitRect(
      boxWidth,
      boxHeight,
      Number(link?.dataset['width']) || image.naturalWidth || 1600,
      Number(link?.dataset['height']) || image.naturalHeight || 1000,
    );
    image.style.width = `${base.width}px`;
    image.style.height = `${base.height}px`;
  };
  const stageCentre = () => {
    const r = stage.getBoundingClientRect();
    return { cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
  };

  const setContent = (n: number) => {
    index = stepIndex(n, 0, triggers.length);
    const link = triggers[index];
    if (!link) return;
    const thumb = thumbOf(index);
    // The thumbnail is already decoded, so show it at once and swap in the
    // full size image when it arrives: no blank frame while it downloads.
    image.src = thumb?.complete && thumb.currentSrc ? thumb.currentSrc : link.href;
    const full = new Image();
    full.onload = () => {
      if (triggers[index] === link) image.src = link.href;
    };
    full.src = link.href;
    image.alt = link.dataset['alt'] ?? '';
    caption.textContent = link.dataset['caption'] ?? '';
    caption.hidden = !link.dataset['caption'];
    counter.textContent = `${index + 1} / ${triggers.length}`;
    layout();
    // Warm the neighbours so paging feels instant.
    for (const d of [-1, 1]) {
      const near = triggers[stepIndex(index, d, triggers.length)];
      if (near) new Image().src = near.href;
    }
  };

  const open = (n: number, link: HTMLElement) => {
    opener = link;
    closing = false;
    dialog.showModal();
    root.documentElement.style.overflow = 'hidden';
    setContent(n);
    for (const spring of all) spring.stop();

    const thumb = thumbOf(index);
    const from = thumb?.getBoundingClientRect();
    if (prefersReducedMotion() || !from || from.width === 0 || base.width === 0) {
      x.jump(0);
      y.jump(0);
      s.jump(1);
      o.jump(0).to(1, { params: FADE });
      fade.jump(0).to(1, { params: FADE });
      return;
    }
    // Start exactly on top of the thumbnail, then let it grow into place.
    const { cx, cy } = stageCentre();
    x.jump(from.left + from.width / 2 - cx);
    y.jump(from.top + from.height / 2 - cy);
    s.jump(from.width / base.width);
    o.jump(1);
    fade.jump(0);
    hideThumb(thumb);
    x.to(0, { params: OPEN });
    y.to(0, { params: OPEN });
    s.to(1, { params: OPEN });
    fade.to(1, { params: OPEN });
  };

  // Paging: the new shot comes in from the side it lives on, and the old one
  // leaves the other way, both riding the same spring so there is no seam.
  const page = (delta: 1 | -1, velocity = 0) => {
    if (triggers.length < 2) {
      x.to(0, { velocity, params: SETTLE });
      return;
    }
    if (prefersReducedMotion()) {
      setContent(index + delta);
      hideThumb(thumbOf(index));
      x.jump(0);
      o.jump(0.2).to(1, { params: FADE });
      return;
    }
    const shift = stage.clientWidth;
    dropGhost();
    ghost = image.cloneNode() as HTMLImageElement;
    ghost.removeAttribute('data-lightbox-image');
    ghost.alt = '';
    ghost.setAttribute('aria-hidden', 'true');
    Object.assign(ghost.style, {
      position: 'absolute',
      left: `${(stage.clientWidth - base.width) / 2}px`,
      top: `${(stage.clientHeight - base.height) / 2}px`,
      pointerEvents: 'none',
    });
    stage.append(ghost);
    setContent(index + delta);
    hideThumb(thumbOf(index));
    // The new shot sits one stage away from where the old one is now.
    x.jump(x.value + delta * shift);
    ghostShift = -delta * shift;
    x.to(0, { velocity, params: velocity ? SETTLE : PAGE, onRest: dropGhost });
  };

  const close = (velocity = 0) => {
    if (!dialog.open || closing) return;
    closing = true;
    const done = () => {
      closing = false;
      dialog.close();
    };
    if (prefersReducedMotion() || base.width === 0) {
      together(
        [
          [o, 0, { params: FADE }],
          [fade, 0, { params: FADE }],
        ],
        done,
      );
      return;
    }
    // Back into the thumbnail of the shot on screen, if it can be seen.
    const thumb = thumbOf(index);
    const r = thumb?.getBoundingClientRect();
    const visible = r && r.width > 0 && r.bottom > 0 && r.top < window.innerHeight;
    if (visible) {
      hideThumb(thumb);
      const { cx, cy } = stageCentre();
      together(
        [
          [x, r.left + r.width / 2 - cx, { params: CLOSE }],
          [y, r.top + r.height / 2 - cy, { velocity, params: CLOSE }],
          [s, r.width / base.width, { params: CLOSE }],
          [fade, 0, { params: CLOSE }],
        ],
        done,
      );
    } else {
      together(
        [
          [y, y.value + project(velocity) * 0.25, { velocity, params: CLOSE }],
          [s, 0.85, { params: CLOSE }],
          [o, 0, { params: CLOSE }],
          [fade, 0, { params: CLOSE }],
        ],
        done,
      );
    }
  };

  triggers.forEach((link, n) => {
    link.addEventListener('click', (event) => {
      // Let modified clicks (new tab, download) do what the visitor asked.
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0)
        return;
      event.preventDefault();
      open(n, link);
    });
  });

  dialog.querySelector('[data-lightbox-prev]')?.addEventListener('click', () => page(-1));
  dialog.querySelector('[data-lightbox-next]')?.addEventListener('click', () => page(1));
  dialog.querySelector('[data-lightbox-close]')?.addEventListener('click', () => close());

  // Esc animates out instead of vanishing.
  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    close();
  });

  dialog.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') page(-1);
    if (event.key === 'ArrowRight') page(1);
  });

  // ── Dragging ───────────────────────────────────────────────────────────
  const tracker = new VelocityTracker();
  let drag: {
    id: number;
    startX: number;
    startY: number;
    axis: 'x' | 'y' | null;
    baseX: number;
    baseY: number;
  } | null = null;
  let swallowClick = false;

  stage.addEventListener('pointerdown', (event) => {
    swallowClick = false;
    if (event.button !== 0 || (event.target as Element).closest('button')) return;
    // Grabbing a shot that is closing takes it back.
    closing = false;
    for (const spring of all) spring.stop();
    o.jump(1);
    stage.setPointerCapture(event.pointerId);
    drag = {
      id: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      axis: null,
      baseX: x.value,
      baseY: y.value,
    };
    tracker.reset();
    tracker.add(event.timeStamp, event.clientX, event.clientY);
  });

  stage.addEventListener('pointermove', (event) => {
    if (!drag || event.pointerId !== drag.id) return;
    tracker.add(event.timeStamp, event.clientX, event.clientY);
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    if (!drag.axis) {
      // About 10px decides the direction, then it tracks 1:1 from there.
      if (Math.hypot(dx, dy) < 10) return;
      drag.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      drag.startX = event.clientX;
      drag.startY = event.clientY;
      return;
    }
    if (prefersReducedMotion()) return;
    if (drag.axis === 'x') {
      const offset = drag.baseX + dx;
      x.jump(triggers.length < 2 ? rubberband(offset, stage.clientWidth) : offset);
    } else {
      const offset = drag.baseY + dy;
      const travel = Math.min(1, Math.abs(offset) / (stage.clientHeight * 0.6));
      y.jump(offset);
      s.jump(1 - 0.2 * travel);
      fade.jump(1 - travel);
    }
  });

  const release = (event: PointerEvent) => {
    if (!drag || event.pointerId !== drag.id) return;
    // The release point counts: a drag that stopped before letting go has no speed.
    tracker.add(event.timeStamp, event.clientX, event.clientY);
    const { axis } = drag;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    drag = null;
    if (stage.hasPointerCapture(event.pointerId)) stage.releasePointerCapture(event.pointerId);
    if (!axis) {
      // A tap, or a grab that didn't move: put everything back where it belongs.
      together(
        [
          [x, 0],
          [y, 0],
          [s, 1],
          [fade, 1],
        ],
        () => {},
      );
      return;
    }
    swallowClick = true;
    const { vx, vy } = tracker.velocity();

    if (prefersReducedMotion()) {
      const dir = swipeDirection(dx, dy);
      if (dir !== 0) page(dir);
      else if (axis === 'y' && Math.abs(dy) > 80) close();
      return;
    }
    if (axis === 'x') {
      const decision = pageDecision(x.value, vx, stage.clientWidth);
      if (decision !== 0 && triggers.length > 1) page(decision, vx);
      else x.to(0, { velocity: vx, params: SETTLE });
    } else if (dismissDecision(y.value, vy, stage.clientHeight)) {
      close(vy);
    } else {
      y.to(0, { velocity: vy, params: SETTLE });
      s.to(1, { params: SETTLE });
      fade.to(1, { params: SETTLE });
    }
  };
  stage.addEventListener('pointerup', release);
  stage.addEventListener('pointercancel', release);

  // A click on the dimmed area around the shot closes it; the click that
  // ends a drag does not.
  dialog.addEventListener('click', (event) => {
    if (swallowClick) {
      swallowClick = false;
      return;
    }
    const target = event.target as HTMLElement;
    if (target === dialog || target === stage || target === scrim) close();
  });

  window.addEventListener('resize', () => {
    if (dialog.open) layout();
  });

  dialog.addEventListener('close', () => {
    for (const spring of all) spring.stop();
    closing = false;
    dropGhost();
    hideThumb(null);
    root.documentElement.style.overflow = '';
    image.removeAttribute('src');
    x.jump(0);
    y.jump(0);
    s.jump(1);
    o.jump(1);
    fade.jump(0);
    opener?.focus();
  });
}
