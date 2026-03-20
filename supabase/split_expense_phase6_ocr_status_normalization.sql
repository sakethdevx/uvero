-- =====================================================
-- PaySplit Phase 6 migration
-- OCR status normalization for metadata-only receipt flow
-- =====================================================

begin;

update public.split_expense_receipts
set ocr_status = 'not_requested'
where ocr_status = 'pending'
  and (ocr_text is null or btrim(ocr_text) = '')
  and (
    ocr_payload is null
    or ocr_payload = '{}'::jsonb
    or ocr_payload = '[]'::jsonb
  );

alter table public.split_expense_receipts
  alter column ocr_status set default 'not_requested';

commit;
