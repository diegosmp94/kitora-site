import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
import {spawnSync} from "node:child_process";
const read=f=>readFileSync(f,"utf8");
const migration="supabase/migrations/20261019_security_revoke_excess_privileges.sql";
const stripeMigration="supabase/migrations/20261019_security_live_stripe_atomic.sql";
const quotaMigration="supabase/migrations/20261019_security_invoice_draft_quota.sql";
const webhook="supabase/functions/stripe-webhook-live/index.ts";
const checkout="supabase/functions/create-checkout-live/index.ts";
for(const p of [migration,stripeMigration,quotaMigration,webhook,checkout])assert.ok(existsSync(p),"missing security patch "+p);
const permissions=read(migration);
assert.match(permissions,/revoke truncate, trigger, references/i);
assert.match(permissions,/kitora_invoice_drafts/);
assert.match(permissions,/kitora_org_profiles/);
const invoice=read("facturation-pro.js");
assert.doesNotMatch(invoice,/localStorage\.setItem|localStorage\.getItem|sessionStorage\.setItem/,"client PII must not persist in browser");
assert.match(invoice,/purgeLegacyDraftStorage\(\)/);
assert.match(invoice,/localStorage\.removeItem/);
assert.match(invoice,/invoice=emptyInvoice\(\)/);
const page=read("facturation-pro.html");
assert.match(page,/http-equiv="Content-Security-Policy"/);
assert.match(page,/object-src 'none'/);
assert.match(page,/uniquement en mémoire/);
assert.match(page,/sauvegardes? volontairement|enregistres volontairement/i);
assert.match(read("tool-access.js"),/resolved\.origin!==location\.origin/);
assert.ok(read("tool-access.js").includes(String.raw`*\.js`),"same-origin JS loader must accept standard file extensions");
assert.ok(!read("tool-access.js").includes(String.raw`*\\.js`),"double-escaped loader regex prevents dashboards loading");

assert.match(read("tool-access.js"),/location\.replace\(chooser\)/);
for(const f of ["admin.js","tool-access.js","kitora3.js","subscriber-requests.js","admin-insights.js","facturation-pro.js"]){
 const src=read(f);
 assert.ok(!src.includes("@supabase/supabase-js@2/+esm"),f+" needs exact version");
 if(src.includes("supabase-js"))assert.match(src,/@supabase\/supabase-js@2\.57\.0/);
}
const rpc=read(stripeMigration),stripe=read(webhook),liveCheckout=read(checkout);
for(const token of ["pg_advisory_xact_lock","on conflict(event_id) do nothing","from public,anon,authenticated","grant execute","ignored_conflicting_subscription","to service_role"]){
 assert.ok(rpc.toLowerCase().includes(token.toLowerCase()),"Stripe SQL: "+token);
}
for(const token of ["constructEventAsync","event.livemode","stripe.subscriptions.retrieve","kitora_commit_live_stripe_event_safe","if(error)throw","data!==\"applied\""]){
 assert.ok(stripe.includes(token),"Stripe edge: "+token);
}
assert.match(liveCheckout,/KITORA_LIVE_CHECKOUT_ENABLED/);
assert.match(liveCheckout,/!=="true"/);
assert.match(read(quotaMigration),/v_count >= 100/);
assert.match(read(quotaMigration),/before insert/);
assert.match(read(quotaMigration),/pg_advisory_xact_lock/);
assert.doesNotMatch(stripe,/\.upsert\(\{user_id/,"LIVE webhook must not use non-atomic direct upsert");
assert.doesNotMatch(stripe,/console\.log\(.+secret|console\.log\(.+token/i);
for(const p of ["facturation-pro.js","tool-access.js"]){
 const r=spawnSync(process.execPath,["--check",p],{encoding:"utf8"});
 assert.equal(r.status,0,p+": "+r.stderr);
}
console.log("SECURITY PATCH CHECKS PASS: restrictive permissions, memory-only client PII, CSP, dependencies, atomic Stripe and invoice quota.");
