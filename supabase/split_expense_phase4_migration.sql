-- =====================================================
-- PaySplit Phase 4 migration
-- Guest-to-account claim + invite recovery codes
-- =====================================================

begin;

create extension if not exists pgcrypto;

-- =====================================================
-- GROUP RECOVERY CODES
-- =====================================================

create table if not exists public.split_group_recovery_codes (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.split_groups(id) on delete cascade,
  code_hash text not null,
  code_hint text,
  created_by_member_id uuid not null references public.split_group_members(id) on delete restrict,
  used_by_user_id uuid references auth.users(id) on delete set null,
  expires_at timestamptz,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists idx_split_group_recovery_codes_hash
  on public.split_group_recovery_codes(code_hash);

create index if not exists idx_split_group_recovery_codes_group
  on public.split_group_recovery_codes(group_id);

-- =====================================================
-- RLS + service-role policy
-- =====================================================

alter table public.split_group_recovery_codes enable row level security;

drop policy if exists "Service role full access - split_group_recovery_codes" on public.split_group_recovery_codes;
create policy "Service role full access - split_group_recovery_codes" on public.split_group_recovery_codes
  for all using (true) with check (true);

commit;
