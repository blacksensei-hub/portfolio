---
project: attendx
headline: A class register that fills itself, and can't be signed from the hostel.
role: Solo. Design, web app, mobile app, and API.
period: May to Sep 2026
platforms:
  - Web app
  - iOS and Android (Expo)
  - REST and WebSocket API
metrics:
  - value: 5s
    label: How long each QR code lives
  - value: 100m
    label: Classroom zone a scan must come from
  - value: '1'
    label: Phone per student
  - value: '3'
    label: Roles, each with its own view
gallery:
  - image: ../../assets/case-studies/attendx/how-it-works.webp
    alt: AttendX landing page section titled Open, Scan, Done, with three cards showing a QR code, a phone scanning, and a register filling in.
    caption: The whole flow in three steps, on the public landing page.
    device: desktop
  - image: ../../assets/case-studies/attendx/take-the-register.webp
    alt: A dark panel inviting the visitor to press and hold to take the register, next to an empty grid of fifty seats.
    caption: A press-and-hold demo fills fifty seats the way a real session does.
    device: desktop
  - image: ../../assets/case-studies/attendx/hard-to-fake.webp
    alt: Section titled A friend can't sign in for you, with four figures, 5 seconds, 100 metres, 1 phone, and 3 accounts.
    caption: The anti-proxy rules, stated plainly for students and lecturers.
    device: desktop
  - image: ../../assets/case-studies/attendx/three-views.webp
    alt: Section titled One register. Three views, with cards for students, lecturers, and admins.
    caption: One register, seen three ways.
    device: desktop
  - image: ../../assets/case-studies/attendx/phone-hero.webp
    alt: AttendX landing page on a phone, with the headline Every seat, counted over a lit lecture hall.
    device: phone
  - image: ../../assets/case-studies/attendx/phone-open.webp
    alt: The Open step on a phone, showing a framed QR code.
    device: phone
  - image: ../../assets/case-studies/attendx/phone-demo.webp
    alt: The hold to take the register demo on a phone.
    device: phone
  - image: ../../assets/case-studies/attendx/phone-hard-to-fake.webp
    alt: The anti-proxy figures stacked on a phone screen.
    device: phone
---

## The problem

Taking attendance by hand wastes the start of every lecture. A sheet goes round a full lecture hall, friends sign for friends, and someone types it all up later. Reading names out is slower, and it still doesn't prove anyone was in the room.

I wanted the register to take seconds, and to make signing for someone else harder than just turning up.

## What I built

AttendX has three roles, and each one sees the same register differently.

- **Lecturers** open a session from the class page, or let a schedule open it for them. A QR code goes up on the projector and changes every five seconds. Names arrive on their screen live as students scan, and when the session closes, anyone who didn't scan is marked absent. The register exports as CSV or PDF.
- **Students** scan from their seat with the mobile app or any phone browser. They can see their attendance for every class, how many more sessions keep them above 75 percent, and they can appeal an absence they think is wrong.
- **Admins** see the whole campus: every class and session, the students slipping behind before the semester ends, accounts, phone resets, and an audit log of who did what.

## Making it hard to fake

The interesting part of attendance isn't recording it. It's making the record mean something. Every scan has to pass four checks:

1. **The code is fresh.** Each QR token is single use and expires five seconds after it appears, plus a two-second grace period. A photo sent to the group chat is out of date before anyone opens it.
2. **The phone is in the room.** The scan carries the phone's location, and the server measures its distance from the classroom. Coordinates that can't be real are rejected, and so is a mocked GPS location on Android.
3. **The phone belongs to the student.** Each student is bound to one phone. A new phone needs an admin to reset it.
4. **One phone, one person.** If the same phone marks several accounts in one session, the lecturer gets a proxy flag.

## Live, not refreshed

Arrivals stream to the lecturer's screen over WebSockets. Each session is its own room, the server checks that you own a session before you can join its room, and live attendance survives a dropped connection instead of silently freezing.

## The hard parts

- **Latency eating the five-second window.** A valid scan could arrive already expired if the database connection was cold. I started recording how far past expiry every rejected token was, which separated a genuinely late scan from one where the server itself was the slow part.
- **Serverless Postgres.** The database sits behind a connection pooler, which broke some queries until the driver was told it was talking to one.
- **Honest numbers.** An early dashboard showed an attendance trend drawn from placeholder data. I removed it and show an empty state until there is real data to plot.
- **Shipping a mobile app.** An iOS update broke the app's startup, which meant moving to the new scene lifecycle and updating Expo. A clean native rebuild also kept deleting a machine-specific build file, so the build now writes it every time.

## Stack

- **Web:** React, TanStack Query, Zustand, React Hook Form with Zod, Leaflet maps, Recharts.
- **Mobile:** Expo and React Native, Expo Router, the camera, location, secure storage, and push notifications.
- **API:** Node.js and Express, Sequelize on PostgreSQL, Socket.IO, scheduled jobs, and PDF and CSV exports.

## What I'd do next

- An automated test suite around the check-in path, which carries the most rules and the most risk.
- Letting a scan made in a hall with no signal queue on the phone and submit when it reconnects, still inside the time and place it was taken.
