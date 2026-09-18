/*
 * Layout rules for the build time social card, per spec 0006 (AC-4). Pure, so
 * the name sizing is tested without a font or a renderer.
 */

/** Width of the card's text column: 1200 minus the 12px bar, 80px gap, 80px right padding. */
export const TEXT_WIDTH = 1028;

/** Returns the rendered width of `text` at `size` px, in px. */
export type Measure = (text: string, size: number) => number;

/** Lines `text` takes when wrapped greedily at word boundaries into `width`. */
function lineCount(text: string, size: number, measure: Measure, width: number): number {
  let lines = 1;
  let line = '';
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const next = line ? `${line} ${word}` : word;
    if (line && measure(next, size) > width) {
      lines += 1;
      line = word;
    } else {
      line = next;
    }
  }
  return lines;
}

/**
 * The name is 72px when it fits on one line, 64px when it fits in two, and
 * 56px otherwise, wrapping as needed. It is never truncated.
 */
export function pickNameSize(name: string, measure: Measure, width = TEXT_WIDTH): 72 | 64 | 56 {
  if (measure(name, 72) <= width) return 72;
  if (lineCount(name, 64, measure, width) <= 2) return 64;
  return 56;
}
