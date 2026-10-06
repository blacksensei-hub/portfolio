/*
 * AttendX's "How a scan is checked" (spec 0022): a pinned stage that steps
 * through one scan as the page scrolls. Native scroll position is the only
 * source of truth, so it plays forward and backward exactly. Under reduced
 * motion, without this script, or on a screen too short for the stage (a
 * phone on its side, spec 0024), the steps read as a plain list beside the
 * finished state.
 */

export const STEPS = 5;

/** Where the stage pins. Same query as the enhanced block in ScanStory.astro. */
export const PINNED = '(prefers-reduced-motion: no-preference) and (min-height: 600px)';
const CHECKS = 4;

/** How far through the track the page has scrolled, 0 to 1. */
export function trackProgress(top: number, height: number, viewport: number): number {
  const range = height - viewport;
  if (range <= 0) return top <= 0 ? 1 : 0;
  return Math.min(1, Math.max(0, -top / range));
}

/** The step showing at `progress`, and how far through that step it is (0 to 1). */
export function stepAt(progress: number, steps = STEPS): { step: number; within: number } {
  const x = Math.min(steps - 1e-9, Math.max(0, progress * steps));
  const step = Math.floor(x);
  return { step, within: x - step };
}

/** Inside the checks step, how many of the four checks have passed: all four by 80 percent. */
export function checksPassed(within: number): number {
  return Math.min(CHECKS, Math.max(0, Math.floor(within * (CHECKS + 1))));
}

/** Which of the three codes is on the projector: it changes as the first steps scroll by, then holds. */
export function codeAt(progress: number, codes = 3): number {
  const frozen = 2 / STEPS;
  return Math.floor(Math.min(progress, frozen) * 12) % codes;
}

export function initScanStory(root: Document = document): void {
  const section = root.querySelector<HTMLElement>('[data-scan-story]');
  const track = section?.querySelector<HTMLElement>('[data-scan-track]');
  const stage = section?.querySelector<HTMLElement>('[data-scan-stage]');
  if (!section || !track || !stage) return;

  const pinned = matchMedia(PINNED);
  const items = [...section.querySelectorAll<HTMLElement>('[data-scan-step]')];

  let queued = false;
  let last = '';
  const update = () => {
    queued = false;
    if (!pinned.matches) return;
    const box = track.getBoundingClientRect();
    const progress = trackProgress(box.top, box.height, window.innerHeight);
    const { step, within } = stepAt(progress);
    const checks = step < 2 ? 0 : step === 2 ? checksPassed(within) : 4;
    const code = codeAt(progress);
    const key = `${step}/${checks}/${code}`;
    if (key === last) return;
    last = key;
    stage.dataset['step'] = String(step);
    stage.dataset['checks'] = String(checks);
    stage.dataset['code'] = String(code);
    for (const item of items) {
      if (item.dataset['scanStep'] === String(step)) item.setAttribute('aria-current', 'step');
      else item.removeAttribute('aria-current');
    }
  };
  const schedule = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(update);
  };
  // Turning the phone, or changing the motion setting, moves between the
  // pinned stage and the list.
  const apply = () => {
    last = '';
    if (pinned.matches) {
      // The pinned state lands at once rather than fading in from the list:
      // transitions are off until the browser has applied it (spec 0024).
      section.setAttribute('data-instant', '');
      section.setAttribute('data-enhanced', '');
      window.addEventListener('scroll', schedule, { passive: true });
      window.addEventListener('resize', schedule);
      update();
      void section.offsetWidth;
      section.removeAttribute('data-instant');
      return;
    }
    section.removeAttribute('data-enhanced');
    window.removeEventListener('scroll', schedule);
    window.removeEventListener('resize', schedule);
    for (const key of ['step', 'checks', 'code']) delete stage.dataset[key];
    for (const item of items) item.removeAttribute('aria-current');
  };
  pinned.addEventListener('change', apply);
  apply();
}
