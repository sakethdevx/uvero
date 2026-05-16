# Uvero Quickstart

This guide is the short path from a fresh checkout to a working local Uvero app.

## Prerequisites

- Node.js 18+
- npm
- A Supabase project for auth and persisted metadata
- Optional GitHub repositories for clipboard storage

## Install

```bash
git clone https://github.com/sakethdevx/uvero.git
cd uvero
npm install
cp .env.example .env
```

Fill the required values in `.env`:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
```

Clipboard GitHub storage is optional, but recommended if you want persistent public/private boards:

```env
CLIPBOARD_PUBLIC_STORAGE_GITHUB_TOKEN=
CLIPBOARD_PUBLIC_STORAGE_GITHUB_OWNER=
CLIPBOARD_PUBLIC_STORAGE_GITHUB_REPO=clipboard-public-storage

CLIPBOARD_PRIVATE_STORAGE_GITHUB_TOKEN=
CLIPBOARD_PRIVATE_STORAGE_GITHUB_OWNER=
CLIPBOARD_PRIVATE_STORAGE_GITHUB_REPO=clipboard-private-storage
```

## Database

Run the Supabase SQL files in this order:

1. `supabase/profiles_table.sql`
2. `supabase/clipboard_tables.sql`
3. `supabase/qr_tools_tables.sql`

## Run Locally

```bash
npm run dev
```

Open `http://localhost:5173`.

## What To Test

- `/` - command-first home
- `/toolbox` - unified converter and utility tools
- `/merge-pdf`, `/split-pdf`, `/protect-pdf` - dedicated PDF tools
- `/clipboard` and `/cli` - clipboard workflows
- `/qr-tools` - QR generator, scanner, validator, bulk, dynamic, and analytics tools
- `/compiler` - Monaco-based online compiler
- `/privacy` and `/contact` - static support pages

## Build

```bash
npm run build
npm run preview
```

`npm run build` runs toolbox checks, route smoke tests, sitemap generation, and the Vite production build.

## Useful Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start local development |
| `npm run build` | Run checks and build production assets |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run ESLint |
| `npm run generate:sitemap` | Regenerate sitemap and robots.txt |
| `npm run check:toolbox` | Validate toolbox registry consistency |
| `npm run test:toolbox-routes` | Smoke test representative toolbox routes |

## Notes

- Heavy file work uses browser workers and WASM where possible.
- Some server/API flows require Vercel-style environment variables.
- Keep `SUPABASE_SERVICE_KEY` server-only. Never expose it in frontend code.
