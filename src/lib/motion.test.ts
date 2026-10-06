import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { applyPaused, isPaused, MOTION_HEAD_SCRIPT } from './motion';
import { PERPETUAL } from './offscreen';

/** A stand in for <html>: just the attribute calls the motion code makes. */
function fakeRoot() {
  const attrs = new Map<string, string>();
  return {
    attrs,
    getAttribute: (name: string) => attrs.get(name) ?? null,
    setAttribute: (name: string, value: string) => attrs.set(name, value),
    removeAttribute: (name: string) => attrs.delete(name),
  };
}

function runHeadScript(getItem: () => string | null) {
  const root = fakeRoot();
  new Function('document', 'localStorage', MOTION_HEAD_SCRIPT)(
    { documentElement: root },
    { getItem },
  );
  return root.attrs;
}

describe('applyPaused and isPaused', () => {
  it('marks the root paused and clears it again', () => {
    const root = fakeRoot();
    expect(isPaused(root)).toBe(false);

    applyPaused(root, true);
    expect(root.attrs.get('data-motion')).toBe('paused');
    expect(isPaused(root)).toBe(true);

    applyPaused(root, false);
    expect(root.attrs.has('data-motion')).toBe(false);
    expect(isPaused(root)).toBe(false);
  });
});

describe('MOTION_HEAD_SCRIPT', () => {
  it('pauses before first paint when the pause was saved', () => {
    expect(Object.fromEntries(runHeadScript(() => 'paused'))).toEqual({
      'data-motion': 'paused',
    });
  });

  it.each([null, 'running', 'Paused', 'junk'])('leaves %j running', (stored) => {
    expect(runHeadScript(() => stored).size).toBe(0);
  });

  it('leaves the loops running when storage throws', () => {
    const attrs = runHeadScript(() => {
      throw new Error('SecurityError');
    });
    expect(attrs.size).toBe(0);
  });

  it('is plain ES5, since it is never bundled', () => {
    expect(MOTION_HEAD_SCRIPT).not.toMatch(/=>|\bconst\b|\blet\b|`/);
  });
});

describe('the pause rule in global.css', () => {
  const css = readFileSync(new URL('../styles/global.css', import.meta.url), 'utf8');
  const rule = css.slice(css.indexOf(':root[data-motion="paused"]'));
  const block = rule.slice(0, rule.indexOf('}'));

  it('holds every loop the off-screen pause knows about', () => {
    const loops = PERPETUAL.split(',').map((s) => s.trim());
    expect(loops.length).toBeGreaterThan(0);
    for (const loop of loops) {
      // The caret blinks on its ::after, so the rule names the pseudo element.
      expect(block).toContain(loop === '.caret' ? '.caret::after' : loop);
    }
  });

  it('also holds the drifting glows and the shimmer', () => {
    expect(block).toContain('.animate-drift');
    expect(block).toContain('.shimmer-text');
    expect(block).toContain('animation-play-state: paused');
  });
});
