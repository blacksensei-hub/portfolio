import { describe, expect, it } from 'vitest';

import { pickNameSize } from './og';

// Every character is half the font size wide, so widths are easy to reason about.
const measure = (text: string, size: number) => text.length * size * 0.5;

describe('pickNameSize', () => {
  it('uses 72px for a name that fits on one line', () => {
    // 20 chars at 72px is 720px, inside 1028px.
    expect(pickNameSize('Ada Augusta Lovelace', measure)).toBe(72);
  });

  it('uses 64px for a name that fits in two lines', () => {
    // 31 chars at 72px is 1116px, too wide; at 64px each half fits.
    expect(pickNameSize('Jeffrey Nii Akwei Ankrah Mensah', measure)).toBe(64);
  });

  it('uses 56px for a name that needs more than two lines', () => {
    const name = 'Wolfeschlegelsteinhausenberger Bartholomew Alexander Maximilian Montgomery';
    expect(pickNameSize(name, measure)).toBe(56);
  });
});
