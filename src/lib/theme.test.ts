import { describe, expect, it } from 'vitest';

import {
  applyChoice,
  nextChoice,
  readChoice,
  THEME_HEAD_SCRIPT,
  type ThemeChoice,
  themeLabel,
} from './theme';

/** A stand in for <html>: just the attribute calls the theme code makes. */
function fakeRoot() {
  const attrs = new Map<string, string>();
  return {
    attrs,
    setAttribute: (name: string, value: string) => attrs.set(name, value),
    removeAttribute: (name: string) => attrs.delete(name),
  };
}

function runHeadScript(getItem: () => string | null) {
  const root = fakeRoot();
  new Function('document', 'localStorage', THEME_HEAD_SCRIPT)(
    { documentElement: root },
    { getItem },
  );
  return root.attrs;
}

describe('readChoice', () => {
  it.each(['system', 'light', 'dark'] as const)('keeps %s', (value) => {
    expect(readChoice(value)).toBe(value);
  });

  it.each([null, '', 'Dark', 'blue'])('reads %j as system', (value) => {
    expect(readChoice(value)).toBe('system');
  });
});

describe('nextChoice', () => {
  it('cycles system, light, dark, then back to system', () => {
    expect(nextChoice('system')).toBe('light');
    expect(nextChoice('light')).toBe('dark');
    expect(nextChoice('dark')).toBe('system');
  });
});

describe('themeLabel', () => {
  it.each([
    ['system', 'Theme: system. Switch to light.'],
    ['light', 'Theme: light. Switch to dark.'],
    ['dark', 'Theme: dark. Switch to system.'],
  ] as const)('names %s and the next choice', (choice, label) => {
    expect(themeLabel(choice)).toBe(label);
  });
});

describe('applyChoice', () => {
  it('sets the forced theme for light and dark', () => {
    const root = fakeRoot();
    applyChoice(root as unknown as HTMLElement, 'dark');

    expect(Object.fromEntries(root.attrs)).toEqual({
      'data-theme-choice': 'dark',
      'data-theme': 'dark',
    });
  });

  it('removes the forced theme for system', () => {
    const root = fakeRoot();
    applyChoice(root as unknown as HTMLElement, 'light');
    applyChoice(root as unknown as HTMLElement, 'system');

    expect(Object.fromEntries(root.attrs)).toEqual({ 'data-theme-choice': 'system' });
  });
});

describe('THEME_HEAD_SCRIPT', () => {
  it.each<[string | null, ThemeChoice, string | undefined]>([
    ['light', 'light', 'light'],
    ['dark', 'dark', 'dark'],
    ['system', 'system', undefined],
    [null, 'system', undefined],
    ['junk', 'system', undefined],
  ])('stored %j gives choice %s and data-theme %s', (stored, choice, theme) => {
    const attrs = runHeadScript(() => stored);

    expect(attrs.get('data-theme-choice')).toBe(choice);
    expect(attrs.get('data-theme')).toBe(theme);
  });

  it('falls back to system when storage throws', () => {
    const attrs = runHeadScript(() => {
      throw new Error('SecurityError');
    });

    expect(Object.fromEntries(attrs)).toEqual({ 'data-theme-choice': 'system' });
  });
});
