-- =====================================================
-- PaySplit Phase 5 migration
-- Receipt storage metadata for link-vs-upload support
-- =====================================================

begin;

alter table public.split_expense_receipts
  add column if not exists storage_mode text not null default 'external_link'
    check (storage_mode in ('external_link', 'github_upload')),
  add column if not exists storage_provider text,
  add column if not exists storage_path text,
  add column if not exists source_url text,
  add column if not exists file_mime_type text,
  add column if not exists size_bytes bigint;

create index if not exists idx_split_expense_receipts_storage_mode
  on public.split_expense_receipts(storage_mode);

create index if not exists idx_split_expense_receipts_storage_provider
  on public.split_expense_receipts(storage_provider);

update public.split_expense_receipts
set source_url = file_url
where source_url is null
  and file_url is not null
  and storage_mode = 'external_link';

commit;
