import { describe, expect, it } from 'vitest';

import { beaconAttr } from './analytics';

describe('beaconAttr', () => {
  it('returns the beacon JSON for a token', () => {
    // covers: AC-1
    expect(beaconAttr('abc')).toBe('{"token":"abc"}');
  });

  it('trims the token', () => {
    expect(beaconAttr('  abc  ')).toBe('{"token":"abc"}');
  });

  it.each([undefined, '', '   '])('returns null for %j', (token) => {
    // covers: AC-2
    expect(beaconAttr(token)).toBeNull();
  });
});
