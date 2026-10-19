import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=path=>readFileSync(path,"utf8");
const email="studiokitora.contact@gmail.com";
const expected=[
 "mentions-legales.html","cgv.html","cgv-professionnels.html","cgu.html",
 "confidentialite.html","juridique.html","retractation.html","aide.html","a-propos.html"
];
for(const page of expected){
 const html=read(page);
 assert.ok(html.includes('href="mailto:'+email+'"'),"Missing working contact link on "+page);
 assert.ok(html.includes(email),"Missing declared contact on "+page);
}
const record=JSON.parse(read("kitora-commercial-readiness.json"));
assert.equal(record.merchant.business_email,email);
assert.equal(record.sales_live_authorized,false,"Contact alone cannot authorize LIVE billing");
assert.equal(record.validation.business_contact_verified,false,"Mailbox reception unverified");
assert.equal(record.validation.legal_identity_verified,false,"Legal identity remains pending");
assert.equal(record.merchant.business_phone,null,"Do not invent a professional phone");
assert.equal(record.merchant.registration_siren,null,"Do not invent registration");
assert.match(read("mentions-legales.html"),/Téléphone professionnel : <span class="placeholder">/);
assert.match(read("cgv.html"),/contact e-mail déclaré/);
assert.match(read("retractation.html"),/Aucune demande n'a été envoyée/);
assert.match(read("LEGAL_LAUNCH_CHECKLIST_20261019.md"),/réception de messages n’a pas été vérifiée/);
console.log("Unified Kitora contact verified across legal/help pages, merchant readiness remains NO-GO.");
