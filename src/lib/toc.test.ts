import { describe, expect, it } from 'vitest';

import { activeSection } from './toc';

describe('activeSection', () => {
  it('is none while every heading is still below the reading line', () => {
    expect(activeSection([400, 900, 1500], 100)).toBe(-1);
  });

  it('is the last heading that has passed the reading line', () => {
    expect(activeSection([-600, -100, 300], 100)).toBe(1);
    expect(activeSection([-900, -400, 60], 100)).toBe(2);
  });

  it('counts a heading sitting exactly on the line, as after a jump to it', () => {
    expect(activeSection([-500, 100, 700], 100)).toBe(1);
  });

  it('is none on a page with no headings', () => {
    expect(activeSection([], 100)).toBe(-1);
  });
});
