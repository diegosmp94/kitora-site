-- KITORA SECURITY PATCH 2026-10-19, SEC-01.
-- RLS does not protect TRUNCATE; TRIGGER/REFERENCES are not required for the web client.
-- Deliberately preserve SELECT, INSERT, UPDATE, DELETE on user-owned documents and profiles.
revoke truncate, trigger, references on table
  public.kitora_invoice_drafts,
  public.kitora_org_profiles
from authenticated;
-- Explicitly remove unnecessary default execute rights on trigger functions.
-- Triggers already installed continue to operate.
revoke execute on function public.kitora_invoice_drafts_touch() from public, anon, authenticated;
revoke execute on function public.kitora_org_profile_touch_updated_at() from public, anon, authenticated;
