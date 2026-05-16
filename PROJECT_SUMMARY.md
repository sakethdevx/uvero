# Uvero Project Summary

Uvero is a multi-service digital tools workspace focused on private file workflows, QR tools, clipboard sharing, and code execution.

## Current Services

| Service | Summary |
|---------|---------|
| Toolbox | Unified image, document, audio, and video conversion plus PDF and utility tools |
| PDF Tools | Merge, split, rotate, delete, reorder, extract, compress, unlock, and protect PDFs |
| QR Tools | Generator, scanner, validator, bulk generator, dynamic QR manager, redirects, and analytics |
| Clipboard | Quick text share, private boards, password locks, expiry, burn-after-read, QR sharing, and CLI routes |
| Compiler | Monaco editor, templates, stdin/stdout panels, execution history, and server-backed code execution |

## Core Architecture

- React 19, Vite 7, Tailwind CSS 3
- React Router 7 for app routes
- Vercel serverless API router in `api/index.js`
- Supabase for auth and app metadata
- GitHub Contents API for optional clipboard storage
- Web Workers and WASM for heavy browser-side file work
- Monaco Editor for the compiler

## Important Paths

```text
api/                              Vercel API router and maintenance helpers
public/workers/                   Browser workers and WASM helpers
scripts/                          Sitemap, consistency, and smoke-test scripts
src/auth/                         Supabase auth provider and profile flows
src/components/                   Global UI, command/search, sheets, panels
src/lib/                          Intent engine, session context, Supabase client
src/pages/                        App-level pages
src/services/clipboard/           Clipboard UI, API, CLI, and storage helpers
src/services/compiler/            Compiler UI, language data, and execution API
src/services/qr-tools/            QR generation, scanning, dynamic codes, analytics
src/services/toolbox/             Unified converter, PDF tools, utilities, processors
supabase/                         SQL schemas for profiles, clipboard, and QR tools
```

## Current Route Surface

- `/`
- `/toolbox`
- `/:toolId`
- `/compiler`
- `/clipboard`
- `/clipboard/:boardId`
- `/c/:code`
- `/cli`
- `/qr-tools`
- `/qr-tools/generator`
- `/qr-tools/scanner`
- `/qr-tools/validator`
- `/qr-tools/bulk`
- `/qr-tools/dynamic`
- `/qr-tools/analytics`
- `/qr/r/:code`
- `/login`
- `/signup`
- `/reset-password`
- `/profile`
- `/privacy`
- `/contact`

## Verification

Use these before deploying meaningful changes:

```bash
npm run build
npx eslint api/index.js src/App.jsx src/components/Search/searchIndex.js src/lib/IntentEngine.js src/pages/ServicesHome.jsx
```

The full `npm run lint` can be expensive because the repo contains large generated PDF assets.
