import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { beforeEach, describe, expect, it } from 'vitest';

import GluedLinkSentence from './__fixtures__/GluedLinkSentence.astro';
import InlineLinkSentence from './__fixtures__/InlineLinkSentence.astro';

/*
 * Astro drops the line break space before a component that starts a new line,
 * so a sentence Prettier wraps before a <Link> renders glued ("anexternal link").
 * Ending the line with {' '} keeps the space and survives formatting.
 */

let container: AstroContainer;

beforeEach(async () => {
  container = await AstroContainer.create();
});

function visibleText(html: string): string {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

describe('Link inside a sentence', () => {
  it("keeps the spaces around each link when the line before ends with {' '}", async () => {
    const html = await container.renderToString(InlineLinkSentence);
    expect(visibleText(html)).toBe(
      'An internal link, an external link (opens in a new tab), and a mail link.',
    );
  });

  it('loses the space when a Link starts a new line with no explicit space', async () => {
    // Documents the trap. If this starts failing, Astro changed how it trims.
    const html = await container.renderToString(GluedLinkSentence);
    expect(visibleText(html)).toBe('Read thedocs first.');
  });
});
