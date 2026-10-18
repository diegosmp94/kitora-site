-- Kitora priority queue schema (already applied to Supabase on 2026-10-18).
-- Contains NO secret values. Use migrations with review; do not rerun on a live system without a backup.
create table if not exists public.kitora_ai_jobs (
 request_id uuid primary key references public.subscriber_requests(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 plan text not null check(plan in ('plus_monthly','plus_yearly','ultimate')),
 priority integer not null check(priority between 0 and 100),
 status text not null default 'queued' check(status in ('queued','processing','completed','failed')),
 attempts integer not null default 0,
 max_attempts integer not null default 3,
 run_after timestamptz not null default now(),
 created_at timestamptz not null default now(),
 started_at timestamptz,
 finished_at timestamptz,
 lease_token uuid,
 error_code text
);
alter table public.kitora_ai_jobs enable row level security;
revoke all on public.kitora_ai_jobs from public,anon,authenticated;
grant select,insert,update,delete on public.kitora_ai_jobs to service_role;
create index if not exists kitora_ai_jobs_claim_idx on public.kitora_ai_jobs(status,run_after,priority desc,created_at);
create index if not exists kitora_ai_jobs_user_idx on public.kitora_ai_jobs(user_id,created_at desc);

create or replace function public.kitora_claim_ai_job()
returns table(request_id uuid,user_id uuid,plan text,lease_token uuid,attempts integer)
language plpgsql security invoker set search_path=public as $$
begin
 update public.kitora_ai_jobs j set status='queued',lease_token=null,run_after=now()
 where j.status='processing' and j.started_at<now()-interval '3 minutes' and j.attempts<j.max_attempts;
 update public.kitora_ai_jobs j set status='failed',finished_at=now(),error_code='timeout'
 where j.status='processing' and j.started_at<now()-interval '3 minutes' and j.attempts>=j.max_attempts;
 return query with next as (
 select j.request_id from public.kitora_ai_jobs j
 where j.status='queued' and j.run_after<=now()
 order by (j.priority + least(50,extract(epoch from(now()-j.created_at))/300.0)) desc,j.created_at asc
 for update skip locked limit 1
 ) update public.kitora_ai_jobs j
 set status='processing',attempts=j.attempts+1,started_at=now(),lease_token=gen_random_uuid()
 from next where j.request_id=next.request_id
 returning j.request_id,j.user_id,j.plan,j.lease_token,j.attempts;
end $$;
revoke all on function public.kitora_claim_ai_job() from public,anon,authenticated;
grant execute on function public.kitora_claim_ai_job() to service_role;

-- Supabase Vault + pg_cron + pg_net are configured on the project, with a random internal token.
-- Never put the decrypted worker token in this repository.
-- Role-restricted verification function kitora_verify_worker_token(text) is already deployed.
