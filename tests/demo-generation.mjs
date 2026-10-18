import{readFileSync}from"node:fs";
import assert from"node:assert/strict";
const src=readFileSync(new URL("../essayer-un-kit.js",import.meta.url),"utf8");
const node={addEventListener(){},querySelectorAll(){return[]}};
const document={getElementById(){return node}};
const window={};
new Function("document","window",src)(document,window);
let total=0;
for(const kind of Object.keys(window.KitoraDemo.templates)){
 for(const days of [2,7,14,30]){
  const title="Réviser l'espagnol",goal="Préparer un dialogue simple";
  const text=window.KitoraDemo.make({kind,title,goal,days});
  assert(text.includes(title),"Titre perdu");
  assert(text.includes(goal),"Objectif perdu");
  assert(text.includes("DURÉE\n"+days+" jours"),"Durée perdue");
  const steps=[...text.matchAll(/Jour (\d+) — /g)].map(x=>Number(x[1]));
  assert.equal(steps[0],1,"Première étape incorrecte");
  assert.equal(steps.at(-1),days,"Dernière étape incorrecte");
  assert.equal(steps.length,Math.min(days,5),"Nombre d'étapes incorrect");
  total++;
 }
}
console.log("Kitora : "+total+" scénarios de génération d'exemples réussis.");
