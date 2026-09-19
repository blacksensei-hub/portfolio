# 0013 Compact scale and reference inspired features

Status: accepted

Owner feedback: the site felt zoomed in; match the density of https://anthonysaah.me/, adopt MotionSites.ai style motion, and give the footer useful content. The handoff's zero JS rule is relaxed by the owner.

## Scale
Hero name 40 to 60px (was up to 136px), section headings 22 to 26px, body 16px, content column 62rem, section spacing 56 to 88px.

## Reference features, reinterpreted (not copied)
| On the reference | Here |
|---|---|
| Glass nav: logo, icon tabs, socials, theme toggle | Glass pill: monogram, segmented section tabs lit by `:target-current`, social icons, the theme toggle inside; shrinks on scroll |
| Photo card with availability badge | A `developer.ts` code card that types itself in, with a spinning glow ring |
| Role chip above the name | Role chip with shimmer text; count-up stats under the CTAs |
| Section titles with icon badges | Numbered mono badges, a hint on the right, a rule that draws in |
| Spotlight project with tag chips | Featured chip on the first project, "Visit live site" hover overlay |
| Contact card with typewriter headline | Glass CTA card with aurora and a typewriter cycling what we could build |
| Footer: © line, last updated, links, socials | Brand block with availability, Explore and Connect columns, a live Ghana clock, last updated date, back to top |

## MotionSites style effects
MotionSites.ai is a paid prompt library, not a code package, so its signature effects are built here: aurora blobs over a grid floor, conic glow borders (`@property --angle`), shimmer text, blur-in word reveals, CSS count-up (`@property --num`), typewriter, pointer spotlight, magnetic buttons.

All still rest at their final state under reduced motion; contrast and axe checks pass in both themes.
