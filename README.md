# Uvero

> A privacy-minded digital tools workspace for file conversion, PDF editing, code execution, QR workflows, and secure clipboard sharing.

![React](https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react&logoColor=111)
![Vite](https://img.shields.io/badge/Vite-7-646cff?style=flat-square&logo=vite&logoColor=fff)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-38bdf8?style=flat-square&logo=tailwindcss&logoColor=fff)
![Supabase](https://img.shields.io/badge/Supabase-Auth_%2B_Data-3ecf8e?style=flat-square&logo=supabase&logoColor=fff)
![Vercel](https://img.shields.io/badge/Vercel-Serverless-000?style=flat-square&logo=vercel&logoColor=fff)

Uvero brings everyday digital utilities into one focused app: convert files, work with PDFs, run code, generate QR codes, and share clipboard boards without jumping across a pile of separate sites.

## Highlights

| Area | What is available now |
|------|------------------------|
| Toolbox | Unified image, document, audio, and video conversion plus dedicated PDF/security/unit tools |
| PDF Tools | Merge, split, rotate, delete pages, reorder pages, extract pages, compress, unlock, protect, watermark, clean metadata, convert images to PDF, and export PDF pages as images |
| QR Tools | Generator, scanner, validator, bulk generator, dynamic QR manager, redirects, and analytics |
| Clipboard | Quick text share, Live Clipboard (Private), password locks, expiry, burn-after-read, QR sharing, and CLI routes |
| Compiler | Monaco-powered online editor for 19 languages with templates, stdin, output panels, and execution history |

## Product Surface

### Toolbox

The Toolbox combines a broad drag-and-drop converter with embedded task workspaces.

- **Unified converter** for image, document, audio, and video formats.
- **Image operations** include format conversion, crop, resize, watermark, and AI background removal.
- **Document conversion** supports formats such as DOCX, DOC, Markdown, HTML, RTF, CSV, TSV, JSON, EPUB, ODT, and DocBook.
- **Audio/video conversion** runs through browser-first FFmpeg workflows where supported.
- **Embedded PDF tools** live inside the unified converter and include merge, split, rotate, delete, reorder, extract, compress, unlock, protect, watermark, clean metadata, image to PDF, and PDF to image.
- **PDF tool deep links** use `/toolbox?to=<tool-id>`, for example `/toolbox?to=merge-pdf` and `/toolbox?to=pdf-to-image`. Legacy standalone PDF paths redirect into the toolbox workspace.
- **PDF rasterization** exports selected pages or page ranges as PNG, JPG, or WEBP, using local PDF.js workers, standard fonts, and CMaps for offline rendering.
- **Utility tools** include password generation, hash generation, and unit conversion.

### QR Tools

Uvero includes a complete QR workflow rather than a single generator page.

- Generate QR codes for URLs, text, email, phone, SMS, WiFi, WhatsApp, UPI, vCard contacts, maps, app links, menus, and calendar/event data.
- Customize colors, logos, frames, and export PNG or SVG.
- Scan codes from the camera or uploaded images.
- Validate contrast, quiet zone, print size, and logo safety.
- Create QR codes in bulk from pasted lists or CSV input, with ZIP and printable PDF export.
- Manage dynamic QR codes whose destinations can be edited after printing.
- Track scans, trends, countries, top codes, and export analytics.

### Online Clipboard

Clipboard is built for quick sharing and richer Live Clipboard (Private) boards.

- Quick Share creates short retrieval codes for text snippets.
- Private boards support syntax highlighting, Markdown preview, split view, autosave, and file download.
- Security controls include password protection, expiry windows, and burn-after-read.
- Boards can be shared with QR codes.
- CLI-friendly endpoints support quick send/get and board send/get workflows.
- Metadata lives in Supabase; board content can be stored in GitHub-backed storage.

### Online Compiler

The compiler uses Monaco for editing and a server-side execution proxy.

- Supports **19 languages**: Python 3, Node.js, TypeScript, C, C++, Java, Go, Rust, Ruby, PHP, Perl, R, Bash, Lua, Swift, Kotlin, C#, Scala, and Haskell.
- Includes starter templates for common language patterns.
- Provides stdin, stdout, stderr, compile output, and execution history.
- Shareable snippets are supported from the compiler UI.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, Vite 7, Tailwind CSS 3 |
| Routing | React Router 7 |
| Motion/UI | Framer Motion, custom glass UI system |
| Editor | Monaco Editor |
| Auth/Data | Supabase Auth, Postgres, RLS |
| Backend | Vercel Serverless Functions with a shared API router |
| File Engines | Web Workers, FFmpeg WASM, ImageMagick WASM, Pandoc WASM, qpdf-wasm, pdf-lib, pdfjs |
| QR | qrcode, jsQR, html2canvas, jsPDF |
| Storage | GitHub Contents API for clipboard boards |
| Deployment | Vercel |

## Project Structure

```text
uvero/
├── api/
│   ├── index.js                         # Vercel API dispatcher
│   └── maintenance.js                   # Shared maintenance response helpers
├── public/
│   ├── workers/                         # Heavy browser workers, PDF.js assets, and WASM helpers
│   └── sitemap.xml
├── scripts/
│   ├── generate-sitemap.mjs
│   ├── check-toolbox-consistency.mjs
│   └── test-*.mjs
├── src/
│   ├── auth/                            # Supabase auth provider and profile helpers
│   ├── components/                      # Global UI, command bar, search, sheets, panels
│   ├── config/                          # Runtime-style frontend config
│   ├── hooks/                           # Shared React hooks
│   ├── lib/                             # Intent engine, sessions, suggestions, Supabase client
│   ├── pages/                           # App-level pages: auth, profile, contact, privacy
│   └── services/
│       ├── clipboard/                   # Clipboard pages, APIs, CLI commands, GitHub storage
│       ├── compiler/                    # Online compiler UI, language data, execution API
│       ├── qr-tools/                    # QR generator, scanner, dynamic codes, analytics
│       └── toolbox/                     # Unified converter, PDF tools, utilities, processors
├── supabase/                            # SQL schemas for profiles, clipboard, and QR tools
├── vercel.json                          # API rewrites and SPA fallback
├── vite.config.js
└── package.json
```

## Routes

| Route | Purpose |
|-------|---------|
| `/` | Command-first services home |
| `/toolbox` | Unified file converter, embedded PDF workspaces, and utility hub |
| `/toolbox?to=<tool-id>` | Deep link into a unified converter action, such as `/toolbox?to=merge-pdf` or `/toolbox?to=pdf-to-image` |
| `/:toolId` | Standalone utility tools, such as `/password-generator`, `/hash-generator`, and `/unit-converter` |
| `/compiler` | Online compiler |
| `/clipboard` | Quick Share and Live Clipboard (Private) entry |
| `/clipboard/:boardId` | Private clipboard board |
| `/c/:code` | Public clipboard retrieval link |
| `/cli` | Clipboard CLI docs |
| `/qr-tools` | QR tools hub |
| `/qr-tools/generator` | QR code generator |
| `/qr-tools/scanner` | QR scanner |
| `/qr-tools/validator` | QR validator |
| `/qr-tools/bulk` | Bulk QR generator |
| `/qr-tools/dynamic` | Dynamic QR manager |
| `/qr-tools/analytics` | QR analytics dashboard |
| `/qr/r/:code` | Dynamic QR redirect endpoint |
| `/login`, `/signup`, `/reset-password`, `/profile` | Account flows |
| `/privacy`, `/contact` | Static support pages |

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- Supabase project for auth and persisted metadata
- Optional GitHub repositories for clipboard board storage

### Install

```bash
git clone https://github.com/sakethdevx/uvero.git
cd uvero
npm install
cp .env.example .env
npm run dev
```

The development server runs at `http://localhost:5173`.

### Build

```bash
npm run build
npm run preview
```

The production build runs the toolbox consistency checks, route smoke test, and sitemap generation before Vite builds the app.

## Environment Variables

Start with `.env.example`, then fill only the services you need.

### Supabase

```env
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_URL=your_project_url
SUPABASE_SERVICE_KEY=your_service_role_key
```

### Clipboard Storage

```env
CLIPBOARD_PUBLIC_STORAGE_GITHUB_TOKEN=
CLIPBOARD_PUBLIC_STORAGE_GITHUB_OWNER=
CLIPBOARD_PUBLIC_STORAGE_GITHUB_REPO=clipboard-public-storage

CLIPBOARD_PRIVATE_STORAGE_GITHUB_TOKEN=
CLIPBOARD_PRIVATE_STORAGE_GITHUB_OWNER=
CLIPBOARD_PRIVATE_STORAGE_GITHUB_REPO=clipboard-private-storage
```

### Compiler And Toolbox APIs

```env
HF_COMPILER_TOKEN=
HF_COMPILER_URL=
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

Run the SQL files in `supabase/` in this order:

1. `profiles_table.sql`
2. `clipboard_tables.sql`
3. `qr_tools_tables.sql`

Row Level Security is enabled in the schemas. Keep `SUPABASE_SERVICE_KEY` server-only.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite in development mode |
| `npm run build` | Run prebuild checks and build production assets |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run ESLint |
| `npm run generate:sitemap` | Rebuild `public/sitemap.xml` and `public/robots.txt` |
| `npm run check:toolbox` | Validate toolbox registry consistency |
| `npm run test:toolbox-routes` | Smoke test representative toolbox routes |
| `npm run test:toolbox-runtime-status` | Check toolbox runtime status handling |
| `npm run test:toolbox-api` | Exercise toolbox API behavior |
| `npm run test:rar-to-zip` | Exercise RAR-to-ZIP API behavior |

## Architecture Notes

- **Command-first UX**: homepage suggestions, command bar, universal search, history, and favorites are designed around quickly launching tasks.
- **Client-heavy processing**: many conversions run in the browser with workers and WASM to reduce server dependency.
- **Serverless where needed**: Vercel functions handle auth-backed APIs, storage integration, compiler proxying, and heavyweight server tasks.
- **Feature isolation**: each product area lives under `src/services/` with its own pages, APIs, and supporting logic.
- **Storage separation**: clipboard public and Live Clipboard (Private) boards can use separate GitHub repositories.
- **Safety controls**: Supabase RLS, password-protected boards, expiring clipboard content, maintenance mode, and server-only secrets are part of the default shape.

## License

MIT License

---

Built for fast, focused, privacy-conscious work.
