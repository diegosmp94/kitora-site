import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(p,"utf8");
const html=read("compte.html"),client=read("plus-account-status.js"),api=read("supabase/functions/kitora-plus-status/index.ts");
for(const id of ["plusAccountMessage","plusAccountRefresh","plusAccountQuota","plusAccountPending","plusAccountReady","plusAccountHistory"]){
 assert.ok(html.includes('id="'+id+'"'),"Account dashboard must contain "+id);
}
assert.match(html,/plus-account-status\.js\?v=20261020-plus4/);
assert.match(html,/\.plus-account-status\{/,"Premium styling missing");
assert.match(html,/@media\(max-width:640px\)/,"Mobile account dashboard styling missing");
assert.match(client,/client\.auth\.getUser\(\)/,"User must be verified");
assert.match(client,/client\.auth\.getSession\(\)/,"JWT bearer must be sent");
assert.match(client,/kitora-plus-status/,"Read-only status endpoint absent");
assert.match(client,/method:"GET"/,"Use GET for status");
assert.match(client,/history\.replaceChildren\(\)/,"Previous user's history must be purged");
assert.match(client,/h\.textContent=String\(entry\.title/,"Untrusted labels must be inserted only as text");
assert.match(client,/client\.auth\.onAuthStateChange/,"Dashboard must update when auth changes");
assert.doesNotMatch(client,/generate-plus|stripe|checkout|\.insert\(/,"Account status may not generate AI or buy anything");
assert.match(api,/userDb\.auth\.getUser\(\)/,"Server status route should be verified");
assert.match(api,/\.eq\("user_id",user\.id\)/,"Jobs must be user scoped");
console.log("Kitora Plus account: quotas, statuses, mobile, verified identity and no billable refresh PASS.");
