-- Kitora Pro: optional cloud library of NON-ISSUED invoice drafts only.
-- No official invoice numbering, tax filing, payment collection or e-invoicing.
create table if not exists public.kitora_invoice_drafts (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 kind text not null default 'invoice' check (kind in ('invoice','credit')),
 status text not null default 'draft' check (status in ('draft','review')),
 client_name text not null default 'Client à renseigner' check (char_length(client_name) between 1 and 180),
 document jsonb not null default '{}'::jsonb check (jsonb_typeof(document)='object' and pg_column_size(document)<=65536),
 total_ht_cents bigint not null default 0 check (total_ht_cents between 0 and 100000000000),
 total_vat_cents bigint not null default 0 check (total_vat_cents between 0 and 100000000000),
 total_ttc_cents bigint generated always as (total_ht_cents + total_vat_cents) stored,
 revision integer not null default 1 check (revision > 0),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists kitora_invoice_drafts_owner_recent_idx
 on public.kitora_invoice_drafts(user_id,updated_at desc);
alter table public.kitora_invoice_drafts enable row level security;
revoke all on public.kitora_invoice_drafts from public,anon;
grant select,insert,update,delete on public.kitora_invoice_drafts to authenticated;
drop policy if exists kitora_invoice_drafts_owner_select on public.kitora_invoice_drafts;
drop policy if exists kitora_invoice_drafts_owner_insert on public.kitora_invoice_drafts;
drop policy if exists kitora_invoice_drafts_owner_update on public.kitora_invoice_drafts;
drop policy if exists kitora_invoice_drafts_owner_delete on public.kitora_invoice_drafts;
create policy kitora_invoice_drafts_owner_select on public.kitora_invoice_drafts
 for select to authenticated using (user_id=(select auth.uid()));
create policy kitora_invoice_drafts_owner_insert on public.kitora_invoice_drafts
 for insert to authenticated with check (user_id=(select auth.uid()));
create policy kitora_invoice_drafts_owner_update on public.kitora_invoice_drafts
 for update to authenticated using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()));
create policy kitora_invoice_drafts_owner_delete on public.kitora_invoice_drafts
 for delete to authenticated using (user_id=(select auth.uid()));
create or replace function public.kitora_invoice_drafts_touch()
 returns trigger language plpgsql set search_path = '' as $$
begin
 new.updated_at=now();
 new.revision=old.revision+1;
 return new;
end $$;
drop trigger if exists kitora_invoice_drafts_update on public.kitora_invoice_drafts;
create trigger kitora_invoice_drafts_update
 before update on public.kitora_invoice_drafts
 for each row execute function public.kitora_invoice_drafts_touch();
comment on table public.kitora_invoice_drafts is
 'Kitora Pro user-owned pre-issuance documents only. Status draft/review is not issued. No fiscal invoice number.';
