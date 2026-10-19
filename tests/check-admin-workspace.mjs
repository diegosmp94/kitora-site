import assert from "node:assert/strict";
import {readFileSync,existsSync}from"node:fs";
import{spawnSync}from"node:child_process";
const pages=["admin.html","admin-products.html","admin-orders.html","admin-requests.html","admin-users.html","admin-insights.html","admin-health.html"];
const links=[...pages];
const read=p=>readFileSync(p,"utf8");
for(const f of [...pages,"admin-workspace.css","admin-workspace.js"])assert.ok(existsSync(f),"Missing "+f);
const css=read("admin-workspace.css"),js=read("admin-workspace.js");
assert.match(css,/grid-template-columns:minmax\(205px,238px\)/);
assert.match(css,/ka-shortcut/);
assert.match(css,/@media\(max-width:760px\)/);
assert.match(css,/prefers-reduced-motion/);
assert.match(js,/aria-current/);
assert.match(js,/\.textContent/);
assert.match(js,/\.classList\.toggle/);
assert.ok(!js.includes("innerHTML"),"Avoid injecting admin labels as HTML");
assert.ok(!js.includes("fetch("),"Admin navigation must not fetch or expose privileged information");
const first=read("admin.html");
assert.ok(first.includes('id="adminPages"'));
assert.ok(first.includes('id="adminStats"'));
assert.ok(first.includes('id="statOrders"')&&first.includes('id="statRevenue"')&&first.includes('id="statSubscriptions"')&&first.includes('id="statLibrary"'),"Keep all existing stat IDs");
assert.match(first,/Command Center/);
assert.match(first,/mode TEST|démonstration/i);
for(const p of pages){
 const content=read(p);
 assert.ok(content.includes('<body class="ka-app">'),p+": scoped styling");
 assert.ok(content.includes("admin-workspace.css?v="),p+": shared CSS");
 assert.ok(content.includes("admin-workspace.js?v="),p+": shared JS");
 assert.ok(content.includes('aria-label="'),p+": accessible markup");
 assert.ok(!content.includes('https://checkout.stripe.com'),p+": no LIVE checkout");
 const protectedSelector=p==="admin.html"?'id="adminPages"':'id="'+(p==="admin-health.html"?"healthProtected":"adminProtected")+'" hidden';
 assert.ok(content.includes(protectedSelector),p+": never unhide admin data before role validation");
 if(p!=="admin.html"){
   for(const link of links)assert.ok(content.includes('href="'+link+'"'),p+": missing nav "+link);
   assert.ok(content.includes('<nav class="kitora-admin-tabs ka-sidebar"'),p+": missing unified sidebar");
   assert.ok(content.includes('href="'+p+'" aria-current="page"'),p+": active nav unavailable");
   assert.ok(content.includes('class="ka-nav-filter"'),p+": missing searchable navigation");
 }
}
const required={
"admin-products.html":["adminProductForm","productSave","adminProductsRefresh","adminProductRows"],
"admin-orders.html":["adminOrdersRefresh","adminOrdersExport","adminOrderRows"],
"admin-requests.html":["adminRequestsRefresh","adminRequestsExport","adminRequestList"],
"admin-users.html":["usersSearch","usersRows","usersAuditRows","usersRefresh"],
"admin-insights.html":["adminInsightsCards","adminInsightsRefresh","adminInsightsExport"],
"admin-health.html":["healthRefresh","healthMetrics","healthChecked"]
};
for(const [page,ids] of Object.entries(required))for(const id of ids)assert.ok(read(page).includes('id="'+id+'"'),"Legacy admin workflow ID missing: "+page+" "+id);
const check=spawnSync(process.execPath,["--check","admin-workspace.js"],{encoding:"utf8"});
assert.equal(check.status,0,check.stderr);
for(const page of pages)for(const m of read(page).matchAll(/href="(admin[^"]+\.html)"/g))assert.ok(existsSync(m[1]),page+" broken "+m[1]);
console.log("Kitora Admin UI static: 7 pages, shared accessible navigation, role-gated panels, unchanged workflows OK.");
