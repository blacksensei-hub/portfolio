import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { contrastRatio, type Oklch, parseOklch } from './contrast';

/*
 * AC-2: proves every text and focus pair meets WCAG 2.2 AA in both themes,
 * reading the real values from global.css so the test cannot drift from what
 * ships. Light values come from @theme; dark values from the dark media block,
 * falling back to light for tokens it does not override (focus, which follows
 * the accent through var()).
 */

const css = readFileSync(new URL('./global.css', import.meta.url), 'utf8');

/** The body of the first `{ … }` block after `opener`, braces balanced. */
function block(source: string, opener: RegExp): string {
  const start = source.search(opener);
  if (start === -1) throw new Error(`Block not found: ${opener}`);
  const open = source.indexOf('{', start);
  let depth = 0;
  for (let i = open; i < source.length; i++) {
    if (source[i] === '{') depth++;
    if (source[i] === '}') {
      depth--;
      if (depth === 0) return source.slice(open + 1, i);
    }
  }
  throw new Error(`Unclosed block: ${opener}`);
}

function colorTokens(body: string): Map<string, string> {
  const tokens = new Map<string, string>();
  for (const [, name = '', value = ''] of body.matchAll(/--color-([\w-]+):\s*([^;]+);/g)) {
    tokens.set(name, value.trim());
  }
  return tokens;
}

/** Resolves one level of var(--color-*), then parses every value. */
function resolve(tokens: Map<string, string>): Map<string, Oklch> {
  const resolved = new Map<string, Oklch>();
  for (const [name, value] of tokens) {
    const ref = /^var\(--color-([\w-]+)\)$/.exec(value);
    const literal = ref ? tokens.get(ref[1] ?? '') : value;
    if (literal === undefined) throw new Error(`--color-${name} references an unknown token`);
    resolved.set(name, parseOklch(literal));
  }
  return resolved;
}

const light = colorTokens(block(css, /@theme\s*\{/));
const darkOverrides = colorTokens(
  block(block(css, /@media \(prefers-color-scheme: dark\)/), /:root/),
);
const themes = {
  light: resolve(light),
  dark: resolve(new Map([...light, ...darkOverrides])),
};

const pairs: [fg: string, bg: string, min: number][] = [
  ['on-surface', 'surface', 4.5],
  ['on-surface', 'surface-raised', 4.5],
  ['muted', 'surface', 4.5],
  ['muted', 'surface-raised', 4.5],
  ['accent', 'surface', 4.5],
  ['accent', 'surface-raised', 4.5],
  ['on-accent', 'accent', 4.5],
  ['focus', 'surface', 3],
  ['focus', 'surface-raised', 3],
];

describe.each(Object.entries(themes))('%s theme contrast', (_theme, colors) => {
  it.each(pairs)('%s on %s is at least %d:1', (fg, bg, min) => {
    const a = colors.get(fg);
    const b = colors.get(bg);
    if (!a || !b) throw new Error(`Missing token: ${a ? bg : fg}`);

    expect(contrastRatio(a, b)).toBeGreaterThanOrEqual(min);
  });
});

describe('token sets', () => {
  it('defines a dark value for every color token except focus', () => {
    // focus is var(--color-accent), so it follows the dark accent on its own.
    expect([...darkOverrides.keys()].sort()).toEqual(
      [...light.keys()].filter((k) => k !== 'focus').sort(),
    );
  });
});

describe('contrast helpers', () => {
  it('gives 21:1 for black on white', () => {
    const black = parseOklch('oklch(0% 0 0)');
    const white = parseOklch('oklch(100% 0 0)');

    expect(contrastRatio(black, white)).toBeCloseTo(21, 1);
  });

  it('fails a muted token lowered toward the surface', () => {
    // The regression the test exists to catch: muted text too close to the page.
    const surface = themes.light.get('surface');
    if (!surface) throw new Error('Missing surface');

    expect(contrastRatio(parseOklch('oklch(75% 0.02 260)'), surface)).toBeLessThan(4.5);
  });

  it('rejects a value it cannot parse instead of skipping it', () => {
    expect(() => parseOklch('#6366f1')).toThrow(/Not an oklch/);
  });
});
