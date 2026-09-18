import { describe, expect, it } from 'vitest';

import { toHex } from './contrast';

describe('toHex', () => {
  it('maps black and white to their hex', () => {
    expect(toHex({ l: 0, c: 0, h: 0 })).toBe('#000000');
    expect(toHex({ l: 1, c: 0, h: 0 })).toBe('#ffffff');
  });

  it('maps a known oklch color to its sRGB hex', () => {
    // oklch(62.8% 0.2577 29.23) is CSS red, #ff0000.
    expect(toHex({ l: 0.628, c: 0.2577, h: 29.23 })).toBe('#ff0000');
  });

  it('clamps an out of gamut color to a valid hex', () => {
    expect(toHex({ l: 0.7, c: 0.5, h: 150 })).toMatch(/^#[0-9a-f]{6}$/);
  });
});
