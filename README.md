# ExamDesk · Online Examination System

Working prototype based on `Online_Examination_System_SE_Lab.pptx`.

## Run

Requires Node.js 22.12+ (or 20.19+).

**Windows:** double-click `START_EXAMDESK.cmd` to start the app and open it in your browser. Keep the terminal window open. Press Ctrl+C in it to stop the server.

```powershell
cd D:\PROJECTS\SE\online-examination
npm.cmd install
npm.cmd run dev
```

Open the printed local address, usually **http://127.0.0.1:5173**.

```powershell
npm.cmd test
npm.cmd run build
npm.cmd run preview
```

The production build is in `dist/` and can be served by a static web server.

## Demonstrate the workflow

The app opens as demo student Garvit Jain (E225). Click the avatar/account panel to switch to Faculty or Administrator. Demo accounts do not require passwords.

1. **Faculty:** Add or edit questions in Question bank. Create an examination, select questions, set its opening/closing times, duration, marks, penalty, pass percentage, allowed attempts, and assigned students. Enable Publish examination and save.
2. **Student:** Start a live examination and read its instructions. Answer questions, mark them for review, and navigate. Refresh or Save & leave, then resume: saved answers and the original deadline remain. Submit to see the scorecard, grading, correct answers, and explanations.
3. **Faculty/Admin:** Review submissions and export CSV. Open a scorecard and choose Print / Save PDF.
4. **Administrator:** Add/edit subjects, enable/disable users, promote registered accounts, and inspect the activity log.
5. **Registration:** Sign out using the account menu. Register with a unique email and roll number, then sign in with that password. New students see examinations assigned to all students. Demo account roles are fixed.

For a quick timeout demo, create a one-minute examination as Faculty, then begin it as Student and let the timer expire. Start/end boundaries and attempt limits apply. Exams stay drafts until explicitly published.

## Features

- Responsive role-based dashboards, schedules, and in-app notifications
- Student registration, local password sign-in using salted PBKDF2 hashes, and a five-failure/15-minute browser-session limit
- Question CRUD, subjects, difficulty, options, answer keys, explanations, and filters
- Exam creation/editing, publication, scheduling, assignment, and configurable scoring/attempt rules
- Randomized question order, countdown, autosave, resumption, review flags, and manual/automatic submission
- One result per attempt, score floor at zero, percentage, grade, pass/fail, and answer review
- Scorecard printing/PDF, CSV reports, profiles, user management, and activity logs

## Prototype boundaries

All records are saved in **localStorage in the current browser and origin**. This is a classroom prototype, not a secure production examination service. Demo roles are intentionally accessible. Correct answers are in the client bundle. Role checks, schedules, login limits, and deadlines are browser-controlled and can be modified by a user. No emails are sent. Cross-tab data synchronizes, but simultaneous writes are not database transactions. Do not store real credentials or sensitive student records.

The deck's production requirements (hidden papers, trusted server timers, secure authentication/authorization, atomic submissions, IP audit records, MySQL persistence, backups, 2,000 concurrent students, and availability/latency guarantees) require a backend, transactional database, server-side evaluation, infrastructure, and load/security testing. This frontend does not claim those guarantees.

Google Fonts are optional; system fonts work offline. No external services are required for the core workflow.

## Verification

18 tests cover the deck's scoring and eligibility rules plus React interaction flows for student attempts, refresh/resume, submission, faculty question/exam creation, early-access prevention, automatic submission, student registration/sign-in, and administrator subject/account management.

The production build and local HTTP response were checked. Visual browser inspection was unavailable because this session had no connected browser.
