import{createClient}from"https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
const client=createClient("https://yxjxizxzjubhjaxskksh.supabase.co","sb_publishable_K6y-xwSJdAKhAccH698lgw_cp79fnbW");
const $=id=>document.getElementById(id),form=$("labForm"),status=$("labEligibility"),message=$("labMessage");
const choices={cours:{category:"etudes",header:"Cours personnalisé, exemples, exercices et corrigés",details:"Inclure des explications progressives, des exemples commentés, des exercices et les réponses détaillées. Respecter la langue cible du sujet."},revision:{category:"etudes",header:"Programme de révisions personnalisé",details:"Créer des séances adaptées, des questions d'autoévaluation, les corrections et des checkpoints réalistes."},projet:{category:"projet",header:"Dossier de projet opérationnel",details:"Présenter le besoin, les livrables, les étapes concrètes, les risques, les indicateurs et les hypothèses à confirmer."},organisation:{category:"organisation",header:"Planning personnalisé et priorités",details:"Décomposer les objectifs en actions réalistes, respecter les contraintes de temps et proposer une méthode de suivi."},creation:{category:"projet",header:"Plan de création de contenu",details:"Définir l'objectif, le public, des idées originales, les étapes de production et les indicateurs de progression."}};
let authorizedUser=null;
function compose(){
 const type=choices[$("labType").value]||choices.projet;
 const topic=$("labTopic").value.trim(),deadline=$("labDeadline").value.trim(),level=$("labLevel").value.trim(),constraints=$("labConstraints").value.trim();
 const title=(type.header+" : "+topic).slice(0,120);
 const details=[type.details,"Sujet : "+(topic||"à préciser"),"Durée/échéance : "+(deadline||"à préciser"),"Point de départ : "+(level||"à préciser"),"Objectifs et contraintes : "+(constraints||"à préciser"),"Éviter les contenus génériques et ne pas inventer d'informations manquantes."].join("\n");
 return{category:type.category,title,details,format:$("labFormat").value};
}
function preview(){const p=compose();$("labPreview").textContent=p.title+"\n\n"+p.details+"\n\nFormat : "+p.format.toUpperCase()+"\n\nLe document final dépendra de la génération IA et des données fournies."}
for(const e of form.querySelectorAll("input,textarea,select"))e.addEventListener("input",preview);
async function check(){
 try{
  const{data:{user},error}=await client.auth.getUser();
  if(error||!user){status.textContent="Connecte-toi pour accéder à l'espace exclusif Kitora Plus.";return}
  const{data:sub,error:subError}=await client.from("subscriptions").select("plan,status").eq("user_id",user.id).maybeSingle();
  if(subError)throw Error("Vérification de l'abonnement indisponible.");
  if(sub?.status!=="active"||!["plus_monthly","plus_yearly"].includes(sub.plan)){status.textContent="Cet atelier est réservé aux abonnements Kitora Plus actifs.";return}
  authorizedUser=user.id;status.textContent="Kitora Plus actif — tu peux préparer une demande.";form.hidden=false;preview();
 }catch(e){status.textContent="Impossible de confirmer l'accès : "+e.message}
}
form.addEventListener("submit",async e=>{
 e.preventDefault();if(!authorizedUser||!form.reportValidity())return;
 const btn=$("labSubmit");btn.disabled=true;message.textContent="Envoi de ta demande…";
 try{
  const p=compose();
  if(p.title.length<5||p.details.length<20)throw Error("Précise le sujet et l'objectif.");
  const{data,error}=await client.from("subscriber_requests").insert({user_id:authorizedUser,...p}).select("id").single();
  if(error)throw Error(error.message);
  message.textContent="Demande enregistrée. Retrouve-la dans « Mon espace ».";
  const link=document.createElement("a");link.href="compte.html#demandes-plus";link.textContent=" Voir le suivi →";message.append(link);
 }catch(e){message.textContent="Envoi impossible : "+e.message}finally{btn.disabled=false}
});
client.auth.onAuthStateChange(()=>{authorizedUser=null;form.hidden=true;void check()});void check();
