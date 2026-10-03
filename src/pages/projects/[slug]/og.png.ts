import { type CollectionEntry, getCollection, getEntry } from 'astro:content';
import type { APIRoute, GetStaticPaths } from 'astro';

import {
  cardColors,
  el,
  HEIGHT,
  monogram,
  renderCard,
  screenshot,
  threads,
  WIDTH,
} from '../../../lib/og-card';
import { pickPreview } from '../../../lib/preview';

/*
 * A link preview card per case study (spec 0022), so a shared case study link
 * shows that project, not the home page card. Text on the left: "Case study",
 * the project title, and the case study's headline. On the right, the same
 * screens as the project card (pickPreview): a window that bleeds off the
 * edge with a phone resting on it. Dark palette and weave, like the home card.
 */

export const getStaticPaths = (async () => {
  const studies = await getCollection('caseStudies');
  return studies.map((study) => ({ params: { slug: study.id }, props: { study } }));
}) satisfies GetStaticPaths;

const img = (src: string, width: number, height: number, style: Record<string, unknown> = {}) => ({
  type: 'img',
  props: { src, width, height, style: { width, height, ...style } },
});

export const GET: APIRoute = async ({ props }) => {
  const { study } = props as { study: CollectionEntry<'caseStudies'> };
  const project = (await getEntry(study.data.project))?.data;
  const profile = (await getEntry('profile', 'profile'))?.data;
  if (!project || !profile) throw new Error(`og: ${study.id} is missing its project or profile`);

  const colors = await cardColors();
  const preview = pickPreview(study.data.gallery);

  const windowWidth = 600;
  const phoneWidth = 138;
  const [desktopSrc, phoneSrc] = await Promise.all([
    preview ? screenshot(preview.desktop.image, windowWidth * 2) : undefined,
    preview?.phone ? screenshot(preview.phone.image, phoneWidth * 2) : undefined,
  ]);

  const chip = el(
    {
      display: 'flex',
      alignItems: 'center',
      padding: '8px 18px',
      borderRadius: 999,
      backgroundColor: colors.surfaceRaised,
      color: colors.accent,
      fontSize: 20,
      fontWeight: 500,
      letterSpacing: 2,
    },
    'CASE STUDY',
  );

  const text = el(
    {
      position: 'absolute',
      left: 72,
      top: 72,
      width: 520,
      display: 'flex',
      flexDirection: 'column',
      gap: 22,
    },
    [
      el({ display: 'flex', alignItems: 'center', gap: 20 }, [
        monogram(profile.name, colors, 56),
        chip,
      ]),
      el(
        {
          fontSize: 88,
          fontWeight: 700,
          lineHeight: 1,
          letterSpacing: -2,
          color: colors.onSurface,
        },
        project.title,
      ),
      el(
        {
          display: 'block',
          fontSize: 32,
          fontWeight: 500,
          lineHeight: 1.3,
          color: colors.onSurface,
          lineClamp: 3,
        },
        // Curly apostrophes, as the page renders them.
        study.data.headline.replace(/'/g, '’'),
      ),
      el(
        { fontSize: 22, fontWeight: 400, color: colors.muted },
        `${profile.name} · ${study.data.role.split('.')[0]}`,
      ),
    ],
  );

  const media: unknown[] = [];
  if (preview && desktopSrc) {
    const height = Math.round(
      (windowWidth * preview.desktop.image.height) / preview.desktop.image.width,
    );
    media.push(
      el(
        {
          position: 'absolute',
          left: 640,
          top: 96,
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 18,
          overflow: 'hidden',
          border: `1px solid ${colors.border}`,
          backgroundColor: colors.surfaceRaised,
          boxShadow: '0 30px 60px rgba(0,0,0,0.45)',
        },
        [
          el({ display: 'flex', gap: 8, padding: '12px 14px' }, [
            el({ width: 11, height: 11, borderRadius: 99, backgroundColor: colors.border }),
            el({ width: 11, height: 11, borderRadius: 99, backgroundColor: colors.border }),
            el({ width: 11, height: 11, borderRadius: 99, backgroundColor: colors.border }),
          ]),
          img(desktopSrc, windowWidth, height),
        ],
      ),
    );
    if (preview.phone && phoneSrc) {
      const phoneHeight = Math.round(
        (phoneWidth * preview.phone.image.height) / preview.phone.image.width,
      );
      media.push(
        el(
          {
            position: 'absolute',
            left: 1006,
            top: 590 - phoneHeight,
            display: 'flex',
            border: '6px solid #0b0b0f',
            borderRadius: 26,
            overflow: 'hidden',
            backgroundColor: '#0b0b0f',
            boxShadow: '0 24px 48px rgba(0,0,0,0.55)',
          },
          img(phoneSrc, phoneWidth, phoneHeight, { borderRadius: 20 }),
        ),
      );
    }
  }

  const card = el(
    {
      position: 'relative',
      display: 'flex',
      width: WIDTH,
      height: HEIGHT,
      backgroundColor: colors.surface,
      fontFamily: 'Inter',
      overflow: 'hidden',
    },
    [
      ...media,
      text,
      el({ position: 'absolute', left: 0, bottom: 0, display: 'flex' }, threads(colors)),
    ],
  );

  const png = await renderCard(card, `projects/${study.id}/og.png`);
  return new Response(png, { headers: { 'Content-Type': 'image/png' } });
};
