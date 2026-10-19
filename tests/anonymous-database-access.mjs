import assert from "node:assert/strict";
const base="https://yxjxizxzjubhjaxskksh.supabase.co/rest/v1/";
const apiKey="sb_publishable_K6y-xwSJdAKhAccH698lgw_cp79fnbW";
const sensitive=["subscriptions","orders","profiles","subscriber_requests","kitora_ai_usage","kitora_workspace_backup","kitora_ai_jobs","kitora_ai_reservations","kitora_stripe_webhook_events","kitora_admin_audit","kitora_admins","kitora_org_profiles","kitora_invoice_drafts","kitora_live_subscriptions","kitora_user_documents"];
for(const table of sensitive){
 // Retry only transient transport failures; never accept an inconclusive check as success.
 let response,lastError;
 for(let attempt=0;attempt<3;attempt++){
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),16000);
  try{
   response=await fetch(base+table+"?select=*&limit=1",{
    headers:{"apikey":apiKey,"Accept":"application/json"},
    cache:"no-store",signal:controller.signal
   });
   break;
  }catch(error){
   lastError=error;
   if(attempt===2)throw new Error(table+": unable to verify anonymous isolation after three attempts",{cause:error});
   await new Promise(resolve=>setTimeout(resolve,500*(attempt+1)));
  }finally{clearTimeout(timeout)}
 }
 if(!response)throw new Error(table+": no security response",{cause:lastError});
 {
  if(response.ok){
   const data=await response.json();
   assert.ok(Array.isArray(data)&&data.length===0,table+": anonymous API returned private records");
   console.log(table+": anonymous request returned no data");
  }else{
   assert.ok([400,401,403,404,406].includes(response.status),table+": unexpected response "+response.status);
   console.log(table+": anonymous access rejected (HTTP "+response.status+")");
  }
 }
}
console.log("Anonymous database isolation: no sensitive rows exposed.");
