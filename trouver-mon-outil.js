(()=>{"use strict";
const catalog={
 projects:{name:"Projects",url:"projects.html",description:"Transforme tes objectifs en projets, tâches concrètes et étapes suivies.",label:"Projets et tâches"},
 atelier:{name:"Atelier de projet",url:"atelier.html",description:"Clarifie le résultat souhaité et télécharge un brief de projet.",label:"Brief personnel"},
 agenda:{name:"Agenda",url:"agenda.html",description:"Planifie des événements, dates et échéances dans un calendrier.",label:"Calendrier"},
 learn:{name:"Learn",url:"learn.html",description:"Crée tes propres cartes et teste tes connaissances avec un quiz.",label:"Apprentissage"},
 methodes:{name:"Méthodes Kitora",url:"methodes.html",description:"Découvre des fiches d'organisation, de projet et de révision.",label:"Conseils pratiques"},
 notes:{name:"Mes notes",url:"notes.html",description:"Conserve, retrouve et exporte tes idées et informations.",label:"Carnet local"},
 focus:{name:"Kitora Focus",url:"focus.html",description:"Découpe ton travail en séances avec pauses et suivi local.",label:"Concentration"},
 decision:{name:"Comparateur",url:"comparateur.html",description:"Évalue trois options à partir de tes propres critères pondérés.",label:"Choix éclairé"},
 challenge:{name:"Défi 7 jours",url:"defi-7-jours.html",description:"Avance par petites étapes, sans compétition ni contrainte de calendrier.",label:"Progression"},
 templates:{name:"Templates",url:"templates.html",description:"Télécharge six modèles de documents gratuits à remplir.",label:"Modèles prêts à l'emploi"},
 dashboard:{name:"Dashboard",url:"dashboard.html",description:"Retrouve tes activités et leur progression au même endroit.",label:"Vue d'ensemble"}
};
const goals={
 project:["projects","atelier","dashboard"],organize:["agenda","templates","dashboard"],
 study:["learn","methodes","focus"],notes:["notes","atelier","templates"],
 focus:["focus","challenge","agenda"],decision:["decision","atelier","notes"],
 habit:["challenge","dashboard","focus"],create:["templates","atelier","notes"],
 team:["atelier","templates","projects"],schedule:["agenda","projects","dashboard"]
};
function recommend(input){const goal=goals[input.goal]?input.goal:"project";const items=goals[goal].slice();
 if(input.stage==="starting"&&items.includes("atelier"))items.splice(items.indexOf("atelier"),1),items.unshift("atelier");
 if(input.stage==="stuck"&&items.includes("methodes"))items.splice(items.indexOf("methodes"),1),items.unshift("methodes");
 if(input.style==="practice"&&items.includes("learn"))items.splice(items.indexOf("learn"),1),items.unshift("learn");
 if(input.style==="structured"&&items.includes("projects"))items.splice(items.indexOf("projects"),1),items.unshift("projects");
 if(input.style==="flexible"&&items.includes("challenge"))items.splice(items.indexOf("challenge"),1),items.unshift("challenge");
 return items.map(id=>({id,...catalog[id]}))
}
window.KITORA_FINDER={catalog,goals,recommend};
const form=document.getElementById("finderForm");if(!form)return;
const results=document.getElementById("finderResults"),summary=document.getElementById("finderSummary"),feedback=document.getElementById("finderFeedback");
function draw(){const input={goal:document.getElementById("finderGoal").value,stage:document.getElementById("finderStage").value,style:document.getElementById("finderStyle").value};
 const matches=recommend(input);results.replaceChildren();summary.textContent="Voici trois outils disponibles adaptés à ton objectif. Le premier est une piste de départ, pas une obligation d'achat.";
 for(const [i,p]of matches.entries()){const item=document.createElement("article");item.className="finder-item";const eyebrow=document.createElement("div");eyebrow.className="finder-meta";eyebrow.textContent=(i===0?"SUGGESTION PRINCIPALE":"AUTRE OUTIL PERTINENT")+" · GRATUIT";const title=document.createElement("h3");title.textContent=p.name;const description=document.createElement("p");description.textContent=p.description;const link=document.createElement("a");link.className="btn";link.href=p.url;link.textContent="Ouvrir "+p.name+" →";item.append(eyebrow,title,description,link);results.append(item)}
 feedback.classList.remove("finder-hidden");document.getElementById("finderFeedbackStatus").textContent="";
}
form.addEventListener("submit",event=>{event.preventDefault();draw()});
form.addEventListener("reset",()=>{results.replaceChildren();summary.textContent="Choisis ton objectif pour voir les outils adaptés.";feedback.classList.add("finder-hidden")});
for(const [id,value]of [["finderYes","oui"],["finderNo","non"]])document.getElementById(id).addEventListener("click",()=>{try{const key="kitora_finder_local_feedback_v1";let log=JSON.parse(localStorage.getItem(key)||"[]");if(!Array.isArray(log))log=[];log.push({goal:document.getElementById("finderGoal").value,match:value});localStorage.setItem(key,JSON.stringify(log.slice(-100)))}catch{}document.getElementById("finderFeedbackStatus").textContent="Merci pour ton retour. Il reste sur cet appareil.";});
})();