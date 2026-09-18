import { describe, expect, it } from 'vitest';

import { isExternal } from './isExternal';

describe('isExternal', () => {
  it.each(['https://github.com', 'http://example.com/a', 'HTTPS://EXAMPLE.COM'])(
    'treats %s as external',
    (href) => {
      expect(isExternal(href)).toBe(true);
    },
  );

  it.each(['/resume.pdf', '#projects', 'mailto:me@example.com', 'about', '//cdn.example.com'])(
    'treats %s as internal',
    (href) => {
      expect(isExternal(href)).toBe(false);
    },
  );
});
