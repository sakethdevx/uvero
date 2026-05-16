# Uvero Deployment Guide

Uvero is designed for Vercel. The app is a Vite SPA with serverless API routes behind a shared dispatcher at `api/index.js`.

## Recommended Host

Use Vercel unless you are intentionally separating the frontend and API.

Why Vercel fits this repo:

- `vercel.json` already rewrites `/api/:path*` to the serverless router.
- SPA fallback is already configured.
- Preview deployments work naturally for feature branches.
- Environment variables can be scoped per environment.

## Pre-Deployment Checklist

1. Install dependencies:

```bash
npm install
```

2. Run the production build:

```bash
npm run build
```

3. Confirm the generated sitemap:

```bash
npm run generate:sitemap
```

4. Review required environment variables.

## Required Environment Variables

### Supabase

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
```

`VITE_*` values are baked into frontend builds. Backend-only secrets such as `SUPABASE_SERVICE_KEY` must stay server-side.

### Clipboard Storage

Optional, but recommended for persistent clipboard boards:

```env
CLIPBOARD_PUBLIC_STORAGE_GITHUB_TOKEN=
CLIPBOARD_PUBLIC_STORAGE_GITHUB_OWNER=
CLIPBOARD_PUBLIC_STORAGE_GITHUB_REPO=clipboard-public-storage

CLIPBOARD_PRIVATE_STORAGE_GITHUB_TOKEN=
CLIPBOARD_PRIVATE_STORAGE_GITHUB_OWNER=
CLIPBOARD_PRIVATE_STORAGE_GITHUB_REPO=clipboard-private-storage
```

### Compiler API

```env
HF_COMPILER_TOKEN=
HF_COMPILER_URL=
```

### Toolbox API Limits

```env
RAR_TO_ZIP_MAX_UPLOAD_BYTES=52428800
EPUB_TO_MOBI_MAX_UPLOAD_BYTES=52428800
EPUB_TO_MOBI_BINARY_PATH=
```

### Maintenance Mode

```env
VITE_MAINTENANCE_MODE=false
VITE_MAINTENANCE_TITLE=Uvero is getting a careful tune-up
VITE_MAINTENANCE_MESSAGE=We are updating core systems right now so your next session feels stable and smooth.
VITE_MAINTENANCE_ETA=We will be back soon
VITE_MAINTENANCE_DETAILS=New sessions, uploads, clipboard updates, and data changes are temporarily paused during maintenance.
MAINTENANCE_RETRY_AFTER=300
```

### Contact Form

```env
VITE_FORMSUBMIT_EMAIL=
```

## Supabase Setup

Run these files in Supabase SQL Editor:

1. `supabase/profiles_table.sql`
2. `supabase/clipboard_tables.sql`
3. `supabase/qr_tools_tables.sql`

Do not expose service-role keys in frontend code.

## Deploy To Vercel

Using the Vercel dashboard:

1. Import the GitHub repository.
2. Set framework preset to Vite if it is not detected.
3. Add environment variables.
4. Deploy.

Using the Vercel CLI:

```bash
npm install -g vercel
vercel
```

For production:

```bash
vercel --prod
```

## Post-Deployment Smoke Test

After deployment, test:

- `/`
- `/toolbox`
- `/merge-pdf`
- `/protect-pdf`
- `/clipboard`
- `/cli`
- `/qr-tools`
- `/compiler`
- `/privacy`
- `/contact`
- `/api/toolbox/runtime-status`

Also check:

- Browser console for route or asset errors
- Network tab for missing workers or WASM files
- Supabase auth flows
- Clipboard API behavior if storage env vars are configured
- QR dynamic redirect routes if QR tables are installed

## Notes For Other Hosts

Static-only hosts are not enough for the full product because clipboard, compiler, QR analytics/dynamic codes, auth helpers, and toolbox server transforms use API routes.

If deploying elsewhere, configure equivalents for:

- `/api/:path*` serverless routing
- SPA fallback to `/index.html`
- WASM content type: `application/wasm`
- Environment variables for server routes

## Troubleshooting

### Build Fails

```bash
rm -rf node_modules
npm install
npm run build
```

### API Routes Return 404

Check that `/api/:path*` rewrites to `/api?path=:path*`, matching `vercel.json`.

### Browser Cannot Load WASM

Confirm the host serves `.wasm` files with:

```text
Content-Type: application/wasm
```

### Frontend Env Changes Do Not Apply

Redeploy after changing `VITE_*` values. They are embedded at build time.
