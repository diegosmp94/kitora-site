(()=>{
"use strict";
const $=id=>document.getElementById(id);
const profiles=new Set(["particulier","association","entreprise"]);
const labels={particulier:"Offres pour particuliers",association:"Solutions pour associations",entreprise:"Solutions pour entreprises"};
function selectAudience(audience,focus=false){
 if(!profiles.has(audience))audience="particulier";
 document.querySelectorAll("[data-audience-button]").forEach(button=>{
  const isActive=button.dataset.audienceButton===audience;
  button.setAttribute("aria-pressed",String(isActive));
  if(isActive&&focus)button.focus();
 });
 document.querySelectorAll("[data-audience-panel]").forEach(panel=>{
  panel.hidden=panel.dataset.audiencePanel!==audience;
 });
 $("audienceStatus").textContent=labels[audience];
 const u=new URL(location.href);if(audience==="particulier")u.searchParams.delete("public");else u.searchParams.set("public",audience);
 history.replaceState(null,"",u.pathname+u.search+u.hash);
 if(audience!=="particulier")$("briefType").value=audience;
}
document.querySelectorAll("[data-audience-button]").forEach(button=>button.addEventListener("click",()=>selectAudience(button.dataset.audienceButton)));
const initial=new URLSearchParams(location.search).get("public");
selectAudience(profiles.has(initial)?initial:"particulier");
$("briefForm").addEventListener("submit",event=>{
 event.preventDefault();
 const form=event.currentTarget;
 if(!form.reportValidity())return;
 const type=$("briefType").value,team=$("briefTeam").value;
 const name=$("briefName").value.trim(),details=$("briefNotes").value.trim();
 const features=[...form.querySelectorAll("fieldset input[type=checkbox]:checked")].map(input=>input.value);
 if(!features.length){$("briefFeedback").textContent="Choisis au moins un besoin pour préparer ton document.";return;}
 const draft=[
 "KITORA — BRIEF PRÉPARATOIRE (NON TRANSMIS)",
 "Document créé localement le "+new Date().toLocaleDateString("fr-FR"),
 "",
 "Public : "+(type==="association"?"Association":"Entreprise"),
 "Structure : "+(name||"Non précisée"),
 "Utilisateurs concernés : "+team,
 "Besoins :",
 ...features.map(feature=>"- "+feature),
 "",
 "Contexte : "+(details||"Non précisé"),
 "",
 "OUTILS ACTUELLEMENT ACCESSIBLES EN INDIVIDUEL",
 "- Projects, Agenda, Notes, Atelier, Templates et autres outils gratuits selon accès.",
 "- Plus est en démonstration Stripe TEST, sans débit réel.",
 "",
 "POUR UN ESPACE COLLECTIF (EN PRÉPARATION)",
 "- Comptes multi-utilisateurs, rôles et documents partagés : non commercialisés.",
 "- Prix, devis, gestion contractuelle et facturation B2B : à définir.",
 "",
 "Ce document ne constitue ni un devis ni une commande et n'a pas été envoyé à Kitora."
 ].join("\n");
 const url=URL.createObjectURL(new Blob([draft],{type:"text/plain;charset=utf-8"}));
 const a=document.createElement("a");a.href=url;a.download="kitora-brief-"+type+".txt";document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),5000);
 $("briefFeedback").textContent="Brief préparé pour téléchargement. Rien n'a été transmis à Kitora.";
});
})();