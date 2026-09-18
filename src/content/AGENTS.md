# Content

The site's text lives here, in four YAML files validated by the strict Zod
schemas in [`../content.config.ts`](../content.config.ts). Adding or editing a
project, skill or link is a change to one file, with no code touched. A bad
entry fails `pnpm build` rather than shipping.

Decided in [spec 0002](../../docs/specs/0002-content-model/index.md).

## The four collections

| File | Collection | Entry key | Shape |
|---|---|---|---|
| `profile.yaml` | `profile` | `profile` | one mapping under a single `profile:` key |
| `projects.yaml` | `projects` | `slug` | a list |
| `skills.yaml` | `skills` | `group` | a list |
| `links.yaml` | `links` | `label` | a list |

The four are independent. There are no cross collection references, so there is
nothing to join at render time.

## Reading content

- Read through `getCollection` and `getEntry` only. Never import a YAML file
  directly, and never read one off disk. The schema types are the contract.
- `profile` holds exactly one entry: `getEntry('profile', 'profile')`.
- **Sort ascending on `order`** before rendering `projects`, `skills` or
  `links`. The loader does not sort for you, and `order` is unique within each
  collection, so no tie break is needed.
- Under `strictest`, `getEntry` returns `T | undefined`. Handle the absent case;
  do not assert non-null.

## Rendering rules

- **An empty collection renders nothing at all**: no heading, no empty
  container, no "coming soon". Same when the `profile` entry is absent. The
  section omits itself entirely.
- **An absent optional field omits only that element**, not the section around
  it. A project with no `image` still renders its card.
- **Project image alt text is exactly `Screenshot of {title}`**, built from the
  entry's `title`. There is deliberately no `alt` field: every image here is a
  screenshot of the named project, and pinning the wording stops each section
  inventing its own.
- The `icon` key maps to a glyph **in the contact section, not in the data**. A
  glyph is presentation. Adding a new icon means extending the `z.enum` in the
  config and the map in the section.
- `profile.email` is a bare address. The section adds the `mailto:` prefix.
- `profile.resume` is a root relative path into `public/`, used verbatim as the
  `href`. To add a resume, drop the PDF at `public/resume.pdf` and add one
  `resume: /resume.pdf` line. It is not an `astro:assets` asset: that pipeline
  handles images, and a PDF has nothing to optimise.

## Project images

- The path is **relative to this folder**, so `../assets/thing.png` points at
  `src/assets/`.
- It resolves through `astro:assets` to an optimised build time asset with real
  width, height and format.
- A path pointing at a missing file **fails the build** (`image-not-found`),
  but only once a page actually reads the collection. An unread collection
  never forces resolution, so the check is real in practice and not in theory.

## Editing rules

- **Every schema is `.strict()`.** An unknown key is an error, not ignored. So
  adding a field is two steps: the schema first, then the data.
- **`order` must be unique within a collection**, and is checked when the file
  is parsed. Inserting between two entries means renumbering, not one edit.
- **Entry keys must be unique**: `slug`, `group`, `label`. A duplicate fails the
  build with a message naming the collection and the value.
- A project needs **at least one of `demoUrl` or `repoUrl`**, so its card always
  has somewhere to link.
- `slug` is lowercase words joined by single hyphens, for example
  `my-portfolio`.
- An empty list file is valid and yields an empty collection, which the
  consuming section then omits.
