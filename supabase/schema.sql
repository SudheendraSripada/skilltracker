create extension if not exists "pgcrypto";

create table if not exists public.topics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.subtopics (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.topics(id) on delete cascade,
  user_id uuid not null,
  title text not null,
  description text,
  order_index integer not null default 0,
  status text not null default 'pending',
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.topics(id) on delete cascade,
  user_id uuid not null,
  title text not null,
  url text not null,
  type text not null,
  rank integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.tests (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.topics(id) on delete cascade,
  user_id uuid not null,
  status text not null default 'offered',
  total_questions integer not null default 0,
  score integer,
  max_score integer,
  attempted_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, topic_id)
);

create table if not exists public.test_questions (
  id uuid primary key default gen_random_uuid(),
  test_id uuid not null references public.tests(id) on delete cascade,
  prompt text not null,
  options jsonb not null,
  correct_answer text not null,
  explanation text,
  user_answer text,
  is_correct boolean,
  created_at timestamptz not null default now()
);

alter table public.topics enable row level security;
alter table public.subtopics enable row level security;
alter table public.resources enable row level security;
alter table public.tests enable row level security;
alter table public.test_questions enable row level security;

create policy "topics_read" on public.topics for select using (auth.uid() = user_id);
create policy "topics_write" on public.topics for insert with check (auth.uid() = user_id);
create policy "topics_update" on public.topics for update using (auth.uid() = user_id);
create policy "topics_delete" on public.topics for delete using (auth.uid() = user_id);

create policy "subtopics_read" on public.subtopics for select using (auth.uid() = user_id);
create policy "subtopics_write" on public.subtopics for insert with check (auth.uid() = user_id);
create policy "subtopics_update" on public.subtopics for update using (auth.uid() = user_id);
create policy "subtopics_delete" on public.subtopics for delete using (auth.uid() = user_id);

create policy "resources_read" on public.resources for select using (auth.uid() = user_id);
create policy "resources_write" on public.resources for insert with check (auth.uid() = user_id);
create policy "resources_update" on public.resources for update using (auth.uid() = user_id);
create policy "resources_delete" on public.resources for delete using (auth.uid() = user_id);

create policy "tests_read" on public.tests for select using (auth.uid() = user_id);
create policy "tests_write" on public.tests for insert with check (auth.uid() = user_id);
create policy "tests_update" on public.tests for update using (auth.uid() = user_id);
create policy "tests_delete" on public.tests for delete using (auth.uid() = user_id);

create policy "test_questions_read" on public.test_questions for select using (
  exists (
    select 1 from public.tests t
    where t.id = test_id and t.user_id = auth.uid()
  )
);
create policy "test_questions_write" on public.test_questions for insert with check (
  exists (
    select 1 from public.tests t
    where t.id = test_id and t.user_id = auth.uid()
  )
);
create policy "test_questions_update" on public.test_questions for update using (
  exists (
    select 1 from public.tests t
    where t.id = test_id and t.user_id = auth.uid()
  )
);
create policy "test_questions_delete" on public.test_questions for delete using (
  exists (
    select 1 from public.tests t
    where t.id = test_id and t.user_id = auth.uid()
  )
);
