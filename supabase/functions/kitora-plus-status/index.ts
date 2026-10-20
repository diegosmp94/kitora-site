import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {createClient} from "npm:@supabase/supabase-js@2";
const headers={"Access-Control-Allow-Origin":"https://diegosmp94.github.io","Access-Control-Allow-Headers":"authorization, apikey, content-type","Access-Control-Allow-Methods":"GET, OPTIONS","Content-Type":"application/json","Cache-Control":"no-store"};
const reply=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers});
const allowedPlans=new Set(["plus_monthly","plus_yearly","ultimate"]);
Deno.serve(async request=>{
 if(request.method==="OPTIONS")return new Response(null,{status:204,headers});
 if(request.method!=="GET")return reply({error:"Méthode interdite"},405);
 const auth=request.headers.get("Authorization")||"";
 if(!auth.startsWith("Bearer "))return reply({error:"Connexion requise"},401);
 const url=Deno.env.get("SUPABASE_URL");
 const anon=Deno.env.get("SUPABASE_ANON_KEY");
 const key=Deno.env.get("KITORA_SERVICE_ROLE_KEY")||Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
 if(!url||!anon||!key)return reply({error:"Service indisponible"},503);
 const userDb=createClient(url,anon,{global:{headers:{Authorization:auth}},auth:{autoRefreshToken:false,persistSession:false}});
 const {data:{user},error:userError}=await userDb.auth.getUser();
 if(userError||!user)return reply({error:"Session non valide"},401);
 const db=createClient(url,key,{auth:{autoRefreshToken:false,persistSession:false}});
 const [live,test,requests]=await Promise.all([
  db.from("kitora_live_subscriptions").select("plan,status").eq("user_id",user.id).maybeSingle(),
  db.from("subscriptions").select("plan,status").eq("user_id",user.id).maybeSingle(),
  db.from("subscriber_requests").select("id,title,category,format,status,created_at,ai_generated_at").eq("user_id",user.id).order("created_at",{ascending:false}).limit(20)
 ]);
 if(live.error||test.error||requests.error)return reply({error:"Historique momentanément indisponible"},503);
 const plan=live.data||test.data;
 const eligible=plan?.status==="active"&&allowedPlans.has(plan.plan);
 const limit=eligible?(plan.plan==="ultimate"?30:10):0;
 const month=new Date().toISOString().slice(0,7)+"-01";
 const [jobs,usage]=await Promise.all([
  requests.data?.length?
   db.from("kitora_ai_jobs").select("request_id,status,attempts").eq("user_id",user.id).in("request_id",requests.data.map(d=>d.id)):
   Promise.resolve({data:[],error:null}),
  eligible?
   db.from("kitora_ai_reservations").select("request_id",{count:"exact",head:true}).eq("user_id",user.id).eq("month_start",month):
   Promise.resolve({count:0,error:null})
 ]);
 if(jobs.error||usage.error)return reply({error:"Statut des générations momentanément indisponible"},503);
 const states=new Map((jobs.data||[]).map(j=>[j.request_id,j]));
 const history=(requests.data||[]).map(item=>{
  const job=states.get(item.id);
  const jobStatus=item.ai_generated_at?"completed":job?.status||"not_started";
  return {id:item.id,title:item.title,category:item.category,format:item.format,created_at:item.created_at,
   request_status:item.status,job_status:jobStatus,has_result:!!item.ai_generated_at,
   attempt_count:typeof job?.attempts==="number"?Math.max(0,Math.min(3,job.attempts)):0};
 });
 return reply({eligible,plan:eligible?plan.plan:null,quota_limit:limit,quota_used:eligible?(usage.count||0):0,
  month_start:month,history,has_more:history.length===20});
});
