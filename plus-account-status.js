import {createClient} from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.57.0/+esm";
const client=createClient("https://yxjxizxzjubhjaxskksh.supabase.co","sb_publishable_K6y-xwSJdAKhAccH698lgw_cp79fnbW");
const $=id=>document.getElementById(id);
const message=$("plusAccountMessage"),refreshButton=$("plusAccountRefresh"),history=$("plusAccountHistory");
const quota=$("plusAccountQuota"),pending=$("plusAccountPending"),ready=$("plusAccountReady");
let currentUserId=null,revision=0,loading=false;
function clearStatus(){
 history.replaceChildren();
 quota.textContent="—";pending.textContent="—";ready.textContent="—";
 refreshButton.disabled=true;
}
function statusLabel(entry){
 if(entry.has_result||entry.job_status==="completed")return "Document IA prêt";
 return {queued:"Dans la file d’attente",processing:"Création en cours",failed:"Génération non aboutie",not_started:"Brief enregistré — IA non lancée"}[entry.job_status]||"État en cours de vérification";
}
function render(payload){
 const items=payload.history||[];
 const used=Number(payload.quota_used)||0,limit=Number(payload.quota_limit)||0;
 quota.textContent=payload.eligible?Math.max(0,used)+" / "+Math.max(0,limit):"—";
 pending.textContent=String(items.filter(e=>e.job_status==="queued"||e.job_status==="processing").length);
 ready.textContent=String(items.filter(e=>e.has_result||e.job_status==="completed").length);
 history.replaceChildren();
 for(const entry of items.slice(0,6)){
  const card=document.createElement("article");
  const h=document.createElement("h4");h.textContent=String(entry.title||"Dossier sans titre");
  const label=document.createElement("p");label.textContent=statusLabel(entry);
  card.append(h,label);
  history.append(card);
 }
 if(!payload.eligible){
  message.textContent="Ton historique reste accessible, mais les nouvelles générations nécessitent un abonnement Plus ou Ultimate actif.";
 }else if(!items.length){
  message.textContent="Aucun dossier enregistré. Tu peux en créer un dans Kitora Plus Lab.";
 }else{
  message.textContent=items.length+" demande(s) retrouvée(s). Les chiffres de progression affichent uniquement les 20 dossiers les plus récents.";
 }
}
async function loadStatus(){
 const call=++revision;
 clearStatus();
 message.textContent="Vérification de ton compte et de tes générations…";
 if(loading)return;
 loading=true;
 try{
  const {data:{user},error:authError}=await client.auth.getUser();
  if(call!==revision)return;
  if(authError||!user){
   currentUserId=null;message.textContent="Connecte-toi pour consulter tes générations.";
   return;
  }
  currentUserId=user.id;
  const {data:{session},error:tokenError}=await client.auth.getSession();
  if(tokenError||!session?.access_token)throw Error("Session expirée. Reconnecte-toi.");
  const response=await fetch("https://yxjxizxzjubhjaxskksh.supabase.co/functions/v1/kitora-plus-status",{
   method:"GET",headers:{"apikey":"sb_publishable_K6y-xwSJdAKhAccH698lgw_cp79fnbW","Authorization":"Bearer "+session.access_token},
   cache:"no-store",signal:AbortSignal.timeout(12000)
  });
  const body=await response.json();
  if(!response.ok||!Array.isArray(body.history))throw Error(body.error||"Échec de la consultation");
  if(call!==revision||user.id!==currentUserId)return;
  render(body);
 }catch(e){
  if(call===revision)message.textContent="Impossible de charger le suivi Plus : "+(e instanceof Error?e.message:"Erreur inattendue");
 }finally{
  if(call===revision)refreshButton.disabled=!currentUserId;
  loading=false;
 }
}
refreshButton.addEventListener("click",()=>{if(!loading)void loadStatus()});
client.auth.onAuthStateChange(()=>{revision++;currentUserId=null;clearStatus();void Promise.resolve().then(()=>loadStatus())});
void loadStatus();
