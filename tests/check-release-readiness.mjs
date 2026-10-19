import assert from "node:assert/strict";
import {readFileSync,writeFileSync,mkdtempSync,rmSync} from "node:fs";
import {spawnSync} from "node:child_process";
import {tmpdir} from "node:os";
import {join} from "node:path";

const load=f=>readFileSync(f,"utf8");
const account=load("compte.html"),requests=load("subscriber-requests.js"),studio=load("kitora3.js"),studioPage=load("kitora3-studio.html");
assert.match(account,/kitora_live_subscriptions/,"account should load LIVE subscriptions");
assert.match(account,/customer-portal-live/,"LIVE customers must use LIVE portal");
assert.match(account,/dataset\.billingMode/,"portal mode must match selected subscription");
assert.match(requests,/getKitoraSubscription/,"Plus access must use verified entitlement checks");
assert.match(load("billing-entitlements.js"),/kitora_live_subscriptions/,"Shared entitlement lookup must verify LIVE subscriptions");
assert.match(requests,/if\(eligible\|\|item\.ai_result\)/,"saved results must remain accessible");
assert.match(requests,/item\.ai_result\?\{ready:true,result:item\.ai_result\}/,"saved download must not require a new generation");
assert.match(studio,/subscriber_requests/,"studio should import existing saved AI results");
assert.match(studio,/source_request_id:request\.id/,"import must track own source request");
assert.match(studioPage,/id="importAI"/);
assert.match(studioPage,/id="importDialog"/);
for(const page of ["index.html","compte.html","aide.html","kits.html","kitora3-studio.html","projects.html","agenda.html","learn.html","templates.html","focus.html","synchronisation.html","choisir-offre.html","bienvenue.html","notes.html","a-propos.html","boutique.html","panier.html","admin.html","comparateur.html","atelier.html","defi-7-jours.html","methodes.html"]){
 const source=load(page),head=source.slice(source.indexOf("<header"),source.indexOf("</header>")+9);
 assert.ok(head.startsWith("<header"),page+" missing header");
 assert.ok(head.includes("kitora-header"),page+" wrong header");
 assert.ok(head.includes("kitora-mobile"),page+" missing mobile menu");
 assert.ok(head.includes('href="kits.html"'),page+" missing Kits link");
}
for(const file of ["subscriber-requests.js","kitora3.js"]){
 const result=spawnSync(process.execPath,["--check",file],{encoding:"utf8"});
 assert.equal(result.status,0,file+" invalid JS: "+result.stderr);
}
const dir=mkdtempSync(join(tmpdir(),"kitora-release-check-"));
try{
 const inline=[...account.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)].filter(m=>m[2].trim()&&!/type\s*=\s*["']application\//.test(m[1]));
 for(let i=0;i<inline.length;i++){
  const path=join(dir,"account-inline-"+i+".mjs");writeFileSync(path,inline[i][2]);
  const result=spawnSync(process.execPath,["--check",path],{encoding:"utf8"});
  assert.equal(result.status,0,"compte.html inline script "+i+": "+result.stderr);
 }
}finally{rmSync(dir,{recursive:true,force:true})}
console.log("Release readiness static checks passed: TEST/LIVE, saved AI, 22 headers, scripts.");
