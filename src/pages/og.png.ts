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
const PAD = 80;

const fontFile = (weight: 400 | 500 | 700) =>
  readFile(`node_modules/@fontsource/inter/files/inter-latin-${weight}-normal.woff`);

/**
 * Dark theme tokens from the forced dark block, as hex, since satori cannot read
 * `oklch()`. The card ships in the dark palette: it is the site's signature look,
 * and link previews sit on other people's dark chrome more often than not.
 */
async function cardColors() {
  const css = await readFile('src/styles/global.css', 'utf8');
  const block = /:root\[data-theme="dark"\]\s*\{([^}]*)\}/.exec(css)?.[1] ?? '';
  const token = (name: string) => {
    const value = new RegExp(`--color-${name}:s*([^;]+);`).exec(block)?.[1];
    if (value === undefined)
      throw new Error(`og.png: --color-${name} is missing from the dark theme`);
    return toHex(parseOklch(value));
  };
  return {
    surface: token('surface'),
    surfaceRaised: token('surface-raised'),
    onSurface: token('on-surface'),
    onAccent: token('on-accent'),
    accent: token('accent'),
    muted: token('muted'),
    gold: token('thread-gold'),
    green: token('thread-green'),
    red: token('thread-red'),
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
    cardColors(),
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

  const badge = el(
    {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 72,
      height: 72,
      borderRadius: 20,
      backgroundColor: colors.accent,
      color: colors.onAccent,
      fontSize: 34,
      fontWeight: 700,
    },
    profile.name
      .split(/\s+/)
      .filter((_, n, all) => n === 0 || n === all.length - 1)
      .map((word) => word.charAt(0))
      .join(''),
  );

  const chip = el(
    {
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      padding: '10px 22px',
      borderRadius: 999,
      backgroundColor: colors.surfaceRaised,
      color: colors.onSurface,
      fontSize: 24,
      fontWeight: 500,
    },
    [
      el({ width: 14, height: 14, borderRadius: 999, backgroundColor: colors.green }),
      'Available for work',
    ],
  );

  // The weave, flattened for a still card: three thread coloured bars.
  const threads = el({ display: 'flex', width: WIDTH, height: 14 }, [
    el({ width: 460, height: 14, backgroundColor: colors.gold }),
    el({ width: 300, height: 14, backgroundColor: colors.green }),
    el({ width: 440, height: 14, backgroundColor: colors.red }),
  ]);

  const card = el(
    {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      width: WIDTH,
      height: HEIGHT,
      backgroundColor: colors.surface,
      fontFamily: 'Inter',
    },
    [
      el(
        {
          display: 'flex',
          flexDirection: 'column',
          gap: 26,
          width: TEXT_WIDTH,
          padding: `${PAD}px 0 0 ${PAD}px`,
          boxSizing: 'content-box',
        },
        [
          el({ display: 'flex', alignItems: 'center', gap: 28 }, [badge, chip]),
          el(
            { fontSize: nameSize, fontWeight: 700, lineHeight: 1.1, color: colors.onSurface },
            profile.name,
          ),
          el(
            { fontSize: 38, fontWeight: 500, lineHeight: 1.2, color: colors.accent },
            profile.role,
          ),
          el(
            {
              display: 'block',
              fontSize: 30,
              fontWeight: 400,
              lineHeight: 1.4,
              color: colors.muted,
              lineClamp: 2,
            },
            profile.tagline,
          ),
        ],
      ),
      threads,
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
