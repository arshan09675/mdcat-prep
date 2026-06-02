# LMS — Master Build Plan (for Claude Code)

A real, multi-user, production-style Learning Management System. **No demo / no fake data flows** — every feature hits the real database, real auth, real payments, real file storage.

## Stack (fixed — do not substitute)
- **Next.js 14** App Router + **TypeScript**
- **Supabase**: Auth (email/password) + Postgres + Storage
- **@supabase/ssr** for cookie-based server sessions (NOT the deprecated `auth-helpers`)
- **Stripe** Checkout + webhooks for paid courses
- **Tailwind CSS** + **shadcn/ui**
- **Resend** (or Supabase SMTP) for transactional email
- PDF certificates via **@react-pdf/renderer** (server route)

## Environment variables (`.env.local`)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # server only — never expose to browser
NEXT_PUBLIC_SITE_URL=http://localhost:3000
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
RESEND_API_KEY=
```

## Database
Schema + RLS already written — run `schema.sql` in the Supabase SQL editor first.
After your first signup, promote yourself to admin (see bottom of schema.sql).

## Roles
`student` (default) · `instructor` (create/manage own courses) · `admin` (full control).

## Pages / routes
- `/login`, `/register` — Supabase email+password
- `/` — course catalog: published courses, search, price/Free badge, "Enroll"/"Buy"
- `/courses/[slug]` — landing: description, curriculum, **preview lessons** (`is_preview`), buy/enroll CTA
- `/learn/[slug]` — the player (enrolled only): sidebar of modules→lessons, video (uploaded via signed URL OR YouTube/Vimeo embed), text lessons, **Mark complete**, progress bar, inline **quiz** (auto-graded), **assignment** upload, **discussion** thread per lesson
- `/dashboard` — student: enrolled courses + % progress, certificates, grades
- `/admin` — full control panel (see below)
- `/certificate/[courseId]` — view + **download PDF** (only if 100% complete)

## Admin panel (`/admin`) — full control
Tabs: **Courses** (create/edit/delete, upload cover to `course-covers`, set price/free, publish toggle), **Curriculum** (drag-order modules + lessons; per lesson choose video upload → `course-videos` OR embed URL OR text), **Quizzes** (questions + correct answer + passing score), **Assignments** (create + **grade submissions** with feedback), **Live sessions** (add Zoom/Meet link + time), **Students** (list, enrollments, progress), **Analytics** (total students, revenue from `payments`, enrollments over time, completion rate). Instructors see only their own courses; admin sees everything.

## Payments flow (Stripe — must be real)
1. Buy button → `POST /api/checkout` (server) creates a Stripe Checkout Session with `course_id` + `user_id` in metadata; insert a `payments` row (`pending`).
2. Redirect to Stripe Checkout.
3. **Webhook** `POST /api/stripe/webhook` on `checkout.session.completed`: verify signature, mark `payments.status='paid'`, **insert `enrollments` row using the SERVICE ROLE client** (bypasses RLS), send enrollment email.
4. Free courses skip Stripe → enroll directly server-side.
> Never create enrollments from the browser. Only the webhook / server route does it.

## Video handling (both required)
- **Upload**: staff upload to private `course-videos` bucket → store `video_path`; player requests a **signed URL** from a server route (checks enrollment) → `<video>`.
- **Embed**: staff paste YouTube/Vimeo URL → store `video_url` → render iframe.
- Lesson `content_type` decides which renderer to use.

## Certificates
When a student's completed lessons == total lessons in a course → server inserts a `certificates` row (idempotent) → `/certificate/[courseId]` renders a branded PDF (name, course, serial, date) for download.

## Email (Resend)
Send on: signup welcome, successful enrollment, assignment graded. Keep templates simple; send from a server route/webhook only.

## Security checklist (do NOT skip)
- RLS enabled on every table (schema does this) — verify queries return data; empty arrays usually mean a missing policy.
- `SUPABASE_SERVICE_ROLE_KEY` and `STRIPE_SECRET_KEY` used **only** in server code / route handlers.
- Verify Stripe webhook signature with `STRIPE_WEBHOOK_SECRET`.
- Quiz `correct_index` must never be sent to the student client — grade on the server route, return only score/passed.
- Signed video URLs short-lived (e.g. 1 hour) and gated by enrollment check.

## Build order (so a working core lands first)
1. Scaffold + Supabase auth (`@supabase/ssr`), `/login` `/register`, role-aware middleware. **Commit.**
2. Catalog `/` + course landing `/courses/[slug]` reading real data. **Commit.**
3. Stripe checkout + webhook + enrollment + free-enroll. Test with a real test-card. **Commit.**
4. Learn player `/learn/[slug]`: video (upload signed URL + embed), text, mark-complete, progress. **Commit.**
5. Quizzes (server grading) + assignments (upload + grade). **Commit.**
6. Admin panel CRUD + cover upload + analytics. **Commit.**
7. Certificates PDF + emails. **Commit.**
8. Deploy: push to GitHub → Vercel → add all env vars → set Stripe webhook to the live URL.

## Workflow rules for Claude Code
- `git commit` after each numbered step so we can roll back.
- Stripe test mode + card `4242 4242 4242 4242` for testing payments.
- If a Supabase query returns empty, suspect RLS first.
- Paste exact error text back when something breaks.
