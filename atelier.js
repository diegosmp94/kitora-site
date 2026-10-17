(()=>{"use strict";
const KEY="kitora_atelier_brief_v1";
const ids=["briefName","briefGoal","briefAudience","briefDeadline","briefResources","briefFirst"];
const form=document.getElementById("briefForm"),preview=document.getElementById("briefPreview"),status=document.getElementById("briefStatus");
const down=document.getElementById("downloadBrief"),copy=document.getElementById("copyBrief");
let output="";
const data=()=>Object.fromEntries(ids.map(id=>[id,document.getElementById(id).value.trim()]));
function format(x){
 const parts=["KITORA / MON BRIEF DE PROJET","",x.briefName,"","OBJECTIF",x.briefGoal,"","PUBLIC CONCERNÉ",x.briefAudience||"À préciser","","ÉCHÉANCE",x.briefDeadline||"À définir","","RESSOURCES ET CONTRAINTES",x.briefResources||"À préciser","","PREMIÈRE ACTION",x.briefFirst||"Définir une première étape réalisable.","","POINT DE CONTRÔLE","Qu'est-ce qui montrera que le projet avance ? Définir un livrable mesurable."];
 return parts.join("\n");
}
function render(){const x=data();if(!x.briefName||!x.briefGoal){output="";preview.textContent="Indique au moins le nom du projet et le résultat souhaité.";down.disabled=copy.disabled=true;return}output=format(x);preview.textContent=output;down.disabled=copy.disabled=false}
try{const saved=JSON.parse(localStorage.getItem(KEY)||"null");if(saved&&typeof saved==="object")for(const id of ids)if(typeof saved[id]==="string")document.getElementById(id).value=saved[id]}catch{}
for(const id of ids)document.getElementById(id).addEventListener("input",()=>{try{localStorage.setItem(KEY,JSON.stringify(data()))}catch{}});
form.addEventListener("submit",e=>{e.preventDefault();if(!form.reportValidity())return;render();status.textContent="Brief prêt. Tu peux le copier ou l'exporter."});
down.addEventListener("click",()=>{if(!output)return;const blob=new Blob(["\uFEFF",output],{type:"text/plain;charset=utf-8"});const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="kitora-mon-brief.txt";document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);status.textContent="Téléchargement lancé."});
copy.addEventListener("click",async()=>{if(!output)return;try{await navigator.clipboard.writeText(output);status.textContent="Brief copié."}catch{status.textContent="Copie indisponible sur ce navigateur. Utilise l'export TXT."}});
document.getElementById("clearBrief").addEventListener("click",()=>{form.reset();output="";preview.textContent="Complète le formulaire, puis génère ton premier brief.";down.disabled=copy.disabled=true;try{localStorage.removeItem(KEY)}catch{}status.textContent="Données locales effacées."});
})();