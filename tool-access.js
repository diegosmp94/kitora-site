import {createClient} from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
const supabase=createClient("https://yxjxizxzjubhjaxskksh.supabase.co","sb_publishable_K6y-xwSJdAKhAccH698lgw_cp79fnbW");
const allowed=new Set(["dashboard.html","projects.html","learn.html","agenda.html","notes.html","templates.html","comparateur.html","atelier.html","focus.html","defi-7-jours.html","etude-clients.html","test-audience.html","synchronisation.html"]);
const current=location.pathname.split("/").pop();
const route=allowed.has(current)?current:"dashboard.html";
const chooser="choisir-offre.html?next="+encodeURIComponent(route);
async function load(){
 try{
  const {data:{user},error}=await supabase.auth.getUser();
  if(error||!user){location.replace(chooser);return;}
  const {data:row,error:choiceError}=await supabase.from("kitora_tool_access").select("chosen_plan").eq("user_id",user.id).maybeSingle();
  if(choiceError||!row||!["free","solo","workspace","plus","ultimate"].includes(row.chosen_plan)){location.replace(chooser);return;}
  if(row.chosen_plan!=="free"){
   const {data:sub,error:subError}=await supabase.from("subscriptions").select("status,plan").eq("user_id",user.id).maybeSingle();
   const plans={solo:["solo"],workspace:["workspace"],plus:["plus_monthly","plus_yearly"],ultimate:["ultimate"]};
   if(subError||sub?.status!=="active"||!plans[row.chosen_plan]?.includes(sub.plan)){location.replace(chooser);return;}
  }
  for(const old of document.querySelectorAll("script[data-kitora-protected-src]")){
   const source=old.dataset.kitoraProtectedSrc;
   const el=document.createElement("script");
   if(old.dataset.kitoraProtectedType==="module")el.type="module";
   el.src=source;
   await new Promise((resolve,reject)=>{el.onload=resolve;el.onerror=()=>reject(new Error("Impossible de charger "+source));document.body.append(el)});
  }
  document.documentElement.classList.remove("kitora-protected-pending");
 }catch(error){
  console.error("Kitora: accès aux outils indisponible",error);
  location.replace(chooser);
 }
}
load();
