import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
import vm from "node:vm";
// Synthetic coverage fixture; NOT a customer survey or an estimated conversion rate.
// 10 declared goals x 10 requirements. Each group contains 8 existing-feature requests
// and 2 unsupported advanced-feature requests; hence it tests routing, not market demand.
const expectations={
 project:["projects","atelier","dashboard","projects","atelier","dashboard","projects","atelier",null,null],
 organize:["agenda","templates","dashboard","agenda","templates","dashboard","agenda","templates",null,null],
 study:["learn","methodes","focus","learn","methodes","focus","learn","methodes",null,null],
 notes:["notes","atelier","templates","notes","atelier","templates","notes","atelier",null,null],
 focus:["focus","challenge","agenda","focus","challenge","agenda","focus","challenge",null,null],
 decision:["decision","atelier","notes","decision","atelier","notes","decision","atelier",null,null],
 habit:["challenge","dashboard","focus","challenge","dashboard","focus","challenge","dashboard",null,null],
 create:["templates","atelier","notes","templates","atelier","notes","templates","atelier",null,null],
 team:["atelier","templates","projects","atelier","templates","projects","atelier","templates",null,null],
 schedule:["agenda","projects","dashboard","agenda","projects","dashboard","agenda","projects",null,null]
};
const sandbox={window:{},document:{getElementById:()=>null}};
vm.runInNewContext(readFileSync("trouver-mon-outil.js","utf8"),sandbox,{timeout:1000});
const finder=sandbox.window.KITORA_FINDER;
assert(finder&&typeof finder.recommend==="function");
const stages=["starting","moving","stuck","returning"],styles=["simple","structured","practice","flexible"];
let matched=0,total=0,unsupported=0;
for(const [goal,requirements] of Object.entries(expectations)){
 for(let i=0;i<requirements.length;i++){
  total++;const expected=requirements[i];
  const recommendations=finder.recommend({goal,stage:stages[i%4],style:styles[(i+1)%4]});
  assert.equal(recommendations.length,3);
  for(const r of recommendations){assert(existsSync(r.url),goal+": missing "+r.url);assert.equal(typeof r.description,"string")}
  if(expected===null){unsupported++;continue}
  if(recommendations.some(r=>r.id===expected))matched++;
 }
}
assert.equal(total,100);
console.log(JSON.stringify({synthetic_profiles:total,matched,unsupported,coverage_percent:matched/total*100,real_visitors_tested:0,actual_purchases_measured:0}));
console.log("Important : les 100 demandes fictives sont construites pour tester le routage des outils, et non choisies aléatoirement selon la population.");
