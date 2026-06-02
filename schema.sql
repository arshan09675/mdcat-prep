-- ============================================================
--  FULL LMS — Supabase Postgres schema + RLS
--  Run this in: Supabase Dashboard -> SQL Editor -> New query -> Run
--  Order matters; run the whole file at once.
-- ============================================================

-- ---------- Extensions ----------
create extension if not exists "uuid-ossp";

-- ---------- ENUMS ----------
create type user_role        as enum ('student','instructor','admin');
create type lesson_kind       as enum ('video_upload','video_embed','text');
create type enrollment_status as enum ('active','refunded','cancelled');
create type payment_status    as enum ('pending','paid','failed','refunded');
create type submission_status as enum ('submitted','graded');

-- ============================================================
--  PROFILES (1-1 with auth.users)
-- ============================================================
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text,
  avatar_url  text,
  role        user_role not null default 'student',
  created_at  timestamptz not null default now()
);

-- Auto-create a profile when a new auth user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email,'@',1)), 'student');
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Helper: current user's role (SECURITY DEFINER avoids RLS recursion on profiles)
create or replace function public.current_role()
returns user_role language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_staff()
returns boolean language sql stable as $$
  select public.current_role() in ('instructor','admin');
$$;

create or replace function public.is_admin()
returns boolean language sql stable as $$
  select public.current_role() = 'admin';
$$;

-- ============================================================
--  COURSES / MODULES / LESSONS
-- ============================================================
create table courses (
  id            uuid primary key default uuid_generate_v4(),
  title         text not null,
  slug          text unique not null,
  description   text,
  cover_url     text,
  instructor_id uuid not null references profiles(id) on delete cascade,
  is_free       boolean not null default false,
  price_cents   integer not null default 0,     -- e.g. 4999 = $49.99
  currency      text not null default 'usd',
  published     boolean not null default false,
  created_at    timestamptz not null default now()
);

create table modules (
  id         uuid primary key default uuid_generate_v4(),
  course_id  uuid not null references courses(id) on delete cascade,
  title      text not null,
  position   integer not null default 0
);

create table lessons (
  id               uuid primary key default uuid_generate_v4(),
  module_id        uuid not null references modules(id) on delete cascade,
  title            text not null,
  position         integer not null default 0,
  content_type     lesson_kind not null default 'text',
  body             text,                 -- rich text / markdown for text lessons
  video_url        text,                 -- YouTube/Vimeo embed url
  video_path       text,                 -- Supabase Storage path (private bucket)
  duration_seconds integer,
  is_preview       boolean not null default false  -- free preview before enroll
);

-- ============================================================
--  ENROLLMENTS + PAYMENTS (Stripe)
-- ============================================================
create table payments (
  id                  uuid primary key default uuid_generate_v4(),
  user_id             uuid not null references profiles(id) on delete cascade,
  course_id           uuid not null references courses(id) on delete cascade,
  stripe_session_id   text,
  stripe_payment_intent text,
  amount_cents        integer not null,
  currency            text not null default 'usd',
  status              payment_status not null default 'pending',
  created_at          timestamptz not null default now()
);

create table enrollments (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references profiles(id) on delete cascade,
  course_id  uuid not null references courses(id) on delete cascade,
  status     enrollment_status not null default 'active',
  created_at timestamptz not null default now(),
  unique (user_id, course_id)
);

-- ============================================================
--  PROGRESS
-- ============================================================
create table lesson_progress (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references profiles(id) on delete cascade,
  lesson_id    uuid not null references lessons(id) on delete cascade,
  completed    boolean not null default true,
  completed_at timestamptz not null default now(),
  unique (user_id, lesson_id)
);

-- ============================================================
--  QUIZZES
-- ============================================================
create table quizzes (
  id            uuid primary key default uuid_generate_v4(),
  lesson_id     uuid not null references lessons(id) on delete cascade,
  title         text not null,
  passing_score integer not null default 70   -- percent
);

create table questions (
  id            uuid primary key default uuid_generate_v4(),
  quiz_id       uuid not null references quizzes(id) on delete cascade,
  text          text not null,
  options       jsonb not null,               -- ["A","B","C","D"]
  correct_index integer not null,
  position      integer not null default 0
);

create table quiz_attempts (
  id        uuid primary key default uuid_generate_v4(),
  user_id   uuid not null references profiles(id) on delete cascade,
  quiz_id   uuid not null references quizzes(id) on delete cascade,
  score     integer not null,                 -- percent
  passed    boolean not null default false,
  answers   jsonb,
  taken_at  timestamptz not null default now()
);

-- ============================================================
--  ASSIGNMENTS (file upload + grading)
-- ============================================================
create table assignments (
  id           uuid primary key default uuid_generate_v4(),
  lesson_id    uuid not null references lessons(id) on delete cascade,
  title        text not null,
  instructions text,
  max_points   integer not null default 100,
  due_at       timestamptz
);

create table assignment_submissions (
  id            uuid primary key default uuid_generate_v4(),
  assignment_id uuid not null references assignments(id) on delete cascade,
  user_id       uuid not null references profiles(id) on delete cascade,
  file_path     text,                          -- Storage path (private bucket)
  text          text,
  status        submission_status not null default 'submitted',
  grade         integer,
  feedback      text,
  submitted_at  timestamptz not null default now(),
  graded_at     timestamptz,
  unique (assignment_id, user_id)
);

-- ============================================================
--  CERTIFICATES
-- ============================================================
create table certificates (
  id        uuid primary key default uuid_generate_v4(),
  user_id   uuid not null references profiles(id) on delete cascade,
  course_id uuid not null references courses(id) on delete cascade,
  serial    text unique not null default ('CERT-' || upper(substr(uuid_generate_v4()::text,1,8))),
  issued_at timestamptz not null default now(),
  unique (user_id, course_id)
);

-- ============================================================
--  DISCUSSIONS (comments per lesson, threaded)
-- ============================================================
create table comments (
  id         uuid primary key default uuid_generate_v4(),
  lesson_id  uuid not null references lessons(id) on delete cascade,
  user_id    uuid not null references profiles(id) on delete cascade,
  parent_id  uuid references comments(id) on delete cascade,
  body       text not null,
  created_at timestamptz not null default now()
);

-- ============================================================
--  LIVE SESSIONS (Zoom/Meet links)
-- ============================================================
create table live_sessions (
  id           uuid primary key default uuid_generate_v4(),
  course_id    uuid not null references courses(id) on delete cascade,
  title        text not null,
  meeting_url  text not null,
  scheduled_at timestamptz not null,
  created_at   timestamptz not null default now()
);

-- ============================================================
--  Helper: is the current user enrolled in a course?
-- ============================================================
create or replace function public.is_enrolled(c uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(
    select 1 from public.enrollments
    where user_id = auth.uid() and course_id = c and status = 'active'
  );
$$;

-- ============================================================
--  ENABLE RLS ON EVERYTHING
-- ============================================================
alter table profiles               enable row level security;
alter table courses                enable row level security;
alter table modules                enable row level security;
alter table lessons                enable row level security;
alter table payments               enable row level security;
alter table enrollments            enable row level security;
alter table lesson_progress        enable row level security;
alter table quizzes                enable row level security;
alter table questions              enable row level security;
alter table quiz_attempts          enable row level security;
alter table assignments            enable row level security;
alter table assignment_submissions enable row level security;
alter table certificates           enable row level security;
alter table comments               enable row level security;
alter table live_sessions          enable row level security;

-- ============================================================
--  POLICIES
-- ============================================================

-- PROFILES: anyone can read basic profile; you can update your own; admin all
create policy "profiles read"   on profiles for select using (true);
create policy "profiles update" on profiles for update using (id = auth.uid() or is_admin());
create policy "profiles admin"  on profiles for all   using (is_admin()) with check (is_admin());

-- COURSES: published visible to all; staff manage their own; admin all
create policy "courses read published" on courses for select
  using (published = true or instructor_id = auth.uid() or is_admin());
create policy "courses staff insert" on courses for insert
  with check (is_staff() and (instructor_id = auth.uid() or is_admin()));
create policy "courses staff update" on courses for update
  using (instructor_id = auth.uid() or is_admin());
create policy "courses staff delete" on courses for delete
  using (instructor_id = auth.uid() or is_admin());

-- MODULES / LESSONS: readable if course readable; writable by course owner/admin
create policy "modules read" on modules for select using (
  exists(select 1 from courses c where c.id = course_id
         and (c.published or c.instructor_id = auth.uid() or is_admin())));
create policy "modules write" on modules for all using (
  exists(select 1 from courses c where c.id = course_id
         and (c.instructor_id = auth.uid() or is_admin())))
  with check (
  exists(select 1 from courses c where c.id = course_id
         and (c.instructor_id = auth.uid() or is_admin())));

create policy "lessons read" on lessons for select using (
  exists(select 1 from modules m join courses c on c.id = m.course_id
         where m.id = module_id
         and (c.published or c.instructor_id = auth.uid() or is_admin())));
create policy "lessons write" on lessons for all using (
  exists(select 1 from modules m join courses c on c.id = m.course_id
         where m.id = module_id and (c.instructor_id = auth.uid() or is_admin())))
  with check (
  exists(select 1 from modules m join courses c on c.id = m.course_id
         where m.id = module_id and (c.instructor_id = auth.uid() or is_admin())));

-- PAYMENTS: user sees own; admin all. (Inserts happen server-side via service_role,
-- which bypasses RLS — never insert payments from the browser.)
create policy "payments read" on payments for select using (user_id = auth.uid() or is_admin());

-- ENROLLMENTS: user sees own; staff see enrollments in their courses; admin all.
-- (Created server-side after Stripe webhook confirms payment.)
create policy "enrollments read" on enrollments for select using (
  user_id = auth.uid() or is_admin()
  or exists(select 1 from courses c where c.id = course_id and c.instructor_id = auth.uid()));

-- LESSON PROGRESS: user manages own
create policy "progress read"  on lesson_progress for select using (user_id = auth.uid() or is_staff());
create policy "progress write" on lesson_progress for all   using (user_id = auth.uid()) with check (user_id = auth.uid());

-- QUIZZES / QUESTIONS: readable to enrolled users + staff; questions hide correct_index in app layer
create policy "quizzes read" on quizzes for select using (
  exists(select 1 from lessons l join modules m on m.id=l.module_id
         where l.id = lesson_id and (is_enrolled(m.course_id) or is_staff())));
create policy "quizzes write" on quizzes for all using (is_staff()) with check (is_staff());

create policy "questions read" on questions for select using (
  exists(select 1 from quizzes q join lessons l on l.id=q.lesson_id join modules m on m.id=l.module_id
         where q.id = quiz_id and (is_enrolled(m.course_id) or is_staff())));
create policy "questions write" on questions for all using (is_staff()) with check (is_staff());

-- QUIZ ATTEMPTS: user manages own; staff read
create policy "attempts read"  on quiz_attempts for select using (user_id = auth.uid() or is_staff());
create policy "attempts write" on quiz_attempts for insert with check (user_id = auth.uid());

-- ASSIGNMENTS: readable to enrolled + staff; staff write
create policy "assignments read" on assignments for select using (
  exists(select 1 from lessons l join modules m on m.id=l.module_id
         where l.id = lesson_id and (is_enrolled(m.course_id) or is_staff())));
create policy "assignments write" on assignments for all using (is_staff()) with check (is_staff());

-- SUBMISSIONS: student manages own; staff read + grade (update)
create policy "subs read"   on assignment_submissions for select using (user_id = auth.uid() or is_staff());
create policy "subs insert" on assignment_submissions for insert with check (user_id = auth.uid());
create policy "subs update" on assignment_submissions for update using (user_id = auth.uid() or is_staff());

-- CERTIFICATES: user sees own; staff/admin see all. Issued server-side.
create policy "certs read" on certificates for select using (user_id = auth.uid() or is_staff());

-- COMMENTS: readable to enrolled + staff; create your own; edit/delete own or admin
create policy "comments read" on comments for select using (
  exists(select 1 from lessons l join modules m on m.id=l.module_id
         where l.id = lesson_id and (is_enrolled(m.course_id) or is_staff())));
create policy "comments insert" on comments for insert with check (user_id = auth.uid());
create policy "comments update" on comments for update using (user_id = auth.uid() or is_admin());
create policy "comments delete" on comments for delete using (user_id = auth.uid() or is_admin());

-- LIVE SESSIONS: readable to enrolled + staff; staff write
create policy "live read" on live_sessions for select using (is_enrolled(course_id) or is_staff());
create policy "live write" on live_sessions for all using (is_staff()) with check (is_staff());

-- ============================================================
--  STORAGE BUCKETS  (create these in Storage UI, or run below)
-- ============================================================
-- course-covers   : PUBLIC  (cover images)
-- course-videos    : PRIVATE (uploaded lesson videos -> serve via signed URLs)
-- assignments      : PRIVATE (student submissions)
insert into storage.buckets (id, name, public)
values ('course-covers','course-covers', true),
       ('course-videos','course-videos', false),
       ('assignments','assignments', false)
on conflict (id) do nothing;

-- Storage policies: covers readable by all, writable by staff
create policy "covers public read" on storage.objects for select
  using (bucket_id = 'course-covers');
create policy "covers staff write" on storage.objects for insert
  with check (bucket_id = 'course-covers' and public.is_staff());

-- Videos: only enrolled/staff can read (app generates signed URLs with service role anyway)
create policy "videos staff write" on storage.objects for insert
  with check (bucket_id = 'course-videos' and public.is_staff());

-- Assignment files: owner uploads, owner+staff read
create policy "assign owner write" on storage.objects for insert
  with check (bucket_id = 'assignments' and owner = auth.uid());
create policy "assign read" on storage.objects for select
  using (bucket_id = 'assignments' and (owner = auth.uid() or public.is_staff()));

-- ============================================================
--  Make yourself ADMIN after you sign up the first time:
--  update profiles set role='admin' where id =
--    (select id from auth.users where email = 'YOUR_EMAIL_HERE');
-- ============================================================
