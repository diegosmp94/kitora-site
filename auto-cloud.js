import {createClient} from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import {getKitoraSubscription} from "./billing-entitlements.js";
const db=createClient("https://yxjxizxzjubhjaxskksh.supabase.co","sb_publishable_K6y-xwSJdAKhAccH698lgw_cp79fnbW");
const modules=[["projects","kitora_projects_v1"],["agenda","kitora_agenda_v1"],["learn","kitora_learn_cards_v1"],["notes","kitora_notes_v1"],["challenge","kitora_challenge_7_v1"],["focus","kitora_focus_completed_v1"]];
const control="kitora_auto_cloud_enabled_v1";
let user=null,enabled=false,busy=false;
async function canUse(){
 const {data:{user:current},error}=await db.auth.getUser();if(error||!current)return false;
 const {subscription:sub,error:err}=await getKitoraSubscription(db,current.id);
 if(err||sub?.status!=="active"||!["workspace","ultimate"].includes(sub.plan))return false;
 user=current;return true;
}
const stable=value=>JSON.stringify(value,(key,v)=>v&&typeof v==="object"&&!Array.isArray(v)?Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b))):v);
function snapshot(name,key){try{const raw=localStorage.getItem(key);if(!raw)return null;const p=JSON.parse(raw);if(name==="focus"?!Number.isInteger(p)||p<0:!Array.isArray(p))return null;if(raw.length>150000)return null;return {raw:stable(p),p}}catch{return null}}
function settingKey(){return control+"_"+user.id}
function baselineKey(name){return "kitora_auto_cloud_base_"+user.id+"_"+name}
function readBase(name){try{return JSON.parse(localStorage.getItem(baselineKey(name))||"null")}catch{return null}}
function writeBase(name,stamp,raw){localStorage.setItem(baselineKey(name),JSON.stringify({stamp,raw}))}
async function synchronize(){
 if(busy||!user||!enabled||document.visibilityState==="hidden")return;busy=true;let updated=0,conflicts=0;
 try{
  for(const [name,key] of modules){
   const v=snapshot(name,key);if(!v)continue;
   const baseline=readBase(name);
   if(baseline?.raw===v.raw)continue;
   const {data:remote,error:readErr}=await db.from("kitora_workspace_backup").select("payload,updated_at").eq("user_id",user.id).eq("module",name).maybeSingle();
   if(readErr)throw readErr;
   if(remote&&!baseline&&stable(remote.payload)===v.raw){writeBase(name,remote.updated_at,v.raw);continue;}
   if(remote&&(!baseline||stable(remote.payload)!==baseline.raw)){conflicts++;continue;}
   const expected=baseline?JSON.parse(baseline.raw):null;
   const {data:saved,error:writeErr}=await db.rpc("kitora_cloud_save_cas",{p_module:name,p_payload:v.p,p_expected_payload:expected});
   if(writeErr)throw writeErr;
   if(saved?.status==="conflict"){conflicts++;continue;}
   if(saved?.status!=="saved")throw Error("Sauvegarde non autorisée : "+(saved?.status||"erreur"));
   writeBase(name,saved.updated_at,v.raw);updated++;
  }
  if(location.pathname.endsWith("synchronisation.html")){
   const msg=document.getElementById("kitoraAutoCloudStatus");
   if(msg)msg.textContent=conflicts?"Sauvegarde auto : "+conflicts+" conflit(s). Restaure ou sauvegarde manuellement les modules concernés.":updated?"Sauvegarde automatique : "+updated+" module(s) actualisé(s).":"Sauvegarde automatique : aucune nouvelle modification.";
  }
 }catch(error){console.warn("Kitora autosave",error);const msg=document.getElementById("kitoraAutoCloudStatus");if(msg)msg.textContent="Sauvegarde auto indisponible : "+error.message}
 finally{busy=false}
}
async function init(){
 if(!await canUse())return;
 enabled=localStorage.getItem(settingKey())==="yes";
 if(location.pathname.endsWith("synchronisation.html")){
  const panel=document.createElement("div");panel.className="panel";
  panel.innerHTML='<h2>Sauvegarde automatique Workspace / Ultimate (bêta)</h2><p>Envoi automatique des modifications locales vers ton cloud privé toutes les 45 secondes lorsque le site est ouvert. Pas de restauration silencieuse : en cas de divergence entre appareils, la sauvegarde est suspendue pour éviter un écrasement.</p><label><input type="checkbox" id="kitoraAutoCloudToggle"> Activer sur cet appareil</label><p class="fine" role="status" id="kitoraAutoCloudStatus"></p>';
  document.querySelector("main .wrap")?.append(panel);
  const toggle=document.getElementById("kitoraAutoCloudToggle");toggle.checked=enabled;
  toggle.addEventListener("change",()=>{enabled=toggle.checked;localStorage.setItem(settingKey(),enabled?"yes":"no");document.getElementById("kitoraAutoCloudStatus").textContent=enabled?"Activation enregistrée. Les conflits seront ignorés, jamais écrasés.":"Sauvegarde automatique désactivée.";if(enabled)synchronize()});
  document.getElementById("kitoraAutoCloudStatus").textContent=enabled?"Sauvegarde automatique active sur cet appareil.":"Désactivée.";
 }
 if(enabled)synchronize();setInterval(synchronize,45000);window.addEventListener("focus",synchronize)
}
init();