Supabase setup and schema for Uvero

This folder contains guidance and SQL for creating the `profiles` table and RLS policies used by the app.

1) Create a Supabase project

1) Database schema

1) Row Level Security (RLS)

1) Optional service key

- If you plan to use Hugging Face server-side detection, also add `HF_FACEPROCESSING_TOKEN` and `HF_FACEPROCESSING_URL` to your deployment environment (Vercel Environment Variables). Do NOT commit your token.

- In Supabase Auth settings, set the site URL (and any allowed redirect URLs) to your deployment origin (e.g., `http://localhost:5173` for local dev). This is important for magic links and OAuth callbacks.

- You can enable providers (Google/GitHub/etc.) in Supabase Auth -> Settings -> External OAuth Providers. The `authService` has a scaffold function `signInWithProvider` to call for provider sign-ins.

- Copy `.env.example` to `.env` or set variables in your environment.
- Install deps: `npm install`

- Use `SUPABASE_SERVICE_KEY` only on server-side code.
- Keep anon key in environment and rotate if leaked.
