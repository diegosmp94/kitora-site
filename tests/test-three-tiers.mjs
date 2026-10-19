import {readFileSync} from "node:fs";
import assert from "node:assert/strict";
const read=path=>readFileSync(path,"utf8");
const cart=read("cart.js"),selector=read("choisir-offre.js"),gate=read("tool-access.js"),offers=read("offres.html"),requests=read("subscriber-requests.js"),lab=read("plus-lab.js");
const tiers={solo:199,workspace:399,ultimate:899};
for(const [tier,cents] of Object.entries(tiers)){
 assert.ok(cart.includes(tier+':{name:'),'Missing cart tier '+tier);
 assert.ok(cart.includes('price:'+cents),'Missing test price '+tier);
 assert.ok(selector.includes(tier+':["'+tier+'"]'),'Missing plan check '+tier);
 assert.ok(gate.includes(tier+':["'+tier+'"]'),'Missing access check '+tier);
 assert.ok(offers.includes('data-offer-plan="'+tier+'"'),"Missing announced plan "+tier);
 assert.ok(!offers.includes('href="panier.html?plan='+tier+'"'),"Unavailable pack must not have public checkout "+tier);
}
assert.ok(requests.includes('"ultimate"')&&lab.includes('"ultimate"'));
assert.ok(offers.includes("sans débit réel"));
assert.ok(read("choisir-offre.html").includes("choisir-offre.js?v=20261018-tier1"));
assert.ok(read("panier.html").includes("cart.js?v=20261018-tier1"));
console.log("Kitora V1 beta: tier consistency static checks passed.");
