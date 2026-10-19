import {createClient} from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.57.0/+esm";
import {getKitoraSubscription} from "./billing-entitlements.js";
const client=createClient("https://yxjxizxzjubhjaxskksh.supabase.co","sb_publishable_K6y-xwSJdAKhAccH698lgw_cp79fnbW");
const $=id=>document.getElementById(id);
const form=$("labForm"),status=$("labEligibility"),message=$("labMessage"),quota=$("labQuota");
const progress=$("labGenerationPanel"),generation=$("labGenerationStatus"),refreshButton=$("labRefreshGeneration");
const choices={
 cours:{category:"etudes",header:"Cours personnalisé, exemples, exercices et corrigés",details:"Inclure des explications progressives, des exemples commentés, des exercices et les réponses détaillées. Respecter la langue cible du sujet."},
 revision:{category:"etudes",header:"Programme de révisions personnalisé",details:"Créer des séances adaptées, des questions d'autoévaluation, les corrections et des checkpoints réalistes."},
 projet:{category:"projet",header:"Dossier de projet opérationnel",details:"Présenter le besoin, les livrables, les étapes concrètes, les risques, les indicateurs et les hypothèses à confirmer."},
 organisation:{category:"organisation",header:"Planning personnalisé et priorités",details:"Décomposer les objectifs en actions réalistes, respecter les contraintes de temps et proposer une méthode de suivi."},
 creation:{category:"projet",header:"Plan de création de contenu",details:"Définir l'objectif, le public, des idées originales, les étapes de production et les indicateurs de progression."}
};
let authorizedUser=null,checking=0,currentRequestId=null,requestInFlight=false;
function compose(){
 const type=choices[$("labType").value]||choices.projet;
 const topic=$("labTopic").value.trim(),deadline=$("labDeadline").value.trim();
 const level=$("labLevel").value.trim(),constraints=$("labConstraints").value.trim();
 const title=(type.header+" : "+topic).slice(0,120);
 const details=[type.details,"Sujet : "+(topic||"à préciser"),"Durée/échéance : "+(deadline||"à préciser"),
  "Point de départ : "+(level||"à préciser"),"Objectifs et contraintes : "+(constraints||"à préciser"),
  "Éviter les contenus génériques et ne pas inventer d'informations manquantes."].join("\n");
 return {category:type.category,title,details,format:$("labFormat").value};
}
function preview(){
 const p=compose();
 $("labPreview").textContent=p.title+"\n\n"+p.details+"\n\nFormat : "+p.format.toUpperCase()+"\n\nLe document final dépendra de la génération IA et des données fournies.";
}
for(const element of form.querySelectorAll("input,textarea,select"))element.addEventListener("input",preview);
$("labCopy").addEventListener("click",async()=>{
 try{await navigator.clipboard.writeText($("labPreview").textContent);message.textContent="Brief copié."}
 catch{message.textContent="Copie indisponible. Sélectionne le texte dans l’aperçu."}
});
function showGeneration(result){
 progress.hidden=false;
 const queued=result?.job_status==="queued",processing=result?.job_status==="processing";
 if(result?.ready===true){
  generation.textContent="Dossier généré et enregistré. Accède à Mon espace pour le lire ou télécharger en PDF/TXT.";
 }else if(queued){
  generation.textContent="Demande dans la file de génération IA. Position indicative : "+(result.position||1)+".";
 }else if(processing){
  generation.textContent="La génération IA est en cours. Revenez consulter son résultat dans Mon espace.";
 }else if(result?.job_status==="failed"){
  generation.textContent="La génération a échoué. Ton dossier reste enregistré. Contacte l’assistance depuis le centre d’aide.";
 }else if(result?.configured===false){
  generation.textContent="Moteur IA non activé sur ce projet. Ton brief est enregistré sans génération facturable.";
 }else{
  generation.textContent=result?.message||"Demande enregistrée. Ouvre Mon espace pour consulter son état.";
 }
 refreshButton.disabled=!authorizedUser||!currentRequestId||requestInFlight||result?.ready===true;
}
async function ensureAuthorizedSession(){
 const {data:{user},error}=await client.auth.getUser();
 if(error||!user||user.id!==authorizedUser)throw Error("La session a expiré. Reconnecte-toi.");
 const {data:{session},error:sessionError}=await client.auth.getSession();
 if(sessionError||!session?.access_token)throw Error("Connexion requise.");
 return session.access_token;
}
async function generateFor(requestId){
 const token=await ensureAuthorizedSession();
 const response=await fetch("https://yxjxizxzjubhjaxskksh.supabase.co/functions/v1/generate-plus",{
  method:"POST",headers:{"Content-Type":"application/json","apikey":"sb_publishable_K6y-xwSJdAKhAccH698lgw_cp79fnbW","Authorization":"Bearer "+token},
  body:JSON.stringify({request_id:requestId}),signal:AbortSignal.timeout(35000)
 });
 let result;try{result=await response.json()}catch{throw Error("Le serveur n’a pas renvoyé de réponse lisible.")}
 if(!response.ok)throw Error(result.error||"Impossible de programmer la génération IA.");
 return result;
}
async function check(){
 const attempt=++checking;authorizedUser=null;currentRequestId=null;
 form.hidden=true;progress.hidden=true;refreshButton.disabled=true;quota.textContent="";
 status.textContent="Vérification de l’abonnement…";
 try{
  const {data:{user},error}=await client.auth.getUser();
  if(attempt!==checking)return;
  if(error||!user){status.textContent="Connecte-toi pour accéder à l'espace exclusif Kitora Plus.";return}
  const {subscription:sub,error:subError}=await getKitoraSubscription(client,user.id);
  if(attempt!==checking)return;
  if(subError)throw Error("Vérification de l'abonnement indisponible.");
  if(sub?.status!=="active"||!["plus_monthly","plus_yearly","ultimate"].includes(sub.plan)){
   status.textContent="Cet atelier est réservé aux abonnements Kitora Plus et Ultimate actifs.";
   quota.textContent="Les formules payantes ne sont pas encore commercialisées.";
   return;
  }
  authorizedUser=user.id;
  status.textContent="Accès confirmé : "+(sub.plan==="ultimate"?"Kitora Ultimate":"Kitora Plus")+".";
  quota.textContent="Générations IA soumises à disponibilité : "+(sub.plan==="ultimate"?"30":"10")+" documents par mois maximum. Les appels fournisseur restent désactivables côté serveur.";
  form.hidden=false;preview();
 }catch(e){if(attempt===checking)status.textContent="Impossible de confirmer l'accès : "+e.message}
}
async function updateGeneration(){
 if(!currentRequestId||requestInFlight)return;
 const id=currentRequestId;
 requestInFlight=true;refreshButton.disabled=true;
 try{
  const {data,error}=await client.from("subscriber_requests").select("id,ai_result,ai_generated_at").eq("id",id).eq("user_id",authorizedUser).maybeSingle();
  if(error)throw Error("Impossible de consulter le dossier.");
  if(!data)throw Error("Demande introuvable.");
  if(data.ai_generated_at&&data.ai_result){showGeneration({ready:true});return}
  const result=await generateFor(id);
  if(currentRequestId===id)showGeneration(result);
 }catch(e){
  generation.textContent="Actualisation impossible : "+(e instanceof Error?e.message:"Erreur inattendue")+". Le dossier reste accessible depuis Mon espace.";
 }finally{
  requestInFlight=false;
  if(currentRequestId===id&&authorizedUser&&generation.textContent.indexOf("généré et enregistré")<0)refreshButton.disabled=false;
 }
}
refreshButton.addEventListener("click",()=>void updateGeneration());
form.addEventListener("submit",async event=>{
 event.preventDefault();
 if(!authorizedUser||requestInFlight||!form.reportValidity())return;
 const topic=$("labTopic").value.trim();
 if(topic.length<5){message.textContent="Précise un sujet d’au moins cinq caractères.";return}
 const btn=$("labSubmit");btn.disabled=true;
 message.textContent="Enregistrement sécurisé de ton dossier…";
 try{
  await ensureAuthorizedSession();
  const payload=compose();
  if(payload.title.length<5||payload.details.length>4500)throw Error("Demande invalide ou trop longue.");
  const {data,error}=await client.from("subscriber_requests").insert({user_id:authorizedUser,...payload}).select("id").single();
  if(error||!data?.id)throw Error("Impossible d'enregistrer le dossier.");
  currentRequestId=data.id;progress.hidden=false;
  generation.textContent="Dossier enregistré. Vérification de la disponibilité du moteur IA…";
  message.textContent="Ta demande Plus est enregistrée. Elle est consultable dans Mon espace, même si l'IA est indisponible.";
  await updateGeneration();
 }catch(e){message.textContent="Envoi impossible : "+(e instanceof Error?e.message:"Erreur inattendue")}
 finally{btn.disabled=false}
});
client.auth.onAuthStateChange(()=>{authorizedUser=null;form.hidden=true;setTimeout(()=>void check(),0)});
void check();
