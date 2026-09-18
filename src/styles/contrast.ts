/**
 * WCAG 2.2 contrast for OKLCH colors, with no dependency. OKLCH goes to OKLab,
 * then to linear sRGB (Ottosson's published matrices), clamped to the sRGB
 * gamut the way a browser displays it. Linear sRGB feeds relative luminance
 * directly, so no gamma step is needed.
 */
export interface Oklch {
  /** Lightness, 0 to 1. */
  l: number;
  c: number;
  /** Hue in degrees. */
  h: number;
}

const clamp = (v: number): number => Math.min(1, Math.max(0, v));

export function relativeLuminance({ l, c, h }: Oklch): number {
  const rad = (h * Math.PI) / 180;
  const a = c * Math.cos(rad);
  const b = c * Math.sin(rad);

  const lc = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const mc = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const sc = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;

  const r = clamp(4.0767416621 * lc - 3.3077115913 * mc + 0.2309699292 * sc);
  const g = clamp(-1.2684380046 * lc + 2.6097574011 * mc - 0.3413193965 * sc);
  const bl = clamp(-0.0041960863 * lc - 0.7034186147 * mc + 1.707614701 * sc);

  return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
}

export function contrastRatio(x: Oklch, y: Oklch): number {
  const lx = relativeLuminance(x);
  const ly = relativeLuminance(y);
  return (Math.max(lx, ly) + 0.05) / (Math.min(lx, ly) + 0.05);
}

/** Parses `oklch(L% C H)`; anything else throws, so the caller fails loudly. */
export function parseOklch(value: string): Oklch {
  const match = /^oklch\(\s*([\d.]+)%\s+([\d.]+)\s+([\d.]+)\s*\)$/.exec(value.trim());
  if (!match) throw new Error(`Not an oklch(L% C H) literal: "${value}"`);
  const [, l = '', c = '', h = ''] = match;
  return { l: Number(l) / 100, c: Number(c), h: Number(h) };
}
