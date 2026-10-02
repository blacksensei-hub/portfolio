# 0020 Project card device preview

Status: accepted

From the Keynote concept (spec 0019), the owner chose one element for the real site: the project media as a browser window showing the desktop screen, with a phone resting on its corner.

- `Projects.astro` hands `ProjectCard` a `preview` of one desktop shot and one phone shot from the case study. A shot marked `card: true` in the gallery is used; without one, it takes the first of each device. UrbanPulse marks the admin visitors chart and the jeans size guide, so its card shows no jersey, at the owner's request. A project without a case study, or without a desktop shot, keeps its `image` (or the Weave) exactly as before.
- **Browser window:** the site's rounded card frame with three dots, the desktop shot, and the "Visit live site" hover shortcut.
- **Phone:** a near-black bezel at 22% of the media width, resting on the bottom right corner and overhanging it.
- **Hover:** the window lifts 4px and the phone 8px, so they read as layers. Under reduced motion they stay put.
- **Alt text:** each image uses its gallery alt text.
- **Layout:** the media still alternates sides between rows.

Verification: a unit test that a preview renders both shots with their alt text in place of the project image; the e2e layout test reads the first image of each card.
