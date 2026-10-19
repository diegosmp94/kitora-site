import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=file=>readFileSync(file,"utf8");
const productPrice="price_1USLrS0xrx52eQIkfvGoRzqK";
const checkout=read("supabase/functions/create-checkout-live/index.ts");
const availability=read("supabase/functions/kitora-solo-availability/index.ts");
const store=read("solo-live.html"),client=read("solo-live.js"),catalog=read("packs-actifs.html"),offers=read("offres.html");
for(const env of ["KITORA_LIVE_CHECKOUT_ENABLED","KITORA_LIVE_SOLO_ENABLED","KITORA_LEGAL_READY"]){
 assert.ok(checkout.includes(env),"Checkout missing "+env);
 assert.ok(availability.includes(env),"Availability missing "+env);
}
for(const src of [checkout,availability]){
 assert.ok(src.includes(productPrice),"Unmatched Stripe recurring price");
 assert.match(src,/price\.(?:unit_amount|currency)/);
 assert.match(src,/price\.active/);
 assert.match(src,/product\.active/);
 assert.match(src,/mentions-legales\.html/);
 assert.match(src,/cgv\.html/);
 assert.match(src,/À compléter avant/,"Must block unfinished legal pages");
}
assert.match(checkout,/acceptedTerms!==true/,"An explicit confirmation of billing terms is required");
assert.match(checkout,/price\.recurring\?\.interval!=="month"/);
assert.match(checkout,/b\.plan/);
assert.match(checkout,/auth\.getUser\(\)/);
assert.match(checkout,/subscription_data/);
assert.match(store,/id="soloAcceptTerms"/);
assert.match(store,/id="soloLiveCheckout"[^>]+disabled/);
assert.match(store,/1,99/);
assert.match(store,/panier\.html\?plan=solo/);
assert.match(client,/kitora-solo-availability/);
assert.match(client,/result\.available===true/);
assert.match(client,/!ready\|\|!checkbox\.checked/);
assert.match(client,/acceptedTerms:true/);
assert.match(client,/functions\/v1\//);
assert.match(client,/create-checkout-live/);
assert.match(client,/checkout\\\.stripe\\\.com/);
assert.match(catalog,/href="solo-live\.html"/);
assert.match(offers,/href="solo-live\.html"/);
assert.doesNotMatch(client,/sk_live_|rk_live_|whsec_/);
console.log("Solo LIVE storefront: gated public status, posted checkout, terms consent, test fallback and billing safety PASS.");
