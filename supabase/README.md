Supabase setup and schema for Uvero

This folder contains guidance and SQL for creating the `profiles` table and RLS policies used by the app.

1) Create a Supabase project

- Go to <https://app.supabase.com/> and create a new project (free tier is sufficient).
- Note the `Project URL` and `anon` public key from Project Settings -> API.
- Add these to your local environment as `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

1) Database schema

- Run the SQL in `profiles_table.sql` in Supabase SQL editor or via psql.

1) Row Level Security (RLS)

- RLS is enabled in the SQL file; it includes policies to allow users to read/update only their own profile.

1) Optional service key

- For server-side operations (e.g., migrating data) use SUPABASE_SERVICE_KEY from Project Settings -> Service API Keys. NEVER expose this in the browser.

1) Redirects and Auth

- In Supabase Auth settings, set the site URL (and any allowed redirect URLs) to your deployment origin (e.g., `http://localhost:5173` for local dev). This is important for magic links and OAuth callbacks.

1) Future OAuth

- You can enable providers (Google/GitHub/etc.) in Supabase Auth -> Settings -> External OAuth Providers. The `authService` has a scaffold function `signInWithProvider` to call for provider sign-ins.

Local dev notes

- Copy `.env.example` to `.env` or set variables in your environment.
- Install deps: `npm install`
- Start dev server: `npm run dev`

Security notes

- Use `SUPABASE_SERVICE_KEY` only on server-side code.
- Keep anon key in environment and rotate if leaked.
