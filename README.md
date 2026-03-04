# Uvero

> Professional digital tools — file processing, photo sharing, and online clipboard — built with privacy and speed in mind.

## Features

Uvero is a multi-service platform deployed on **Vercel**, combining client-side file processing with cloud-powered collaboration tools.

### 🛠️ File Processing — 63+ Tools

All file processing runs **100% client-side** in the browser. No uploads, no servers, completely private.

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

### 📸 PhotoDrop

Event-based photo sharing platform with AI-powered face detection.

- Create events & upload photos (stored on GitHub via API)
- **AI face detection** — automatically identifies and groups people in photos (Hugging Face inference)
- Invite system with unique shareable links & tokens
- Event management — create, browse, delete events & images
- Person tagging and name management
- Auth-gated access via Supabase

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
- **Separated storage** — Public and private board data stored on different GitHub branches (`public_boards` / `private_boards`)
- Metadata tracked in Supabase, content stored in GitHub

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 7, Tailwind CSS 3 |
| Routing | React Router 7 |
| Auth | Supabase (email/password) |
| Backend API | Vercel Serverless Functions |
| File Processing | Web Workers, Canvas API, FFmpeg WASM, pdf-lib, pdfjs, jsPDF, SheetJS, Mammoth, Sharp |
| Image Storage | GitHub Contents API (PhotoDrop + Clipboard) |
| AI / ML | Hugging Face Inference API (face detection), @imgly/background-removal |
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
│   ├── features/
│   │   ├── file-processing/
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
│   │   ├── photodrop/
│   │   │   ├── pages/                   # Events, EventDetail, Invite
│   │   │   ├── api/                     # 13 API endpoints (events, images, faces, invites)
│   │   │   └── services/               # GitHub image storage
│   │   └── clipboard/
│   │       ├── pages/                   # Clipboard (public), ClipboardBoard (private)
│   │       ├── api/                     # Clipboard API (CRUD + code assignment)
│   │       └── services/               # GitHub storage (branch-separated)
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
| `/tools` | File processing tools hub |
| `/:toolId` | Individual tool (e.g. `/compress-image`, `/merge-pdf`) |
| `/photodrop` | PhotoDrop events |
| `/photodrop/:id` | Event detail + photos |
| `/invite/:token` | Accept event invite |
| `/clipboard` | Online Clipboard (quick share + board entry) |
| `/clipboard/:boardId` | Private clipboard board |
| `/login` | Sign in |
| `/signup` | Sign up |
| `/reset-password` | Password reset |
| `/profile` | User profile |
| `/privacy` | Privacy policy |

---

## Architecture

- **Feature-based structure** — Each service (file-processing, photodrop, clipboard) is self-contained under `src/features/`
- **Client-side file processing** — Web Workers, Canvas API, and WASM keep the main thread free
- **Serverless API** — Vercel functions with a single router dispatching to feature-specific handlers
- **GitHub as storage** — PhotoDrop images and clipboard boards stored via the GitHub Contents API
- **Supabase for metadata & auth** — Board metadata, event data, and user auth managed through Supabase
- **Dark mode** — Full dark/light theme support with ThemeToggle
- **Responsive** — Mobile-first design with mega-menu navigation on desktop

---

## License

MIT License

---

**Made with ❤️ for privacy-conscious users**
