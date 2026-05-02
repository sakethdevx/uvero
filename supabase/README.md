# Supabase Setup Guide for Uvero

This directory contains the database schema, security policies, and automation scripts required to power the Uvero platform. Follow these steps to set up your Supabase project correctly.

## 1. Project Initialization
- Create a new project at [supabase.com](https://supabase.com).
- Note your `Project URL` and `Anon Key` (found in Project Settings -> API).

## 2. Database Schema Setup
Execute the SQL scripts in the **SQL Editor** in the following order to ensure dependencies are handled correctly:

1.  **[profiles_table.sql](file:///Users/saketh_jangala/Documents/Projects/Antigravity/uvero/supabase/profiles_table.sql)**: Core user profiles and account-synced settings. Also sets up the automatic auth-to-profile data mirroring trigger.
2.  **[clipboard_tables.sql](file:///Users/saketh_jangala/Documents/Projects/Antigravity/uvero/supabase/clipboard_tables.sql)**: Tables for the Universal Clipboard service.
3.  **[event_tables.sql](file:///Users/saketh_jangala/Documents/Projects/Antigravity/uvero/supabase/event_tables.sql)**: Tables for the PhotoDrop (AI Photo Organizer) service. *Requires `pgvector` extension.*
4.  **[split_expense_tables.sql](file:///Users/saketh_jangala/Documents/Projects/Antigravity/uvero/supabase/split_expense_tables.sql)**: Tables for the PaySplit service.
5.  **[qr_tools_tables.sql](file:///Users/saketh_jangala/Documents/Projects/Antigravity/uvero/supabase/qr_tools_tables.sql)**: Tables for QR code generation and tracking.

## 3. Authentication Configuration
- **Site URL**: In Supabase Auth -> Settings, set the `Site URL` to your deployment origin (e.g., `http://localhost:5173` for local dev).
- **External Providers**: Enable Google, GitHub, or other providers in the "External OAuth Providers" section. 
- **Redirects**: Ensure your callbacks point to your site URL.

## 4. Security (RLS)
Uvero uses **Row Level Security (RLS)** to protect user data. 
- All tables have RLS enabled by default in the SQL scripts.
- Policies are designed so users can only access their own data or data they have been explicitly invited to (e.g., shared expenses or photo events).
- **Never disable RLS in production.**

## 5. Environment Variables
Add the following variables to your `.env` (local) or Vercel Environment Variables:

```env
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key

# Optional: PhotoDrop AI Processing (Hugging Face)
HF_FACEPROCESSING_TOKEN=your_token
HF_FACEPROCESSING_URL=your_api_endpoint
```

> [!NOTE]
> The `authService.js` and `ModeContext.jsx` in the `src/` directory are already configured to interact with this schema. Syncing is handled automatically via database triggers.

> [!IMPORTANT]
> Always use `VITE_SUPABASE_ANON_KEY` for client-side code. The `SUPABASE_SERVICE_KEY` should **never** be exposed in the frontend; it should only be used in secure backend environments or Edge Functions.
