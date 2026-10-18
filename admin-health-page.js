import {createClient} from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
const db=createClient("https://yxjxizxzjubhjaxskksh.supabase.co","sb_publishable_K6y-xwSJdAKhAccH698lgw_cp79fnbW");
const $=id=>document.getElementById(id);
const labels={pending_webhooks:"Webhooks Stripe en attente",stale_webhooks:"Webhooks bloqués depuis plus de 10 min",past_due_subscriptions:"Abonnements avec paiement en retard",active_subscriptions:"Abonnements actifs (mode test)",stale_ai_reservations:"Réservations IA inachevées depuis plus de 10 min",ai_queue_waiting:"Générations IA en attente",ai_queue_running:"Générations IA en cours",ai_queue_failed:"Générations IA en échec",ai_queue_ultimate_waiting:"Ultimate dans la file prioritaire"};
async function refresh(){
 const status=$("healthStatus");
 $("healthRefresh").disabled=true;
 try{
  const {data:{session},error}=await db.auth.getSession();
  if(error||!session)throw Error("Session expirée.");
  const response=await fetch("https://yxjxizxzjubhjaxskksh.supabase.co/functions/v1/kitora-health",{method:"POST",cache:"no-store",headers:{"Content-Type":"application/json",apikey:"sb_publishable_K6y-xwSJdAKhAccH698lgw_cp79fnbW",Authorization:"Bearer "+session.access_token},body:"{}"});
  const data=await response.json();
  if(!response.ok)throw Error(data.error||"Supervision indisponible.");
  $("healthProtected").hidden=false;
  $("healthChecked").textContent="Dernière vérification : "+new Date(data.checked_at).toLocaleString("fr-FR")+" · Stripe TEST";
  const root=$("healthMetrics");root.replaceChildren();
  const info=document.createElement("section");
  const heading=document.createElement("h3");heading.textContent="Diagnostic Stripe TEST";
  info.append(heading);
  const metrics=[
   ["Clé serveur test",data.stripe?.test_only?"Oui":"Non / non vérifiable"],
   ["Compte Stripe connecté",data.stripe?.account_id||"Indisponible"],
   ["Webhook pour ce compte",data.stripe?.endpoint_status||"Indisponible"],
   ["Six événements requis",data.stripe?.webhook_events_ok?"Configurés":"Non vérifiés / incomplets"],
   ["Erreur de vérification",data.stripe?.error||"Aucune signalée"]
  ];
  for(const [label,value] of metrics){const p=document.createElement("p");const b=document.createElement("strong");b.textContent=label+" : ";p.append(b,document.createTextNode(value));info.append(p)}
  root.append(info);
  for(const [key,label]of Object.entries(labels)){
   const value=Number(data.metrics?.[key]||0);
   const p=document.createElement("p"),strong=document.createElement("strong");
   strong.textContent=label+" : ";
   const span=document.createElement("span");span.textContent=String(value);
   if(value>0&&["stale_webhooks","past_due_subscriptions","stale_ai_reservations","ai_queue_failed"].includes(key))span.style.color="#a13b43";
   p.append(strong,span);root.append(p);
  }
  status.textContent="Supervision accessible.";
 }catch(error){$("healthProtected").hidden=true;status.textContent="Impossible de charger la supervision : "+(error.message||"Erreur.");}
 finally{$("healthRefresh").disabled=false}
}
$("healthRefresh").addEventListener("click",refresh);
refresh();