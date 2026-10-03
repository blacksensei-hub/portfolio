import { readFile } from 'node:fs/promises';
import { Resvg } from '@resvg/resvg-js';
import type { ReactNode } from 'react';
import satori from 'satori';
import sharp from 'sharp';

import { parseOklch, toHex } from '../styles/contrast';

/*
 * Shared drawing for the build time link preview cards (specs 0006, 0022): the
 * home page card and one per case study. Satori lays out a tree of styled
 * boxes, resvg rasterises it to a 1200 by 630 PNG.
 */

export const WIDTH = 1200;
export const HEIGHT = 630;

/** A styled box, the shape satori expects in place of JSX. */
export const el = (style: Record<string, unknown>, children?: unknown) => ({
  type: 'div',
  props: { style, children },
});

export const fontFile = (weight: 400 | 500 | 700) =>
  readFile(`node_modules/@fontsource/inter/files/inter-latin-${weight}-normal.woff`);

/**
 * Dark theme tokens from the forced dark block, as hex, since satori cannot read
 * `oklch()`. The cards ship in the dark palette: it is the site's signature look,
 * and link previews sit on other people's dark chrome more often than not.
 */
export async function cardColors() {
  const css = await readFile('src/styles/global.css', 'utf8');
  const block = /:root\[data-theme="dark"\]\s*\{([^}]*)\}/.exec(css)?.[1] ?? '';
  const token = (name: string) => {
    const value = new RegExp(`--color-${name}:\\s*([^;]+);`).exec(block)?.[1];
    if (value === undefined) throw new Error(`og: --color-${name} is missing from the dark theme`);
    return toHex(parseOklch(value));
  };
  return {
    surface: token('surface'),
    surfaceRaised: token('surface-raised'),
    onSurface: token('on-surface'),
    onAccent: token('on-accent'),
    accent: token('accent'),
    muted: token('muted'),
    border: token('border'),
    gold: token('thread-gold'),
    green: token('thread-green'),
    red: token('thread-red'),
  };
}

export type CardColors = Awaited<ReturnType<typeof cardColors>>;

/** The weave, flattened for a still card: three thread coloured bars along the bottom. */
export const threads = (colors: CardColors) =>
  el({ display: 'flex', width: WIDTH, height: 14 }, [
    el({ width: 460, height: 14, backgroundColor: colors.gold }),
    el({ width: 300, height: 14, backgroundColor: colors.green }),
    el({ width: 440, height: 14, backgroundColor: colors.red }),
  ]);

/** The monogram badge: the first and last initials on the accent. */
export const monogram = (name: string, colors: CardColors, size = 72) =>
  el(
    {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: size,
      height: size,
      borderRadius: size * 0.28,
      backgroundColor: colors.accent,
      color: colors.onAccent,
      fontSize: size * 0.47,
      fontWeight: 700,
    },
    name
      .split(/\s+/)
      .filter((_, n, all) => n === 0 || n === all.length - 1)
      .map((word) => word.charAt(0))
      .join(''),
  );

/**
 * A screenshot as a JPEG data URL at `width`, for satori, which cannot decode
 * WebP. `image` is a content collection image; its source file is read at build.
 */
export async function screenshot(image: ImageMetadata, width: number): Promise<string> {
  const path = (image as ImageMetadata & { fsPath?: string }).fsPath;
  if (!path) throw new Error(`og: no source file for ${image.src}`);
  const jpeg = await sharp(path).resize({ width }).jpeg({ quality: 82 }).toBuffer();
  return `data:image/jpeg;base64,${jpeg.toString('base64')}`;
}

/** Renders a card tree to PNG bytes with Inter at three weights. */
export async function renderCard(card: unknown, label: string): Promise<Uint8Array<ArrayBuffer>> {
  const [regular, medium, bold] = await Promise.all([fontFile(400), fontFile(500), fontFile(700)]);
  try {
    const svg = await satori(card as ReactNode, {
      width: WIDTH,
      height: HEIGHT,
      fonts: [
        { name: 'Inter', data: regular, weight: 400, style: 'normal' },
        { name: 'Inter', data: medium, weight: 500, style: 'normal' },
        { name: 'Inter', data: bold, weight: 700, style: 'normal' },
      ],
    });
    return new Uint8Array(new Resvg(svg).render().asPng());
  } catch (cause) {
    throw new Error(`${label}: failed to render the social card`, { cause });
  }
}
