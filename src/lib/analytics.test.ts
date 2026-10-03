import { describe, expect, it } from 'vitest';

import { BEACON_LOADER, BEACON_SRC, beaconAttr } from './analytics';

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

describe('BEACON_LOADER', () => {
  it('adds the beacon only after load, carrying the token from its own tag', () => {
    expect(BEACON_LOADER).toContain("addEventListener('load'");
    expect(BEACON_LOADER).toContain('requestIdleCallback');
    expect(BEACON_LOADER).toContain(BEACON_SRC);
    expect(BEACON_LOADER).toContain("getAttribute('data-cf-beacon-token')");
    // Plain ES5: it runs inline, unbundled.
    expect(BEACON_LOADER).not.toMatch(/=>|\bconst\b|\blet\b/);
  });
});
