import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=path=>readFileSync(path,"utf8");
const checked=[
 ["projects.html","advanced-exports.js"],["notes.html","advanced-exports.js"],["agenda.html","advanced-exports.js"],["learn.html","advanced-exports.js"],
 ["dashboard.html","workspace-insights.js"],["synchronisation.html","auto-cloud.js"],["admin-health.html","admin-health-page.js"]
];
for(const[html,script]of checked)assert.ok(read(html).includes(script),html+" is missing "+script);
for(const f of ["advanced-exports.js","auto-cloud.js","workspace-insights.js","admin-health-page.js"])assert.ok(read(f).includes("auth.getUser()")||read(f).includes("auth.getSession()"),f+" missing authentication");
assert.match(read("advanced-exports.js"),/subscriptions/);
assert.match(read("advanced-exports.js"),/\.status!=="active"/);
assert.match(read("workspace-insights.js"),/\["workspace","ultimate"\]/);
assert.match(read("auto-cloud.js"),/baseline/);
assert.match(read("auto-cloud.js"),/enabled/);
assert.match(read("admin-health-page.js"),/kitora-health/);
assert.match(read("release/V1_SPECIFICATIONS_ET_DOCUMENTS_DRAFT.md"),/BROUILLON NON CONTRACTUEL/);
assert.match(read("release/V1_OPERATIONS_RUNBOOK.md"),/Stripe TEST/);
console.log("Kitora V1.0 phase 2: "+checked.length+" pages contrôlées; politiques d'accès et documents vérifiés.");
