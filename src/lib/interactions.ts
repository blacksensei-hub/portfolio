/*
 * Pointer micro interactions (spec 0012): a spotlight that follows the pointer
 * across `[data-spotlight]` surfaces, and buttons marked `[data-magnetic]` that
 * lean toward the pointer. Pure enhancement: without this script, or under
 * reduced motion or a touch pointer, every element simply rests in place.
 *
 * Spec 0018: the lean rides two independent springs (x and y), so it eases
 * toward the pointer and back home from wherever it is, and the phone menu
 * moves on springs too (menu.ts).
 */
import { initMenus } from './menu';
import { Spring } from './spring';

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

/** The time in Ghana (GMT, no daylight saving) as HH:MM, 24 hour. */
export function ghanaTime(date: Date): string {
  const hh = String(date.getUTCHours()).padStart(2, '0');
  const mm = String(date.getUTCMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

/**
 * The typewriter's next state: type toward `word`, pause when complete, then
 * delete back to empty and move on. Returns the text to show and the delay in ms
 * before the next step.
 */
export function typewriterStep(
  shown: string,
  word: string,
  deleting: boolean,
): { text: string; deleting: boolean; delay: number; advance: boolean } {
  if (!deleting && shown === word)
    return { text: shown, deleting: true, delay: 1800, advance: false };
  if (deleting && shown === '') return { text: '', deleting: false, delay: 300, advance: true };
  const text = deleting ? shown.slice(0, -1) : word.slice(0, shown.length + 1);
  return { text, deleting, delay: deleting ? 45 : 90, advance: false };
}

function startClocks(root: Document): void {
  const clocks = root.querySelectorAll<HTMLElement>('[data-local-clock]');
  if (clocks.length === 0) return;
  const tick = () => {
    const now = new Date();
    for (const clock of clocks) {
      clock.textContent = ghanaTime(now);
      clock.setAttribute('datetime', now.toISOString());
    }
  };
  tick();
  setInterval(tick, 15_000);
}

function startTypewriters(root: Document): void {
  for (const el of root.querySelectorAll<HTMLElement>('[data-typewriter]')) {
    let words: string[];
    try {
      words = JSON.parse(el.dataset['typewriter'] ?? '[]');
    } catch {
      continue;
    }
    if (words.length === 0) continue;
    let index = 0;
    let shown = el.textContent ?? '';
    let deleting = true;
    const step = () => {
      const next = typewriterStep(shown, words[index] ?? '', deleting);
      if (next.advance) index = (index + 1) % words.length;
      shown = next.text;
      deleting = next.deleting;
      el.textContent = shown;
      setTimeout(step, next.delay);
    };
    setTimeout(step, 2000);
  }
}

function startMagnets(root: Document): void {
  for (const el of root.querySelectorAll<HTMLElement>('[data-magnetic]')) {
    const render = () => {
      el.style.translate = `${dx.value.toFixed(2)}px ${dy.value.toFixed(2)}px`;
    };
    const lean = { damping: 1, response: 0.3 };
    const home = { damping: 0.8, response: 0.4 };
    const dx = new Spring(0, render, lean, 0.05);
    const dy = new Spring(0, render, lean, 0.05);
    el.addEventListener('pointermove', (event) => {
      const offset = magnetOffset(el.getBoundingClientRect(), event.clientX, event.clientY);
      // Measured from where the button rests, not where it has leaned to.
      const rest = { dx: offset.dx + dx.value * 0.3, dy: offset.dy + dy.value * 0.3 };
      dx.to(Math.max(-10, Math.min(10, rest.dx)), { params: lean });
      dy.to(Math.max(-10, Math.min(10, rest.dy)), { params: lean });
    });
    el.addEventListener('pointerleave', () => {
      dx.to(0, { params: home });
      dy.to(0, { params: home });
    });
  }
}

export function initInteractions(root: Document = document): void {
  startClocks(root);
  initMenus(root);
  // iOS Safari only applies :active (the press states) when a touch listener exists.
  root.addEventListener('touchstart', () => {}, { passive: true });
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) startTypewriters(root);

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

  startMagnets(root);
}
