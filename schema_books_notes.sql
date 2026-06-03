-- ============================================================
--  BOOKS + NOTES LIBRARY  (safe to run anytime — idempotent)
--  Subject-wise downloadable books & standalone notes (PDF),
--  subscription-gated. Run after schema_mdcat.sql.
-- ============================================================

-- Table (won't error if it already exists)
create table if not exists books (
  id          uuid primary key default uuid_generate_v4(),
  title       text not null,
  description text,
  subject_id  uuid references subjects(id) on delete set null,
  file_path   text not null,
  cover_url   text,
  file_size_mb numeric,
  is_free     boolean not null default false,
  position    integer not null default 0,
  created_at  timestamptz not null default now()
);

-- type: 'book' (full books) or 'notes' (subject-wise short notes/summaries)
alter table books add column if not exists type text not null default 'book';

create index if not exists books_subject_idx on books(subject_id);
create index if not exists books_type_idx    on books(type);

alter table books enable row level security;

-- Policies (drop-if-exists then create, so re-running is safe)
drop policy if exists "books read"  on books;
drop policy if exists "books write" on books;

create policy "books read" on books for select
  using (is_free or has_active_subscription() or is_staff());
create policy "books write" on books for all
  using (is_staff()) with check (is_staff());

-- Storage bucket for the PDF files (private)
insert into storage.buckets (id, name, public)
values ('books','books', false)
on conflict (id) do nothing;

drop policy if exists "books staff write"  on storage.objects;
drop policy if exists "books read access"  on storage.objects;

create policy "books staff write" on storage.objects for insert
  with check (bucket_id = 'books' and public.is_staff());
create policy "books read access" on storage.objects for select
  using (bucket_id = 'books' and (public.is_staff() or public.has_active_subscription()));
