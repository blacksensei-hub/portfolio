import { describe, expect, it } from 'vitest';

import { stepIndex, swipeDirection } from './lightbox';

describe('stepIndex', () => {
  it('moves forward and back within the list', () => {
    expect(stepIndex(2, 1, 5)).toBe(3);
    expect(stepIndex(2, -1, 5)).toBe(1);
  });

  it('wraps from the last shot to the first, and back', () => {
    expect(stepIndex(4, 1, 5)).toBe(0);
    expect(stepIndex(0, -1, 5)).toBe(4);
  });

  it('stays at 0 for an empty list', () => {
    expect(stepIndex(3, 1, 0)).toBe(0);
  });
});

describe('swipeDirection', () => {
  it('reads a leftward swipe as forward and a rightward one as back', () => {
    expect(swipeDirection(-120, 10)).toBe(1);
    expect(swipeDirection(120, -10)).toBe(-1);
  });

  it('ignores short swipes and mostly vertical ones', () => {
    expect(swipeDirection(-30, 0)).toBe(0);
    expect(swipeDirection(-80, 200)).toBe(0);
  });
});
