-- SEC-08. Limit the number of cloud drafts per authenticated owner.
-- Existing data is preserved; inserts beyond the quota fail.
create or replace function public.kitora_check_invoice_draft_quota()
returns trigger language plpgsql set search_path = '' as $$
declare v_count integer;
begin
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(new.user_id::text,20261019));
 select count(*) into v_count from public.kitora_invoice_drafts where user_id=new.user_id;
 if v_count >= 100 then
  raise exception 'Draft quota reached (100 documents)' using errcode='check_violation';
 end if;
 return new;
end $$;
drop trigger if exists kitora_invoice_draft_quota_before_insert on public.kitora_invoice_drafts;
create trigger kitora_invoice_draft_quota_before_insert
before insert on public.kitora_invoice_drafts
for each row execute function public.kitora_check_invoice_draft_quota();
revoke execute on function public.kitora_check_invoice_draft_quota() from public,anon,authenticated;
