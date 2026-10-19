import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
import {spawnSync} from "node:child_process";
const read=p=>readFileSync(p,"utf8");
for(const file of ["facturation-pro.html","facturation-pro.css","facturation-pro.js","facture-pdf.js","supabase/migrations/20261019_kitora_org_profiles.sql"])assert.ok(existsSync(file),"missing "+file);
const html=read("facturation-pro.html"),app=read("facturation-pro.js"),pdf=read("facture-pdf.js"),sql=read("supabase/migrations/20261019_kitora_org_profiles.sql");
for(const id of ["organizationForm","saveOrg","orgKind","orgPlan","orgName","orgSiren","orgAddress","orgPostal","orgCity","orgEmail","orgVatMode","invoiceForm","invoiceLines","invoiceDate","serviceDate","paymentDue","clientName","clientSiren","invoiceTotals","downloadPdf","invoiceProfile"]){assert.ok(html.includes('id="'+id+'"'),"missing "+id)}
assert.match(html,/BROUILLON/i);assert.match(html,/aucun.*paiement/i);
assert.match(app,/kitora_org_profiles/);
assert.match(app,/\.upsert\(/);
assert.match(app,/\.eq\("user_id",user\.id\)/);
assert.match(app,/kitora_pro_invoice_draft_v1_/);
assert.match(app,/facture-brouillon/);
assert.doesNotMatch(app,/checkout|stripe\/v1|service_role|rpc\(.?create_invoice/i,"no live checkout or invoice issuance");
assert.match(sql,/enable row level security/);
assert.match(sql,/auth\.uid\(\)/);
assert.match(sql,/authenticated/);
assert.doesNotMatch(sql,/create policy[^;]*to anon/i);
assert.match(pdf,/NON ÉMISE/);
assert.match(pdf,/startxref/);
for(const file of ["facturation-pro.js","facture-pdf.js"]){
 const c=spawnSync(process.execPath,["--check",file],{encoding:"utf8"});
 assert.equal(c.status,0,file+": "+c.stderr);
}
for(const page of ["offres-pro.html","outils-pro.html","solutions.html","compte.html","boutique.html"])assert.match(read(page),/facturation-pro\.html/,page+" missing invoice link");
for(const href of [...html.matchAll(/href="([^"]+)"/g)].map(x=>x[1])){
 if(href.startsWith("#")||href.startsWith("https://"))continue;
 const path=href.split("?")[0].split("#")[0];
 if(path)assert.ok(existsSync(path),"broken href "+href);
}
const module=await import("data:text/javascript;base64,"+Buffer.from(pdf,"utf8").toString("base64"));
const sampleProfile={
 kind:"association",legal_name:"Association Démonstration",address:"1 rue de l'Essai",
 postal_code:"75001",city:"Paris",country:"France",siren:"123456789",
 email:"contact@example.org",phone:"01 00 00 00 00",vat_mode:"standard",
 payment_terms:"Paiement à 30 jours",late_penalties:"Pénalités légales applicables"
};
const sampleInvoice={
 clientName:"Client Exemple",clientAddress:"9 avenue Exemple",clientPost:"69001",
 clientCity:"Lyon",clientCountry:"France",clientSiren:"987654321",clientVat:"",
 date:"2026-10-19",serviceDate:"2026-10-19",dueDate:"2026-11-18",
 orderNumber:"BC-999",vatRate:"20",paymentNote:"Virement",notes:"",
 lines:[{description:"Atelier création",qty:2,unitCents:12050}]
};
const totals=module.computeInvoice(sampleInvoice.lines,20,"standard");
assert.deepEqual([totals.ht,totals.tva,totals.ttc],[24100,4820,28920]);
const exempt=module.computeInvoice(sampleInvoice.lines,20,"franchise_293b");
assert.deepEqual([exempt.ht,exempt.tva,exempt.ttc],[24100,0,24100]);
const blob=module.createInvoicePdf(sampleProfile,sampleInvoice);
const bytes=Buffer.from(await blob.arrayBuffer()),raw=bytes.toString("latin1");
assert.equal(bytes.subarray(0,8).toString(),"%%PDF-1.4".slice(1),"PDF signature");
assert.match(raw,/Association D.monstra/);
assert.match(raw,/Client Exemple/);
assert.match(raw,/BROUILLON/);
assert.match(raw,/NON ATTRIBU/);
const match=raw.match(/startxref\n(\d+)\n%%EOF$/);assert.ok(match,"PDF trailer");
assert.equal(raw.slice(Number(match[1]),Number(match[1])+4),"xref","valid xref pointer");
const lots={...sampleInvoice,lines:Array.from({length:39},(_,i)=>({description:"Mission de conseil numéro "+(i+1)+" longue ligne pour vérifier la pagination et les tableaux du document.",qty:2,unitCents:12340}))};
const many=Buffer.from(await module.createInvoicePdf(sampleProfile,lots).arrayBuffer()).toString("latin1");
assert.ok((many.match(/\/Type \/Page \/Parent/g)||[]).length>=2,"multipage PDF");
const franchise=Buffer.from(await module.createInvoicePdf({...sampleProfile,vat_mode:"franchise_293b"},sampleInvoice).arrayBuffer()).toString("latin1");
assert.match(franchise,/293 B du CGI/);
console.log("Kitora invoice static checks passed: Supabase RLS, forms, PDF A4, 20% VAT, 293B, multipage, links.");
