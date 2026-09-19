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

function closeMenusOnChoice(root: Document): void {
  for (const menu of root.querySelectorAll<HTMLDetailsElement>('details[data-menu]')) {
    menu.addEventListener('click', (event) => {
      if ((event.target as Element).closest('a')) menu.open = false;
    });
  }
}

export function initInteractions(root: Document = document): void {
  startClocks(root);
  closeMenusOnChoice(root);
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
