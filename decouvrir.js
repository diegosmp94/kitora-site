(()=>{"use strict";
const needs=[
{id:"projet",title:"Concrétiser un projet",desc:"Passer d'une idée à des tâches réalisables.",tools:[["Projects","projects.html"],["Atelier de projet","atelier.html"],["Dashboard","dashboard.html"]]},
{id:"etudes",title:"Apprendre et réviser",desc:"Créer des supports et vérifier mes connaissances.",tools:[["Learn","learn.html"],["Méthodes","methodes.html"],["Templates","templates.html"]]},
{id:"temps",title:"Mieux gérer mon temps",desc:"Organiser mon agenda, mes échéances et mes séances.",tools:[["Agenda","agenda.html"],["Focus","focus.html"],["Défi 7 jours","defi-7-jours.html"]]},
{id:"idees",title:"Conserver mes idées",desc:"Noter, structurer et retrouver une inspiration.",tools:[["Mes notes","notes.html"],["Atelier de projet","atelier.html"],["Templates","templates.html"]]},
{id:"choix",title:"Comparer mes options",desc:"Évaluer plusieurs pistes avant de décider.",tools:[["Comparateur","comparateur.html"],["Méthodes","methodes.html"],["Projects","projects.html"]]},
{id:"creation",title:"Créer du contenu",desc:"Préparer des publications et des projets créatifs.",tools:[["Templates","templates.html"],["Projects","projects.html"],["Mes notes","notes.html"]]},
{id:"equipe",title:"Préparer un projet collectif",desc:"Clarifier des actions et partager un document.",tools:[["Atelier de projet","atelier.html"],["Projects","projects.html"],["Templates","templates.html"]]},
{id:"personnalise",title:"Obtenir un document sur mesure",desc:"Préparer une demande détaillée d'un cours ou d'un dossier.",tools:[["Plus Lab (abonnés actifs)","plus-lab.html"],["Templates gratuits","templates.html"],["Comparer les offres","offres.html"]]}
];
const root=document.getElementById("chooseOptions");
for(const n of needs){const card=document.createElement("div");card.className="choose-card";const label=document.createElement("label"),check=document.createElement("input");check.type="checkbox";check.name="goal";check.value=n.id;const strong=document.createElement("strong");strong.textContent=n.title;label.append(check,strong);const p=document.createElement("p");p.textContent=n.desc;card.append(label,p);root.append(card)}
document.getElementById("chooseForm").addEventListener("submit",event=>{
event.preventDefault();const chosen=[...document.querySelectorAll('input[name="goal"]:checked')].map(x=>x.value);
const destination=document.getElementById("chooseResult");destination.replaceChildren();destination.hidden=false;
const heading=document.createElement("h2");heading.textContent=chosen.length?"Des outils pour tes objectifs":"Quelques outils pour découvrir Kitora";destination.append(heading);
const matching=needs.filter(n=>chosen.includes(n.id));const selected=matching.length?matching:needs.slice(0,3);
const used=new Set();
for(const n of selected){const section=document.createElement("div");const h=document.createElement("h3");h.textContent=n.title;section.append(h);const links=document.createElement("div");links.className="choose-actions";for(const[label,url]of n.tools){if(used.has(url))continue;used.add(url);const a=document.createElement("a");a.href=url;a.className="btn secondary";a.textContent=label+" →";links.append(a)}section.append(links);destination.append(section)}
const notice=document.createElement("p");notice.className="choose-note";notice.textContent="Ces recommandations reposent uniquement sur tes choix. Elles ne garantissent pas qu'une offre commerciale corresponde à ton budget ou à tes besoins.";destination.append(notice);destination.scrollIntoView({behavior:"smooth",block:"start"});
});
})();