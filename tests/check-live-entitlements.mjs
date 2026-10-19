import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {getKitoraSubscription,isKitoraPlanActive} from "../billing-entitlements.js";
const db=({live=null,test=null,error=null}={})=>({from(table){return {select(){return this},eq(){return this},maybeSingle:async()=>({data:table==="kitora_live_subscriptions"?live:test,error})}}});
const subscription=(plan,status="active")=>({plan,status});
let v=await getKitoraSubscription(db({live:subscription("workspace"),test:subscription("solo")}),"user");
assert.equal(v.subscription.billing_mode,"live");
assert.ok(isKitoraPlanActive(v.subscription,"workspace"));
assert.ok(!isKitoraPlanActive(v.subscription,"solo"));
v=await getKitoraSubscription(db({test:subscription("solo")}),"user");
assert.ok(isKitoraPlanActive(v.subscription,"solo"),"TEST previews may still operate pending activation");
v=await getKitoraSubscription(db({live:subscription("plus_monthly","canceled"),test:subscription("plus_yearly")}),"user");
assert.ok(!isKitoraPlanActive(v.subscription,"plus"),"Canceled LIVE must not fallback to TEST");
v=await getKitoraSubscription(db({error:new Error("Connection failed")}),"user");
assert.ok(v.error&&!v.subscription,"Errors must fail closed");
v=await getKitoraSubscription(db({live:subscription("plus_yearly")}),"user");
assert.ok(isKitoraPlanActive(v.subscription,"plus"));
assert.ok(!isKitoraPlanActive(v.subscription,"ultimate"));
v=await getKitoraSubscription(db(),"");
assert.ok(v.error);
for(const f of ["tool-access.js","choisir-offre.js","advanced-exports.js","auto-cloud.js","workspace-insights.js","plus-lab.js","subscriber-requests.js"]){
 const src=readFileSync(f,"utf8");
 assert.match(src,/getKitoraSubscription/,"LIVE access not wired in "+f);
}
for(const f of ["supabase/functions/generate-plus/index.ts","supabase/functions/kitora-ai-worker/index.ts"]){
 const src=readFileSync(f,"utf8");
 assert.match(src,/kitora_live_subscriptions/,"Backend LIVE rights missing in "+f);
 assert.match(src,/liveRow\.data\|\|testRow\.data/,"LIVE must take precedence in "+f);
}
console.log("Kitora LIVE access: entitlement precedence, cancellation, fail-closed and server integration PASS.");
