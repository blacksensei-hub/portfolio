import { describe, expect, it } from 'vitest';

import { ghanaTime, localPoint, magnetOffset, typewriterStep } from './interactions';

const box = { left: 100, top: 50, width: 200, height: 40 };

describe('magnetOffset', () => {
  it('rests at zero with the pointer on the center', () => {
    expect(magnetOffset(box, 200, 70)).toEqual({ dx: 0, dy: 0 });
  });

  it('leans toward the pointer by the strength', () => {
    expect(magnetOffset(box, 220, 80, 0.3)).toEqual({ dx: 6, dy: 3 });
  });

  it('never leans further than the cap', () => {
    expect(magnetOffset(box, 1000, -1000, 0.3, 10)).toEqual({ dx: 10, dy: -10 });
  });
});

describe('localPoint', () => {
  it('gives the pointer relative to the box', () => {
    expect(localPoint(box, 150, 60)).toEqual({ mx: 50, my: 10 });
  });
});

describe('ghanaTime', () => {
  it('reads GMT, zero padded', () => {
    expect(ghanaTime(new Date('2026-09-19T07:05:00Z'))).toBe('07:05');
  });
});

describe('typewriterStep', () => {
  it('types one letter toward the word', () => {
    expect(typewriterStep('we', 'web', false)).toMatchObject({ text: 'web', deleting: false });
  });

  it('pauses on a finished word, then starts deleting', () => {
    expect(typewriterStep('web', 'web', false)).toMatchObject({
      text: 'web',
      deleting: true,
      delay: 1800,
    });
  });

  it('deletes back to empty, then advances to the next word', () => {
    expect(typewriterStep('w', 'web', true)).toMatchObject({ text: '', deleting: true });
    expect(typewriterStep('', 'web', true)).toMatchObject({
      text: '',
      deleting: false,
      advance: true,
    });
  });
});
