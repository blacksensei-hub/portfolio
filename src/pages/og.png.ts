import { getEntry } from 'astro:content';
import type { APIRoute } from 'astro';
import opentype from 'opentype.js';

import { pickNameSize, TEXT_WIDTH } from '../lib/og';
import {
  cardColors,
  el,
  fontFile,
  HEIGHT,
  monogram,
  renderCard,
  threads,
  WIDTH,
} from '../lib/og-card';

/*
 * The 1200 by 630 link preview card, drawn at build from `profile.yaml` so it
 * never drifts from the page (spec 0006, AC-4 and AC-8). Drawing helpers are
 * shared with the case study cards (spec 0022).
 */

const PAD = 80;

export const GET: APIRoute = async () => {
  const profile = (await getEntry('profile', 'profile'))?.data;
  if (!profile) throw new Error('profile.yaml is missing');

  const [bold, colors] = await Promise.all([fontFile(700), cardColors()]);

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

  const badge = monogram(profile.name, colors);

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
      threads(colors),
    ],
  );

  const png = await renderCard(card, 'og.png');
  return new Response(png, { headers: { 'Content-Type': 'image/png' } });
};
