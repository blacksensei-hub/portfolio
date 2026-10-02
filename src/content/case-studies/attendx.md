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
  - value: '6'
    label: Cheating patterns flagged for review
  - value: '3'
    label: Roles, each with its own view
gallery:
  - image: ../../assets/case-studies/attendx/app-live-register.webp
    alt: The lecturer live register for CSC 301 Week 13, with a large rotating QR code, counts of 34 present, 0 late, and 10 not yet, a seat grid, and a list of arrivals.
    caption: 'The live register: the QR on the left changes every five seconds while arrivals stream in on the right.'
    device: desktop
  - image: ../../assets/case-studies/attendx/app-admin-console.webp
    alt: The dark admin console greeting Demo, with 84.4 percent attendance this semester, one live session, 14 students at risk, 6 fraud flags to review, a weekly attendance chart, and the latest audit entries.
    caption: 'The admin console: where the semester stands, and what needs a decision next.'
    device: desktop
  - image: ../../assets/case-studies/attendx/app-fraud-review.webp
    alt: Fraud review queue with six open flags, from one phone used by three students and a location spoofing app, rated high, down to frequent phone resets, rated low.
    caption: Patterns worth a second look, queued for a person to decide. A flag never blocks anyone by itself.
    device: desktop
  - image: ../../assets/case-studies/attendx/app-projector.webp
    alt: Projector mode filling the screen with a QR code, the class name, and 34 of 44 scanned in, with a bar counting down to the next code.
    caption: Projector mode shows the code and a count, never names.
    device: desktop
  - image: ../../assets/case-studies/attendx/app-timetable.webp
    alt: A lecturer's week from 28 September to 2 October, with each timetabled class marked held with its scan count, or still to come.
    caption: The lecturer's week, with what actually happened at each slot.
    device: desktop
  - image: ../../assets/case-studies/attendx/app-class-page.webp
    alt: Class page for Software Engineering with 84.4 percent attendance, 23 sessions held, 10 students below the minimum, and a register showing each student's rate and last 12 sessions as coloured squares.
    caption: 'A class page: every student against the minimum, and their last twelve sessions at a glance.'
    device: desktop
  - image: ../../assets/case-studies/attendx/app-requests.webp
    alt: Lecturer requests page titled 7 to review, with tabs for 4 appeals and 3 excused absence requests, each appeal showing the student, session, and their reason.
    caption: Appeals and excused absences in one queue.
    device: desktop
  - image: ../../assets/case-studies/attendx/app-student-detail.webp
    alt: One student's record in CSC 301, at 60.9 percent with 14 of 23 sessions counted, a full register strip, a running rate chart against the 75 percent line, and an approved excused absence.
    caption: One student's whole record, including the absences that were excused.
    device: desktop
  - image: ../../assets/case-studies/attendx/app-analytics.webp
    alt: Admin analytics for the first semester, with the attendance rate, sessions held, late arrivals, students at risk, a weekly chart, attendance by department, and a day and hour grid.
    caption: Institution analytics, exportable as a PDF report.
    device: desktop
  - image: ../../assets/case-studies/attendx/app-audit-trail.webp
    alt: Audit trail table listing who did what and when, such as a weekly digest sent, a session force-closed, an announcement sent, a phone registration reset, and invites sent.
    caption: Every sensitive change, with who made it. Nothing here can be edited.
    device: desktop
  - image: ../../assets/case-studies/attendx/app-planner.webp
    alt: 'The student''s classes page, where a planner says that even attending all 6 remaining Computer Networks sessions would finish at 55.2 percent, under the 75 percent minimum.'
    caption: The student planner works from the sessions actually left, and says so when the minimum is out of reach.
    device: desktop
  - image: ../../assets/case-studies/attendx/app-phone-admin.webp
    alt: The admin console on a phone, with attendance, live sessions, students at risk, and fraud flags stacked in cards.
    device: phone
  - image: ../../assets/case-studies/attendx/app-phone-lecturer.webp
    alt: Lecturer dashboard on a phone, with the live session, projector and live view buttons, and attendance figures.
    device: phone
  - image: ../../assets/case-studies/attendx/app-phone-timetable.webp
    alt: A student's week on a phone, each class marked with whether they were present or absent, and what is still to come.
    device: phone
  - image: ../../assets/case-studies/attendx/app-phone-planner.webp
    alt: The student planner on a phone, with a rate bar against the minimum and what it would take to reach it.
    device: phone
---

## The problem

Taking attendance by hand wastes the start of every lecture. A sheet goes round a full lecture hall, friends sign for friends, and someone types it all up later. Reading names out is slower, and it still doesn't prove anyone was in the room.

I wanted the register to take seconds, and to make signing for someone else harder than just turning up.

## What I built

AttendX has three roles, and each one sees the same register differently.

- **Lecturers** open a session, or let the timetable open it for them. A QR code goes up on the projector and changes every five seconds, and names arrive on their screen as students scan. Each class has its own page with every student's rate against the minimum, and any student can be opened for their full record. Lecturers can share a class with co-lecturers and teaching assistants, who get only the powers their role needs, and they can export attendance as a grade.
- **Students** scan from their seat with the mobile app or any phone browser. A planner works out what each class still needs from the sessions left this semester. Their timetable shows how each class went, sends reminders, and can be subscribed to from their own calendar. They can ask for an absence to be excused, appeal one they think is wrong, and download an attendance statement.
- **Admins** get a separate console for the whole campus. It covers an audit trail of every sensitive change, bulk import of accounts from a spreadsheet with emailed invites, a fraud review queue, analytics with a PDF report, an academic calendar, announcements with read receipts, and policy settings. There is a command palette for getting around it and a live wall for a big screen.

## Making it hard to fake

The interesting part of attendance isn't recording it. It's making the record mean something. Every scan has to pass four checks:

1. **The code is fresh.** Each QR token is single use and expires five seconds after it appears, plus a two-second grace period. A photo sent to the group chat is out of date before anyone opens it.
2. **The phone is in the room.** The scan carries the phone's location, and the server measures its distance from the classroom. Coordinates that can't be real are rejected, and so is a mocked GPS location on Android.
3. **The phone belongs to the student.** Each student is bound to one phone. A new phone needs an admin to reset it.
4. **One phone, one person.** If the same phone marks several accounts in one session, the lecturer is told on the spot.

Checks on single scans only go so far, so the refused ones are kept too. Six patterns across them raise a flag for review: one phone used by several students, a location-spoofing app, repeated scans from outside the room, repeated sign-ins from the wrong phone, several students at the exact same GPS position, and too many phone resets. A flag never blocks anyone by itself. An admin looks at the evidence and decides, and that decision goes in the audit trail.

## Excused, not absent

Illness and funerals aren't truancy, so "excused" is its own status. It counts towards the minimum like being present, and only an approved request or a lecturer's adjustment can set it, never a scan. Before a lecturer approves a request they see exactly which records it will change. If the dates run into the future, sessions in that range are recorded as excused when they close.

## Live, not refreshed

Arrivals stream to the lecturer's screen over WebSockets. Each session is its own room, the server checks that you teach a class before you can join its room, and live attendance survives a dropped connection instead of silently freezing.

## The hard parts

- **A roster anyone could read.** Adding co-lecturers meant asking "who is allowed to see this class?" everywhere, and the answer turned up a hole: any signed-in user could read any class's roster, names and emails included. One access check now decides it for sessions, reports, appeals, schedules, and live updates alike.
- **Timetabled sessions took a shortcut.** Sessions opened by the timetable skipped the location check, could open twice for the same class, and were announced to every connected user instead of that class. All three are fixed, and holidays and exam weeks on the calendar now stop them opening at all.
- **Latency eating the five-second window.** A valid scan could arrive already expired if the database connection was cold. I started recording how far past expiry every rejected token was, which separated a genuinely late scan from one where the server itself was the slow part.
- **Honest numbers.** An early dashboard drew its trend from placeholder data, and the at-risk count counted a student once for every class they were slipping in. Both now count what they say.
- **Shipping a mobile app.** An iOS update broke the app's startup, which meant moving to the new scene lifecycle and updating Expo. A clean native rebuild also kept deleting a machine-specific build file, so the build now writes it every time.

## Stack

- **Web:** React, TanStack Query, Zustand, React Hook Form with Zod, Framer Motion and anime.js, a cmdk command palette, Leaflet maps, and Recharts.
- **Mobile:** Expo and React Native, Expo Router, the camera, location, secure storage, and push notifications.
- **API:** Node.js and Express, Sequelize on PostgreSQL, Socket.IO, scheduled jobs, PDF and CSV exports, calendar feeds, and emailed invites.

## What I'd do next

- An automated test suite around the check-in path and the permission rules, which carry the most risk.
- Letting a scan made in a hall with no signal queue on the phone and submit when it reconnects, still inside the time and place it was taken.
