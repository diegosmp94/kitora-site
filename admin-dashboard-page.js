import{createClient}from"https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
const db=createClient("https://yxjxizxzjubhjaxskksh.supabase.co","sb_publishable_K6y-xwSJdAKhAccH698lgw_cp79fnbW");
const $=id=>document.getElementById(id),money=c=>new Intl.NumberFormat("fr-FR",{style:"currency",currency:"EUR"}).format((Number(c)||0)/100);
async function boot(){
const status=$("adminStatus");
try{
 const {data:{user},error}=await db.auth.getUser();
 if(error||!user)throw Error("Connecte-toi pour accéder à l'administration.");
 const {data:role,error:roleError}=await db.from("kitora_admins").select("user_id").eq("user_id",user.id).maybeSingle();
 if(roleError||!role)throw Error("Accès réservé aux administrateurs.");
 $("adminPages").hidden=false;status.textContent="Administration prête.";
 try{
  const {data:{session}}=await db.auth.getSession();
  if(!session)throw Error("Session expirée.");
  const res=await fetch("https://yxjxizxzjubhjaxskksh.supabase.co/functions/v1/admin-dashboard",{method:"POST",headers:{"Content-Type":"application/json",apikey:"sb_publishable_K6y-xwSJdAKhAccH698lgw_cp79fnbW",Authorization:"Bearer "+session.access_token},body:"{}"});
  const data=await res.json();if(!res.ok)throw Error(data.error||"Statistiques indisponibles.");
  $("statOrders").textContent=data.orders;
  $("statRevenue").textContent=money(data.test_revenue_cents);
  $("statSubscriptions").textContent=data.active_subscriptions;
  $("statLibrary").textContent=data.library_grants;
  $("adminStats").hidden=false;
 }catch(e){status.textContent="Administration accessible, mais statistiques générales indisponibles.";console.warn("Kitora admin dashboard:",e)}
}catch(e){status.textContent=e.message||"Accès non autorisé."; $("adminPages").hidden=true;$("adminStats").hidden=true;}
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot);else boot();
