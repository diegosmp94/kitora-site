(()=>{"use strict";
const $=id=>document.getElementById(id);
const templates={
 revision:{name:"PLAN DE RÉVISIONS",steps:["Lister les notions indispensables et vérifier ce qui est déjà acquis.","Étudier une notion courte, puis l'expliquer avec ses propres mots.","Réaliser trois questions sans regarder le support et vérifier les réponses.","Revoir les erreurs, puis refaire un exercice sans aide.","Faire un bilan des acquis et choisir la suite."]},
 projet:{name:"PLAN DE PROJET",steps:["Définir le résultat attendu et à qui il doit servir.","Identifier un livrable simple et les ressources disponibles.","Créer une première version concrète, même incomplète.","Recueillir un retour et apporter une amélioration ciblée.","Vérifier le livrable et préparer une prochaine étape."]},
 organisation:{name:"ORGANISATION PERSONNELLE",steps:["Lister les engagements et distinguer l'important de l'urgent.","Choisir trois priorités réalisables et prévoir les créneaux.","Avancer sur la priorité principale et noter les imprévus.","Faire un point intermédiaire, simplifier le plan si nécessaire.","Réviser les priorités et préparer la période suivante."]},
 creation:{name:"PLAN DE CRÉATION",steps:["Définir l'idée, le public et le message principal.","Rassembler les références et préparer un premier brouillon.","Produire une première version et vérifier sa cohérence.","Demander un retour et améliorer un élément concret.","Préparer une version partageable et évaluer la suite."]}
};
let output="";
function make(data){const p=templates[data.kind]||templates.projet,days=Number(data.days);
 const plan=[...new Set(Array.from({length:Math.min(days,5)},(_,i)=>Math.round(i*(days-1)/Math.max(1,Math.min(days,5)-1))+1))];
 const lines=["KITORA / "+p.name,"","SUJET",data.title,"","RÉSULTAT SOUHAITÉ",data.goal,"","DURÉE",days+" jours","","FEUILLE DE ROUTE"];
 plan.forEach((day,i)=>{lines.push("","Jour "+day+" — "+p.steps[Math.min(i,p.steps.length-1)])});
 lines.push("","AUTO-ÉVALUATION","- Qu'ai-je réellement terminé ?","- Qu'est-ce qui reste difficile ?","- Quelle petite action sera utile ensuite ?","","Ce document est un exemple local généré à partir de modèles Kitora. Il ne fournit pas de leçons complètes ni de conseils professionnels personnalisés.");
 return lines.join("\n");
}
for(const control of $("demoForm").querySelectorAll("input,select,textarea"))control.addEventListener("input",()=>{if(!output)return;output="";$("demoPreview").textContent="Les paramètres ont changé. Clique sur « Créer mon exemple » pour actualiser le document.";$("demoDownload").disabled=$("demoCopy").disabled=true;$("demoStatus").textContent="Modifications détectées : régénère ton exemple avant de le télécharger."});
$("demoForm").addEventListener("submit",e=>{e.preventDefault();if(!e.target.reportValidity())return;const title=$("demoTitle").value.trim(),goal=$("demoGoal").value.trim();if(!title||!goal){$("demoStatus").textContent="Complète le sujet et l'objectif.";return}output=make({kind:$("demoKind").value,title,goal,days:$("demoDuration").value});$("demoPreview").textContent=output;$("demoDownload").disabled=$("demoCopy").disabled=false;$("demoStatus").textContent="Ton exemple est prêt. Tu peux le télécharger et le modifier.";});
$("demoDownload").addEventListener("click",()=>{if(!output)return;const file=new Blob(["\uFEFF",output],{type:"text/plain;charset=utf-8"});const url=URL.createObjectURL(file),a=document.createElement("a");a.href=url;a.download="kitora-exemple-personnalise.txt";document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);$("demoStatus").textContent="Téléchargement lancé.";});
$("demoCopy").addEventListener("click",async()=>{if(!output)return;try{await navigator.clipboard.writeText(output);$("demoStatus").textContent="Document copié."}catch{$("demoStatus").textContent="Copie indisponible. Utilise le téléchargement."}});
window.KitoraDemo={make,templates};
})();