-- Run this in the Supabase SQL editor before using the todo list UI.
create table if not exists public.todos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) > 0),
  is_complete boolean not null default false,
  inserted_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists todos_user_id_inserted_at_idx
  on public.todos (user_id, inserted_at desc);

alter table public.todos enable row level security;

create policy "Users can read their own todos"
  on public.todos
  for select
  using (auth.uid() = user_id);

create policy "Users can insert their own todos"
  on public.todos
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own todos"
  on public.todos
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own todos"
  on public.todos
  for delete
  using (auth.uid() = user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_todos_updated_at on public.todos;
create trigger set_todos_updated_at
  before update on public.todos
  for each row
  execute function public.set_updated_at();
