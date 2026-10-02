/*
 * The phone menu (spec 0018). Without this script it is a plain <details>
 * disclosure. With it, the panel grows out of the menu button (its transform
 * origin is the button) as a scale, fade and short blur together, closes back
 * the same way, and can be closed with Esc, a tap outside, a choice, or by
 * throwing it upward. Every motion is a spring, so it can be reversed mid-way.
 */
import {
  prefersReducedMotion,
  project,
  rubberband,
  Spring,
  type SpringParams,
  VelocityTracker,
} from './spring';

/** Whether a drag released `offset` px from rest at `velocity` px/s throws the menu shut (upward is negative). */
export function menuShouldClose(offset: number, velocity: number, threshold = 48): boolean {
  return offset + project(velocity) < -threshold;
}

const OPEN: SpringParams = { damping: 1, response: 0.32 };
const CLOSE: SpringParams = { damping: 1, response: 0.26 };
const SETTLE: SpringParams = { damping: 0.86, response: 0.3 };

function setup(menu: HTMLDetailsElement, root: Document): void {
  const summary = menu.querySelector<HTMLElement>('summary');
  const panel = menu.querySelector<HTMLElement>('[data-menu-panel]');
  if (!summary || !panel) return;

  const render = () => {
    const p = Math.max(0, Math.min(1, progress.value));
    panel.style.opacity = String(p);
    if (prefersReducedMotion()) return;
    panel.style.transform = `translate3d(0, ${(1 - p) * -10 + lift.value}px, 0) scale(${0.9 + 0.1 * p})`;
    panel.style.filter = p < 0.995 ? `blur(${((1 - p) * 6).toFixed(2)}px)` : '';
  };
  const progress = new Spring(0, render, OPEN, 0.001);
  const lift = new Spring(0, render, OPEN, 0.1);
  const tracker = new VelocityTracker();
  let start: { id: number; y: number; moving: boolean } | null = null;
  // Set when a drag ends, so the click it produces doesn't follow a link.
  let dragged = false;

  const show = () => {
    menu.removeAttribute('data-closing');
    if (!menu.open) {
      menu.open = true;
      lift.jump(0);
      progress.jump(0);
    }
    progress.to(1, { params: prefersReducedMotion() ? CLOSE : OPEN });
  };

  const hide = (velocity = 0) => {
    if (!menu.open || menu.hasAttribute('data-closing')) return;
    // The icon turns back into a hamburger now, not when the panel is gone.
    menu.setAttribute('data-closing', '');
    if (velocity) lift.to(lift.value + project(velocity) * 0.15, { velocity, params: CLOSE });
    progress.to(0, {
      params: CLOSE,
      onRest: () => {
        menu.open = false;
        menu.removeAttribute('data-closing');
        lift.jump(0);
        panel.style.transform = '';
        panel.style.filter = '';
        panel.style.opacity = '';
      },
    });
  };

  summary.addEventListener('click', (event) => {
    event.preventDefault();
    if (menu.open && !menu.hasAttribute('data-closing')) hide();
    else show();
  });

  // A choice closes it; the link itself does the navigating.
  panel.addEventListener('click', (event) => {
    if (dragged) {
      event.preventDefault();
      dragged = false;
      return;
    }
    if ((event.target as Element).closest('a')) hide();
  });

  root.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || !menu.open) return;
    hide();
    summary.focus();
  });

  root.addEventListener('pointerdown', (event) => {
    if (menu.open && !menu.contains(event.target as Node)) hide();
  });

  // Throw it upward to dismiss; downward it resists like a rubber band.
  panel.addEventListener('pointerdown', (event) => {
    if (prefersReducedMotion() || event.button !== 0) return;
    dragged = false;
    start = { id: event.pointerId, y: event.clientY, moving: false };
    lift.stop();
    tracker.reset();
    tracker.add(event.timeStamp, 0, event.clientY);
  });

  panel.addEventListener('pointermove', (event) => {
    if (!start || event.pointerId !== start.id) return;
    tracker.add(event.timeStamp, 0, event.clientY);
    const dy = event.clientY - start.y;
    if (!start.moving) {
      if (Math.abs(dy) < 10) return;
      start.moving = true;
      start.y = event.clientY;
      panel.setPointerCapture(event.pointerId);
      return;
    }
    lift.jump(dy < 0 ? dy : rubberband(dy, 240));
  });

  const release = (event: PointerEvent) => {
    if (!start || event.pointerId !== start.id) return;
    tracker.add(event.timeStamp, 0, event.clientY);
    const { moving } = start;
    start = null;
    if (!moving) return;
    dragged = true;
    const { vy } = tracker.velocity();
    if (menuShouldClose(lift.value, vy)) hide(vy);
    else lift.to(0, { velocity: vy, params: SETTLE });
  };
  panel.addEventListener('pointerup', release);
  panel.addEventListener('pointercancel', release);
}

export function initMenus(root: Document = document): void {
  for (const menu of root.querySelectorAll<HTMLDetailsElement>('details[data-menu]')) {
    setup(menu, root);
  }
}
