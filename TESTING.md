# Testing guide

This project can be tested locally on the user's Windows machine, but the Codex container may not be able to install dependencies because its npm traffic is routed through a restricted proxy.

## Why Codex container tests failed

The container npm configuration currently includes proxy settings:

```text
http-proxy = "http://proxy:8080"
https-proxy = "http://proxy:8080"
```

When `npm install` runs in that container, the registry request for `@supabase/ssr` can return:

```text
403 Forbidden - GET https://registry.npmjs.org/@supabase%2fssr
```

That means `npm install`, `npm run typecheck`, `npm run build`, and screenshot capture cannot be trusted inside that restricted container until dependency installation works.

## What the user can do

### Option A — run verification locally

The user's Windows machine already installed dependencies successfully once. Future verification can be done there with:

```powershell
cd C:\Users\Rootho\Desktop\hardwork
npm install
npm run typecheck
npm run build
npm run dev
```

If the local app is running, test manually at:

```text
http://localhost:3000
```

### Option B — commit a lockfile

After running `npm install` locally, commit the generated `package-lock.json`.

This improves reproducibility and lets future environments use:

```sh
npm ci
```

However, a lockfile does not fix a registry/proxy policy that blocks downloading packages. It only makes dependency versions deterministic.

### Option C — use GitHub Actions for automated tests

This repository includes a GitHub Actions workflow at `.github/workflows/ci.yml`. It runs on pushes to `main` and on pull requests.

The workflow verifies the same commands recommended for local validation:

```sh
npm ci
npm run typecheck
npm run build
```

The workflow uses placeholder public Supabase environment variables so the Next.js build can run without exposing real project credentials.

## What must change for Codex container tests to pass

At least one of these must be true:

1. The container proxy allows npm registry access to all required packages, including scoped packages such as `@supabase/ssr`.
2. The container receives a working npm cache with the needed packages already available.
3. The environment provides dependencies another way, such as a prebuilt `node_modules` cache.
4. Tests run outside the restricted container, for example on the user's local machine or GitHub Actions.

## Recommended next testing step

Ask the user to run this locally after pulling the latest PR:

```powershell
cd C:\Users\Rootho\Desktop\hardwork
git pull
npm install
npm run typecheck
npm run build
```

If these pass locally, the code is much more reliable than the Codex container warning suggests.
