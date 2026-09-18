import { getEntry } from 'astro:content';
import { readFile } from 'node:fs/promises';
import { Resvg } from '@resvg/resvg-js';
import type { APIRoute } from 'astro';
import opentype from 'opentype.js';
import type { ReactNode } from 'react';
import satori from 'satori';

import { pickNameSize, TEXT_WIDTH } from '../lib/og';
import { parseOklch, toHex } from '../styles/contrast';

/*
 * The 1200 by 630 link preview card, drawn at build from `profile.yaml` so it
 * never drifts from the page (spec 0006, AC-4 and AC-8).
 */

const WIDTH = 1200;
const HEIGHT = 630;
const BAR = 12;
const PAD = 80;

const fontFile = (weight: 400 | 500 | 700) =>
  readFile(`node_modules/@fontsource/inter/files/inter-latin-${weight}-normal.woff`);

/** Light theme tokens from the `@theme` block, as hex, since satori cannot read `oklch()`. */
async function lightColors() {
  const css = await readFile('src/styles/global.css', 'utf8');
  const theme = /@theme\s*\{([^}]*)\}/.exec(css)?.[1] ?? '';
  const token = (name: string) => {
    const value = new RegExp(`--color-${name}:s*([^;]+);`).exec(theme)?.[1];
    if (value === undefined) throw new Error(`og.png: --color-${name} is missing from @theme`);
    return toHex(parseOklch(value));
  };
  return {
    surface: token('surface'),
    onSurface: token('on-surface'),
    accent: token('accent'),
    muted: token('muted'),
  };
}

const el = (style: Record<string, unknown>, children?: unknown) => ({
  type: 'div',
  props: { style, children },
});

export const GET: APIRoute = async () => {
  const profile = (await getEntry('profile', 'profile'))?.data;
  if (!profile) throw new Error('profile.yaml is missing');

  const [regular, medium, bold, colors] = await Promise.all([
    fontFile(400),
    fontFile(500),
    fontFile(700),
    lightColors(),
  ]);

  const boldFace = opentype.parse(
    bold.buffer.slice(bold.byteOffset, bold.byteOffset + bold.byteLength),
  );
  const nameSize = pickNameSize(profile.name, (text, size) => {
    // Advances plus pair kerning, by hand: opentype.js's shaper throws on one of
    // Inter's substitution lookups, and substitutions barely change a name's width.
    const glyphs = [...text].map((char) => boldFace.charToGlyph(char));
    const units = glyphs.reduce(
      (sum, glyph, n) =>
        sum +
        (glyph.advanceWidth ?? 0) +
        (n > 0 ? boldFace.getKerningValue(glyphs[n - 1] as typeof glyph, glyph) : 0),
      0,
    );
    return (units / boldFace.unitsPerEm) * size;
  });

  const card = el(
    { display: 'flex', width: WIDTH, height: HEIGHT, backgroundColor: colors.surface },
    [
      el({ width: BAR, height: HEIGHT, backgroundColor: colors.accent }),
      el(
        {
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
          width: TEXT_WIDTH,
          height: HEIGHT,
          padding: `${PAD}px 0 ${PAD}px ${PAD}px`,
          boxSizing: 'content-box',
          fontFamily: 'Inter',
        },
        [
          el(
            { fontSize: nameSize, fontWeight: 700, lineHeight: 1.1, color: colors.onSurface },
            profile.name,
          ),
          el(
            { fontSize: 40, fontWeight: 500, lineHeight: 1.2, color: colors.accent },
            profile.role,
          ),
          el(
            {
              display: 'block',
              fontSize: 32,
              fontWeight: 400,
              lineHeight: 1.4,
              color: colors.muted,
              lineClamp: 3,
            },
            profile.tagline,
          ),
        ],
      ),
    ],
  );

  let png: Uint8Array<ArrayBuffer>;
  try {
    const svg = await satori(card as unknown as ReactNode, {
      width: WIDTH,
      height: HEIGHT,
      fonts: [
        { name: 'Inter', data: regular, weight: 400, style: 'normal' },
        { name: 'Inter', data: medium, weight: 500, style: 'normal' },
        { name: 'Inter', data: bold, weight: 700, style: 'normal' },
      ],
    });
    png = new Uint8Array(new Resvg(svg).render().asPng());
  } catch (cause) {
    throw new Error('og.png: failed to render the social card', { cause });
  }

  return new Response(png, { headers: { 'Content-Type': 'image/png' } });
};
