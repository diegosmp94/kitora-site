-- Already applied to the Supabase database. Security invoker: checks auth.uid and subscription.
-- Atomic client-side autosave compare-and-swap prevents concurrent device overwrite.
create or replace function public.kitora_cloud_save_cas(
 p_module text,p_payload jsonb,p_expected_payload jsonb default null
) returns jsonb language plpgsql security invoker set search_path=public as $$
declare v_user uuid := (select auth.uid()); v_current jsonb; v_timestamp timestamptz; v_plan text;
begin
 if v_user is null then return jsonb_build_object('status','unauthorized'); end if;
 if p_module not in ('projects','agenda','learn','notes','challenge','focus')
 or p_payload is null or octet_length(p_payload::text)>150000
 then return jsonb_build_object('status','invalid_payload'); end if;
 select s.plan into v_plan from public.subscriptions s where s.user_id=v_user and s.status='active' and s.plan in ('workspace','ultimate');
 if v_plan is null then return jsonb_build_object('status','subscription_required'); end if;
 perform pg_advisory_xact_lock(hashtextextended(v_user::text||':'||p_module, 7819));
 select b.payload into v_current from public.kitora_workspace_backup b where b.user_id=v_user and b.module=p_module for update;
 if found then
  if v_current is distinct from p_expected_payload then return jsonb_build_object('status','conflict'); end if;
  update public.kitora_workspace_backup set payload=p_payload,updated_at=now()
  where user_id=v_user and module=p_module returning updated_at into v_timestamp;
 else
  if p_expected_payload is not null then return jsonb_build_object('status','conflict'); end if;
  insert into public.kitora_workspace_backup(user_id,module,payload,updated_at)
  values(v_user,p_module,p_payload,now()) returning updated_at into v_timestamp;
 end if;
 return jsonb_build_object('status','saved','updated_at',v_timestamp);
end $$;
revoke all on function public.kitora_cloud_save_cas(text,jsonb,jsonb) from public,anon;
grant execute on function public.kitora_cloud_save_cas(text,jsonb,jsonb) to authenticated;