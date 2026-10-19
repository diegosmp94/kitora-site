import assert from "node:assert/strict";
import {existsSync,readFileSync} from "node:fs";
import {spawnSync} from "node:child_process";
import {quoteTotals} from "../devis-calcul.mjs";
for (const path of ["devis-pro.html","devis-pro.css","devis-pro.js","devis-calcul.mjs"]) assert.ok(existsSync(path),path+" absent");
const html=readFileSync("devis-pro.html","utf8"),js=readFileSync("devis-pro.js","utf8"),css=readFileSync("devis-pro.css","utf8");
for(const id of ["quoteForm","issuerName","issuerAddress","clientName","clientAddress","quoteReference","quoteDate","quoteExpires","quoteVatMode","quoteVatRate","quoteRows","quotePreview","quoteTotal","quotePrint","quoteRefresh","quoteReset","quoteStatus","orgStatus"])
 assert.ok(html.includes('id="'+id+'"'),"Champ manquant : "+id);
assert.match(html,/Content-Security-Policy/);
for(const id of ["quoteExport","quoteImport","quoteImportInput"])assert.ok(html.includes('id="'+id+'"'),"Brouillon : "+id);
assert.match(html,/BROUILLON.*NON SIGNÉ|BROUILLON NON SIGNÉ/i);
assert.match(html,/imprimer.*PDF/i);
assert.match(js,/getUser\(/);
assert.match(js,/kitora_org_profiles/);
assert.match(js,/\.eq\("user_id",user\.id\)/);
assert.ok(!/localStorage|sessionStorage|document\.cookie|\.innerHTML\s*=|service_role|sk_live_/.test(js),"Données client non stockées et affichage sans HTML dynamique");
assert.ok(!/stripe|checkout\.stripe\.com|panier\.html/i.test(html),"Aucun paiement activé");
assert.match(css,/@media print/);
assert.match(js,/DRAFT_FORMAT="kitora\.quote\.draft\.v1"/);
assert.match(js,/file\.size>32768/);
assert.match(js,/verifyDraft\(draft\)/);
assert.match(js,/URL\.revokeObjectURL/);
for(const p of ["facturation-pro.html","outils-pro.html"]){
 const body=readFileSync(p,"utf8");assert.ok(body.includes('href="devis-pro.html"'),p+" sans lien Devis Studio");
}
const a=quoteTotals([{description:"Conseil",qty:2,unitCents:12550}],20,"standard");
assert.deepEqual([a.ht,a.tva,a.ttc],[25100,5020,30120]);
assert.equal(quoteTotals([{description:"Association",qty:1,unitCents:8000}],20,"franchise_293b").ttc,8000);
assert.equal(quoteTotals([{description:"Service",qty:3,unitCents:335}],5.5,"standard").ttc,1060);
for(const bad of [
 [{description:"",qty:1,unitCents:100}],
 [{description:"Erreur",qty:0,unitCents:100}],
 [{description:"Erreur",qty:1,unitCents:-1}],
 Array(41).fill({description:"Trop",qty:1,unitCents:0})
])assert.throws(()=>quoteTotals(bad,20,"standard"));
for(const p of ["devis-pro.js","devis-calcul.mjs"]){
 const check=spawnSync(process.execPath,["--check",p],{encoding:"utf8"});
 assert.equal(check.status,0,p+" : "+check.stderr);
}
console.log("Kitora Pro Quote Studio : calculs et garde-fous OK.");
