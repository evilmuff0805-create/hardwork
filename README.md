# Hardwork

A Next.js app configured with Supabase Auth and protected routes.

For ongoing handoff notes, completed setup, and next-step guidance, see `PROJECT_STATUS.md`. For local and CI verification guidance, see `TESTING.md`.

## Setup

1. Copy `.env.example` to `.env.local`.
2. Fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from your Supabase project API settings.
3. Optionally set `NEXT_PUBLIC_SITE_URL` to your deployed site URL so magic links redirect correctly outside local development.
4. In Supabase Auth URL Configuration, add `http://localhost:3000/auth/callback` and your production callback URL as allowed redirect URLs.


## Todo table setup

Before using `/protected` as a todo list, open your Supabase project SQL editor and run `supabase/migrations/001_create_todos.sql`.

The SQL creates a `todos` table, enables Row Level Security, and adds policies so each signed-in user can only read and modify their own todos.

## Supabase MCP login

If you are using the Codex Supabase MCP integration, authenticate it before asking Codex to inspect or mutate your Supabase project:

```sh
codex mcp login supabase
```

This environment did not include the `codex` CLI, so the command could not be run here.

## Scripts

- `npm run dev` starts the development server.
- `npm run build` creates a production build.
- `npm run typecheck` validates TypeScript.
