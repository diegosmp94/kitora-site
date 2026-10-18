import {createClient} from "npm:@supabase/supabase-js@2";
const base={"Access-Control-Allow-Origin":"https://diegosmp94.github.io","Access-Control-Allow-Headers":"authorization, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS","Content-Type":"application/json","Cache-Control":"no-store"};
const reply=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:base});
Deno.serve(async req=>{
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers:base});
 if(req.method!=="POST")return reply({error:"Method not allowed"},405);
 const url=Deno.env.get("SUPABASE_URL"),anon=Deno.env.get("SUPABASE_ANON_KEY"),service=Deno.env.get("KITORA_SERVICE_ROLE_KEY")||Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
 if(!url||!anon||!service)return reply({error:"Service unavailable"},503);
 const token=req.headers.get("Authorization")||"";
 if(!token.startsWith("Bearer "))return reply({error:"Not authenticated"},401);
 try{
 const client=createClient(url,anon,{global:{headers:{Authorization:token}},auth:{persistSession:false,autoRefreshToken:false}});
 const {data:{user},error}=await client.auth.getUser();
 if(error||!user)return reply({error:"Not authenticated"},401);
 const admin=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:role,error:roleError}=await admin.from("kitora_admins").select("user_id").eq("user_id",user.id).maybeSingle();
 if(roleError||!role)return reply({error:"Forbidden"},403);
 const staleBefore=new Date(Date.now()-10*60*1000).toISOString();
 const [pending,stale,pastDue,active,usage,queueWaiting,queueRunning,queueFailed,ultimateWaiting]=await Promise.all([
  admin.from("kitora_stripe_webhook_events").select("event_id",{head:true,count:"exact"}).is("processed_at",null),
  admin.from("kitora_stripe_webhook_events").select("event_id",{head:true,count:"exact"}).is("processed_at",null).lt("created_at",staleBefore),
  admin.from("subscriptions").select("user_id",{head:true,count:"exact"}).eq("status","past_due"),
  admin.from("subscriptions").select("user_id",{head:true,count:"exact"}).eq("status","active"),
  admin.from("kitora_ai_reservations").select("request_id",{head:true,count:"exact"}).is("completed_at",null).lt("created_at",staleBefore),
  admin.from("kitora_ai_jobs").select("request_id",{head:true,count:"exact"}).eq("status","queued"),
  admin.from("kitora_ai_jobs").select("request_id",{head:true,count:"exact"}).eq("status","processing"),
  admin.from("kitora_ai_jobs").select("request_id",{head:true,count:"exact"}).eq("status","failed"),
  admin.from("kitora_ai_jobs").select("request_id",{head:true,count:"exact"}).eq("status","queued").eq("plan","ultimate")
 ]);
 const entries={pending_webhooks:pending,stale_webhooks:stale,past_due_subscriptions:pastDue,active_subscriptions:active,stale_ai_reservations:usage,ai_queue_waiting:queueWaiting,ai_queue_running:queueRunning,ai_queue_failed:queueFailed,ai_queue_ultimate_waiting:ultimateWaiting};
 if(Object.values(entries).some(x=>x.error))return reply({error:"Monitoring query failed"},503);
 return reply({checked_at:new Date().toISOString(),mode:"test",metrics:Object.fromEntries(Object.entries(entries).map(([name,r])=>[name,r.count??0])),limits:{webhook_stale_minutes:10,ai_stale_minutes:10}});
 }catch(error){console.error("health check failed",error);return reply({error:"Monitoring unavailable"},503)}
});