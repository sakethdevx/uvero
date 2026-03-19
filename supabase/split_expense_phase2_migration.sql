-- =====================================================
-- PaySplit Phase 2 migration (delta after Phase 1)
-- Safe to run after base split_expense_tables.sql is already applied.
-- =====================================================

begin;

-- =====================================================
-- EXPENSE RECEIPTS
-- =====================================================

create table if not exists public.split_expense_receipts (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.split_groups(id) on delete cascade,
  expense_id uuid not null references public.split_expenses(id) on delete cascade,
  uploaded_by_member_id uuid not null references public.split_group_members(id) on delete restrict,
  file_url text not null,
  file_name text,
  ocr_status text not null default 'pending' check (ocr_status in ('pending', 'completed', 'failed', 'not_requested')),
  ocr_text text,
  ocr_payload jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_split_expense_receipts_group_id
  on public.split_expense_receipts(group_id);

create index if not exists idx_split_expense_receipts_expense_id
  on public.split_expense_receipts(expense_id);

-- =====================================================
-- SETTLEMENT PAYMENT PROOFS
-- =====================================================

create table if not exists public.split_settlement_payment_proofs (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.split_groups(id) on delete cascade,
  settlement_id uuid not null references public.split_settlements(id) on delete cascade,
  uploaded_by_member_id uuid not null references public.split_group_members(id) on delete restrict,
  file_url text not null,
  file_name text,
  note text,
  proof_status text not null default 'submitted' check (proof_status in ('submitted', 'verified', 'rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create index if not exists idx_split_payment_proofs_group_id
  on public.split_settlement_payment_proofs(group_id);

create index if not exists idx_split_payment_proofs_settlement_id
  on public.split_settlement_payment_proofs(settlement_id);

-- =====================================================
-- REMINDERS
-- =====================================================

create table if not exists public.split_reminders (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.split_groups(id) on delete cascade,
  settlement_id uuid references public.split_settlements(id) on delete cascade,
  expense_id uuid references public.split_expenses(id) on delete cascade,
  from_member_id uuid references public.split_group_members(id) on delete set null,
  to_member_id uuid not null references public.split_group_members(id) on delete cascade,
  channel text not null default 'in_app' check (channel in ('in_app', 'email', 'sms', 'whatsapp')),
  message text not null,
  status text not null default 'sent' check (status in ('sent', 'acknowledged', 'dismissed')),
  created_at timestamptz not null default now()
);

create index if not exists idx_split_reminders_group_id
  on public.split_reminders(group_id);

create index if not exists idx_split_reminders_to_member
  on public.split_reminders(to_member_id, status);

-- =====================================================
-- RLS + service-role policies for new tables
-- =====================================================

alter table public.split_expense_receipts enable row level security;
alter table public.split_settlement_payment_proofs enable row level security;
alter table public.split_reminders enable row level security;

drop policy if exists "Service role full access - split_expense_receipts" on public.split_expense_receipts;
create policy "Service role full access - split_expense_receipts" on public.split_expense_receipts
  for all using (true) with check (true);

drop policy if exists "Service role full access - split_settlement_payment_proofs" on public.split_settlement_payment_proofs;
create policy "Service role full access - split_settlement_payment_proofs" on public.split_settlement_payment_proofs
  for all using (true) with check (true);

drop policy if exists "Service role full access - split_reminders" on public.split_reminders;
create policy "Service role full access - split_reminders" on public.split_reminders
  for all using (true) with check (true);

commit;
