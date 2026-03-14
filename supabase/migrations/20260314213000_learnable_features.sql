-- Add premium and streak fields to profiles
alter table public.profiles 
  add column if not exists is_premium boolean not null default false,
  add column if not exists streak_count integer not null default 0,
  add column if not exists last_check_in timestamptz;

-- Create documents table
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  topic_id uuid not null references public.topics(id) on delete cascade,
  title text not null,
  file_url text not null,
  extracted_text text not null,
  created_at timestamptz not null default now()
);

-- Create document_messages table for side-by-side chat
create table if not exists public.document_messages (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.documents enable row level security;
alter table public.document_messages enable row level security;

-- RLS Policies for documents
create policy "documents_read" on public.documents for select using (auth.uid() = user_id);
create policy "documents_write" on public.documents for insert with check (auth.uid() = user_id);
create policy "documents_update" on public.documents for update using (auth.uid() = user_id);
create policy "documents_delete" on public.documents for delete using (auth.uid() = user_id);

-- RLS Policies for document_messages
create policy "document_messages_read" on public.document_messages for select using (auth.uid() = user_id);
create policy "document_messages_write" on public.document_messages for insert with check (auth.uid() = user_id);
create policy "document_messages_update" on public.document_messages for update using (auth.uid() = user_id);
create policy "document_messages_delete" on public.document_messages for delete using (auth.uid() = user_id);

-- Storage bucket for class documents
insert into storage.buckets (id, name, public)
values ('class_documents', 'class_documents', true)
on conflict (id) do nothing;

create policy "class_documents_select" on storage.objects for select using (bucket_id = 'class_documents');
create policy "class_documents_insert" on storage.objects for insert with check (bucket_id = 'class_documents' and auth.uid() = owner);
create policy "class_documents_update" on storage.objects for update using (bucket_id = 'class_documents' and auth.uid() = owner);
create policy "class_documents_delete" on storage.objects for delete using (bucket_id = 'class_documents' and auth.uid() = owner);
