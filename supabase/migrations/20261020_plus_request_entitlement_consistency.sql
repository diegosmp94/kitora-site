-- Kitora Plus: request creation must honour the same LIVE-before-TEST billing precedence
-- as the trusted generate-plus function and front-end entitlements.
-- This changes only INSERT permission. Existing requests and administrator rights remain intact.
DROP POLICY IF EXISTS subscriber_create_active_only ON public.subscriber_requests;
CREATE POLICY subscriber_create_active_only
 ON public.subscriber_requests FOR INSERT TO authenticated
 WITH CHECK (
   user_id = (select auth.uid())
   AND status = 'new'
   AND admin_reply IS NULL
   AND ai_result IS NULL
   AND ai_generated_at IS NULL
   AND (
     EXISTS (
       SELECT 1 FROM public.kitora_live_subscriptions ls
       WHERE ls.user_id = (select auth.uid())
         AND ls.status = 'active'
         AND ls.plan IN ('plus_monthly','plus_yearly','ultimate')
     )
     OR (
       NOT EXISTS (
         SELECT 1 FROM public.kitora_live_subscriptions ls
         WHERE ls.user_id = (select auth.uid())
       )
       AND EXISTS (
         SELECT 1 FROM public.subscriptions s
         WHERE s.user_id = (select auth.uid())
           AND s.status = 'active'
           AND s.plan IN ('plus_monthly','plus_yearly','ultimate')
       )
     )
   )
 );
