-- Run this after 001_create_todos.sql to make the app a no-login personal cloud todo list.
-- Anyone who knows the deployed app URL can read and edit this single shared todo list.

alter table public.todos
  alter column user_id drop not null;

drop policy if exists "Users can read their own todos" on public.todos;
drop policy if exists "Users can insert their own todos" on public.todos;
drop policy if exists "Users can update their own todos" on public.todos;
drop policy if exists "Users can delete their own todos" on public.todos;

create policy "Anyone can read todos"
  on public.todos
  for select
  using (true);

create policy "Anyone can insert todos"
  on public.todos
  for insert
  with check (true);

create policy "Anyone can update todos"
  on public.todos
  for update
  using (true)
  with check (true);

create policy "Anyone can delete todos"
  on public.todos
  for delete
  using (true);
