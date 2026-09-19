import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import {
  keyedList,
  linkSchema,
  profileSchema,
  projectSchema,
  reportDefects,
  reportProfileDefect,
  serviceSchema,
  singleProfile,
  skillGroupSchema,
} from './content.config';

/*
 * Proves the four schemas accept a good entry and reject each way an entry can
 * be wrong, so a typo fails `pnpm build` instead of shipping (spec 0002,
 * AC-3 to AC-7, AC-9).
 *
 * These exercise the parsers and schemas directly rather than through a build,
 * which keeps them fast and lets each rejection rule get its own case. The two
 * collection wide rules, duplicate keys and duplicate `order`, are found by the
 * parser and reported by the schema, so their cases run the pair together.
 */

// `image()` is only handed to the projects schema by Astro at build time. The
// tests never resolve a real asset, so a permissive stand-in is enough: every
// case here is about the other fields.
const imageStub = (() => z.any()) as unknown as Parameters<typeof projectSchema>[0];

const projects = projectSchema(imageStub);

const validProfile = {
  name: 'Ada Lovelace',
  role: 'Full stack developer',
  tagline: 'I build fast, accessible web applications.',
  bio: 'A short paragraph about the work.',
  email: 'ada@example.com',
};

const validProject = {
  slug: 'my-portfolio',
  title: 'My Portfolio',
  summary: 'A one page personal portfolio.',
  tech: ['Astro', 'TypeScript'],
  repoUrl: 'https://github.com/example/my-portfolio',
  order: 0,
};

const validSkillGroup = {
  group: 'Languages',
  items: ['TypeScript'],
  order: 0,
};

const validLink = {
  label: 'GitHub',
  href: 'https://github.com/example',
  icon: 'github',
  order: 0,
};

describe('keyedList', () => {
  const parseSkills = keyedList('skills', 'group');

  it('keys each entry by its key field', () => {
    // covers: AC-1. The `file()` loader keys an array entry off `id` or `slug`
    // alone, so without this a `group` keyed entry would be dropped, not loaded.
    const parsed = parseSkills('- group: Languages\n  items: [TypeScript]\n  order: 0\n');

    expect(Object.keys(parsed)).toEqual(['Languages']);
    expect(parsed['Languages']).toMatchObject({ group: 'Languages', order: 0 });
  });

  it('returns an empty collection for an empty file', () => {
    // covers: AC-10. An empty file is a legitimate empty collection, so the
    // consuming section can omit itself rather than the build failing.
    expect(parseSkills('')).toEqual({});
  });

  it('keeps the first of two entries sharing a key', () => {
    // The duplicate is not stored; it is recorded as a defect and reported by
    // the schema instead, which is what actually fails the build. See the
    // `reportDefects` cases below.
    const yaml =
      '- group: Languages\n  items: [TypeScript]\n  order: 0\n' +
      '- group: Languages\n  items: [Go]\n  order: 1\n';
    const parsed = parseSkills(yaml);

    expect(Object.keys(parsed)).toEqual(['Languages']);
    expect(parsed['Languages']).toMatchObject({ items: ['TypeScript'] });
  });

  it('parks an entry with no key field under a placeholder', () => {
    // covers: it cannot be stored under its own name, and dropping it would
    // leave the build green with the entry silently missing. Parking it means
    // the schema rejects it for the missing required field, which does fail.
    const parsed = parseSkills('- items: [TypeScript]\n  order: 0\n');

    expect(Object.keys(parsed)).toEqual(['missing-group-1']);
  });

  it('rejects a file that is a mapping rather than a list', () => {
    expect(() => parseSkills('Languages:\n  order: 0\n')).toThrow(/must contain a list/);
  });

  it('keys projects by slug', () => {
    const parsed = keyedList('projects', 'slug')('- slug: my-portfolio\n  order: 0\n');

    expect(Object.keys(parsed)).toEqual(['my-portfolio']);
  });
});

describe('reportDefects', () => {
  /*
   * The two collection wide rules. `file()` swallows a thrown parser into a log
   * line and an empty collection, leaving the build green, so the parser
   * records these and the schema reports them. These cases prove the round
   * trip: parse a bad file, then validate and expect a located failure.
   */
  const schema = reportDefects(skillGroupSchema, 'skills', 'group');
  const parse = keyedList('skills', 'group');

  function firstIssue(entry: unknown) {
    const result = schema.safeParse(entry);
    expect(result.success).toBe(false);
    return result.success ? undefined : result.error.issues[0];
  }

  it('reports a duplicate key against the key field', () => {
    // covers: AC-6. Astro's own loader only warns on a duplicate, which would
    // let two entries collide and one silently win.
    const parsed = parse(
      '- group: Languages\n  items: [TypeScript]\n  order: 0\n' +
        '- group: Languages\n  items: [Go]\n  order: 1\n',
    );
    const issue = firstIssue(parsed['Languages']);

    expect(issue?.path).toEqual(['group']);
    expect(issue?.message).toMatch(/"Languages" is used by more than one entry/);
  });

  it('reports a duplicate order against the order field and names the clash', () => {
    // covers: AC-7. A Zod schema validates one entry at a time, so a collision
    // between two entries is invisible to it.
    const parsed = parse(
      '- group: Languages\n  items: [TypeScript]\n  order: 0\n' +
        '- group: Frameworks\n  items: [Astro]\n  order: 0\n',
    );
    const issue = firstIssue(parsed['Frameworks']);

    expect(issue?.path).toEqual(['order']);
    expect(issue?.message).toMatch(/0 is already used by "Languages"/);
  });

  it('passes a clean file through untouched', () => {
    const parsed = parse(
      '- group: Languages\n  items: [TypeScript]\n  order: 0\n' +
        '- group: Frameworks\n  items: [Astro]\n  order: 1\n',
    );

    expect(schema.safeParse(parsed['Languages']).success).toBe(true);
    expect(schema.safeParse(parsed['Frameworks']).success).toBe(true);
  });

  it('clears defects from a previous parse of the same collection', () => {
    // covers: the parser reruns on every content change, including in the dev
    // server. A stale defect would fail a file the author has already fixed.
    parse(
      '- group: Languages\n  items: [TypeScript]\n  order: 0\n' +
        '- group: Languages\n  items: [Go]\n  order: 1\n',
    );
    const reparsed = parse('- group: Languages\n  items: [TypeScript]\n  order: 0\n');

    expect(schema.safeParse(reparsed['Languages']).success).toBe(true);
  });
});

describe('singleProfile', () => {
  /*
   * covers: AC-9. The single entry rule is found by the parser and reported by
   * the schema, so these run the pair together the way the duplicate key cases
   * do. That pairing is the whole point: `file()` swallows a thrown parser into
   * a logged error and an empty collection, leaving the build green, while a
   * schema failure is a build failure. This is the same mechanism AC-3 relies
   * on for every other rule.
   */
  const profileEntry = reportProfileDefect(profileSchema);

  // Parses the file, then validates the entry it produced. Returns both, so a
  // case can assert the parser did not throw and that the schema rejected.
  function parseFile(text: string) {
    const parsed = singleProfile(text);

    return { parsed, result: profileEntry.safeParse(parsed['profile']) };
  }

  it('accepts a file holding exactly one profile key', () => {
    // `getEntry('profile', 'profile')` is the contract, so the key has to be
    // that exact string.
    const { parsed, result } = parseFile(
      `profile:\n  name: ${validProfile.name}\n  role: ${validProfile.role}\n  tagline: ${validProfile.tagline}\n  bio: ${validProfile.bio}\n  email: ${validProfile.email}\n`,
    );

    expect(Object.keys(parsed)).toEqual(['profile']);
    expect(result.success).toBe(true);
  });

  it('leaves no defect behind after a good file', () => {
    // A bad parse must not poison the next good one: the register is cleared
    // per parse, so a fixed file builds without a restart.
    parseFile('');
    const { result } = parseFile(
      `profile:\n  name: ${validProfile.name}\n  role: ${validProfile.role}\n  tagline: ${validProfile.tagline}\n  bio: ${validProfile.bio}\n  email: ${validProfile.email}\n`,
    );

    expect(result.success).toBe(true);
  });

  it('fails the build on a file with no keys', () => {
    const { parsed, result } = parseFile('');

    // The parser returns rather than throwing, so the loader cannot swallow it.
    expect(Object.keys(parsed)).toEqual(['profile']);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toMatch(/exactly one top level key/);
  });

  it('fails the build on a file with more than one key', () => {
    const { parsed, result } = parseFile('profile:\n  name: Ada\nother:\n  name: Bob\n');

    expect(Object.keys(parsed)).toEqual(['profile']);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toMatch(/exactly one top level key.*other/s);
  });

  it('fails the build on a file whose single key is not `profile`', () => {
    const { result } = parseFile('me:\n  name: Ada\n');

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toMatch(/exactly one top level key/);
  });

  it('fails the build on a list', () => {
    const { parsed, result } = parseFile('- name: Ada\n');

    expect(Object.keys(parsed)).toEqual(['profile']);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toMatch(/single `profile:` mapping/);
  });
});

describe('profileSchema', () => {
  it('accepts a fully populated entry', () => {
    expect(profileSchema.safeParse(validProfile).success).toBe(true);
  });

  it('accepts an entry carrying an optional resume path', () => {
    const result = profileSchema.safeParse({ ...validProfile, resume: '/resume.pdf' });

    expect(result.success).toBe(true);
  });

  it('rejects a resume that is not a root relative path', () => {
    // covers: the resume is served straight out of `public/`, so a bare
    // filename or an absolute URL would produce a dead link.
    const result = profileSchema.safeParse({ ...validProfile, resume: 'resume.pdf' });

    expect(result.success).toBe(false);
  });

  it('rejects a malformed email', () => {
    expect(profileSchema.safeParse({ ...validProfile, email: 'not-an-email' }).success).toBe(false);
  });

  it('rejects a tagline longer than 160 characters', () => {
    const result = profileSchema.safeParse({ ...validProfile, tagline: 'x'.repeat(161) });

    expect(result.success).toBe(false);
  });

  it('rejects an empty required field', () => {
    expect(profileSchema.safeParse({ ...validProfile, name: '' }).success).toBe(false);
  });

  it('rejects an unknown key', () => {
    // covers: AC-4. The `never` catchall means a mistyped field name is an
    // error rather than content that silently never renders.
    const result = profileSchema.safeParse({ ...validProfile, twitter: '@ada' });

    expect(result.success).toBe(false);
    // The issue is pinned to the offending key, not to the entry as a whole.
    // An empty path here is what made Astro print a bare `****` instead of a
    // field name, so this assertion is the guard against that coming back.
    expect(result.error?.issues[0]?.path).toEqual(['twitter']);
  });

  it('rejects an entry missing a required field', () => {
    const { bio: _bio, ...withoutBio } = validProfile;

    expect(profileSchema.safeParse(withoutBio).success).toBe(false);
  });

  describe('availability (spec 0009, AC-2)', () => {
    const withAvailability = (availability: unknown) =>
      profileSchema.safeParse({ ...validProfile, availability });

    it.each(['open', 'limited', 'closed'])('accepts status %s', (status) => {
      expect(withAvailability({ status, note: 'Taking work.' }).success).toBe(true);
    });

    it('rejects a status outside the enum', () => {
      expect(withAvailability({ status: 'busy', note: 'Taking work.' }).success).toBe(false);
    });

    it('rejects an empty note', () => {
      expect(withAvailability({ status: 'open', note: '' }).success).toBe(false);
    });

    it('rejects a note longer than 160 characters', () => {
      expect(withAvailability({ status: 'open', note: 'x'.repeat(161) }).success).toBe(false);
    });

    it('rejects a missing note', () => {
      expect(withAvailability({ status: 'open' }).success).toBe(false);
    });

    it('rejects an unknown key, pinned to that key', () => {
      const result = withAvailability({ status: 'open', note: 'Taking work.', until: 'May' });

      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.path).toEqual(['availability', 'until']);
    });
  });
});

describe('serviceSchema (spec 0009, AC-2)', () => {
  const validService = { title: 'Web apps', blurb: 'I build web apps.', order: 0 };
  const schema = reportDefects(serviceSchema, 'services', 'title');
  const parse = keyedList('services', 'title');

  it('accepts a valid entry, including a 280 character blurb', () => {
    expect(serviceSchema.safeParse(validService).success).toBe(true);
    expect(serviceSchema.safeParse({ ...validService, blurb: 'x'.repeat(280) }).success).toBe(true);
  });

  it('rejects a 281 character blurb', () => {
    expect(serviceSchema.safeParse({ ...validService, blurb: 'x'.repeat(281) }).success).toBe(false);
  });

  it('rejects an empty title or blurb', () => {
    expect(serviceSchema.safeParse({ ...validService, title: '' }).success).toBe(false);
    expect(serviceSchema.safeParse({ ...validService, blurb: '' }).success).toBe(false);
  });

  it('rejects an unknown key', () => {
    const result = serviceSchema.safeParse({ ...validService, price: 100 });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(['price']);
  });

  it('reports a duplicate title', () => {
    const parsed = parse(
      '- title: Web apps\n  blurb: a\n  order: 0\n- title: Web apps\n  blurb: b\n  order: 1\n',
    );
    const result = schema.safeParse(parsed['Web apps']);

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(['title']);
  });

  it('reports a duplicate order', () => {
    const parsed = parse(
      '- title: Web apps\n  blurb: a\n  order: 0\n- title: Mobile\n  blurb: b\n  order: 0\n',
    );
    const result = schema.safeParse(parsed['Mobile']);

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(['order']);
  });
});

describe('projectSchema', () => {
  it('accepts a valid entry', () => {
    expect(projects.safeParse(validProject).success).toBe(true);
  });

  it('accepts an entry with a demo url and no repo url', () => {
    const { repoUrl: _repoUrl, ...entry } = validProject;
    const result = projects.safeParse({ ...entry, demoUrl: 'https://example.com' });

    expect(result.success).toBe(true);
  });

  it('rejects an entry with neither a demo url nor a repo url', () => {
    // covers: AC-5. A card with no link is a dead card, so the refinement makes
    // it a build failure rather than a rendering decision for the section.
    const { repoUrl: _repoUrl, ...entry } = validProject;
    const result = projects.safeParse(entry);

    expect(result.success).toBe(false);
  });

  it('rejects a malformed url', () => {
    expect(projects.safeParse({ ...validProject, repoUrl: 'github.com/example' }).success).toBe(
      false,
    );
  });

  it.each([
    ['uppercase', 'My-Portfolio'],
    ['spaces', 'my portfolio'],
    ['underscores', 'my_portfolio'],
    ['a leading hyphen', '-my-portfolio'],
    ['a double hyphen', 'my--portfolio'],
  ])('rejects a slug containing %s', (_label, slug) => {
    expect(projects.safeParse({ ...validProject, slug }).success).toBe(false);
  });

  it('rejects an empty tech list', () => {
    expect(projects.safeParse({ ...validProject, tech: [] }).success).toBe(false);
  });

  it('rejects a summary longer than 280 characters', () => {
    expect(projects.safeParse({ ...validProject, summary: 'x'.repeat(281) }).success).toBe(false);
  });

  it('rejects a negative order', () => {
    expect(projects.safeParse({ ...validProject, order: -1 }).success).toBe(false);
  });

  it('rejects a fractional order', () => {
    // covers: `order` is renumbered by hand, and a fraction invites someone to
    // slot 1.5 between 1 and 2 rather than renumbering as the spec intends.
    expect(projects.safeParse({ ...validProject, order: 1.5 }).success).toBe(false);
  });

  it('rejects an unknown key', () => {
    expect(projects.safeParse({ ...validProject, featured: true }).success).toBe(false);
  });
});

describe('skillGroupSchema', () => {
  it('accepts a valid entry', () => {
    expect(skillGroupSchema.safeParse(validSkillGroup).success).toBe(true);
  });

  it('rejects a group with no items', () => {
    // covers: AC-10 says an empty collection omits the section, but a group
    // that exists with nothing in it would render an empty heading.
    expect(skillGroupSchema.safeParse({ ...validSkillGroup, items: [] }).success).toBe(false);
  });

  it('rejects an empty item', () => {
    expect(skillGroupSchema.safeParse({ ...validSkillGroup, items: [''] }).success).toBe(false);
  });

  it('rejects an unknown key', () => {
    expect(skillGroupSchema.safeParse({ ...validSkillGroup, level: 'expert' }).success).toBe(false);
  });
});

describe('linkSchema', () => {
  it('accepts a valid entry', () => {
    expect(linkSchema.safeParse(validLink).success).toBe(true);
  });

  it.each(['github', 'linkedin', 'email', 'x', 'whatsapp', 'phone'])(
    'accepts the %s icon key',
    (icon) => {
      expect(linkSchema.safeParse({ ...validLink, icon }).success).toBe(true);
    },
  );

  it('rejects an icon key outside the enum', () => {
    // covers: the section maps this key to a glyph, so a typo would render
    // nothing at all. The enum turns that into a build failure.
    expect(linkSchema.safeParse({ ...validLink, icon: 'twitter' }).success).toBe(false);
  });

  it('accepts a mailto url', () => {
    const result = linkSchema.safeParse({
      ...validLink,
      label: 'Email',
      href: 'mailto:ada@example.com',
      icon: 'email',
    });

    expect(result.success).toBe(true);
  });

  it('rejects a relative href', () => {
    expect(linkSchema.safeParse({ ...validLink, href: '/contact' }).success).toBe(false);
  });

  it('rejects an empty label', () => {
    // covers: the label is both the entry key and the link's accessible name.
    expect(linkSchema.safeParse({ ...validLink, label: '' }).success).toBe(false);
  });

  it('rejects an unknown key', () => {
    expect(linkSchema.safeParse({ ...validLink, title: 'GitHub' }).success).toBe(false);
  });
});
