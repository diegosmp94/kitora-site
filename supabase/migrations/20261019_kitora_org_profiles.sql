-- Kitora Pro: individual owner's billing profile for future organization plans.
-- This does not create or activate a paid subscription or a shared team tenancy.
create table if not exists public.kitora_org_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  kind text not null check (kind in ('entreprise','association')),
  legal_name text not null check (char_length(btrim(legal_name)) between 1 and 180),
  trade_name text not null default '' check (char_length(trade_name)<=180),
  plan_interest text not null default 'impact' check (plan_interest in ('impact','launch','flow','creative','horizon')),
  siren text not null default '' check (siren = '' or siren ~ '^[0-9]{9}$'),
  siret text not null default '' check (siret = '' or siret ~ '^[0-9]{14}$'),
  legal_form text not null default '' check (char_length(legal_form)<=100),
  share_capital text not null default '' check (char_length(share_capital)<=90),
  rcs text not null default '' check (char_length(rcs)<=160),
  vat_number text not null default '' check (char_length(vat_number)<=50),
  vat_mode text not null default 'standard' check (vat_mode in ('standard','franchise_293b','autre_exoneration')),
  vat_exemption_note text not null default '' check (char_length(vat_exemption_note)<=250),
  address text not null default '' check (char_length(address)<=300),
  postal_code text not null default '' check (char_length(postal_code)<=30),
  city text not null default '' check (char_length(city)<=120),
  country text not null default 'France' check (char_length(country)<=90),
  email text not null default '' check (char_length(email)<=180),
  phone text not null default '' check (char_length(phone)<=60),
  payment_terms text not null default 'À l’échéance indiquée' check (char_length(payment_terms)<=180),
  late_penalties text not null default 'Selon les conditions contractuelles applicables' check (char_length(late_penalties)<=180),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.kitora_org_profiles enable row level security;
revoke all on public.kitora_org_profiles from anon, public;
grant select, insert, update, delete on public.kitora_org_profiles to authenticated;
drop policy if exists "kitora_org_profile_select_owner" on public.kitora_org_profiles;
drop policy if exists "kitora_org_profile_insert_owner" on public.kitora_org_profiles;
drop policy if exists "kitora_org_profile_update_owner" on public.kitora_org_profiles;
drop policy if exists "kitora_org_profile_delete_owner" on public.kitora_org_profiles;
create policy "kitora_org_profile_select_owner" on public.kitora_org_profiles for select to authenticated using (user_id = (select auth.uid()));
create policy "kitora_org_profile_insert_owner" on public.kitora_org_profiles for insert to authenticated with check (user_id = (select auth.uid()));
create policy "kitora_org_profile_update_owner" on public.kitora_org_profiles for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "kitora_org_profile_delete_owner" on public.kitora_org_profiles for delete to authenticated using (user_id = (select auth.uid()));
create or replace function public.kitora_org_profile_touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end $$;
drop trigger if exists kitora_org_profile_updated_at on public.kitora_org_profiles;
create trigger kitora_org_profile_updated_at before update on public.kitora_org_profiles
for each row execute function public.kitora_org_profile_touch_updated_at();
