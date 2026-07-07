# Project status and next steps

## Current direction update: no-login Railway app

The user clarified that this is a personal cloud app, not a local-only app, and they do not want login or even a password. The correct direction is now:

- Deployment: Railway
- Database: Supabase
- Auth: disabled/unused for the todo app
- Access model: anyone with the Railway URL can use the single shared todo list
- Next required Supabase step: run `supabase/migrations/002_make_todos_public_personal.sql` in Supabase SQL Editor

Reason: the previous Supabase magic-link auth flow created too much setup friction for a personal todo app. Prioritize a working cloud app over formal user accounts.


This file is the handoff note for future chats. Keep it updated so the next assistant remembers what has already been done and what to do next, even if the chat is compressed.

## Highest-priority working rule

Before doing any work, think deeply, understand the task, analyze the context, and verify facts. After fact-checking, verify the answer two or three times for mistakes. If anything is wrong, correct it before reporting. Then explain the final, accurate information carefully and thoroughly to the user.

## App development project guide principles

1. The user is a non-developer. Do not skip steps; explain every step.
2. When telling the user to do something on a website, first search/check the relevant page and then provide the exact menu name and location.
3. Explain in this flow: where to click → what should appear if normal → what to do next.
4. When something fails, do not try random fixes; identify the root cause first.
5. When giving terminal commands, clearly state where to run them: CMD, PowerShell, Claude Code, Codex, etc.
6. Before giving any command, deeply understand, think, analyze, research carefully, verify two or three times, fact-check, and report only after checking for mistakes. Small details matter.
7. If something seems impossible or the work appears to be going in the wrong direction, warn the user in advance, explain the concern, and provide the best alternative after deep analysis.

## User preference

- Work one step at a time.
- Do not dump too much information at once.
- Explain what changed, what it means, and the next single action.
- Prefer Korean explanations for setup guidance.
- When a task is complete, clearly say:
  1. What is now working.
  2. What the user should do next.
  3. What not to touch yet.

## Completed so far

### Supabase project setup

- Supabase project was created by the user.
- Project URL was configured locally as `NEXT_PUBLIC_SUPABASE_URL`.
- Anon key was configured locally as `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- `NEXT_PUBLIC_SITE_URL` was set to `http://localhost:3000` for local development.
- Supabase Auth URL Configuration was updated with:
  - Site URL: `http://localhost:3000`
  - Redirect URL: `http://localhost:3000/auth/callback`
- Email provider was confirmed enabled in Supabase.

### Local app setup

- GitHub PR was created and merged into `main` after Codex generated the app.
- User cloned/pulled the repository to `C:\Users\Rootho\Desktop\hardwork`.
- User created `.env.local` on Windows.
- User ran `npm install` successfully.
- User ran `npm run dev` successfully.
- Local app opened at `http://localhost:3000`.

### Auth flow verified

- Magic-link email was sent successfully.
- User clicked the latest email link.
- Login succeeded.
- `/protected` opened successfully.
- Sign out worked successfully.

### Code added

- Next.js App Router scaffold.
- Supabase Auth helpers and middleware.
- Magic-link login and sign-out actions.
- Protected route middleware.
- Safe redirect helper.
- Protected todo-list UI and server actions.
- Supabase SQL migration for a secure per-user `todos` table with Row Level Security.

## Current latest feature

The protected page is now intended to become the user's actual todo list app.

It includes UI and server actions for:

- Adding todos.
- Listing todos.
- Marking todos complete/incomplete.
- Deleting todos.
- Signing out.

## Important next step

Before the todo list can work, the user must run the SQL in Supabase.

File to use:

```text
supabase/migrations/001_create_todos.sql
```

Where to run it:

```text
Supabase Dashboard → SQL Editor → New query → paste SQL → Run
```

Expected result:

- A `todos` table exists.
- Row Level Security is enabled.
- Each signed-in user can only access their own todos.

## Next recommended workflow

### Step 1 — Get the latest code locally

If a new PR has been merged, tell the user to run:

```powershell
cd C:\Users\Rootho\Desktop\hardwork
git pull
```

### Step 2 — Run Supabase todo SQL

Guide the user through Supabase Dashboard one screen at a time:

1. Open Supabase Dashboard.
2. Open the `Hardwork` project.
3. Click SQL Editor.
4. Click New query.
5. Paste the contents of `supabase/migrations/001_create_todos.sql`.
6. Click Run.

### Step 3 — Restart local dev server

If the server is already running, ask the user to stop it with `Ctrl + C`, then run:

```powershell
npm run dev
```

### Step 4 — Test todos

In the browser:

1. Open `http://localhost:3000`.
2. Sign in if needed.
3. Go to `/protected`.
4. Add a todo.
5. Toggle it complete.
6. Delete it.

## Suggested next product tasks after todo CRUD works

1. Improve Korean UI text.
2. Add due dates.
3. Add priority labels.
4. Add filters: all / active / completed.
5. Add deployment with Vercel.
6. Add production Supabase redirect URL after deployment.

## Testing notes

- See `TESTING.md` for why Codex container tests can fail even when the user's local Windows machine works.
- The key issue is the restricted container proxy returning HTTP 403 for npm packages such as `@supabase/ssr`.
- Best near-term verification path: ask the user to run `npm run typecheck` and `npm run build` locally after `git pull`.

## Known environment notes

- The Codex container may fail `npm install` with HTTP 403 for `@supabase/ssr` because of registry/proxy policy.
- The user's Windows local machine successfully ran `npm install` and `npm run dev` before.
- If local npm commands fail, first confirm PowerShell is inside:

```powershell
C:\Users\Rootho\Desktop\hardwork
```

- Do not tell the user to run npm commands from `C:\Windows\System32`.
