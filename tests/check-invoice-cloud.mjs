import assert from "node:assert/strict";
import{existsSync,readFileSync}from"node:fs";
import{spawnSync}from"node:child_process";
const read=p=>readFileSync(p,"utf8");
const needed=["facturation-pro.html","facturation-pro.js","facturation-cloud.js","facturation-pro.css","supabase/migrations/20261019_kitora_invoice_drafts.sql"];
for(const file of needed)assert.ok(existsSync(file),"Missing "+file);
const html=read("facturation-pro.html"),app=read("facturation-pro.js"),cloud=read("facturation-cloud.js"),sql=read("supabase/migrations/20261019_kitora_invoice_drafts.sql");
for(const id of ["cloudDraftList","cloudDraftCount","cloudDraftStatus","saveCloudDraft","refreshCloudDrafts","newCloudDraft","invoiceForm"]){
 assert.ok(html.includes('id="'+id+'"'),id+" missing in invoice UI");
}
assert.match(html,/choisis explicitement|sélectionnes|enregistres volontairement/);
assert.match(html,/numéro de facture/);
assert.match(html,/À vérifier/);
assert.match(app,/initInvoiceCloudDrafts/);
assert.match(cloud,/\.eq\("user_id",user\.id\)/);
assert.match(cloud,/\.eq\("revision",current\.revision\)/);
assert.match(cloud,/\.eq\("revision",item\.revision\)/);
assert.match(cloud,/\.select\(columns\)/);
assert.match(cloud,/\.maybeSingle\(\)/);
assert.match(cloud,/\.update\(payload\)/);
assert.match(cloud,/\.insert\(\{/);
assert.match(cloud,/\.delete\(\)/);
assert.match(cloud,/\.status="draft"/);
assert.match(cloud,/textContent/);
assert.ok(!cloud.includes("innerHTML"),"User input may never be inserted into HTML");
assert.doesNotMatch(cloud,/checkout|stripe|invoice_number|issued_at|send_invoice/);
for(const term of ["enable row level security","to authenticated","auth.uid()","document jsonb","pg_column_size(document)","revision","status in ('draft','review')","user_id uuid not null","on delete cascade"]){
 assert.ok(sql.includes(term),"SQL missing "+term);
}
assert.doesNotMatch(sql,/create policy[^;]*to anon/i);
assert.doesNotMatch(sql,/^\s*(invoice_number|issued_at|finalized_at|stripe_customer_id)\s+/mi);
for(const path of ["facturation-cloud.js","facturation-pro.js"]){
 const result=spawnSync(process.execPath,["--check",path],{encoding:"utf8"});
 assert.equal(result.status,0,path+": "+result.stderr);
}
console.log("Kitora cloud draft static checks: secure access, explicit cloud storage, revision checks, no issuance.");
