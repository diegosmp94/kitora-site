import fs from "node:fs";import vm from "node:vm";import assert from "node:assert/strict";
const source=fs.readFileSync("trouver-mon-outil.js","utf8");
const env={window:{},document:{getElementById:()=>null}};
vm.runInNewContext(source,env);
const finder=env.window.KITORA_FINDER;
assert(finder&&typeof finder.recommend==="function");
const goals=["project","organize","study","notes","focus","decision","habit","create","team","schedule"];
const expected={project:["projects","atelier"],organize:["agenda","templates"],study:["learn","methodes"],notes:["notes"],focus:["focus"],decision:["decision"],habit:["challenge"],create:["templates","atelier"],team:["atelier","templates"],schedule:["agenda"]};
const stages=["starting","moving","stuck","returning"],styles=["simple","structured","practice","flexible"];
let matched=0,primary=0;
for(let i=0;i<100;i++){
 const goal=goals[i%goals.length],stage=stages[Math.floor(i/10)%4],style=styles[Math.floor(i/20)%4];
 const results=finder.recommend({goal,stage,style});
 assert.equal(results.length,3);
 assert.equal(new Set(results.map(x=>x.id)).size,3);
 for(const result of results){assert(fs.existsSync(result.url),"Page manquante : "+result.url);assert(result.description.length>20)}
 if(results.some(x=>expected[goal].includes(x.id)))matched++;
 if(expected[goal].includes(results[0].id))primary++;
}
assert(matched>=75,"Objectif de couverture synthétique 75 % non atteint");
console.log(JSON.stringify({test:"100 profils synthétiques",recommandation_pertinente:matched,priorite_pertinente:primary,achat_mesure:false}));
