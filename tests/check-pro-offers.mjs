import assert from "node:assert/strict";
import {existsSync,readFileSync} from "node:fs";
import {spawnSync} from "node:child_process";
const read=p=>readFileSync(p,"utf8");
for(const p of ["offres-pro.html","offres-pro.css","offres-pro.js"])assert.ok(existsSync(p),p+" missing");
const html=read("offres-pro.html"),js=read("offres-pro.js"),css=read("offres-pro.css");
const expected={impact:[1290,12900],launch:[2490,24900],flow:[4990,49900],creative:[7990,79900],horizon:[14990,149900]};
const cards=[...html.matchAll(/<article class="pro-card[^"]*" data-pro-plan="([^"]+)" data-monthly="([0-9]+)" data-annual="([0-9]+)"/g)];
assert.equal(cards.length,5,"exactly five distinct Kitora Pro offers");
assert.equal(new Set(cards.map(m=>m[1])).size,5,"duplicate plan id");
for(const [,plan,month,year]of cards){assert.deepEqual([Number(month),Number(year)],expected[plan],plan+" price mismatch");assert.equal(Number(month)*10,Number(year),plan+" ten-month annual target");}
for(const text of ["Impact","Launch","Flow","Creative","Horizon","associations","entreprises","fonctionnalités non livrées","aucun paiement B2B","no payment"]){if(text==="no payment")continue;assert.ok(html.toLowerCase().includes(text.toLowerCase()),"missing "+text)}
for(const txt of ['data-pro-period="monthly"','data-pro-period="annual"','id="billing-status"','id="comparatif"','aria-live="polite"','Fonctionnalités envisagées','non commercialisée','Prix cible indicatif'])assert.ok(html.includes(txt),txt);
assert.ok(!html.includes('href="panier.html"')&&!html.includes('checkout')&&!html.includes('https://checkout.stripe.com'),"planned B2B offers must not expose checkout");
assert.ok(!js.includes("fetch(")&&!js.includes("createClient(")&&!js.includes("stripe"),"pure comparison cannot call backends");
assert.ok(js.includes('history.replaceState'),"shareable billing period");
assert.match(css,/#174c80/);
for(const link of [...html.matchAll(/href="([^"]+)"/g)].map(m=>m[1])){
 if(link.startsWith("#")||link.startsWith("https://")||link.startsWith("mailto:"))continue;
 const target=link.split("#")[0].split("?")[0];if(target)assert.ok(existsSync(target),"broken route: "+link);
}
for(const file of ["offres-pro.js","solutions.js"]){
 const check=spawnSync(process.execPath,["--check",file],{encoding:"utf8"});
 assert.equal(check.status,0,file+" syntax "+check.stderr);
}
for(const page of ["solutions.html","offres.html","boutique.html","index.html","cgv-professionnels.html"])assert.ok(read(page).includes("offres-pro.html"),page+" needs Kitora Pro link");
assert.ok(html.includes("cgv-professionnels.html"),"professional legal document missing");
console.log("Kitora Pro static checks passed: five plans, indicative annual/monthly prices, legal links, no payment endpoints.");
