-- SEC-04: process LIVE Stripe events and subscription changes atomically.
-- Edge verifies the Stripe signature and fetches current subscription state before RPC.
-- No new LIVE sales are enabled by this migration.
create or replace function public.kitora_commit_live_stripe_event_safe(
 p_event_id text,
 p_event_type text,
 p_user_id uuid,
 p_plan text,
 p_status text,
 p_customer_id text,
 p_subscription_id text,
 p_period_end timestamptz
) returns text
language plpgsql
set search_path = ''
as $function$
declare
 v_previous record;
 v_inserted integer;
begin
 if p_event_id is null or p_event_id !~ '^evt_[A-Za-z0-9]+$' or length(p_event_id)>255
    or p_event_type is null or length(p_event_type)>120
    or p_user_id is null
    or p_plan not in ('plus_monthly','plus_yearly')
    or p_status not in ('active','past_due','canceled','inactive')
    or p_subscription_id is null or p_subscription_id !~ '^sub_[A-Za-z0-9]+$'
    or p_customer_id is null or p_customer_id !~ '^cus_[A-Za-z0-9]+$'
 then raise exception 'Invalid LIVE subscription event arguments'; end if;
 -- Serialize all Stripe state transitions per user.
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_user_id::text, 20261019));
 insert into public.kitora_live_webhook_events(event_id,event_type,processed_at)
 values(p_event_id,p_event_type,now())
 on conflict(event_id) do nothing;
 get diagnostics v_inserted=row_count;
 if v_inserted=0 then return 'duplicate'; end if;
 select payment_subscription_id,status into v_previous
 from public.kitora_live_subscriptions where user_id=p_user_id for update;
 -- A cancellation/late webhook from another subscription must never downgrade
 -- an active or past_due subscription already linked to this user.
 if found and v_previous.payment_subscription_id<>p_subscription_id
    and v_previous.status in ('active','past_due') then
   return 'ignored_conflicting_subscription';
 end if;
 insert into public.kitora_live_subscriptions
   (user_id,plan,status,payment_customer_id,payment_subscription_id,current_period_end,updated_at)
 values(p_user_id,p_plan,p_status,p_customer_id,p_subscription_id,p_period_end,now())
 on conflict(user_id) do update set
   plan=excluded.plan,status=excluded.status,
   payment_customer_id=excluded.payment_customer_id,
   payment_subscription_id=excluded.payment_subscription_id,
   current_period_end=excluded.current_period_end,
   updated_at=excluded.updated_at;
 return 'applied';
end
$function$;
-- Invoker rights: only trusted server-side service_role may execute this function.
revoke all on function public.kitora_commit_live_stripe_event_safe(
 text,text,uuid,text,text,text,text,timestamptz
) from public,anon,authenticated;
grant execute on function public.kitora_commit_live_stripe_event_safe(
 text,text,uuid,text,text,text,text,timestamptz
) to service_role;
