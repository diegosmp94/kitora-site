import assert from "node:assert/strict";
import{readFileSync,existsSync}from"node:fs";
import{spawnSync}from"node:child_process";
const r=p=>readFileSync(p,"utf8");
for(const p of ["solutions.html","solutions.css","solutions.js","cgv-professionnels.html","solutions-bridge.css"])assert.ok(existsSync(p),p+" missing");
const html=r("solutions.html"),js=r("solutions.js"),legal=r("cgv-professionnels.html"),offer=r("offres.html"),cart=r("cart.js");
for(const type of ["particulier","association","entreprise"]){
 assert.match(html,new RegExp('data-audience-button="'+type+'"'),"missing audience tab "+type);
 assert.match(html,new RegExp('data-audience-panel="'+type+'"'),"missing audience panel "+type);
}
for(const term of ['id="briefForm"','id="briefType"','id="briefTeam"','id="briefFeedback"','aria-live="polite"','hidden','type="checkbox"'])assert.ok(html.includes(term),term);
assert.match(html,/multi-utilisateurs/);
assert.match(html,/Stripe TEST/);
assert.doesNotMatch(html,/(activer mon abonnement entreprise|payer pour une association)/i);
assert.match(js,/URL\.createObjectURL/);
assert.match(js,/text\/plain/);
assert.match(js,/document\.querySelectorAll/);
assert.match(js,/Aucune? demande/i); // no server-side request and no false CTA
assert.doesNotMatch(js,/\bfetch\s*\(/,"the B2B form must never send user data");
assert.match(offer,/solutions\.html\?public=association/);
assert.match(offer,/solutions\.html\?public=entreprise/);
assert.match(r("boutique.html"),/href="solutions.html"/);
assert.match(r("index.html"),/href="solutions.html"/);
assert.match(r("choisir-offre.html"),/solutions\.html\?public=association/);
assert.match(r("cgv.html"),/cgv-professionnels\.html/);
assert.match(r("juridique.html"),/cgv-professionnels\.html/);
assert.match(legal,/noindex,follow/);
assert.match(legal,/associations/);
assert.match(legal,/protections des consommateurs/);
assert.match(cart,/plus_monthly:\{name:"Kitora Plus mensuel",price:599/);
assert.match(cart,/plus_yearly:\{name:"Kitora Plus annuel",price:5990/);
assert.match(r("LEGAL_LAUNCH_CHECKLIST_20261019.md"),/Extensions B2B/);
for(const file of ["solutions.js","billing-toggle.js"]){
 const check=spawnSync(process.execPath,["--check",file],{encoding:"utf8"});
 assert.equal(check.status,0,file+" JS syntax error "+check.stderr);
}
const targets=[...html.matchAll(/href="([^"]+)"/g)].map(m=>m[1]);
for(const href of targets)if(!href.startsWith("#")&&!href.startsWith("http"))assert.ok(existsSync(href.split("#")[0].split("?")[0]),"broken link "+href);
console.log("B2C, association and business offer segregation, local-only brief, legal and prices: checks passed.");
