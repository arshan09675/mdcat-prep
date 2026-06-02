-- ============================================================
--  MDCAT PREP — additive schema (run AFTER schema.sql)
--  Pakistan: MCQ bank + timed mock tests + lectures/notes +
--  subscription plans + MANUAL Easypaisa/JazzCash payments.
--  Reuses helpers from schema.sql: is_staff(), is_admin(), current_role()
--  Run whole file at once in Supabase SQL Editor.
-- ============================================================

-- ---------- ENUMS ----------
create type test_type      as enum ('mock','topic','past_paper','practice');
create type attempt_status as enum ('in_progress','completed');
create type sub_status     as enum ('pending','active','expired','rejected');
create type pay_method      as enum ('easypaisa','jazzcash','bank');
create type pay_status      as enum ('pending','approved','rejected');
create type difficulty      as enum ('easy','medium','hard');

-- ============================================================
--  CURRICULUM: SUBJECTS -> TOPICS
-- ============================================================
create table subjects (
  id        uuid primary key default uuid_generate_v4(),
  name      text not null,            -- Biology, Chemistry, Physics, English, Logical Reasoning
  slug      text unique not null,
  icon      text,
  position  integer not null default 0
);

create table topics (
  id          uuid primary key default uuid_generate_v4(),
  subject_id  uuid not null references subjects(id) on delete cascade,
  name        text not null,          -- chapter name
  position    integer not null default 0
);

-- ============================================================
--  MCQ BANK  (central — used by practice + tests + past papers)
-- ============================================================
create table mcqs (
  id              uuid primary key default uuid_generate_v4(),
  subject_id      uuid not null references subjects(id) on delete cascade,
  topic_id        uuid references topics(id) on delete set null,
  text            text not null,
  options         jsonb not null,           -- ["opt A","opt B","opt C","opt D"]
  correct_index   integer not null,         -- 0-based
  explanation     text,                      -- shown after answering
  difficulty      difficulty not null default 'medium',
  past_paper_year integer,                    -- e.g. 2023 if from a past paper
  is_free         boolean not null default false,  -- free sample MCQ?
  created_by      uuid references profiles(id) on delete set null,
  created_at      timestamptz not null default now()
);
create index mcqs_subject_idx on mcqs(subject_id);
create index mcqs_topic_idx   on mcqs(topic_id);

-- ============================================================
--  TESTS  (mock / topic / past paper / practice) + their MCQs
-- ============================================================
create table tests (
  id               uuid primary key default uuid_generate_v4(),
  title            text not null,
  type             test_type not null default 'mock',
  subject_id       uuid references subjects(id) on delete set null,  -- null = full/mixed
  topic_id         uuid references topics(id) on delete set null,
  total_questions  integer not null default 0,
  duration_minutes integer not null default 210,   -- e.g. full MDCAT ~3.5h
  marks_per_correct numeric not null default 1,
  negative_marks    numeric not null default 0,     -- e.g. 0.25 for -ve marking
  past_paper_year   integer,
  is_free           boolean not null default false,
  published         boolean not null default false,
  created_at        timestamptz not null default now()
);

-- fixed set of questions in a test (so every student gets the same paper)
create table test_questions (
  id        uuid primary key default uuid_generate_v4(),
  test_id   uuid not null references tests(id) on delete cascade,
  mcq_id    uuid not null references mcqs(id) on delete cascade,
  position  integer not null default 0,
  unique (test_id, mcq_id)
);

-- ============================================================
--  ATTEMPTS + per-question answers
-- ============================================================
create table test_attempts (
  id                uuid primary key default uuid_generate_v4(),
  user_id           uuid not null references profiles(id) on delete cascade,
  test_id           uuid not null references tests(id) on delete cascade,
  status            attempt_status not null default 'in_progress',
  started_at        timestamptz not null default now(),
  submitted_at      timestamptz,
  score             numeric,          -- net marks after negative marking
  total_marks       numeric,
  correct_count     integer default 0,
  wrong_count       integer default 0,
  skipped_count     integer default 0,
  subject_breakdown jsonb             -- {"Biology":{"correct":18,"total":20}, ...}
);
create index attempts_user_idx on test_attempts(user_id);

create table test_answers (
  id             uuid primary key default uuid_generate_v4(),
  attempt_id     uuid not null references test_attempts(id) on delete cascade,
  mcq_id         uuid not null references mcqs(id) on delete cascade,
  selected_index integer,            -- null = skipped
  is_correct     boolean,
  unique (attempt_id, mcq_id)
);

-- ============================================================
--  LECTURES + NOTES  (video upload OR embed + written notes)
-- ============================================================
create table lectures (
  id          uuid primary key default uuid_generate_v4(),
  subject_id  uuid not null references subjects(id) on delete cascade,
  topic_id    uuid references topics(id) on delete set null,
  title       text not null,
  video_url   text,        -- YouTube/Vimeo embed
  video_path  text,        -- Supabase Storage (private) for uploads
  notes_body  text,        -- markdown/rich notes
  notes_path  text,        -- uploaded PDF notes (private bucket)
  position    integer not null default 0,
  is_free     boolean not null default false
);
create index lectures_subject_idx on lectures(subject_id);

-- ============================================================
--  SUBSCRIPTION PLANS (paid-only) + SUBSCRIPTIONS
-- ============================================================
create table plans (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,             -- "1 Month Premium", "Full MDCAT Bundle"
  description   text,
  price_pkr     integer not null,           -- in rupees, e.g. 1500
  duration_days integer not null,           -- access length, e.g. 30, 180
  features      jsonb,                       -- ["All mock tests","Video lectures",...]
  active        boolean not null default true,
  position      integer not null default 0
);

create table subscriptions (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references profiles(id) on delete cascade,
  plan_id    uuid not null references plans(id) on delete restrict,
  status     sub_status not null default 'pending',
  starts_at  timestamptz,
  ends_at    timestamptz,
  created_at timestamptz not null default now()
);
create index subs_user_idx on subscriptions(user_id);

-- ============================================================
--  MANUAL PAYMENTS (Easypaisa / JazzCash / bank)
--  Student submits proof -> admin approves -> server creates
--  an ACTIVE subscription. NO automatic gateway needed.
-- ============================================================
create table payment_submissions (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid not null references profiles(id) on delete cascade,
  plan_id        uuid not null references plans(id) on delete restrict,
  method         pay_method not null,
  amount_pkr     integer not null,
  sender_number  text,                  -- the number student paid FROM
  transaction_id text,                   -- TID from Easypaisa/JazzCash SMS
  screenshot_path text,                  -- uploaded proof (private bucket)
  status         pay_status not null default 'pending',
  reviewed_by    uuid references profiles(id) on delete set null,
  reviewed_at    timestamptz,
  admin_note     text,
  created_at     timestamptz not null default now()
);
create index pay_status_idx on payment_submissions(status);

-- ============================================================
--  Helper: does current user have an ACTIVE (unexpired) subscription?
-- ============================================================
create or replace function public.has_active_subscription()
returns boolean language sql stable security definer set search_path = public as $$
  select exists(
    select 1 from public.subscriptions
    where user_id = auth.uid()
      and status = 'active'
      and (ends_at is null or ends_at > now())
  );
$$;

-- ============================================================
--  RLS
-- ============================================================
alter table subjects            enable row level security;
alter table topics              enable row level security;
alter table mcqs                enable row level security;
alter table tests               enable row level security;
alter table test_questions      enable row level security;
alter table test_attempts       enable row level security;
alter table test_answers        enable row level security;
alter table lectures            enable row level security;
alter table plans               enable row level security;
alter table subscriptions       enable row level security;
alter table payment_submissions enable row level security;

-- Curriculum: everyone can browse subjects/topics
create policy "subjects read" on subjects for select using (true);
create policy "subjects write" on subjects for all using (is_staff()) with check (is_staff());
create policy "topics read" on topics for select using (true);
create policy "topics write" on topics for all using (is_staff()) with check (is_staff());

-- MCQs: free ones public; rest need active subscription or staff.
-- NOTE: correct_index/explanation must be stripped on the SERVER before sending
-- to a student who is actively taking a test (grade server-side).
create policy "mcqs read" on mcqs for select
  using (is_free or has_active_subscription() or is_staff());
create policy "mcqs write" on mcqs for all using (is_staff()) with check (is_staff());

-- Tests: published metadata visible to all (so they show in catalog);
-- free tests fully usable; paid tests gated at attempt creation below.
create policy "tests read" on tests for select
  using (published or is_staff());
create policy "tests write" on tests for all using (is_staff()) with check (is_staff());

create policy "test_questions read" on test_questions for select using (
  exists(select 1 from tests t where t.id = test_id
         and (t.is_free or has_active_subscription() or is_staff())));
create policy "test_questions write" on test_questions for all using (is_staff()) with check (is_staff());

-- Attempts: user owns; can only START an attempt on a free test OR with subscription
create policy "attempts read" on test_attempts for select using (user_id = auth.uid() or is_staff());
create policy "attempts insert" on test_attempts for insert with check (
  user_id = auth.uid() and exists(
    select 1 from tests t where t.id = test_id
    and (t.is_free or has_active_subscription())));
create policy "attempts update" on test_attempts for update using (user_id = auth.uid());

create policy "answers read" on test_answers for select using (
  exists(select 1 from test_attempts a where a.id = attempt_id and (a.user_id = auth.uid() or is_staff())));
create policy "answers write" on test_answers for all using (
  exists(select 1 from test_attempts a where a.id = attempt_id and a.user_id = auth.uid()))
  with check (
  exists(select 1 from test_attempts a where a.id = attempt_id and a.user_id = auth.uid()));

-- Lectures: free ones public; rest need subscription/staff
create policy "lectures read" on lectures for select
  using (is_free or has_active_subscription() or is_staff());
create policy "lectures write" on lectures for all using (is_staff()) with check (is_staff());

-- Plans: everyone can see pricing
create policy "plans read" on plans for select using (true);
create policy "plans write" on plans for all using (is_admin()) with check (is_admin());

-- Subscriptions: user sees own; staff all. Created/updated server-side (service role).
create policy "subs read" on subscriptions for select using (user_id = auth.uid() or is_staff());

-- Payment submissions: student creates + reads own; staff read + approve/reject (update)
create policy "pay read"   on payment_submissions for select using (user_id = auth.uid() or is_staff());
create policy "pay insert" on payment_submissions for insert with check (user_id = auth.uid());
create policy "pay update" on payment_submissions for update using (is_staff()) with check (is_staff());

-- ============================================================
--  STORAGE: private bucket for payment screenshots + notes/videos
-- ============================================================
insert into storage.buckets (id, name, public) values
  ('payment-proofs','payment-proofs', false),
  ('lecture-videos','lecture-videos', false),
  ('notes','notes', false)
on conflict (id) do nothing;

create policy "proof owner write" on storage.objects for insert
  with check (bucket_id = 'payment-proofs' and owner = auth.uid());
create policy "proof read" on storage.objects for select
  using (bucket_id = 'payment-proofs' and (owner = auth.uid() or public.is_staff()));

create policy "lecvid staff write" on storage.objects for insert
  with check (bucket_id = 'lecture-videos' and public.is_staff());
create policy "notes staff write" on storage.objects for insert
  with check (bucket_id = 'notes' and public.is_staff());
create policy "notes read" on storage.objects for select
  using (bucket_id = 'notes' and (public.is_staff() or public.has_active_subscription()));

-- ============================================================
--  SEED: the 5 MDCAT subjects (edit names if your syllabus differs)
-- ============================================================
insert into subjects (name, slug, position) values
  ('Biology','biology',1),
  ('Chemistry','chemistry',2),
  ('Physics','physics',3),
  ('English','english',4),
  ('Logical Reasoning','logical-reasoning',5)
on conflict (slug) do nothing;
