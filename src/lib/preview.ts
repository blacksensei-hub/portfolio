/*
 * The project preview (specs 0020, 0021): one desktop and one phone shot from
 * a case study, shown on the home page card and on the case study's own
 * header. Both places name the same view transition, so the screens carry
 * across the navigation instead of disappearing and reappearing.
 */

type Shot = { device: 'desktop' | 'phone'; card?: boolean | undefined };

/** The shots marked `card: true`, else the first of each device. No desktop shot, no preview. */
export function pickPreview<T extends Shot>(
  gallery: readonly T[],
): { desktop: T; phone: T | undefined } | undefined {
  const pick = (device: Shot['device']) => {
    const shots = gallery.filter((shot) => shot.device === device);
    return shots.find((shot) => shot.card) ?? shots[0];
  };
  const desktop = pick('desktop');
  return desktop ? { desktop, phone: pick('phone') } : undefined;
}

/** The view-transition name for one part of a project's preview. Valid CSS for any slug. */
export function previewTransitionName(slug: string, part: 'window' | 'phone'): string {
  return `shot-${slug.replace(/[^a-zA-Z0-9-]/g, '-')}-${part}`;
}
