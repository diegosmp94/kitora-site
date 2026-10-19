import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(p,"utf8");
const state=JSON.parse(read("kitora-commercial-readiness.json"));
const legal=read("mentions-legales.html"),terms=read("cgv.html"),solo=read("solo-live.html");
const checkout=read("supabase/functions/create-checkout-live/index.ts");
const availability=read("supabase/functions/kitora-solo-availability/index.ts");
assert.equal(state.schema_version,1);
assert.equal(state.sales_live_authorized,false,"An unverified merchant must never be offered LIVE checkout");
assert.equal(state.merchant.declared_responsible,"M. Sampaio");
assert.equal(state.merchant.legal_form,null,"Do not invent the merchant legal form");
assert.equal(state.merchant.registration_siren,null,"Do not invent the merchant company registration");
assert.equal(state.offers.solo.live_public_checkout,false);
assert.equal(state.offers.solo.technical_stripe_price_active,true);
for(const value of Object.values(state.validation))assert.equal(value,false,"No unknown compliance work may be assumed verified");
for(const page of [legal,terms,solo]){
 assert.match(page,/SIREN\s*\/\s*SIRET/,"Disclose unprovided registration");
 assert.match(page,/(autre \/ à préciser|statut juridique à préciser|forme juridique à préciser)/i,"Disclose unverified legal form");
}
assert.match(legal,/M\. Sampaio/);
assert.match(terms,/Kitora Solo/);
assert.match(terms,/1,99 € par mois/);
for(const src of [checkout,availability]){
 assert.match(src,/kitora-commercial-readiness\.json/,"Missing independent approved merchant record");
 assert.match(src,/merchantComplianceApproved\(\)/,"Merchant compliance must be checked");
 assert.match(src,/sales_live_authorized===true/,"Commercial authorization must be affirmative");
 assert.match(src,/merchant_registration_reviewed/);
 assert.match(src,/consumer_mediator_contracted/);
 assert.match(src,/online_withdrawal_submission_and_durable_ack_tested/);
 assert.match(src,/real_payment_entitlement_refund_tested/);
 assert.match(src,/registration_siren/);
 assert.match(src,/legal_identity_verified/);
 assert.match(src,/privacy_notices_reviewed/);
 assert.match(src,/KITORA_LEGAL_READY/,"Must retain independent secret kill switch");
}
assert.match(checkout,/if\(!\(await merchantComplianceApproved\(\)\)\)return out/,"Denied merchants may not create a charge");
assert.match(availability,/if\(!\(await merchantComplianceApproved\(\)\)\)return response\(false\)/);
console.log("Kitora Solo compliance: unverified merchant declared, mandatory live-sale controls fail closed PASS.");
