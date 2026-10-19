import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
import {spawnSync} from "node:child_process";
const read=p=>readFileSync(p,"utf8");
const pages=["juridique.html","mentions-legales.html","cgv.html","cgu.html","confidentialite.html","cookies.html","retractation.html"];
const essential=["index.html","panier.html","compte.html","aide.html","boutique.html","kits.html","kitora3-studio.html","offres.html","admin.html"];
for(const p of pages){
 assert.ok(existsSync(p),"Legal page missing: "+p);
 const html=read(p);
 for(const marker of ['lang="fr"','name="viewport"','<main','<h1','<footer','header.css','legal.css','class="kitora-header"','class="kitora-mobile"']){
  assert.ok(html.includes(marker),p+": missing "+marker);
 }
 for(const m of [...html.matchAll(/href="([^"]+)"/g)]){
  const target=m[1];
  if(target.startsWith("http")||target.startsWith("mailto:")||target.startsWith("#"))continue;
  const pathname=target.split("#")[0].split("?")[0];
  if(pathname)assert.ok(existsSync(pathname),p+" broken link to "+pathname);
 }
 assert.ok(html.includes("avant")||html.includes("provisoire"),p+": missing readiness disclosure");
}
for(const p of essential){
 const html=read(p);
 assert.ok(html.includes('href="juridique.html"'),p+": missing legal hub link");
 assert.ok(html.includes('href="cgv.html"'),p+": missing CGV link");
 assert.ok(html.includes('href="confidentialite.html"'),p+": missing privacy link");
 assert.ok(html.includes('href="retractation.html"'),p+": missing withdrawal link");
}
assert.match(read("panier.html"),/id="kitora-contract-notice"/,"checkout must display precontractual links");
assert.match(read("cgv.html"),/14 jours/);
assert.match(read("cgv.html"),/médiateur/);
assert.match(read("retractation.html"),/19 juin 2026/);
assert.match(read("retractation.html"),/Aucune demande n'a été envoyée/,"never claim submission from copy action");
assert.match(read("confidentialite.html"),/Groq/);
assert.match(read("cookies.html"),/consentement préalable/);
assert.match(read("LEGAL_LAUNCH_CHECKLIST_20261019.md"),/NO-GO/);
const script=[...read("retractation.html").matchAll(/<script>([\s\S]*?)<\/script>/g)].map(x=>x[1]);
for(const [index,code] of script.entries()){
 const result=spawnSync(process.execPath,["--check","--input-type=commonjs"],{input:code,encoding:"utf8"});
 assert.equal(result.status,0,"withdrawal script #"+index+": "+result.stderr);
}
console.log("Kitora legal templates and navigation checks succeeded:",pages.length,"legal pages,",essential.length,"core pages.");
