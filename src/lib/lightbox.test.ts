import { describe, expect, it } from 'vitest';

import { dismissDecision, fitRect, pageDecision, stepIndex, swipeDirection } from './lightbox';

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

describe('fitRect', () => {
  it('scales a wide shot down to the box width', () => {
    expect(fitRect(800, 800, 1600, 1000)).toEqual({ width: 800, height: 500 });
  });

  it('scales a tall phone shot down to the box height', () => {
    expect(fitRect(1200, 600, 585, 1266)).toEqual({ width: 277, height: 600 });
  });

  it('never enlarges a shot past its own size', () => {
    expect(fitRect(3000, 2000, 1600, 1000)).toEqual({ width: 1600, height: 1000 });
  });

  it('gives nothing for an empty box or image', () => {
    expect(fitRect(0, 500, 1600, 1000)).toEqual({ width: 0, height: 0 });
    expect(fitRect(500, 500, 0, 1000)).toEqual({ width: 0, height: 0 });
  });
});

describe('pageDecision', () => {
  it('pages forward on a long drag left and back on a long drag right', () => {
    expect(pageDecision(-400, 0, 1000)).toBe(1);
    expect(pageDecision(400, 0, 1000)).toBe(-1);
  });

  it('pages on a short, fast flick, judged by where it would land', () => {
    expect(pageDecision(-60, -900, 1000)).toBe(1);
  });

  it('settles back when a drag drifts home', () => {
    expect(pageDecision(-300, 800, 1000)).toBe(0);
    expect(pageDecision(-100, 0, 1000)).toBe(0);
  });
});

describe('dismissDecision', () => {
  it('closes on a throw either way, and not on a nudge', () => {
    expect(dismissDecision(80, 1200, 800)).toBe(true);
    expect(dismissDecision(-40, -900, 800)).toBe(true);
    expect(dismissDecision(60, 0, 800)).toBe(false);
  });
});
