import { describe, expect, it } from 'vitest';

import { checksPassed, codeAt, STEPS, stepAt, trackProgress } from './scan-story';

describe('trackProgress', () => {
  it('is 0 before the track reaches the top and 1 once its end has passed', () => {
    expect(trackProgress(300, 3000, 800)).toBe(0);
    expect(trackProgress(-2200, 3000, 800)).toBe(1);
    expect(trackProgress(-5000, 3000, 800)).toBe(1);
  });

  it('runs linearly in between, the same scrolling down or up', () => {
    expect(trackProgress(-1100, 3000, 800)).toBeCloseTo(0.5, 5);
  });
});

describe('stepAt', () => {
  it('splits progress into equal steps', () => {
    expect(stepAt(0)).toEqual({ step: 0, within: 0 });
    expect(stepAt(0.5).step).toBe(2);
    expect(stepAt(0.5).within).toBeCloseTo(0.5, 5);
  });

  it('holds the last step at the very end', () => {
    expect(stepAt(1).step).toBe(STEPS - 1);
    expect(stepAt(1).within).toBeLessThan(1);
  });
});

describe('checksPassed', () => {
  it('ticks the four checks off in order through the step', () => {
    expect(checksPassed(0)).toBe(0);
    expect(checksPassed(0.25)).toBe(1);
    expect(checksPassed(0.45)).toBe(2);
    expect(checksPassed(0.8)).toBe(4);
    expect(checksPassed(1)).toBe(4);
  });
});

describe('codeAt', () => {
  it('changes the code while the projector is in view, then holds the scanned one', () => {
    const early = new Set([0, 0.05, 0.1, 0.15, 0.2, 0.25].map((p) => codeAt(p)));
    expect(early.size).toBeGreaterThan(1);
    expect(codeAt(0.6)).toBe(codeAt(0.9));
  });
});
