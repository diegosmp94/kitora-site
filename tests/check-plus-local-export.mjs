import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const pdf=readFileSync("plus-pdf.js","utf8");
const lab=readFileSync("plus-lab.js","utf8"),html=readFileSync("plus-lab.html","utf8");
const start=pdf.indexOf("export function buildPlusBriefText(item)");
const stop=pdf.indexOf("export function downloadPlusBriefTxt(item)",start);
assert.ok(start>0&&stop>start,"Plus Lab brief serializer missing");
const builder=new Function(pdf.slice(start,stop).replace("export function","function")+";return buildPlusBriefText;")();
const item={title:"Dossier d'apprentissage de portugais",category:"etudes",format:"both",details:"Durée : 2 jours. Niveau : débutant. Je veux travailler les phrases simples."};
const txt=builder(item);
assert.match(txt,/BRIEF PRÉPARATOIRE/,"Must disclose that this is not an AI generated result");
assert.match(txt,/Aucune génération IA/);
assert.match(txt,/portugais/);
assert.match(txt,/2 jours/);
assert.doesNotMatch(txt,/Programme sur quatre semaines/i,"Never invent a fixed 4-week plan for a 2-day task");
for(const id of ["labExportBriefPdf","labExportBriefTxt"]){
 assert.match(html,new RegExp('id="'+id+'" type="button" disabled'),"Exports must require verified Plus access");
 assert.ok(lab.includes(id),"Missing client export handler for "+id);
}
assert.match(lab,/await ensureAuthorizedSession\(\)/);
assert.match(lab,/generatePlusBriefPdf/);
assert.match(lab,/downloadPlusBriefTxt/);
assert.match(lab,/Brief préparatoire exporté sans IA/);
let overflow=0,pages=0,saved=0,lines=[];
class FakePdf{
 setFillColor(){}rect(){}setTextColor(){}setFont(){}setFontSize(){}
 addPage(){pages++} splitTextToSize(text){const str=String(text);return str.match(/.{1,66}/g)||[" "]}
 text(line,x,y){if(y>287)overflow++;lines.push(String(line))}
 output(){return {type:"application/pdf",size:1800}}
}
const source=pdf.slice(pdf.indexOf("export async function generatePlusBriefPdf(item)")).replace("export async function","async function");
const generator=new Function("pdfLib","save","buildPlusBriefText",source+";return generatePlusBriefPdf;")(
 async()=>({jsPDF:FakePdf}),()=>{saved++},builder
);
const long={...item,details:item.details.repeat(140)};
await generator(long);
assert.equal(overflow,0,"Document must not overflow past PDF footer");
assert.equal(saved,1,"A PDF download must be offered");
assert.ok(lines.some(x=>x.includes("PREPARATOIRE")));
console.log("Kitora Plus: honest offline brief export, Unicode-safe source, pagination and gated controls PASS.");
