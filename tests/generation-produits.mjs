import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
// Test six client document templates without browser, checkout, network or Groq costs.
const cards=[],downloads=[];
const document={
 createElement:tag=>({tag,children:[],append(...items){this.children.push(...items)},remove(){},click(){},
  addEventListener(event,fn){if(event==="click")this.onClick=fn}}),
 getElementById:id=>id==="templateList"?{append(node){cards.push(node)}}:null,
 body:{append(){}}
};
const URL={createObjectURL(blob){downloads.push(blob);return "blob:fake"},revokeObjectURL(){}};
class Blob{constructor(parts,opts){this.text=parts.join("");this.type=opts.type}}
vm.runInNewContext(readFileSync("templates.js","utf8"),{document,URL,Blob,setTimeout:()=>{}},{timeout:1000});
assert.equal(cards.length,6,"Six modèles doivent être affichés");
for(const card of cards){const button=card.children.at(-1);assert.equal(typeof button.onClick,"function");button.onClick()}
assert.equal(downloads.length,6,"Les six téléchargements doivent fonctionner");
for(const blob of downloads){
 assert(blob.type.includes("utf-8"),"Le modèle doit être en UTF-8");
 assert(blob.text.startsWith("\uFEFF"),"Le fichier doit préserver les accents via BOM");
 assert(blob.text.length>90,"Le modèle ne doit pas être vide");
 assert(blob.text.includes(":"),"Le document doit contenir des champs à remplir");
}
console.log(JSON.stringify({templates:cards.length,downloads:downloads.length,valid_utf8:downloads.length,groq_calls:0,paid_transactions:0}));
