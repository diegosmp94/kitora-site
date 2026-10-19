-- Enable Solo as an eligible plan in the existing verified LIVE webhook transaction.
-- Does NOT activate a Stripe price, create a charge, modify RLS, or enable checkout.
-- Keep Plus for subscriptions that may already exist.
ALTER TABLE public.kitora_live_subscriptions
 DROP CONSTRAINT kitora_live_subscriptions_plan_check,
 ADD CONSTRAINT kitora_live_subscriptions_plan_check
 CHECK (plan IN ('solo','plus_monthly','plus_yearly'));

DO $solo_live$
DECLARE
 fn text;
 old_clause text := 'p_plan not in (''plus_monthly'',''plus_yearly'')';
 new_clause text := 'p_plan not in (''plus_monthly'',''plus_yearly'',''solo'')';
BEGIN
 SELECT pg_get_functiondef(
  'public.kitora_commit_live_stripe_event_safe(text,text,uuid,text,text,text,text,timestamp with time zone)'::regprocedure
 ) INTO fn;
 IF fn IS NULL OR position(old_clause in fn)=0 THEN
   RAISE EXCEPTION 'Unexpected webhook RPC definition; abort Solo migration';
 END IF;
 EXECUTE replace(fn,old_clause,new_clause);
END
$solo_live$;

-- Existing service role security and the atomic deduplication/entitlement transaction are retained.
