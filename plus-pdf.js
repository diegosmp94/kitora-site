// Kitora Plus: generation locale avancee depuis une demande authentifiee.
let loader;
async function pdfLib(){if(window.jspdf?.jsPDF)return window.jspdf;if(!loader)loader=(async()=>{for(const url of ["https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js","https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.2/jspdf.umd.min.js"]){try{await new Promise((ok,no)=>{const s=document.createElement("script");s.src=url;s.onload=ok;s.onerror=no;document.head.append(s)});if(window.jspdf?.jsPDF)return window.jspdf}catch{}}throw Error("Impossible de charger le moteur PDF. Vérifie ta connexion.")})();try{return await loader}catch(e){loader=null;throw e}}
const plans={
 organisation:{name:"Organisation",steps:["Recenser les engagements fixes de la semaine et les échéances.","Classer les tâches selon leur importance et leur urgence.","Réserver des créneaux réalistes pour les trois priorités.","Ajouter une marge pour les imprévus et les pauses.","Faire un bilan en fin de journée et déplacer les tâches non terminées."],sections:["Agenda hebdomadaire","Priorités","Routines et ajustements"]},
 etudes:{name:"Études",steps:["Lister les notions à maîtriser et les dates importantes.","Identifier les deux sujets les moins bien compris.","Planifier des séances courtes avec objectifs précis.","S'entraîner sans regarder le cours et corriger les erreurs.","Revoir les points fragiles après un délai puis évaluer les progrès."],sections:["Programme de révisions","Autoévaluation","Révision espacée"]},
 projet:{name:"Projet",steps:["Définir le résultat attendu et un critère de réussite mesurable.","Découper le projet en livrables indépendants.","Identifier les ressources, contraintes et dépendances.","Planifier un premier livrable réalisable cette semaine.","Faire une revue des risques et adapter les étapes suivantes."],sections:["Cadrage","Feuille de route","Risques et indicateurs"]},
 habitude:{name:"Habitudes",steps:["Définir une action simple et un déclencheur régulier.","Prévoir une version minimale pour les jours chargés.","Préparer le matériel et réduire les obstacles.","Noter chaque essai dans un suivi hebdomadaire.","Évaluer ce qui fonctionne et ajuster sans chercher la perfection."],sections:["Déclencheurs","Suivi hebdomadaire","Bilan et ajustements"]},
 autre:{name:"Plan personnalisé",steps:["Clarifier le besoin et les contraintes exprimées.","Définir le résultat souhaité et les critères de réussite.","Identifier les étapes réalisables à court terme.","Prévoir un point de contrôle pour mesurer les progrès.","Réviser le plan à partir des résultats obtenus."],sections:["Analyse","Plan d'action","Évaluation"]}
};
function save(blob,name){if(!blob||blob.size<1)throw Error("Fichier vide");const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000)}
export async function generatePlusKit(item){const{jsPDF}=await pdfLib();const doc=new jsPDF({unit:"mm",format:"a4",compress:true});const kind=plans[item.category]||plans.autre;const navy=[20,49,76],gold=[185,143,76];let y=0,page=0;const clean=s=>String(s||"").normalize("NFC").replace(/[\u2018\u2019]/g,"'").replace(/[\u2013\u2014]/g,"-");function next(){if(page)doc.addPage();page++;doc.setFillColor(...navy);doc.rect(0,0,210,36,"F");doc.setFillColor(...gold);doc.rect(0,35,210,1.5,"F");doc.setTextColor(255,255,255);doc.setFont("helvetica","bold");doc.setFontSize(20);doc.text("kitora. PLUS",16,19);doc.setFontSize(9);doc.text(kind.name.toUpperCase()+" / DOSSIER PERSONNALISE",16,29);doc.setTextColor(...navy);doc.setFontSize(8);doc.text("KITORA PLUS  -  "+page,16,287);y=48}function ensure(h){if(y+h>270)next()}function heading(t){ensure(20);doc.setFont("helvetica","bold");doc.setFontSize(14);doc.setTextColor(...navy);doc.text(clean(t),16,y);y+=4;doc.setDrawColor(...gold);doc.line(16,y,194,y);y+=9}function para(t,indent=16,size=10){doc.setFont("helvetica","normal");doc.setFontSize(size);doc.setTextColor(45,61,79);const lines=doc.splitTextToSize(clean(t),194-indent);for(const line of lines){ensure(6);doc.text(line,indent,y);y+=5.7}y+=3}function itemLine(t,n){ensure(15);doc.setFillColor(233,240,247);doc.roundedRect(16,y-4,12,10,2,2,"F");doc.setTextColor(...navy);doc.setFontSize(10);doc.setFont("helvetica","bold");doc.text(String(n).padStart(2,"0"),19,y+2);para(t,34,10);y+=2}next();heading("Ton dossier");para(item.title,16,15);para("Prepare a partir de ta demande du "+new Date(item.created_at||Date.now()).toLocaleDateString("fr-FR")+".");heading("01 / Comprendre ton besoin");para(item.details);heading("02 / Objectif et resultat attendu");para("Objectif principal : "+item.title+". Le plan ci-dessous propose une methode progressive a adapter a tes contraintes. Les informations manquantes restent a preciser.");heading("03 / Plan d'action detaille");kind.steps.forEach((s,i)=>itemLine(s,i+1));heading("04 / Programme sur quatre semaines");const weeks=["Semaine 1 - Cadrage et preparation","Semaine 2 - Premiere mise en pratique","Semaine 3 - Ajustements et consolidation","Semaine 4 - Evaluation et prochaine etape"];weeks.forEach((w,i)=>{ensure(22);doc.setFont("helvetica","bold");doc.setFontSize(11);doc.setTextColor(...navy);doc.text(w,16,y);y+=7;para([kind.steps[0],kind.steps[1],kind.steps[3],kind.steps[4]][i])});next();heading("05 / Tableau de suivi");const headers=["Action / livrable","Priorite","Echeance","Fait"];const xs=[17,108,143,176];doc.setFillColor(232,240,248);doc.rect(16,y-6,178,12,"F");doc.setFont("helvetica","bold");doc.setFontSize(9);headers.forEach((h,i)=>doc.text(h,xs[i],y+1));y+=15;kind.steps.forEach((s,i)=>{ensure(14);doc.setDrawColor(210,220,230);doc.line(16,y+5,194,y+5);doc.setFont("helvetica","normal");doc.setFontSize(8);const short=doc.splitTextToSize(clean(s),87)[0];doc.text(short,17,y);doc.text(i<2?"Haute":"Normale",108,y);doc.text("A definir",143,y);doc.rect(178,y-4,5,5);y+=13});heading("06 / Questions pour affiner le plan");for(const q of ["Quelle est la date limite exacte ?","Quelles sont tes contraintes de temps et tes disponibilites ?","Quel indicateur permettra de mesurer la reussite ?","Quelles ressources ou aides sont deja disponibles ?"]){para("- "+q);ensure(10);doc.setDrawColor(200,210,220);doc.line(16,y+2,194,y+2);y+=10}heading("07 / Bilan et prochaines decisions");kind.sections.forEach((x,i)=>{para((i+1)+". "+x+" : noter les resultats, les difficultes et la prochaine action.");ensure(10);doc.setDrawColor(200,210,220);doc.line(16,y+3,194,y+3);y+=10});para("Ce document est un plan personnalise a partir des informations communiquees. Il ne remplace pas un accompagnement specialise.");const blob=doc.output("blob");save(blob,"kitora-plus-"+(item.id||"personnalise").slice(0,8)+".pdf");return blob.size}
export async function generateAiPlusPdf(item,result){
 const {jsPDF}=await pdfLib();
 const doc=new jsPDF({unit:"mm",format:"a4",compress:true,putOnlyUsedFonts:true});
 const left=17,right=193,maxY=268;let y=47,page=0;
 // Built-in jsPDF fonts are not Unicode fonts. Convert ALL content to safe Latin ASCII
 // before measuring/wrapping it, to prevent broken glyphs and PDF overflow.
 function clean(value){
  return String(value??"").normalize("NFC")
   .replace(/[\u2018\u2019\u02BC]/g,"'").replace(/[\u2013\u2014\u2212]/g,"-")
   .replace(/[\u00A0\u202F\u2000-\u200B]/g," ")
   .replace(/\u2026/g,"...").replace(/\u2022/g,"-")
   .replace(/\u0153/g,"oe").replace(/\u0152/g,"OE").replace(/\u00E6/g,"ae").replace(/\u00C6/g,"AE")
   .replace(/[^\x20-\x7E\xA1-\xFF\n]/g," ").replace(/[ \t]+/g," ").trim();
 }
 function newPage(){
  if(page)doc.addPage();page++;
  doc.setFillColor(20,49,76);doc.rect(0,0,210,34,"F");
  doc.setTextColor(255,255,255);doc.setFont("helvetica","bold");doc.setFontSize(19);
  doc.text("kitora. PLUS AI",16,20);
  doc.setFontSize(9);doc.setTextColor(20,49,76);
  doc.text("KITORA PLUS / DOCUMENT PERSONNALISE - "+page,16,287);y=47;
 }
 function text(value,size=10,bold=false){
  doc.setFont("helvetica",bold?"bold":"normal");doc.setFontSize(size);
  doc.setTextColor(35,56,75);
  const lineHeight=size*0.44+2.1;
  for(const paragraph of clean(value).split("\n")){
   const lines=doc.splitTextToSize(paragraph||" ",right-left);
   for(const line of lines){
    if(y+lineHeight>maxY)newPage();
    doc.setFont("helvetica",bold?"bold":"normal");doc.setFontSize(size);doc.setTextColor(35,56,75);
    doc.text(line,left,y);y+=lineHeight;
   }
  }
  y+=4;
 }
 function head(value){
  if(y+20>maxY)newPage();
  doc.setDrawColor(185,143,76);doc.line(16,y,194,y);y+=9;
  text(value,13,true);
 }
 newPage();head(item.title);text("Document Kitora Plus - analyse IA personnalisee");
 head("Synthese de ton besoin");text(result.summary);
 for(const section of result.sections||[]){
  head(section.heading);text(section.analysis);
  for(const action of section.actions||[])text("- "+action);
 }
 if(result.weekly_plan?.length){
  head("Programme detaille");
  for(const w of result.weekly_plan){
   text("Etape "+w.week+" - "+w.objective,11,true);
   for(const task of w.tasks||[])text("- "+task);
  }
 }
 if(result.questions?.length){head("Questions pour affiner");for(const q of result.questions)text("- "+q)}
 if(result.success_metrics?.length){head("Indicateurs de reussite");for(const metric of result.success_metrics)text("- "+metric)}
 text("Document genere automatiquement. Verifie les hypotheses avant application.",9);
 const blob=doc.output("blob");save(blob,"kitora-plus-ia-"+String(item.id||"document").slice(0,8)+".pdf");return blob.size;
}
export function downloadAiPlusTxt(item,result){
 const lines=["KITORA PLUS - "+String(item.title||"Document"),"",String(result.summary||"")];
 for(const section of result.sections||[]){lines.push("","## "+section.heading,String(section.analysis||""));for(const action of section.actions||[])lines.push("- "+action)}
 if(result.weekly_plan?.length){lines.push("","## Programme detaille");for(const step of result.weekly_plan){lines.push("Etape "+step.week+" : "+step.objective);for(const task of step.tasks||[])lines.push("- "+task)}}
 if(result.questions?.length)lines.push("","## Questions pour affiner",...result.questions.map(q=>"- "+q));
 if(result.success_metrics?.length)lines.push("","## Indicateurs de reussite",...result.success_metrics.map(q=>"- "+q));
 const value=lines.join("\n");
 save(new Blob(["\uFEFF",value],{type:"text/plain;charset=utf-8"}),"kitora-plus-ia-"+String(item.id||"document").slice(0,8)+".txt");
}
export function downloadPlusTxt(item){const p=plans[item.category]||plans.autre;const txt=["KITORA PLUS - "+item.title,"","DEMANDE",item.details,"","PLAN D'ACTION",...p.steps.map((s,i)=>(i+1)+". "+s),"","PROGRAMME SUR 4 SEMAINES","S1 : cadrage","S2 : mise en pratique","S3 : ajustements","S4 : bilan","",...p.sections.map(s=>s+" : ____________________")].join("\n");save(new Blob([txt],{type:"text/plain;charset=utf-8"}),"kitora-plus-"+(item.id||"personnalise").slice(0,8)+".txt")}
