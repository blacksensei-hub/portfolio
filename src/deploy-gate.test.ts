import { describe, expect, it } from 'vitest';

// Deliberate failure on the throwaway test/deploy-preview branch, to prove a
// red check skips the deploy (spec 0007, AC-3). Never merge this file.
describe('deploy gate', () => {
  it('fails on purpose', () => {
    expect(1).toBe(2);
  });
});
