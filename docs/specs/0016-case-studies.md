# 0016 Case study pages

Status: accepted

One page per project at `/projects/[slug]/`, telling the story the project card can't: the problem, what was built, the hard parts, and the screens.

## Content model

- A `caseStudies` collection: one Markdown file per project in `src/content/case-studies/`. The file name is the page slug. The body is the write-up; the frontmatter holds the facts.
- Frontmatter, strictly validated like every other collection: `project` (a `reference('projects')`, so a missing project fails the build), `headline`, `role`, `period`, `platforms`, up to four `metrics`, and a `gallery` of at least one shot, each with `image`, required `alt`, optional `caption`, and `device` (`desktop` or `phone`).
- Title, summary, stack, links, and cover image come from the referenced project, never duplicated, so the card and the page can't disagree.

## Page

Hero with a back link, title, headline, a facts row (role, timeline, platforms, links), and the framed cover; a figures row; the write-up with the stack pinned beside it on wide screens; a gallery of browser-framed desktop shots and phone-framed mobile shots; then the next case study (wrapping round) and a contact card. The site nav is reused with `base="/"` so its anchors lead back to the home page sections.

## Writing rules

Every claim is checked against the project's code, commits, or live site before it goes in. The copy doesn't discuss tooling, and AttendX is described as a solo project, per the owner.

## Screens

Captured from the public live sites on 2026-09-24, desktop at 1440 px and phone at 390 px, stored as WebP under `src/assets/case-studies/`. UrbanPulse's cookie banner was hidden before capture, not accepted. Private screens (dashboards, admin, the mobile app signed in) are a follow-up once supplied.

## Verification

Schema cases in `content.config.test.ts`; `tests/e2e/case-studies.spec.ts` covers content, links, loaded gallery images with alt text, nav anchors, phone width, axe in both themes, the card link from the home page, next-study wrapping, and the sitemap.
