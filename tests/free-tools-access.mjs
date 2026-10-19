import {readFileSync} from "node:fs";
import assert from "node:assert/strict";
const tools=["dashboard","projects","learn","agenda","notes","templates","comparateur","atelier","focus","defi-7-jours","etude-clients","test-audience","synchronisation"];
const guard=readFileSync("tool-access.js","utf8"),choice=readFileSync("choisir-offre.js","utf8");
assert.match(guard,/auth\.getUser\(\)/);
assert.match(guard,/kitora_tool_access/);
assert.match(choice,/chosen_plan:plan/);
assert.match(choice,/choose\("free"\)/);
assert.match(choice,/getKitoraSubscription/);
const billing=readFileSync("billing-entitlements.js","utf8");
assert.match(billing,/kitora_live_subscriptions/);
assert.match(billing,/db\.from\("subscriptions"\)/);
assert.match(guard,/isKitoraPlanActive/);
for(const name of tools){
 const html=readFileSync(name+".html","utf8");
 assert.match(html,/kitora-protected-pending/);
 assert.match(html,/data-kitora-protected-src/);
 assert.match(html,/tool-access\.js\?v=/);
}
assert.match(readFileSync("choisir-offre.html","utf8"),/choisir-offre\.js/);
console.log("Kitora: "+tools.length+" guarded tool pages, plan gate and chooser verified.");
