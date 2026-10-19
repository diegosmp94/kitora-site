(()=>{
"use strict";
const $=id=>document.getElementById(id);
const names=["projet","reunion","budget","brief","calendrier"];
const defaults={
 projet:{name:"",deadline:"",goal:"",tasks:[]},
 reunion:{title:"",date:"",people:"",agenda:"",decisions:"",followup:""},
 budget:{items:[]},
 brief:{project:"",audience:"",problem:"",deliverable:"",tone:"",success:""},
 calendrier:{items:[]}
};
const status=$("storageStatus");
const key=id=>"kitora_protools_v1_"+id;
const clone=value=>JSON.parse(JSON.stringify(value));
function load(id){
 try{
  const raw=localStorage.getItem(key(id));
  if(!raw)return clone(defaults[id]);
  const parsed=JSON.parse(raw);
  if(!parsed||typeof parsed!=="object"||Array.isArray(parsed))throw Error("invalid storage");
  const result={...clone(defaults[id]),...parsed};
  for(const prop of ["tasks","items"])if(prop in defaults[id]&&!Array.isArray(result[prop]))result[prop]=[];
  if(result.tasks)result.tasks=result.tasks.slice(0,120);
  if(result.items)result.items=result.items.slice(0,120);
  return result;
 }catch{return clone(defaults[id])}
}
const data=Object.fromEntries(names.map(id=>[id,load(id)]));
function save(id){
 try{localStorage.setItem(key(id),JSON.stringify(data[id]));status.textContent="✓ "+label(id)+" : enregistré uniquement sur cet appareil.";return true}
 catch{status.textContent="Enregistrement local indisponible. Exporte ton travail pour le conserver.";return false}
}
const label=id=>({projet:"Projet",reunion:"Réunion",budget:"Budget",brief:"Brief",calendrier:"Calendrier"}[id]||id);
const node=(tag,content,cls)=>{const element=document.createElement(tag);if(content!==undefined)element.textContent=String(content);if(cls)element.className=cls;return element};
const euro=cents=>new Intl.NumberFormat("fr-FR",{style:"currency",currency:"EUR"}).format(cents/100);
const newId=()=>String(Date.now())+"-"+Math.random().toString(36).slice(2,9);
const safe=(value,limit)=>String(value??"").trim().slice(0,limit);
function download(content,filename,mime){
 const blob=new Blob([mime.startsWith("text/csv")?"\uFEFF":"",content],{type:mime+";charset=utf-8"});
 const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);status.textContent="Fichier préparé. Les données n'ont pas été envoyées à Kitora.";
}
function csv(value){
 const str=String(value??"").replace(/\r\n|\r|\n/g," ").trim();
 const neutral=/^[=+\-@\t]/.test(str)?"'"+str:str;
 return '"'+neutral.replace(/"/g,'""')+'"';
}
const line=items=>items.map(row=>row.map(csv).join(";")).join("\r\n")+"\r\n";
const dateForFiles=()=>new Date().toISOString().slice(0,10);
const dateLabel=v=>/\d{4}-\d\d-\d\d/.test(v)?v:"Non précisée";
function bindFields(id,mapping){
 for(const [elementId,field]of Object.entries(mapping)){
  const element=$(elementId);element.value=typeof data[id][field]==="string"?data[id][field]:"";
  element.addEventListener("input",()=>{data[id][field]=element.value;save(id)});
 }
}
const projectFields={projectName:"name",projectDeadline:"deadline",projectGoal:"goal"};
const meetingFields={meetingTitle:"title",meetingDate:"date",meetingPeople:"people",meetingAgenda:"agenda",meetingDecisions:"decisions",meetingFollowup:"followup"};
const briefFields={briefProject:"project",briefAudience:"audience",briefProblem:"problem",briefDeliverable:"deliverable",briefTone:"tone",briefSuccess:"success"};
bindFields("projet",projectFields);bindFields("reunion",meetingFields);bindFields("brief",briefFields);
for(const form of ["projectForm","meetingForm","briefForm"])$(form).addEventListener("submit",e=>e.preventDefault());
function empty(list,message){list.replaceChildren(node("p",message,"empty"))}
function itemButton(title,click){const button=node("button",title,"mini-button");button.type="button";button.addEventListener("click",click);return button}
function renderProject(){
 const list=$("taskList"),tasks=data.projet.tasks.filter(t=>t&&typeof t==="object"),done=tasks.filter(t=>t.done).length;
 $("projectStats").textContent=tasks.length+" action"+(tasks.length>1?"s":"")+" · "+done+" terminée"+(done>1?"s":"")+" · "+(tasks.length?Math.round(done/tasks.length*100):0)+" % de progression";
 list.replaceChildren();if(!tasks.length){empty(list,"Aucune action : ajoute la première étape de ton projet.");return}
 for(const task of tasks){
  const row=node("div",undefined,"entry");
  const check=document.createElement("input");check.type="checkbox";check.checked=!!task.done;check.setAttribute("aria-label","Marquer l’action « "+safe(task.name,120)+" » comme terminée");
  check.addEventListener("change",()=>{task.done=check.checked;save("projet");renderProject()});
  const main=node("div",undefined,"entry-main"),title=node("strong",safe(task.name,140));
  if(task.done)title.classList.add("completed");
  main.append(title,node("small",[safe(task.owner,80)||"Responsable non précisé",task.due?"Échéance : "+dateLabel(task.due):""].filter(Boolean).join(" · ")));
  row.append(check,main,itemButton("Supprimer",()=>{data.projet.tasks=data.projet.tasks.filter(t=>t.id!==task.id);save("projet");renderProject()}));
  list.append(row);
 }
}
$("taskForm").addEventListener("submit",event=>{
 event.preventDefault();const name=safe($("taskName").value,140);if(!name)return;
 if(data.projet.tasks.length>=120){status.textContent="Limite locale de 120 actions atteinte.";return}
 data.projet.tasks.push({id:newId(),name,owner:safe($("taskOwner").value,80),due:$("taskDeadline").value,done:false});
 $("taskForm").reset();save("projet");renderProject();$("taskName").focus();
});
function toCents(raw){const n=Number(raw);return Number.isFinite(n)&&n>=0&&n<=100000000?Math.round(n*100):null}
function renderBudget(){
 const list=$("budgetList"),items=data.budget.items.filter(x=>x&&typeof x==="object");
 const planned=items.reduce((n,item)=>n+(Number(item.planned)||0),0),actual=items.reduce((n,item)=>n+(Number(item.actual)||0),0);
 const totals=$("budgetTotals");totals.replaceChildren();
 for(const [name,val]of [["Prévision",planned],["Réalisé",actual],["Écart réel - prévu",actual-planned]]){
  const cell=node("div");cell.append(node("span",name),node("strong",(val>0&&name.startsWith("Écart")?"+":"")+euro(val)));totals.append(cell);
 }
 list.replaceChildren();if(!items.length){empty(list,"Aucune ligne budgétaire ajoutée.");return}
 for(const item of items){
  const row=node("div",undefined,"entry budget-entry"),main=node("div",undefined,"entry-main");
  main.append(node("strong",safe(item.name,125)),node("small","Prévu "+euro(Number(item.planned)||0)+" · Réel "+euro(Number(item.actual)||0)));
  const delta=(Number(item.actual)||0)-(Number(item.planned)||0);
  row.append(main,node("span",(delta>0?"+":"")+euro(delta),"delta"),itemButton("Supprimer",()=>{data.budget.items=data.budget.items.filter(x=>x.id!==item.id);save("budget");renderBudget()}));
  list.append(row);
 }
}
$("budgetForm").addEventListener("submit",event=>{
 event.preventDefault();const name=safe($("budgetItem").value,125),planned=toCents($("budgetPlanned").value),actual=toCents($("budgetActual").value);
 if(!name||planned===null||actual===null){status.textContent="Vérifie la désignation et les montants (0 à 100 millions €).";return}
 if(data.budget.items.length>=120){status.textContent="Limite locale de 120 lignes atteinte.";return}
 data.budget.items.push({id:newId(),name,planned,actual});$("budgetForm").reset();$("budgetPlanned").value="0";$("budgetActual").value="0";save("budget");renderBudget();$("budgetItem").focus();
});
function renderCalendar(){
 const list=$("contentList"),items=data.calendrier.items.filter(x=>x&&typeof x==="object").slice().sort((a,b)=>String(a.date).localeCompare(String(b.date)));
 const published=items.filter(x=>x.published).length;
 $("contentStats").textContent=items.length+" publication"+(items.length>1?"s":"")+" · "+published+" publiée"+(published>1?"s":"");
 list.replaceChildren();if(!items.length){empty(list,"Aucune publication planifiée pour le moment.");return}
 for(const item of items){
  const row=node("div",undefined,"entry"),main=node("div",undefined,"entry-main"),actions=node("div",undefined,"entry-actions");
  const h=node("strong",safe(item.title,150));if(item.published)h.classList.add("completed");
  main.append(h,node("small",dateLabel(item.date)+" · "+safe(item.channel,35)+" · "+(item.published?"Publié":"À préparer")));
  actions.append(itemButton(item.published?"À préparer":"Marquer publié",()=>{item.published=!item.published;save("calendrier");renderCalendar()}));
  actions.append(itemButton("Supprimer",()=>{data.calendrier.items=data.calendrier.items.filter(x=>x.id!==item.id);save("calendrier");renderCalendar()}));
  row.append(main,actions);list.append(row);
 }
}
$("contentForm").addEventListener("submit",event=>{
 event.preventDefault();const title=safe($("contentTitle").value,150),date=$("contentDate").value,channel=$("contentChannel").value;
 if(!title||!/^\d{4}-\d{2}-\d{2}$/.test(date))return;
 if(data.calendrier.items.length>=120){status.textContent="Limite locale de 120 publications atteinte.";return}
 data.calendrier.items.push({id:newId(),title,date,channel,published:false});$("contentForm").reset();save("calendrier");renderCalendar();$("contentTitle").focus();
});
function exportTool(id){
 const d=data[id],date=dateForFiles();
 if(id==="projet"){
  const rows=["KITORA PRO — PROJECT PILOT","Projet : "+(d.name||"Sans titre"),"Objectif : "+(d.goal||"Non précisé"),"Échéance : "+dateLabel(d.deadline),"","ACTIONS :"];
  for(const task of d.tasks)rows.push((task.done?"[Terminée] ":"[À faire] ")+task.name+" | Responsable : "+(task.owner||"Non précisé")+" | Date cible : "+dateLabel(task.due));
  download(rows.join("\n"),"kitora-pro-projet-"+date+".txt","text/plain");
 }else if(id==="reunion"){
  download(["KITORA PRO — MEETING NOTES","Sujet : "+(d.title||"Sans titre"),"Date : "+dateLabel(d.date),"Participants : "+(d.people||"Non précisés"),"","ORDRE DU JOUR",d.agenda||"Non précisé","","DÉCISIONS",d.decisions||"Non précisées","","ACTIONS À SUIVRE",d.followup||"Non précisées"].join("\n"),"kitora-pro-reunion-"+date+".txt","text/plain");
 }else if(id==="budget"){
  download(line([["Poste","Prévision EUR","Réalisé EUR","Écart EUR"],...d.items.map(x=>[x.name,(x.planned/100).toFixed(2),(x.actual/100).toFixed(2),((x.actual-x.planned)/100).toFixed(2)])]),"kitora-pro-budget-"+date+".csv","text/csv");
 }else if(id==="brief"){
  download(["KITORA PRO — CREATIVE BRIEF","Projet : "+(d.project||"Sans titre"),"Public cible : "+(d.audience||"Non précisé"),"","BESOIN",d.problem||"Non précisé","","LIVRABLE",d.deliverable||"Non précisé","","TON ET CONTRAINTES",d.tone||"Non précisé","","CRITÈRES DE RÉUSSITE",d.success||"Non précisés"].join("\n"),"kitora-pro-brief-"+date+".txt","text/plain");
 }else if(id==="calendrier"){
  download(line([["Date prévue","Canal","Publication","Statut"],...d.items.slice().sort((a,b)=>String(a.date).localeCompare(String(b.date))).map(x=>[x.date,x.channel,x.title,x.published?"Publié":"À préparer"])]),"kitora-pro-calendrier-"+date+".csv","text/csv");
 }
}
document.querySelectorAll("[data-export]").forEach(button=>button.addEventListener("click",()=>exportTool(button.dataset.export)));
function clearTool(id){
 if(!confirm("Effacer les données locales de « "+label(id)+" » ? Cette action ne peut pas être annulée."))return;
 data[id]=clone(defaults[id]);save(id);
 const fields=id==="projet"?projectFields:id==="reunion"?meetingFields:id==="brief"?briefFields:{};
 for(const [element,field]of Object.entries(fields))$(element).value=data[id][field];
 if(id==="projet")renderProject();
 if(id==="budget")renderBudget();
 if(id==="calendrier")renderCalendar();
 status.textContent=label(id)+" : données effacées de cet appareil.";
}
document.querySelectorAll("[data-clear]").forEach(button=>button.addEventListener("click",()=>clearTool(button.dataset.clear)));
function selectTool(id,focus=false){
 if(!names.includes(id))return;
 for(const name of names){
  const button=$("tab-"+name),panel=$("panel-"+name),selected=id===name;
  button.setAttribute("aria-selected",String(selected));button.tabIndex=selected?0:-1;panel.hidden=!selected;
  if(selected&&focus)button.focus();
 }
}
for(const button of document.querySelectorAll(".tool-tab")){
 button.addEventListener("click",()=>{const id=button.dataset.tool;history.replaceState(null,"",location.pathname+location.search+"#"+id);selectTool(id)});
 button.addEventListener("keydown",event=>{
  const idx=names.indexOf(button.dataset.tool);
  let next=idx;
  if(event.key==="ArrowRight")next=(idx+1)%names.length;
  else if(event.key==="ArrowLeft")next=(idx+names.length-1)%names.length;
  else if(event.key==="Home")next=0;
  else if(event.key==="End")next=names.length-1;
  else return;
  event.preventDefault();const id=names[next];history.replaceState(null,"",location.pathname+location.search+"#"+id);selectTool(id,true);
 });
}
window.addEventListener("hashchange",()=>{const hash=location.hash.slice(1);if(names.includes(hash))selectTool(hash)});
const initial=location.hash.slice(1);
if(names.includes(initial)){selectTool(initial);requestAnimationFrame(()=>$("atelier").scrollIntoView({block:"start",behavior:"instant"}))}
renderProject();renderBudget();renderCalendar();
})();