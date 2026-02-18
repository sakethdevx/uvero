Event Photo Organizer — Implementation Notes and Setup

Overview
--------

This module adds event creation, image uploads to a private GitHub repository, face detection via face-api.js (browser), grouping into persons, and ZIP downloads.

Server prerequisites
--------------------

- Add these environment variables to your deployment (Vercel / Node host):
  - `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` (service role key)
  - `GITHUB_TOKEN` — a Personal Access Token with `repo` scope (keep it secret, server-only)
  - `GITHUB_OWNER` — GitHub account or organization name
  - `GITHUB_REPO` — private repository name where images will be stored
  - `GITHUB_BRANCH` — branch to commit to (default: `main`)

Install server dependencies
---------------------------

On the server (project root), install these packages:

```bash
npm install mime sanitize-filename
```

Client prerequisites (face detection)
------------------------------------

- We use `face-api.js` in the browser to compute face descriptors and send them to the backend. You can use either `face-api.js` or the maintained fork `@vladmandic/face-api`.

Install on client side:

```bash
npm install @vladmandic/face-api
# or the original
npm install face-api.js
```

Model files
-----------

Download the required models (tiny_face_detector, face_landmark_68, face_recognition) and host them under `public/models/` so they are available at `/models/`.

Database
--------

Run the SQL in `supabase/event_tables.sql` to create tables and RLS policies.

API endpoints
-------------

- `POST /api/events` — create event (requires Authorization Bearer token)
- `GET /api/events` — list user's events
- `GET /api/events?event_id=...` — list images for event
- `POST /api/upload-image` — upload image (base64 payload). Backend saves to GitHub and inserts DB row
- `POST /api/process-faces` — accept descriptors and map to persons
- `GET /api/persons?event_id=...` — list persons for event
-- `POST /api/download-zip` — (removed in Phase-1) ZIP generation via R2 removed; can re-add GitHub-based ZIP later

Security notes
--------------

-- Keep `SUPABASE_SERVICE_KEY` and `GITHUB_TOKEN` secret — store them in your deployment environment only.
-- RLS policies in SQL ensure event access is limited to owners.
-- Images are stored in a private GitHub repo and served only through the backend proxy.

Frontend usage
--------------

- Visit `/events` to create events and open an event.
-- On the event page you can upload images; the browser will send a base64 payload to `/api/upload-image` and the backend will store the file in the private GitHub repo and insert a DB row.
- If face-api is available and models are loaded, the client will compute face descriptors and call `/api/process-faces` to group into persons.

Further improvements
--------------------

- Add pagination for events and images.
- Add thumbnails and lazy loading for gallery.
- Add visual grouping UI with per-person galleries and counts.
- Improve clustering (DB-side k-means, or use a dedicated vector DB) if scale requires.
