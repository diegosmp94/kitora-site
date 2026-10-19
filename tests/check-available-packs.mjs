import assert from "node:assert/strict";
import {existsSync,readFileSync} from "node:fs";
const read=p=>readFileSync(p,"utf8");
const html=read("packs-actifs.html"),css=read("packs-actifs.css"),offers=read("offres.html"),choose=read("choisir-offre.html"),cart=read("cart.js"),b2b=read("offres-pro.html");
const expected={
 free:["available","none",null],
 solo:["test-active","test","solo"],
 workspace:["test-active","test","workspace"],
 plus_monthly:["beta","test","plus_monthly"],
 plus_yearly:["beta","test","plus_yearly"],
 ultimate:["beta","test","ultimate"],
 impact:["planned","none",null],
 launch:["planned","none",null],
 flow:["planned","none",null],
 creative:["planned","none",null],
 horizon:["planned","none",null]
};
const cards=[...html.matchAll(/<article class="pack-card" data-pack-id="([^"]+)" data-pack-status="([^"]+)" data-payment-mode="([^"]+)">([\s\S]*?)<\/article>/g)];
assert.equal(cards.length,11,"exactly six personal variants and five professional packs");
for(const [,id,status,mode,body]of cards){
 assert.ok(id in expected,"unknown pack "+id);
 const [wantStatus,wantMode,checkout]=expected[id];
 assert.equal(status,wantStatus,id+" status");
 assert.equal(mode,wantMode,id+" mode");
 assert.match(body,/href="[^"]+">/,"missing pack access "+id);
 if(checkout)assert.ok(body.includes('href="panier.html?plan='+checkout+'"'),id+" must point to test checkout");
 else assert.ok(!/href="panier\.html\?plan=/.test(body),id+" must not imply a paid subscription");
}
assert.equal(new Set(cards.map(m=>m[1])).size,11,"duplicate pack ID");
for(const t of ["aucun paiement réel","Stripe TEST","cloud","Restauration manuelle","pas commercialisées","Génération IA","sans débit"])assert.ok(html.toLowerCase().includes(t.toLowerCase()),"missing disclosure "+t);
assert.ok(!/create-checkout-live|sk_live_|rk_live_|whsec_|https:\/\/checkout\.stripe\.com/i.test(html),"LIVE forbidden in catalog");
assert.ok(/create-checkout"/.test(cart)&&!/create-checkout-live/.test(cart),"public cart must stay TEST");
assert.ok(offers.includes('href="packs-actifs.html"')&&choose.includes('href="packs-actifs.html"'));
for(const term of ["Impact","Launch","Flow","Creative","Horizon"])assert.ok(new RegExp(term,"i").test(b2b),"retain future B2B offers "+term);
for(const href of [...html.matchAll(/href="([^"]+)"/g)].map(m=>m[1])){
 if(href.startsWith("#")||/^https?:\/\//.test(href))continue;
 const target=href.split("?")[0].split("#")[0];
 if(target)assert.ok(existsSync(target),"broken link "+href);
}
assert.match(css,/@media\(max-width:620px\)/,"small screens supported");
assert.match(css,/@media\(prefers-reduced-motion:reduce\)/,"motion accessibility supported");
assert.ok(read("sitemap.xml").includes("packs-actifs.html"));
const prices={solo:199,workspace:399,plus_monthly:599,plus_yearly:5990,ultimate:899};
for(const [id,amount]of Object.entries(prices))assert.ok(cart.includes(id+':{name:')&&cart.includes('price:'+amount),'price mismatch '+id);
console.log("Kitora Packs availability: 11 accurate pack variants, TEST-only purchases, no misleading LIVE or B2B, valid routes PASS.");