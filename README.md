# Uvero

> Professional digital tools — Uvero Toolbox, online clipboard, PaySplit, QR tools, and an online compiler — built with privacy and speed in mind.

## Features

Uvero is a multi-service platform deployed on **Vercel**, combining Uvero Toolbox with cloud-powered collaboration tools.

### 🧰 Uvero Toolbox — 63+ Tools

Most Toolbox workflows run client-side in the browser, while a few advanced conversions use clearly labeled server-backed runtimes when required.

| Category | Tools |
|----------|-------|
| **PDF** (27) | Compress, Merge, Split, Convert (to/from Word, PowerPoint, Excel, Image, HTML, PDF/A), Edit, Sign, Rotate, Watermark, Protect, Unlock, Organize, Page Numbers, Repair, Crop, Redact, OCR, Compare, Scan to PDF, Translate |
| **Image** (11) | Compress, Convert, Resize, Crop, Image to PDF, JPG to PDF, PDF to JPG, HEIC to JPG, GIF Maker, Add Watermark, Background Remover |
| **Video** (5) | Compress, Convert, MP4 Converter, Video to GIF, MOV to MP4 |
| **Audio** (5) | Compress, Convert, Video to MP3, MP3 Converter, MP4 to MP3 |
| **Document** (3) | Document Converter, EPUB to PDF, EPUB to MOBI |
| **Utility** (10) | QR Generator, Password Generator, Hash Generator, Unit Converter, Timezone Converter, Lbs↔Kg, Feet↔Meters, PST/CST→EST |
| **Archive** (2) | RAR to ZIP, Archive Converter |

---

### 📋 Online Clipboard

Instant text sharing — no login required.

- **Quick Share** — Paste text, get a 4-digit code. Share the code for instant retrieval.
- **Private Boards** — Named boards (`/clipboard/my-notes`) with rich features:
  - Syntax highlighting (25+ languages)
  - Markdown preview (edit / preview / split view)
  - Password protection
  - Burn after read & auto-expiry (1h to 30d)
  - QR code sharing
  - Auto-save & download (.txt, .md, .py, .js, etc.)
- **Separated storage** — Public and private board data stored in separate GitHub repositories
- Metadata tracked in Supabase, content stored in GitHub

---

### 💸 PaySplit – Split Expenses

Splitwise-style expense management for trips and shared plans.

- Create groups and invite friends with shareable invite codes
- Add expenses with smart split modes: equal, exact, percentage, shares
- Auto-calculate balances and suggest minimal settlement transfers
- Save payment details per member: UPI ID, mobile, QR URL, payment note
- 1-tap UPI payment deep links with app references (GPay, PhonePe, Paytm, BHIM)
- Receipts support both privacy-first external links and direct file upload to Uvero-managed GitHub storage
- Supports both signed-in users and guest sessions (guest mode has limits)
- Phase 3: Export complete group records as CSV (expenses, settlements, payment proofs, reminders)
- Phase 4: Claim guest data after sign-in, or recover as guest using invite + one-time recovery code

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 7, Tailwind CSS 3 |
| Routing | React Router 7 |
| Auth | Supabase (email/password) |
| Backend API | Vercel Serverless Functions |
| Uvero Toolbox | Web Workers, Canvas API, FFmpeg WASM, pdf-lib, pdfjs, jsPDF, SheetJS, Mammoth, Sharp |
| File Storage | GitHub Contents API (Clipboard + PaySplit receipts) |
| AI / ML | @imgly/background-removal |
| QR | qrcode library |
| Deployment | Vercel |

---

## Project Structure

```
uvero/
├── api/
│   └── index.js                          # Vercel serverless router → dispatches to feature APIs
├── src/
│   ├── auth/                             # Supabase auth (AuthProvider, RequireAuth, authService)
│   ├── components/                       # Global UI (ThemeToggle)
│   ├── pages/                            # Login, Signup, ResetPassword, Profile, Privacy
│   ├── services/
│   │   ├── toolbox/
│   │   │   ├── tools/                    # 63+ tools organized by category
│   │   │   │   ├── image/               # 11 image tools
│   │   │   │   ├── pdf/                 # 27 PDF tools
│   │   │   │   ├── audio/               # 5 audio tools
│   │   │   │   ├── video/               # 5 video tools
│   │   │   │   ├── document/            # 3 document/ebook tools
│   │   │   │   ├── utility/             # 10 utility tools
│   │   │   │   ├── archive/             # 2 archive tools
│   │   │   │   └── index.js             # Tool registry
│   │   │   ├── pages/                   # Home, ServicesHome, ToolPage
│   │   │   ├── components/              # ModeToggle, Dropzone, etc.
│   │   │   ├── shared/                  # Reusable UI (Button, ProgressBar, FileInfo)
│   │   │   ├── services/                # Processing services
│   │   │   ├── context/                 # ModeContext
│   │   │   └── api/                     # compress, convert-video-to-mp3
│   │   ├── clipboard/
│   │       ├── pages/                   # Clipboard (public), ClipboardBoard (private)
│   │       ├── api/                     # Clipboard API (CRUD + code assignment)
│   │       └── services/               # GitHub storage (repo-separated)
│   │   ├── split-expense/              # PaySplit pages and APIs
│   │   ├── qr-tools/                   # QR generator, scanner, dynamic codes
│   │   └── compiler/                   # Online compiler UI and API proxy
│   ├── App.jsx                          # Root layout, routing, navigation
│   ├── main.jsx                         # Entry point
│   └── index.css                        # Global styles
├── supabase/                            # Database schema (clipboard_tables.sql)
├── vercel.json                          # Rewrite rules
└── package.json
```

---

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
# Clone the repo
git clone https://github.com/sakethdevx/uvero.git
cd uvero

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Fill in your Supabase, GitHub, and Hugging Face credentials

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Environment Variables

Copy `.env.example` to `.env` and fill in the required credentials. See the example file for all available variables.

For clipboard storage, the recommended setup is:

```bash
CLIPBOARD_PUBLIC_STORAGE_GITHUB_TOKEN=...
CLIPBOARD_PUBLIC_STORAGE_GITHUB_OWNER=...
CLIPBOARD_PUBLIC_STORAGE_GITHUB_REPO=clipboard-public-storage

CLIPBOARD_PRIVATE_STORAGE_GITHUB_TOKEN=...
CLIPBOARD_PRIVATE_STORAGE_GITHUB_OWNER=...
CLIPBOARD_PRIVATE_STORAGE_GITHUB_REPO=clipboard-private-storage
```

For PaySplit receipt uploads, configure a dedicated repository:

```bash
PAYSPLIT_RECEIPTS_GITHUB_TOKEN=...
PAYSPLIT_RECEIPTS_GITHUB_OWNER=...
PAYSPLIT_RECEIPTS_GITHUB_REPO=uvero-paysplit-receipts-storage
PAYSPLIT_RECEIPTS_GITHUB_BRANCH=main

# Optional (default is 5MB)
PAYSPLIT_RECEIPT_MAX_UPLOAD_BYTES=5242880
```

Legacy `TRIPSPLIT_RECEIPTS_*` and `GITHUB_RECEIPTS_*` variables are still supported for backward compatibility.

If these variables are not set, users can still attach external receipt URLs (link mode).

### Maintenance Mode

If you need to pause the product during database or storage work, enable maintenance mode before deploying:

```bash
VITE_MAINTENANCE_MODE=true
VITE_MAINTENANCE_TITLE="Uvero is getting a careful tune-up"
VITE_MAINTENANCE_MESSAGE="We are updating core systems right now so your next session feels stable and smooth."
VITE_MAINTENANCE_ETA="Back in about 15 minutes"
VITE_MAINTENANCE_DETAILS="New sessions, uploads, clipboard updates, and data changes are temporarily paused during maintenance."
MAINTENANCE_RETRY_AFTER=300
```

This shows a dedicated maintenance page in the web app and makes the shared API router return `503 Service Unavailable` with a `Retry-After` header.

Operational note:
`VITE_*` values are baked into the frontend build, so the simplest env-var approach works best when you redeploy with the flag enabled or disabled. If you later want instant toggles without a rebuild, move the maintenance flag to a runtime config source.

### Build for Production

```bash
npm run build
npm run preview
```

---

## Routes

| Path | Page |
|------|------|
| `/` | Services home (landing page) |
| `/toolbox` | Uvero Toolbox hub |
| `/:toolId` | Individual tool (e.g. `/compress-image`, `/merge-pdf`) |
| `/clipboard` | Online Clipboard (quick share + board entry) |
| `/clipboard/:boardId` | Private clipboard board |
| `/split-expense` | PaySplit groups home |
| `/split-expense/:groupId` | PaySplit group details |
| `/login` | Sign in |
| `/signup` | Sign up |
| `/reset-password` | Password reset |
| `/profile` | User profile |
| `/privacy` | Privacy policy |

---

## Architecture

- **Feature-based structure** — Each service is self-contained under `src/services/`
- **Client-side Toolbox flows** — Web Workers, Canvas API, and WASM keep the main thread free
- **Serverless API** — Vercel functions with a single router dispatching to feature-specific handlers
- **GitHub as storage** — Clipboard boards and PaySplit receipts can be stored via the GitHub Contents API
- **Supabase for metadata & auth** — Board metadata, PaySplit data, QR analytics, and user auth managed through Supabase
- **Dark mode** — Full dark/light theme support with ThemeToggle
- **Responsive** — Mobile-first design with mega-menu navigation on desktop

---

## License

MIT License

---

**Made with ❤️ for privacy-conscious users**
