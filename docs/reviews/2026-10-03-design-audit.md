# Design audit, 3 October 2026

An evidence-based "AI design slop" audit (removal first, no redesign), run against the live site after specs 0011 to 0021. Spec 0022 records what was acted on.

## Verdict

The content is honest and specific: real projects, real screens, plain copy. Six rounds of effects have stacked decoration on top of it. Eleven animations loop forever, glass and spinning glow rings sit on eight surfaces, and several blocks restate what is already on screen. The biggest gain comes from removing the perpetual decorative layers.

## Checked scope

- The home page at https://jeffrey-ankrah.pages.dev, at 1440×900 and 390×844 in dark mode, as a full page, with motion on and with reduced motion. An automated inventory of running animations and decorative classes.
- The source for the home sections, `BaseLayout`, and `global.css`. The case study header and write-up were checked more lightly.

## Findings

| Priority | Class | Pattern | Evidence | Harm | Remove or fix |
|---|---|---|---|---|---|
| P1 | Slop pattern | Motion theater: 11 perpetual animations | Hero: three aurora blobs (18s loops) and a blinking caret in the code card. Contact: two more aurora blobs, and a typewriter cycling "web app / mobile app / API / next idea" with its own caret. A 40s tech marquee. Two pinging status dots (hero pill and footer). Page-wide drifting glows (90s). | It competes with reading, and the hero never reaches a still frame: Lighthouse mobile Speed Index was 7.9 to 10.8 s. It also costs battery on phones. | Remove the aurora blobs, both carets, the typewriter (keep its final sentence) and the pings. Keep the Weave draw-in and the scroll reveals, which play once. |
| P2 | Slop pattern | Duplicate content: the code card restates the hero | The `developer.ts` card repeats the name, role, stack, "Ghana" and availability right beside the same text | Readers take in the same facts twice, and it imitates code rather than showing work. | Remove the card and let the hero lead with text. Optionally put a project window in its place, reusing `DevicePreview`. |
| P2 | Slop pattern | Availability said five times, three ways | The hero pill says "Available", the code card says `available: true`, About says "Status: Taking new work", Work with me repeats the pill with its note, and the footer says "Available for work" | The repetition reads as filler, and the wording is inconsistent. | Keep it in the hero and the footer, in one wording. Drop the About row and the code card line. |
| P2 | Slop pattern | Decorative stacking on containers | `glass`, `glow-border`, the pointer spotlight and a hover lift on the About facts, the four service cards and the Contact card. The Contact card also has an always-on ring and aurora. | Every container is equally loud, which flattens the hierarchy. | Remove the glow rings and the spotlight. Keep one plain raised surface where content is grouped. |
| P2 | Slop pattern | Hero metrics that count what is below | "2 projects shipped · 23 technologies · 4 services", animated with count-up | Small, countable numbers are made dramatic, and they restate lists further down the page. | Remove the row, or keep it static without the count-up. |
| P2 | Slop pattern | Mono micro-labels restating headings | Section hints ("Who I am", "Selected work", "How I can help", "Say hello") beside each heading, numbered badges 01 to 05, "★ Featured" on the first of two projects, and a shimmering role pill | They add ceremony without adding information. | Remove the hints and the Featured pill. The numbers are optional. |
| P2 | Quality defect | Email address clipped in Contact | Since the copy button arrived (PR #13), the email row read "jeffreyankrah2004@gma…" | The one detail people need to read was cut off. | **Fixed in spec 0022:** the email row now spans the full width. |
| P3 | Slop pattern | Tech marquee duplicates Skills | An auto-scrolling, `aria-hidden` ribbon of the same 23 items that Skills lists two sections later | It adds motion and duplication. | Remove it. |

## Unknowns

- How the site behaves on real low-end Android phones, and with screen readers beyond the automated axe checks.
- The light theme was reviewed through the source and tests in this pass, not by eye.

## Single largest improvement

Remove the perpetual decorative layers: the aurora blobs, the carets and typewriter, the pings and the marquee. That one change ends the motion theater, calms the hero, and should bring Speed Index down. Until the owner decides what goes, spec 0022 pauses every one of them while it is off screen.
