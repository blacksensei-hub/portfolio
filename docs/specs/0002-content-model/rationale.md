# 0002. Rationale: content model

The decision record behind [index.md](index.md). Not read during a build.

## Context

Spec 0001 settled that content lives in Astro content collections under `src/content/` with Zod schemas in `src/content.config.ts`, and explicitly deferred the shape of those collections to this feature. The config file today is an empty stub and `src/content/` holds nothing.

Four Release 1 features (hero & about, projects, skills, contact links & resume) all read from that content, so none of them can be built until the shape exists. Whatever is chosen here becomes the contract all four build against, and a later change to it is a change to all four at once.

The forces:

- **The owner edits this site, not a team.** The format has to be pleasant to hand edit months from now, with no tooling and no memory of how it was set up.
- **A typo must not ship.** The site deploys automatically on push (feature 10), so the build is the only gate between a bad entry and the live page. That argues for validation that is strict by default rather than permissive.
- **Static output, no runtime.** Everything resolves at build time. There is no database, no API, and no runtime validation to fall back on.
- **`strictest` TypeScript.** Indexed access returns `T | undefined`, so the absent cases have to be designed for rather than asserted away.
- **The scope bar is explicit**: adding a project or skill means editing one data file, with no code changes, and a bad entry fails the build.

Not deciding means four features each inventing their own data shape, which is exactly the rework this foundation exists to prevent.

## Options considered

### Option 1: YAML data collections, one file per collection, strict Zod schemas

Four collections loaded by the `file()` loader from `src/content/*.yaml`, each an array (or a single object for `profile`), validated by `.strict()` Zod schemas.

**Pros**:
- YAML is the least noisy format to hand edit: no quotes around every key, no trailing comma errors, and comments are allowed, so the file can carry a note about what a field means.
- One file per collection matches the "edit one data file" bar literally.
- `.strict()` turns a misspelled key into a build error instead of a silently missing value.

**Cons**:
- YAML's whitespace sensitivity is its own class of mistake, and its type coercion has sharp edges (the classic Norway problem, where `no` parses as a boolean).
- A single file per collection grows long and conflicts more readily than separate files.

### Option 2: JSON data collections

The same structure with `.json` files.

**Pros**:
- Unambiguous parsing with no type coercion surprises, and editors offer completion against a JSON Schema.

**Cons**:
- No comments at all, which removes the natural place to explain a field to your future self.
- Quote and comma noise makes hand editing tedious and typo prone, which works against the main use of these files.

### Option 3: Markdown with frontmatter, one file per entry

Each project, skill group, and link as its own `.md` file with structured frontmatter.

**Pros**:
- The natural fit once entries carry long prose, which is where project case studies would go.
- One file per entry means clean diffs and no merge conflicts.

**Cons**:
- Every field in this model today is short and structured; a body is unused weight.
- Adding a project means creating a file rather than editing one, which is a heavier motion than the scope asks for.

### Option 4: TypeScript modules exporting typed constants

Content as `.ts` files with `as const` objects, type checked directly.

**Pros**:
- Errors surface in the editor as you type, with no build run needed.

**Cons**:
- Directly contradicts the `AGENTS.md` rule that content is read through `getCollection` and `getEntry`, never by importing a data file.
- Content and code stop being separable, so "editing content" becomes "editing code".

## Rationale

Option 1 wins on the force that dominates here: these files exist to be hand edited by one person, occasionally, without ceremony. YAML's comments and quiet syntax serve that directly, while JSON's noise (Option 2) works against it and buys only parser strictness that the Zod schemas already provide more precisely. YAML's coercion edges are real but narrow, and the strict schemas catch the cases that would matter, since a coerced boolean where a string is required is a validation error.

Markdown per entry (Option 3) is the right answer for a different model than this one. Every field today is a short scalar or a small list, so there is no body for Markdown to hold, and one file per entry makes the common motion (add a project) heavier than editing a single list. Option 3 is the likely destination if case study pages ever leave Deferred; the Follow-up records that.

Option 4 was ruled out on the project's own rule rather than on merit. The `getCollection` boundary is what makes content replaceable later without touching sections, and a typed constant module dissolves that boundary.

Two smaller calls followed from the same reasoning. `profile` is a collection of one rather than a config constant, because a uniform read path across all four is worth more than saving one file, and it keeps the single entry inside the same validation gate as everything else. Skills are modelled as groups with nested items rather than flat entries carrying a group name, because the scope requires grouped rendering that screen readers announce, and holding the grouping in the data keeps the section from having to know the group names or their order.

Strict validation was chosen over loose typing because the deploy is automatic. There is no review step between an edit and the live site, so the build is the only place a mistake can be caught, and it should catch as much as it reasonably can.

## Tradeoffs accepted

- Hand maintained `order` numbers, in exchange for curation control over which project leads.
- Two step field additions (schema, then data), in exchange for typos being errors.
- Long single files as content grows, in exchange for the one file edit motion.
- No `services` collection yet, in exchange for not guessing at a Release 2 shape.
