import assert from "node:assert/strict";
import{existsSync,readFileSync}from"node:fs";
import{spawnSync}from"node:child_process";
const read=p=>readFileSync(p,"utf8");
const names=["projet","reunion","budget","brief","calendrier"];
for(const file of ["outils-pro.html","outils-pro.js","outils-pro.css"])assert.ok(existsSync(file),file+" missing");
const html=read("outils-pro.html"),js=read("outils-pro.js");
for(const name of names){
 assert.ok(html.includes('id="tab-'+name+'"'),name+" missing accessible tab");
 assert.ok(html.includes('id="panel-'+name+'"'),name+" missing panel");
 assert.ok(html.includes('data-export="'+name+'"'),name+" missing download");
 assert.ok(html.includes('data-clear="'+name+'"'),name+" missing local deletion");
 assert.ok(js.includes("kitora_protools_v1_"),"isolated local storage namespaced");
}
for(const name of ["projectForm","taskForm","meetingForm","budgetForm","briefForm","contentForm","taskList","budgetList","contentList","storageStatus"])assert.ok(html.includes('id="'+name+'"'),name+" missing");
assert.ok(html.includes('role="tablist"')&&html.includes('role="tabpanel"'));
assert.ok(html.includes("dans ce navigateur")&&html.includes("sur cet appareil"),"local-only transparency");
assert.match(html,/aucun compte, serveur ni partage d'équipe|Aucun compte, serveur ni partage d'équipe/i);
assert.doesNotMatch(html,/href="panier\.html|checkout\.stripe\.com/i,"local preview must not sell subscriptions");
assert.doesNotMatch(js,/\bfetch\s*\(|createClient\s*\(|stripe\b/i,"no API or paid subscription access");
assert.match(js,/localStorage\.setItem/);
assert.match(js,/localStorage\.getItem/);
assert.match(js,/URL\.createObjectURL/);
assert.match(js,/text\/csv/);
assert.match(js,/text\/plain/);
assert.match(js,/neutral=/,"CSV formula neutralization is expected");
assert.match(js,/confirm\(/,"clearing requires confirmation");
assert.match(js,/textContent/,"user content must be rendered safely");
assert.ok(!js.includes(".innerHTML"),"user content must not be passed to innerHTML");
for(const page of ["offres-pro.html","solutions.html","boutique.html","kits.html","offres.html"])assert.ok(read(page).includes('outils-pro.html'),page+" should link the actual tools");
for(const plan of ["impact","launch","flow","creative","horizon"]){
 const card=read("offres-pro.html").match(new RegExp('<article class="pro-card[^"]*" data-pro-plan="'+plan+'"[^]*?<\\/article>'))?.[0]||"";
 assert.match(card,/href="outils-pro\.html#(projet|reunion|budget|brief|calendrier)"/,plan+" missing demo link");
}
for(const href of [...html.matchAll(/href="([^"]+)"/g)].map(m=>m[1])){
 if(href.startsWith("#")||href.startsWith("https://"))continue;
 const filename=href.split("#")[0].split("?")[0];if(filename)assert.ok(existsSync(filename),"broken "+href);
}
const out=spawnSync(process.execPath,["--check","outils-pro.js"],{encoding:"utf8"});assert.equal(out.status,0,out.stderr);
console.log("Kitora Pro tools: 5 functional modules, safe local storage, no payments, integrations and links passed.");
