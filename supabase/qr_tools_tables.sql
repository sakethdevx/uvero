-- =====================================================
-- QR Tools — Dynamic QR Codes
-- =====================================================

-- Dynamic QR codes: each code has a mutable destination URL
create table if not exists public.qr_dynamic_codes (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users on delete cascade,
  title         text not null default '',
  short_code    text not null unique,
  destination_url text not null,
  scan_count    integer not null default 0,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Index for redirect lookups (hot path)
create index if not exists qr_dynamic_codes_short_code_idx on public.qr_dynamic_codes (short_code);
create index if not exists qr_dynamic_codes_user_id_idx on public.qr_dynamic_codes (user_id);

-- Scan events: one row per scan
create table if not exists public.qr_scans (
  id          uuid primary key default gen_random_uuid(),
  code_id     uuid not null references public.qr_dynamic_codes on delete cascade,
  scanned_at  timestamptz not null default now(),
  country     text,
  user_agent  text
);

create index if not exists qr_scans_code_id_idx on public.qr_scans (code_id);
create index if not exists qr_scans_scanned_at_idx on public.qr_scans (scanned_at);

-- RPC helper: atomically increment scan_count
create or replace function public.qr_increment_scan_count(code_id_arg uuid)
returns void
language sql
security definer
as $$
  update public.qr_dynamic_codes
  set scan_count = scan_count + 1,
      updated_at = now()
  where id = code_id_arg;
$$;

-- Row Level Security
alter table public.qr_dynamic_codes enable row level security;
alter table public.qr_scans enable row level security;

-- Users can only read/write their own codes
create policy "Users manage own dynamic QR codes"
  on public.qr_dynamic_codes
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Users can view scans for their own codes
create policy "Users view scans for own codes"
  on public.qr_scans
  for select
  using (
    exists (
      select 1 from public.qr_dynamic_codes
      where id = qr_scans.code_id
        and user_id = auth.uid()
    )
  );

-- Service role (used by API) can read codes for redirect (bypasses RLS)
-- No additional grant needed — service key bypasses RLS by default
