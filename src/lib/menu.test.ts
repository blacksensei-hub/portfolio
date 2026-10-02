import { describe, expect, it } from 'vitest';

import { menuShouldClose } from './menu';

describe('menuShouldClose', () => {
  it('closes when thrown upward, even from a short drag', () => {
    expect(menuShouldClose(-20, -400)).toBe(true);
    expect(menuShouldClose(-60, 0)).toBe(true);
  });

  it('stays open after a small or downward drag', () => {
    expect(menuShouldClose(-20, 0)).toBe(false);
    expect(menuShouldClose(30, 300)).toBe(false);
  });

  it('stays open when a drag up is pulled back down', () => {
    expect(menuShouldClose(-60, 500)).toBe(false);
  });
});
