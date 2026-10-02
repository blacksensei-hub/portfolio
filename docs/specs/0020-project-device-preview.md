# 0020 Project card device preview

Status: accepted

From the Keynote concept (spec 0019), the owner chose one element for the real site: the project media as a browser window showing the desktop screen, with a phone resting on its corner.

- `Projects.astro` takes each case study's first desktop shot and first phone shot and hands them to `ProjectCard` as `preview`. A project without a case study, or without a desktop shot, keeps its `image` (or the Weave) exactly as before.
- **Browser window:** the site's rounded card frame with three dots, the desktop shot, and the "Visit live site" hover shortcut.
- **Phone:** a near-black bezel at 22% of the media width, resting on the bottom right corner and overhanging it.
- **Hover:** the window lifts 4px and the phone 8px, so they read as layers. Under reduced motion they stay put.
- **Alt text:** each image uses its gallery alt text.
- **Layout:** the media still alternates sides between rows.

Verification: a unit test that a preview renders both shots with their alt text in place of the project image; the e2e layout test reads the first image of each card.
