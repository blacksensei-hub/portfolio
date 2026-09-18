# 0001. Rationale: Astro 7 static stack

## Context

The product is a one page personal portfolio for recruiters and freelance clients (basis: `docs/scope/scope.md`). It must be free to host, rank and preview well in search and social shares, and keep its content (bio, projects, skills, links) in repo data files where a bad entry fails the build. There is no user data, login, or server logic.

The builder is a solo developer who already knows TypeScript and React. The project uses the Skateboard approach (ship the smallest complete site, then grow) at Beta rigor, so tests are expected. Later releases add a dark/light theme and privacy friendly analytics, and deferred items (contact form, CMS, blog) may one day want dynamic behavior.

Without a recorded stack, the design system, content model, and every section feature have nothing to build on.

## Options considered

### Option 1: Astro 7 static, React islands, Tailwind 4

Astro renders `.astro` components to HTML at build time and hydrates React only where marked (basis: islands architecture).

**Pros**:
- Zero JavaScript by default; content collections validate data with Zod at build time.
- React stays available for interactive pieces.

**Cons**:
- A second component syntax to learn; Astro 7 is a recent major, so some integrations may lag.

### Option 2: Next.js with static export

All React, built with `output: 'export'` to an `out/` folder.

**Pros**:
- Fully familiar React model, huge ecosystem.

**Cons**:
- Ships the React runtime even for static content; static export disables image optimization and server features, and content validation must be wired by hand.

### Option 3: Vite + React with prerendering

A minimal React app prerendered to HTML.

**Pros**:
- Lightest toolchain, pure React.

**Cons**:
- SEO tags, prerendering, sitemap, image optimization, and content validation are all glue code you own.

## Rationale

The forces are static output, strong SEO, and build time content validation for a solo builder. Astro meets all three out of the box, where Next.js and Vite need extra wiring or ship JavaScript a content page does not need (basis: static site generation for content sites). Islands keep your React skill useful without paying for it on every section.

Tailwind 4's CSS tokens directly serve the design system and theme features. Pnpm with pinned Node, and Vitest plus Playwright, are the proven, well documented defaults for this toolchain (basis: boring technology). Staying adapter free keeps hosting reversible until feature 10.

The runner up was Next.js static export: a reasonable pick if the site later grows server features, but heavier for today's one pager.

## References

**Project sources**:
- `docs/scope/scope.md`: product intent, Skateboard approach, Beta tier, features 3, 4, 9, 10, 11

**Practices & standards**:
- Static site generation for content sites
- Islands architecture (partial hydration)
- Boring technology: proven tools over novel ones

**Links** (web verified during the landscape check, 2026-09-17):
- Astro, what's new June 2026: https://astro.build/blog/whats-new-june-2026/
- Next.js static exports: https://nextjs.org/docs/app/guides/static-exports
- Tailwind CSS v4.1: https://tailwindcss.com/blog/tailwindcss-v4-1
- Node.js downloads (LTS): https://nodejs.org/en/download
- Input for feature 10: Cloudflare Pages https://developers.cloudflare.com/pages/ · Netlify pricing https://www.netlify.com/pricing/ · Vercel pricing https://vercel.com/pricing
