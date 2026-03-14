-- Feedback table
create table public.feedback (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete set null,
  type text not null check (type in ('bug', 'feature_request', 'general')),
  message text not null,
  status text not null default 'open' check (status in ('open', 'under_review', 'resolved')),
  route text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies
alter table public.feedback enable row level security;

-- Users can insert their own feedback (or anons can insert if we allow guest feedback, we'll allow authenticated only for now)
create policy "Users can insert their own feedback"
  on public.feedback for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Users can view their own feedback
create policy "Users can view own feedback"
  on public.feedback for select
  to authenticated
  using (auth.uid() = user_id);
