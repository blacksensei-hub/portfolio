import type { ImageFunction } from 'astro:content';
import { defineCollection } from 'astro:content';

import { file } from 'astro/loaders';
import { load as yamlLoad } from 'js-yaml';
// Zod comes straight from the package: Astro 7 deprecates re-exporting `z` from
// `astro:content`, and this is the same zod 4 that Astro validates with.
import { z } from 'zod';

/*
 * The four content collections every section reads from, per spec 0002.
 *
 * Each is one YAML file under `src/content/`, validated by a strict Zod schema.
 * The parsers and schemas are exported so `content.config.test.ts` can exercise
 * them directly; the collections at the bottom are all Astro consumes.
 */

/*
 * Why the parsers below never throw.
 *
 * `file()` wraps the parser in a try/catch that logs at error level and then
 * returns, so a thrown parser leaves the build green with the whole collection
 * silently empty. That is worse than the typo it was meant to catch. Astro does
 * fail the build on a schema error, so every rule that can be pinned to a
 * specific entry is reported there instead, through this register: the parser
 * records what it found, and a `superRefine` on the schema turns it into a
 * proper `InvalidContentEntryDataError` naming the collection, entry and field.
 */
type Defect = { readonly field: string; readonly message: string };

const defects = new Map<string, Map<string, Defect>>();

function recordDefect(collection: string, key: string, defect: Defect): void {
  let forCollection = defects.get(collection);
  if (forCollection === undefined) {
    forCollection = new Map<string, Defect>();
    defects.set(collection, forCollection);
  }
  forCollection.set(key, defect);
}

/*
 * The `file()` loader keys an array entry off `id` or `slug` and nothing else,
 * so a `skills` entry keyed on `group` would be dropped rather than loaded.
 * Parsing the list into a keyed map fixes that: the key field becomes the entry
 * id. It also catches the two rules a Zod schema cannot see, because a schema
 * validates one entry at a time and a collision is a property of the pair:
 * duplicate keys (AC-6) and duplicate `order` values (AC-7).
 */
export function keyedList(collection: string, keyField: string) {
  return (text: string): Record<string, Record<string, unknown>> => {
    // Astro parses YAML itself when it owns the parser; taking it over means
    // parsing here, and `js-yaml` is the parser it would have used.
    const parsed: unknown = yamlLoad(text) ?? [];

    // An empty file is a legitimate empty collection (AC-10), not an error.
    if (!Array.isArray(parsed)) {
      throw new Error(`[${collection}] ${collection}.yaml must contain a list of entries.`);
    }

    defects.delete(collection);

    const entries: Record<string, Record<string, unknown>> = {};
    const seenOrder = new Map<number, string>();
    let unkeyed = 0;

    for (const raw of parsed) {
      if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
        throw new Error(`[${collection}] every entry must be a mapping of fields.`);
      }
      const item = raw as Record<string, unknown>;
      const rawKey = item[keyField];

      // No usable key, so it cannot be stored under its own name. Park it under
      // a placeholder rather than dropping it: the schema then rejects it for
      // the missing required field, which fails the build where dropping would
      // not. The placeholder only ever appears in that error message.
      if (typeof rawKey !== 'string' || rawKey.length === 0) {
        unkeyed += 1;
        entries[`missing-${keyField}-${unkeyed}`] = item;
        continue;
      }

      if (rawKey in entries) {
        recordDefect(collection, rawKey, {
          field: keyField,
          message: `"${rawKey}" is used by more than one entry. Each \`${keyField}\` must be unique.`,
        });
        continue;
      }

      const order = item['order'];
      if (typeof order === 'number') {
        const clash = seenOrder.get(order);
        if (clash === undefined) {
          seenOrder.set(order, rawKey);
        } else {
          recordDefect(collection, rawKey, {
            field: 'order',
            message: `${order} is already used by "${clash}". \`order\` must be unique so the ordering is total.`,
          });
        }
      }

      entries[rawKey] = item;
    }

    return entries;
  };
}

/*
 * `profile` holds exactly one entry (AC-9). The file is a mapping, not a list,
 * so it needs its own parser: one that proves there is exactly one key and that
 * the key is `profile`, since `getEntry('profile', 'profile')` is the contract.
 *
 * This one has nowhere to pin a defect (the violation is the set of keys, not a
 * field on an entry), so it throws. The loader swallows that into a logged
 * error and an empty collection, which is why consumers must handle an absent
 * profile per AC-10.
 */
export function singleProfile(text: string): Record<string, Record<string, unknown>> {
  // An empty file parses to undefined. It is still a rule violation, but the
  // "exactly one key" message below locates it better than a shape complaint.
  const parsed: unknown = yamlLoad(text) ?? {};

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('[profile] profile.yaml must contain a single `profile:` mapping.');
  }

  const keys = Object.keys(parsed);
  if (keys.length !== 1 || keys[0] !== 'profile') {
    throw new Error(
      `[profile] profile.yaml must hold exactly one top level key, \`profile\`. Found: ${
        keys.length === 0 ? 'nothing' : keys.join(', ')
      }.`,
    );
  }

  return parsed as Record<string, Record<string, unknown>>;
}

/*
 * Replays whatever the parser recorded for this entry as a schema issue, so it
 * surfaces as a build failure that names the collection, the entry and the
 * field. `keyField` identifies which entry is being validated.
 */
export function reportDefects<T extends z.ZodTypeAny>(
  schema: T,
  collection: string,
  keyField: string,
) {
  return schema.superRefine((entry, ctx) => {
    const key = (entry as Record<string, unknown>)[keyField];
    if (typeof key !== 'string') return;

    const defect = defects.get(collection)?.get(key);
    if (defect === undefined) return;

    ctx.addIssue({
      code: 'custom',
      path: [defect.field],
      message: defect.message,
    });
  });
}

const nonEmpty = z.string().min(1);

export const profileSchema = z
  .object({
    name: nonEmpty,
    role: nonEmpty,
    tagline: nonEmpty.max(160),
    bio: nonEmpty,
    email: z.email(),
    // A path into `public/`, not an `astro:assets` asset: the image pipeline
    // handles images only, and a PDF has nothing to optimise.
    resume: z
      .string()
      .regex(/^\//, 'must be a root relative path into `public/`, for example `/resume.pdf`')
      .optional(),
  })
  .strict();

export const projectSchema = (image: ImageFunction) =>
  z
    .object({
      slug: z
        .string()
        .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'must be lowercase words joined by single hyphens'),
      title: nonEmpty,
      summary: nonEmpty.max(280),
      tech: z.array(nonEmpty).min(1),
      demoUrl: z.url().optional(),
      repoUrl: z.url().optional(),
      // Resolved through `astro:assets`; the path is relative to this YAML file.
      image: image().optional(),
      order: z.number().int().min(0),
    })
    .strict()
    .refine((entry) => entry.demoUrl !== undefined || entry.repoUrl !== undefined, {
      message: 'needs at least one of `demoUrl` or `repoUrl`, so the card has somewhere to link',
      path: ['demoUrl'],
    });

export const skillGroupSchema = z
  .object({
    group: nonEmpty,
    items: z.array(nonEmpty).min(1),
    order: z.number().int().min(0),
  })
  .strict();

export const linkSchema = z
  .object({
    label: nonEmpty,
    href: z.url(),
    // An enum, not a free string, so a typo fails the build instead of
    // rendering a missing glyph. Extend it when a link needs a new key.
    icon: z.enum(['github', 'linkedin', 'email', 'x', 'whatsapp', 'phone']),
    order: z.number().int().min(0),
  })
  .strict();

const profile = defineCollection({
  loader: file('src/content/profile.yaml', { parser: singleProfile }),
  schema: profileSchema,
});

const projects = defineCollection({
  loader: file('src/content/projects.yaml', { parser: keyedList('projects', 'slug') }),
  schema: ({ image }) => reportDefects(projectSchema(image), 'projects', 'slug'),
});

const skills = defineCollection({
  loader: file('src/content/skills.yaml', { parser: keyedList('skills', 'group') }),
  schema: reportDefects(skillGroupSchema, 'skills', 'group'),
});

const links = defineCollection({
  loader: file('src/content/links.yaml', { parser: keyedList('links', 'label') }),
  schema: reportDefects(linkSchema, 'links', 'label'),
});

export const collections = { profile, projects, skills, links };
