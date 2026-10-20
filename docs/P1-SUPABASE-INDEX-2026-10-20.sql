-- Applied to Supabase project yxjxizxzjubhjaxskksh on 2026-10-20.
-- Verified in pg_indexes; performance advisor no longer reports unindexed_foreign_keys.
-- Idempotent reference for environment reconciliation; do not run twice without checking migration history.
CREATE INDEX IF NOT EXISTS kitora_user_documents_source_request_id_idx
  ON public.kitora_user_documents (source_request_id);
