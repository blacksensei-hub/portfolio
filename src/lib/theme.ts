/*
 * Theme choice logic (spec 0008). The choice lives in localStorage["theme"] and
 * on <html data-theme-choice>; <html data-theme> drives the colors and is only
 * set when the choice forces light or dark.
 */

export type ThemeChoice = 'system' | 'light' | 'dark';

export const THEME_STORAGE_KEY = 'theme';

const CYCLE: readonly ThemeChoice[] = ['system', 'light', 'dark'];

/** Validates a stored value; missing or anything unknown means system. */
export function readChoice(raw: string | null): ThemeChoice {
  return raw === 'light' || raw === 'dark' || raw === 'system' ? raw : 'system';
}

/** The next choice in the cycle system → light → dark → system. */
export function nextChoice(choice: ThemeChoice): ThemeChoice {
  return CYCLE[(CYCLE.indexOf(choice) + 1) % CYCLE.length] ?? 'system';
}

/** Sets the choice attribute, and sets or removes the forced theme. */
export function applyChoice(root: HTMLElement, choice: ThemeChoice): void {
  root.setAttribute('data-theme-choice', choice);
  if (choice === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', choice);
}

/** The toggle's accessible name: the current choice and the next one. */
export function themeLabel(choice: ThemeChoice): string {
  const next = nextChoice(choice);
  return `Theme: ${choice}. Switch to ${next}.`;
}

/*
 * Runs inline and render blocking in <head>, before any stylesheet, so the
 * saved theme applies before first paint. Plain ES5 on purpose: it is never
 * bundled. Same result as applyChoice(document.documentElement, readChoice(stored)).
 */
export const THEME_HEAD_SCRIPT = `(function () {
  var c = null;
  try { c = localStorage.getItem('${THEME_STORAGE_KEY}'); } catch (e) {}
  if (c !== 'light' && c !== 'dark') c = 'system';
  var r = document.documentElement;
  r.setAttribute('data-theme-choice', c);
  if (c !== 'system') r.setAttribute('data-theme', c);
})();`;
