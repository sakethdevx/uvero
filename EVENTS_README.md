Event Photo Organizer — Implementation Notes and Setup

Overview
--------

This module adds event creation, image uploads to Cloudflare R2, face detection via face-api.js (browser), grouping into persons, and ZIP downloads.

Server prerequisites
--------------------

- Add these environment variables to your deployment (Vercel / Node host):
  - `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` (service role key)
  - `R2_ACCOUNT_ID` — your Cloudflare account id used in R2 endpoints
  - `R2_BUCKET` — your R2 bucket name
  - `R2_ACCESS_KEY_ID` and `R2_SECRET_ACCESS_KEY`

Install server dependencies
---------------------------

On the server (project root), install these packages:

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner archiver
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
- `POST /api/gen-upload-url` — returns presigned PUT URL for R2
- `POST /api/confirm-upload` — create image row after upload
- `POST /api/process-faces` — accept descriptors and map to persons
- `GET /api/persons?event_id=...` — list persons for event
- `POST /api/download-zip` — create ZIP and stream images (requires R2 creds)

Security notes
--------------

- Keep `SUPABASE_SERVICE_KEY` and R2 keys secret — store them in your deployment environment only.
- RLS policies in SQL ensure event access is limited to owners.
- Presigned URLs expire quickly (10 minutes) and uploads are stored under `events/{event_id}/`.

Frontend usage
--------------

- Visit `/events` to create events and open an event.
- On the event page you can upload images; the browser will call `/api/gen-upload-url`, PUT the file to R2, then call `/api/confirm-upload`.
- If face-api is available and models are loaded, the client will compute face descriptors and call `/api/process-faces` to group into persons.

Further improvements
--------------------

- Add pagination for events and images.
- Add thumbnails and lazy loading for gallery.
- Add visual grouping UI with per-person galleries and counts.
- Improve clustering (DB-side k-means, or use a dedicated vector DB) if scale requires.
