# 0019 Keynote: a redesign concept

Status: proposed (concept only, not shipped)

The owner asked to see what a full visual redesign could look like with the Apple design skill as its motion and material layer. This is a concept to look at before anything changes. It lives at `/concept/`, is noindexed and kept out of the sitemap, and leaves the real home page untouched. If it is chosen, a follow-up spec moves it onto `/` and the case study pages.

## Direction

The language of Apple's product pages, keeping the owner's identity: the kente gold accent, the monogram, and the existing copy.

- **Restraint over effects.** The decorative layers go: aurora blobs, glow rings, shimmer, typewriter, marquee, spotlight, and the drifting background. Hierarchy comes from type, space, and contrast. Motion is reserved for feedback and for content arriving.
- **One family.** Inter for everything, set like a system face: bold, tightly tracked headlines, a 17px body, and size-specific tracking (spec 0018). Space Grotesk and JetBrains Mono are not used here.
- **Neutral canvas, one accent.** White and `#f5f5f7` tiles in light; black and `#161617` in dark. Gold is reserved for actions and links.
- **Tiles.** Content sits in large rounded tiles (28px). AttendX gets a dark tile in both themes for drama; UrbanPulse gets a light one.
- **Materials.** A thin full-width translucent nav whose hairline appears only once content scrolls under it. The phone menu is shared with spec 0018.

## Page

1. **Hero:** the availability pill, the role as the headline, the tagline, and two actions. Below them is a composition of real screens, a browser window with the AttendX console and a phone with UrbanPulse, which grows into place as it scrolls in.
2. **About:** a bento of the bio, technologies in use, platforms, availability, local time in Accra, and the résumé.
3. **Work:** a product tile per project with its summary, links (case study, live demo, source), stack, and its own screens in device frames.
4. **Inside the apps:** a horizontal gallery of screens from both case studies, with native scroll snapping and momentum, plus previous and next paddles.
5. **Built with:** the skill groups as a quiet specification table.
6. **Work with me:** the four services as tiles.
7. **Contact:** "Let's build your next idea." and every way to reach the owner.
8. **Footer:** fine print.

## Verification

- **Tests:** `/concept/` renders every section, fits a 375px screen without horizontal scroll, and passes axe in light and dark. It is also excluded from the sitemap.
- **Review:** screenshots at desktop and phone sizes in both themes, plus a branch preview on Cloudflare Pages.
