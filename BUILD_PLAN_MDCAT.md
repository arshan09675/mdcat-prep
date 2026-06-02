# MDCAT PREP — Build Plan (PIVOT — supersedes payment + adds MDCAT features)

This product is an **MDCAT (Pakistan medical entry test) preparation platform**, paid-only,
with **manual Easypaisa/JazzCash payments**. This file overrides the payment section of
`BUILD_PLAN.md` and adds MDCAT-specific features. Auth/scaffold from step 1 stays as-is.

Run `schema_mdcat.sql` in Supabase SQL editor (after `schema.sql`) before building these.

## What this platform does
- **MCQ practice** by Subject → Topic (Biology, Chemistry, Physics, English, Logical Reasoning), with instant answer + explanation.
- **Timed mock tests** (full-length and subject/topic), real exam timer, **negative marking**, auto-grading, result with **subject-wise breakdown**.
- **Past papers** (tests tagged with `past_paper_year`).
- **Video lectures + notes** per topic (YouTube/Vimeo embed OR uploaded video, plus written/PDF notes).
- **Paid-only access** via subscription plans; **manual payment verification** (no Stripe).

## PAYMENT — Manual Easypaisa/JazzCash (replaces Stripe entirely)
Stripe does NOT work in Pakistan. Direct Easypaisa/JazzCash APIs need a merchant account + approval, so for a working launch use **manual verification**:

1. Student picks a **plan** (`/pricing`) → sees the site's Easypaisa/JazzCash number + amount.
2. Student pays from their wallet, then submits a form: method, amount, **sender number**, **transaction ID (TID)**, and a **screenshot upload** → row in `payment_submissions` (status `pending`), screenshot in private `payment-proofs` bucket.
3. Student sees "Payment under review."
4. **Admin panel** lists pending submissions with the screenshot → admin clicks **Approve** or **Reject**.
5. On **Approve** (server route, service-role client): create a `subscriptions` row with `status='active'`, `starts_at=now()`, `ends_at=now()+plan.duration_days`. Mark submission `approved`. (Optional email.)
6. Access is gated by `has_active_subscription()` — premium MCQs, tests, lectures unlock instantly.

> Do all subscription writes server-side with the service-role client. Never from the browser.
> Future upgrade: Safepay/PayFast for automated card+wallet payments — keep the plan/subscription model so it drops in later.

## Data model (already in schema_mdcat.sql)
subjects → topics → mcqs (central bank) · tests + test_questions · test_attempts + test_answers · lectures · plans · subscriptions · payment_submissions. RLS gates premium content by `has_active_subscription()`.

## Pages / routes (MDCAT)
- `/` — landing: subjects grid, "Start free MCQs", featured mock tests, pricing CTA.
- `/pricing` — plans + "Subscribe" → payment-submission form (Easypaisa/JazzCash number, TID, screenshot upload).
- `/subjects/[slug]` — topics list; per topic: practice MCQs + lectures/notes.
- `/practice/[topicId]` — MCQ practice: one-by-one or in a set, answer → instant correct/explanation (free MCQs open; rest need subscription).
- `/tests` — catalog of mock tests / past papers (filter by subject, year, free/paid).
- `/test/[id]` — **test runner**: countdown timer, question palette, navigation, submit (also auto-submit on timeout). Grade **on the server** (never expose `correct_index` to the client mid-test).
- `/result/[attemptId]` — score, net marks after negative marking, correct/wrong/skipped, **subject-wise breakdown**, per-question review with explanations.
- `/dashboard` — student: subscription status + expiry, recent attempts, performance trend, weak subjects.
- `/admin` — full control (below).

## Admin panel (`/admin`)
- **Payments**: pending `payment_submissions` with screenshot preview → Approve/Reject (Approve creates active subscription server-side).
- **MCQs**: add/edit/delete MCQs (subject, topic, options, correct, explanation, difficulty, past_paper_year, is_free). **Bulk import via CSV/paste** is high-value — add it.
- **Tests**: create a test (type, subject, duration, marks_per_correct, negative_marks, year), attach MCQs, publish.
- **Lectures/Notes**: add per topic (embed URL or upload video; notes text or PDF).
- **Plans**: create/edit subscription plans (price_pkr, duration_days, features).
- **Students & Analytics**: students list, active subscriptions, revenue (sum of approved payments), attempts, average scores.

## Test runner rules (important)
- Timer is authoritative on the **server**: store `started_at`; if `now() - started_at > duration`, force-submit. Don't trust client clock alone.
- Fetch test MCQs WITHOUT `correct_index`/`explanation` while taking; submit selected answers; **server grades** and writes `test_attempts` + `test_answers`, computes net score with negative marking and `subject_breakdown`.
- Allow review (with correct answers + explanations) only AFTER submission.

## Revised build order (MDCAT, on top of finished step 1)
1. ✅ Done — auth + scaffold.
2. Curriculum + practice: `/subjects`, `/subjects/[slug]`, `/practice/[topicId]` reading subjects/topics/mcqs; free vs locked. **Commit.**
3. Pricing + manual payment: `/pricing`, payment-submission form + screenshot upload to `payment-proofs`. **Commit.**
4. Admin: approve/reject payments → create active subscription (server route). **Commit.**
5. Test engine: `/tests`, `/test/[id]` runner with timer + server grading + negative marking; `/result/[attemptId]`. **Commit.**
6. Lectures/notes per topic + admin to add them. **Commit.**
7. Admin MCQ/test authoring + CSV bulk MCQ import + analytics. **Commit.**
8. Dashboard performance view + emails (optional). Deploy to Vercel.

Priority if time-tight: 2 → 5 → 3 → 4 (practice + tests + payments are the core demo). Lectures/analytics can follow.

## Tell Claude Code
- Use the **subjects/topics/mcqs/tests/...** tables from `schema_mdcat.sql` (NOT the generic courses tables for MDCAT content — those can stay unused or be removed).
- Replace all Stripe work with the **manual Easypaisa/JazzCash** flow above.
- Currency is **PKR**, display like "Rs 1,500".
- Grade tests server-side; never send correct answers to the client during a test.
- `git commit` after each step.
