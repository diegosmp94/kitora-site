import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";
const source=fs.readFileSync("plus-pdf.js","utf8").replace(/^export /gm,"");
const sample=[
 {title:"Apprendre l'espagnol en deux jours",summary:"Jour 1 et Jour 2 avec expressions en espagnol.",sections:[{heading:"Hola",analysis:"Hola signifie bonjour.",actions:["Écris Hola et traduis : bonjour."]}],plan:[{week:1,objective:"Jour 1",tasks:["Vocabulaire"]},{week:2,objective:"Jour 2",tasks:["Dialogue"]}]},
 {title:"Mon projet de portfolio",summary:"Créer un premier livrable concret.",sections:[{heading:"Objectif",analysis:"Présenter deux projets et leurs résultats.",actions:["Préparer une maquette."]}],plan:[{week:1,objective:"Maquette",tasks:["Dessiner la page"]}]},
 {title:"Réviser le réseau informatique",summary:"Un programme de révision progressif.",sections:[{heading:"Routage",analysis:"Expliquer le rôle d'une route.",actions:["Tracer une topologie."]}],plan:[{week:1,objective:"Pratique",tasks:["Répondre aux questions"]}]}
];
let rendered=[],saved=[];
class MockPdf{
 setFillColor(){}rect(){}setTextColor(){}setFont(){}setFontSize(){}setDrawColor(){}line(){}addPage(){}
 text(t){rendered.push(String(t))}
 splitTextToSize(s){return String(s).match(/.{1,70}/g)||[""]}
 output(){return {size:2300,type:"application/pdf"}}
}
const ctx={window:{jspdf:{jsPDF:MockPdf}},document:{createElement(){return {click(){},remove(){}}},body:{append(){}}},URL:{createObjectURL(blob){saved.push(blob);return "blob:test"},revokeObjectURL(){}},setTimeout(){},Blob};
vm.runInNewContext(source+";this.testExports={generateAiPlusPdf,downloadAiPlusTxt}",ctx);
let count=0;
for(const [i,s] of sample.entries()){
 rendered=[];saved=[];
 const result={summary:s.summary,sections:s.sections,weekly_plan:s.plan,questions:[],success_metrics:[]};
 const item={id:"0000000"+i,title:s.title,category:"projet"};
 await ctx.testExports.generateAiPlusPdf(item,result);
 assert(rendered.some(t=>t.includes(s.title)),"Titre perdu : "+s.title);
 assert(rendered.some(t=>t.includes(s.sections[0].heading)),"Section perdue");
 assert(rendered.some(t=>t.includes("Etape 1")),"Programme manquant");
 ctx.testExports.downloadAiPlusTxt(item,result);
 assert(saved.some(b=>b.type.includes("text/plain")),"Export TXT manquant");
 count++;
}
console.log(count+" scénarios de génération PDF/TXT simulés validés (rendu réel non testé).");
