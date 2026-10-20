import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
const client=createClient("https://yxjxizxzjubhjaxskksh.supabase.co","sb_publishable_K6y-xwSJdAKhAccH698lgw_cp79fnbW");
const ENDPOINT="https://yxjxizxzjubhjaxskksh.supabase.co/functions/v1/admin-users";
const $=id=>document.getElementById(id);
let authorized=false,usersPage=1,auditPage=1,users=[],audit=[],busyUsers=false,busyAudit=false,authRevision=0,authInitialized=false;
function text(value){return String(value??"—")}
function readableDate(value){if(!value)return "—";const d=new Date(value);return Number.isNaN(d.getTime())?"—":d.toLocaleString("fr-FR",{dateStyle:"short",timeStyle:"short"})}
function cell(tr,value){const td=document.createElement("td");td.textContent=text(value);tr.append(td)}
function message(tbody,count,message){tbody.replaceChildren();const tr=document.createElement("tr");const td=document.createElement("td");td.colSpan=count;td.textContent=message;tr.append(td);tbody.append(tr)}
function renderUsers(){
 const root=$("usersRows"),term=$("usersSearch").value.trim().toLocaleLowerCase("fr");
 root.replaceChildren();let visible=0;
 for(const u of users){
  const line=[u.display_name||"",u.email||"",u.id||""].join(" ").toLocaleLowerCase("fr");
  if(term&&!line.includes(term))continue;
  const tr=document.createElement("tr");const name=u.display_name||"Sans nom";cell(tr,name+" · "+(u.email||"Adresse indisponible"));
  cell(tr,u.is_admin?"Administrateur":"Utilisateur");
  const sub=u.subscription;
  cell(tr,sub?.plan?sub.plan+" · "+(sub.status||"—"):"Aucun abonnement renseigné");
  cell(tr,readableDate(u.created_at));cell(tr,readableDate(u.last_sign_in_at));
  root.append(tr);visible++;
 }
 if(!visible)message(root,5,users.length?"Aucun résultat sur cette page.":"Aucun utilisateur sur cette page.");
 $("usersCount").textContent=visible+" affiché(s) sur "+users.length+" compte(s) chargés. Recherche limitée à cette page.";
 $("usersPageLabel").textContent="Page "+usersPage;
 $("usersPrevious").disabled=busyUsers||usersPage<=1;
 $("usersNext").disabled=busyUsers||users.length<50;
}
function renderAudit(){
 const root=$("usersAuditRows");root.replaceChildren();
 for(const x of audit){const tr=document.createElement("tr");cell(tr,readableDate(x.created_at));cell(tr,x.action);cell(tr,x.outcome);cell(tr,x.actor_id?String(x.actor_id).slice(0,8)+"…":"—");root.append(tr)}
 if(!audit.length)message(root,4,"Aucune opération journalisée sur cette page.");
 $("usersAuditPageLabel").textContent="Page "+auditPage;
 $("usersAuditPrevious").disabled=busyAudit||auditPage<=1;
 $("usersAuditNext").disabled=busyAudit||audit.length<50;
}
async function request(action,page){
 const revision=authRevision;
 if(!authorized)throw Error("Droits administrateur non vérifiés.");
 const {data:{session},error:sessionError}=await client.auth.getSession();
 if(sessionError||!session?.access_token)throw Error("Session expirée. Reconnecte-toi.");
 const response=await fetch(ENDPOINT,{method:"POST",cache:"no-store",headers:{"Content-Type":"application/json","apikey":"sb_publishable_K6y-xwSJdAKhAccH698lgw_cp79fnbW","Authorization":"Bearer "+session.access_token},body:JSON.stringify({action,page})});
 let data;try{data=await response.json()}catch{throw Error("Réponse serveur illisible.");}
 if(revision!==authRevision||!authorized)throw Error("Session modifiée : données administrateur invalidées.");
 if(!response.ok)throw Error(data.error||"Service administrateur indisponible.");
 if(!Array.isArray(data.items))throw Error("Réponse serveur incomplète.");
 return data.items;
}
async function loadUsers(){
 if(busyUsers)return;busyUsers=true;$("usersRefresh").disabled=true;message($("usersRows"),5,"Chargement sécurisé des comptes…");
 try{users=await request("list",usersPage);renderUsers();}
 catch(e){users=[];renderUsers();$("usersCount").textContent="Liste indisponible.";message($("usersRows"),5,e.message||"Service indisponible.");}
 finally{busyUsers=false;$("usersRefresh").disabled=false;$("usersPrevious").disabled=usersPage<=1;$("usersNext").disabled=users.length<50;}
}
async function loadAudit(){
 if(busyAudit)return;busyAudit=true;$("usersAuditRefresh").disabled=true;$("usersAuditStatus").textContent="Chargement du journal…";
 try{audit=await request("audit",auditPage);renderAudit();$("usersAuditStatus").textContent=audit.length+" opération(s) chargée(s).";}
 catch(e){audit=[];renderAudit();$("usersAuditStatus").textContent=e.message||"Journal indisponible.";}
 finally{busyAudit=false;$("usersAuditRefresh").disabled=false;renderAudit();}
}
async function boot(){
 const revision=authRevision;
 const status=$("adminStatus");
 try{
  const {data:{user},error}=await client.auth.getUser();if(error||!user)throw Error("Connexion requise pour accéder à cette page.");
  const role=await client.from("kitora_admins").select("user_id").eq("user_id",user.id).maybeSingle();
  if(revision!==authRevision)return;
  if(role.error||!role.data)throw Error("Accès réservé aux administrateurs autorisés.");
  authorized=true;$("adminProtected").hidden=false;status.textContent="Administration prête · consultation uniquement.";
  $("usersRefresh").addEventListener("click",loadUsers);
  $("usersAuditRefresh").addEventListener("click",loadAudit);
  $("usersSearch").addEventListener("input",renderUsers);
  $("usersPrevious").addEventListener("click",()=>{if(usersPage>1){usersPage--;loadUsers()}});
  $("usersNext").addEventListener("click",()=>{if(users.length===50){usersPage++;loadUsers()}});
  $("usersAuditPrevious").addEventListener("click",()=>{if(auditPage>1){auditPage--;loadAudit()}});
  $("usersAuditNext").addEventListener("click",()=>{if(audit.length===50){auditPage++;loadAudit()}});
  await Promise.all([loadUsers(),loadAudit()]);
 }catch(e){if(revision!==authRevision)return;authorized=false;$("adminProtected").hidden=true;status.textContent=e.message||"Accès indisponible.";}
}
client.auth.onAuthStateChange((event)=>{if(event!=="SIGNED_OUT")return;authRevision++;authorized=false;users=[];audit=[];if(document.readyState==="loading")return;$("adminProtected").hidden=true;$("usersRows").replaceChildren();$("usersAuditRows").replaceChildren();$("adminStatus").textContent="Session modifiée. Recharge la page pour vérifier tes droits.";});
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot);else boot();
