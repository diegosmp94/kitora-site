import fs from "node:fs";
import assert from "node:assert/strict";
const file=fs.readFileSync("plus-pdf.js","utf8");
const start=file.indexOf("export async function generateAiPlusPdf");
const end=file.indexOf("export function downloadAiPlusTxt",start);
assert(start>=0&&end>start,"Générateur IA PDF manquant");
const source=file.slice(start,end).replace("export async function","async function");
let exportsDone=0,lines=[],overflow=0;
class FakePdf{
 setFillColor(){}rect(){}setTextColor(){}setFont(){}setFontSize(){}setDrawColor(){}line(){}addPage(){}
 splitTextToSize(v){const text=String(v);return text.match(/.{1,65}(?:\s|$)/g)||[text]}
 text(value,x,y){lines.push(String(value));if(y>289)overflow++}
 output(){return{type:"application/pdf",size:1400}}
}
const factory=new Function("pdfLib","save",source+";return generateAiPlusPdf;");
const run=factory(async()=>({jsPDF:FakePdf}),()=>exportsDone++);
const scenarios=["Cours d'espagnol","Cours d'anglais","Révisions informatique","Création de CV","Plan de projet","Organisation hebdomadaire","Dossier associatif","Plan de création"];
for(let i=0;i<scenarios.length;i++){
 const item={id:"fixture-"+i,title:scenarios[i]};
 const result={summary:"Synthèse claire pour "+scenarios[i]+". Objectif et livrables concrets.",sections:[{heading:"Méthode",analysis:"Exemples utiles, français, español, ação. ".repeat(55),actions:["Faire un premier essai","Vérifier et corriger"]}],weekly_plan:[{week:1,objective:"Première étape",tasks:["Terminer un livrable"]}],questions:["Quel niveau ?"],success_metrics:["Objectif vérifiable"]};
 await run(item,result);
}
assert.equal(exportsDone,scenarios.length);
assert.equal(overflow,0);
assert(lines.some(x=>x.includes("Synthèse")),"Accent français perdu dans le corps PDF");
console.log("8 scénarios PDF simulés réussis ; aucune requête IA facturable.");
