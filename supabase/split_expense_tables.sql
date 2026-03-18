-- =====================================================
-- TripSplit / Split Expense schema for Uvero
-- Supports signed-in users + guest sessions
-- =====================================================

create extension if not exists pgcrypto;

-- =====================================================
-- GROUPS
-- =====================================================

create table if not exists public.split_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  currency text not null default 'INR',
  invite_code text not null unique,
  created_by_user_id uuid references auth.users(id) on delete set null,
  created_by_guest_session text,
  is_guest_group boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_split_groups_created_by_user on public.split_groups(created_by_user_id);
create index if not exists idx_split_groups_invite_code on public.split_groups(invite_code);

-- =====================================================
-- GROUP MEMBERS
-- =====================================================

create table if not exists public.split_group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.split_groups(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  guest_session text,
  display_name text not null,
  email text,
  role text not null default 'member' check (role in ('owner', 'member')),
  upi_id text,
  upi_mobile text,
  upi_qr_url text,
  payment_note text,
  joined_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (user_id is not null or guest_session is not null)
);

create unique index if not exists idx_split_member_user_unique
  on public.split_group_members(group_id, user_id)
  where user_id is not null;

create unique index if not exists idx_split_member_guest_unique
  on public.split_group_members(group_id, guest_session)
  where guest_session is not null;

create index if not exists idx_split_members_group_id on public.split_group_members(group_id);

-- =====================================================
-- EXPENSES
-- =====================================================

create table if not exists public.split_expenses (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.split_groups(id) on delete cascade,
  title text not null,
  note text,
  amount_paise bigint not null check (amount_paise > 0),
  currency text not null default 'INR',
  split_mode text not null default 'equal' check (split_mode in ('equal', 'exact', 'percentage', 'shares')),
  paid_by_member_id uuid not null references public.split_group_members(id) on delete restrict,
  incurred_on date not null default current_date,
  created_by_member_id uuid not null references public.split_group_members(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_split_expenses_group_id on public.split_expenses(group_id);
create index if not exists idx_split_expenses_incurred_on on public.split_expenses(incurred_on desc);

-- =====================================================
-- EXPENSE SHARES
-- =====================================================

create table if not exists public.split_expense_shares (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid not null references public.split_expenses(id) on delete cascade,
  member_id uuid not null references public.split_group_members(id) on delete cascade,
  share_paise bigint not null check (share_paise >= 0),
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create unique index if not exists idx_split_expense_share_unique
  on public.split_expense_shares(expense_id, member_id);

create index if not exists idx_split_expense_shares_member_id on public.split_expense_shares(member_id);

-- =====================================================
-- SETTLEMENTS
-- =====================================================

create table if not exists public.split_settlements (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.split_groups(id) on delete cascade,
  from_member_id uuid not null references public.split_group_members(id) on delete restrict,
  to_member_id uuid not null references public.split_group_members(id) on delete restrict,
  amount_paise bigint not null check (amount_paise > 0),
  currency text not null default 'INR',
  status text not null default 'pending' check (status in ('pending', 'paid', 'confirmed', 'cancelled')),
  upi_link text,
  reference_note text,
  created_by_member_id uuid not null references public.split_group_members(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  confirmed_at timestamptz,
  check (from_member_id <> to_member_id)
);

create index if not exists idx_split_settlements_group_id on public.split_settlements(group_id);
create index if not exists idx_split_settlements_status on public.split_settlements(status);

-- =====================================================
-- UPDATED_AT TRIGGER
-- =====================================================

create or replace function public.set_split_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_split_groups_updated_at on public.split_groups;
create trigger trg_split_groups_updated_at
before update on public.split_groups
for each row execute procedure public.set_split_updated_at();

drop trigger if exists trg_split_group_members_updated_at on public.split_group_members;
create trigger trg_split_group_members_updated_at
before update on public.split_group_members
for each row execute procedure public.set_split_updated_at();

drop trigger if exists trg_split_expenses_updated_at on public.split_expenses;
create trigger trg_split_expenses_updated_at
before update on public.split_expenses
for each row execute procedure public.set_split_updated_at();

drop trigger if exists trg_split_settlements_updated_at on public.split_settlements;
create trigger trg_split_settlements_updated_at
before update on public.split_settlements
for each row execute procedure public.set_split_updated_at();

-- =====================================================
-- RLS (API uses service role key)
-- =====================================================

alter table public.split_groups enable row level security;
alter table public.split_group_members enable row level security;
alter table public.split_expenses enable row level security;
alter table public.split_expense_shares enable row level security;
alter table public.split_settlements enable row level security;

drop policy if exists "Service role full access - split_groups" on public.split_groups;
create policy "Service role full access - split_groups" on public.split_groups
  for all using (true) with check (true);

drop policy if exists "Service role full access - split_group_members" on public.split_group_members;
create policy "Service role full access - split_group_members" on public.split_group_members
  for all using (true) with check (true);

drop policy if exists "Service role full access - split_expenses" on public.split_expenses;
create policy "Service role full access - split_expenses" on public.split_expenses
  for all using (true) with check (true);

drop policy if exists "Service role full access - split_expense_shares" on public.split_expense_shares;
create policy "Service role full access - split_expense_shares" on public.split_expense_shares
  for all using (true) with check (true);

drop policy if exists "Service role full access - split_settlements" on public.split_settlements;
create policy "Service role full access - split_settlements" on public.split_settlements
  for all using (true) with check (true);
