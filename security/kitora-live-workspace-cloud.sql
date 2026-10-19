-- Kitora Workspace/Ultimate: honor authoritative LIVE entitlement for CAS cloud writes.
-- Preserve invoker rights/RLS, payload limits, per-module lock and conflict handling.
CREATE OR REPLACE FUNCTION public.kitora_cloud_save_cas(
 p_module text, p_payload jsonb, p_expected_payload jsonb DEFAULT NULL::jsonb
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public'
AS $function$
DECLARE
 v_user uuid := (select auth.uid());
 v_current jsonb;
 v_timestamp timestamptz;
 v_plan text;
 v_status text;
BEGIN
 IF v_user IS NULL THEN RETURN jsonb_build_object('status','unauthorized'); END IF;
 IF p_module NOT IN ('projects','agenda','learn','notes','challenge','focus')
    OR p_payload IS NULL OR octet_length(p_payload::text)>150000
 THEN RETURN jsonb_build_object('status','invalid_payload'); END IF;
 -- LIVE has precedence, even if canceled: no fallback to an active TEST row.
 SELECT ls.plan,ls.status INTO v_plan,v_status
 FROM public.kitora_live_subscriptions ls WHERE ls.user_id=v_user;
 IF NOT FOUND THEN
  SELECT s.plan,s.status INTO v_plan,v_status
  FROM public.subscriptions s WHERE s.user_id=v_user;
 END IF;
 IF v_status IS DISTINCT FROM 'active' OR v_plan NOT IN ('workspace','ultimate')
 THEN RETURN jsonb_build_object('status','subscription_required'); END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(v_user::text||':'||p_module, 7819));
 SELECT b.payload INTO v_current FROM public.kitora_workspace_backup b
 WHERE b.user_id=v_user AND b.module=p_module FOR UPDATE;
 IF FOUND THEN
  IF v_current IS DISTINCT FROM p_expected_payload THEN
   RETURN jsonb_build_object('status','conflict');
  END IF;
  UPDATE public.kitora_workspace_backup SET payload=p_payload,updated_at=now()
  WHERE user_id=v_user AND module=p_module RETURNING updated_at INTO v_timestamp;
 ELSE
  IF p_expected_payload IS NOT NULL THEN RETURN jsonb_build_object('status','conflict'); END IF;
  INSERT INTO public.kitora_workspace_backup(user_id,module,payload,updated_at)
  VALUES(v_user,p_module,p_payload,now()) RETURNING updated_at INTO v_timestamp;
 END IF;
 RETURN jsonb_build_object('status','saved','updated_at',v_timestamp);
END $function$;
