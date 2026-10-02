import { describe, expect, it } from 'vitest';

import { pickPreview, previewTransitionName } from './preview';

const shot = (name: string, device: 'desktop' | 'phone', card?: boolean) => ({
  name,
  device,
  ...(card === undefined ? {} : { card }),
});

describe('pickPreview', () => {
  it('takes the first desktop and first phone shot by default', () => {
    const preview = pickPreview([
      shot('d1', 'desktop'),
      shot('d2', 'desktop'),
      shot('p1', 'phone'),
      shot('p2', 'phone'),
    ]);
    expect(preview?.desktop.name).toBe('d1');
    expect(preview?.phone?.name).toBe('p1');
  });

  it('prefers the shots marked for the card', () => {
    const preview = pickPreview([
      shot('d1', 'desktop'),
      shot('d2', 'desktop', true),
      shot('p1', 'phone'),
      shot('p2', 'phone', true),
    ]);
    expect(preview?.desktop.name).toBe('d2');
    expect(preview?.phone?.name).toBe('p2');
  });

  it('has no phone without a phone shot, and no preview without a desktop shot', () => {
    expect(pickPreview([shot('d1', 'desktop')])?.phone).toBeUndefined();
    expect(pickPreview([shot('p1', 'phone')])).toBeUndefined();
  });
});

describe('previewTransitionName', () => {
  it('is a valid, unique name per project and part', () => {
    expect(previewTransitionName('attendx', 'window')).toBe('shot-attendx-window');
    expect(previewTransitionName('urban pulse', 'phone')).toBe('shot-urban-pulse-phone');
  });
});
