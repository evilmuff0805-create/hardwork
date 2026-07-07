# Hardwork

A tiny personal cloud todo app deployed on Railway and backed by Supabase.

This version intentionally has **no login and no password**. Open the Railway URL and use the todo list directly. Anyone who knows the deployed URL can access the same shared list, so keep the URL private.

For ongoing handoff notes, completed setup, and next-step guidance, see `PROJECT_STATUS.md`. For local and CI verification guidance, see `TESTING.md`.

## Setup

1. Copy `.env.example` to `.env.local`.
2. Fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from your Supabase project API settings.
3. `NEXT_PUBLIC_SITE_URL` is optional now because the app no longer uses magic-link login redirects.

## Todo table setup

If you already ran the original auth-based todo SQL, also run:

```text
supabase/migrations/002_make_todos_public_personal.sql
```

That migration changes the todo table into a single shared no-login list. It removes the per-user Auth policies and allows the public anon key to read, add, update, and delete todos.

## Scripts

- `npm run dev` starts the development server.
- `npm run build` creates a production build.
- `npm run typecheck` validates TypeScript.
