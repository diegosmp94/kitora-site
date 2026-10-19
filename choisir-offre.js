import {createClient} from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import {getKitoraSubscription,isKitoraPlanActive} from "./billing-entitlements.js";
const db=createClient("https://yxjxizxzjubhjaxskksh.supabase.co","sb_publishable_K6y-xwSJdAKhAccH698lgw_cp79fnbW");
const $=id=>document.getElementById(id);
const allowed=new Set(["dashboard.html","projects.html","learn.html","agenda.html","notes.html","templates.html","comparateur.html","atelier.html","focus.html","defi-7-jours.html","etude-clients.html","test-audience.html","synchronisation.html"]);
const requested=new URLSearchParams(location.search).get("next");
const next=allowed.has(requested) ? requested : "dashboard.html";
let user=null;
async function refresh(){
 const {data,error}=await db.auth.getUser();
 user=!error?data.user:null;
 $("toolChoiceAuth").hidden=!!user;
 $("toolChoicePlans").hidden=!user;
 $("toolChoiceStatus").textContent=user?"Compte connecté : choisis l’offre qui te convient.":"Connecte-toi ou crée un compte gratuit pour choisir une offre.";
}
async function choose(plan){
 if(!user)return refresh();
 $("toolChoiceStatus").textContent="Vérification de ta formule…";
 try{
  if(plan!=="free"){
   const {subscription:sub,error}=await getKitoraSubscription(db,user.id);
   const plans={solo:["solo"],workspace:["workspace"],plus:["plus_monthly","plus_yearly"],ultimate:["ultimate"]};
   if(error||!isKitoraPlanActive(sub,plan))throw Error("Aucun abonnement "+plan+" actif. Pour tester une formule, passe par le panier Stripe TEST puis reviens choisir cette offre.");
  }
  const {error}=await db.from("kitora_tool_access").upsert({user_id:user.id,chosen_plan:plan,updated_at:new Date().toISOString()},{onConflict:"user_id"});
  if(error)throw error;
  location.assign(next);
 }catch(error){$("toolChoiceStatus").textContent=error.message||"Sélection impossible.";}
}
$("toolChoiceFree").addEventListener("click",()=>choose("free"));
$("toolChoicePlus").addEventListener("click",()=>choose("plus"));
for(const plan of ["solo","workspace","ultimate"]){const button=$("toolChoice"+plan[0].toUpperCase()+plan.slice(1));if(button)button.addEventListener("click",()=>choose(plan))}
$("toolChoiceLogin").addEventListener("submit",async event=>{
 event.preventDefault();
 const email=$("toolChoiceEmail").value.trim(),password=$("toolChoicePassword").value,display_name=$("toolChoiceName").value.trim();
 $("toolChoiceAuthMessage").textContent="Création du compte…";
 try{
  const {data,error}=await db.auth.signUp({email,password,options:{data:{display_name},emailRedirectTo:new URL("choisir-offre.html?next="+encodeURIComponent(next),location.href).href}});
  if(error)throw error;
  $("toolChoiceAuthMessage").textContent=data.session?"Compte créé. Choisis ton offre.":"Compte créé. Vérifie ton e-mail, puis reconnecte-toi pour choisir ton offre.";
  await refresh();
 }catch(e){$("toolChoiceAuthMessage").textContent=e.message||"Création impossible."}
});
$("toolChoiceSignIn").addEventListener("click",async()=>{
 const email=$("toolChoiceEmail").value.trim(),password=$("toolChoicePassword").value;
 if(!email||!password){$("toolChoiceAuthMessage").textContent="Renseigne ton e-mail et ton mot de passe.";return}
 $("toolChoiceAuthMessage").textContent="Connexion en cours…";
 const {error}=await db.auth.signInWithPassword({email,password});
 if(error){$("toolChoiceAuthMessage").textContent=error.message;return}
 $("toolChoiceAuthMessage").textContent="Connexion réussie.";
 await refresh();
});
db.auth.onAuthStateChange(()=>setTimeout(refresh,0));
refresh();
