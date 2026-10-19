import assert from "node:assert/strict";
import {createServer} from "node:http";
import {readFile,stat} from "node:fs/promises";
import {resolve,sep,extname} from "node:path";
import {chromium} from "playwright";
const root=process.cwd();
const server=createServer(async(req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url,"http://localhost").pathname);
  const full=resolve(root,"."+pathname);
  if(!full.startsWith(root+sep)){res.writeHead(403).end();return}
  const file=(await stat(full)).isDirectory()?resolve(full,"index.html"):full;
  const bytes=await readFile(file);
  res.writeHead(200,{"Content-Type":{".html":"text/html",".css":"text/css",".js":"text/javascript",".svg":"image/svg+xml"}[extname(file)]||"application/octet-stream"});res.end(bytes);
 }catch{res.writeHead(404).end("Not found")}
});
await new Promise(done=>server.listen(0,"127.0.0.1",done));
const base="http://127.0.0.1:"+server.address().port;
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1300,height:850},acceptDownloads:true});
 await page.addInitScript(()=>{
  const pkey="mock-kitora-org-profile";
  const fakeUser="aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";
  window.__KITORA_INVOICE_TEST_CLIENT__={
   auth:{getUser:async()=>({data:{user:{id:fakeUser}},error:null})},
   from:table=>{
    if(table!=="kitora_org_profiles")throw Error("Unexpected DB table "+table);
    return{
     select:()=>({eq:()=>({maybeSingle:async()=>({data:JSON.parse(localStorage.getItem(pkey)||"null"),error:null})})}),
     upsert:value=>({select:()=>({single:async()=>{
      const data={...value,created_at:"2026-10-19T12:00:00Z"};localStorage.setItem(pkey,JSON.stringify(data));
      return {data,error:null};
     }})})
    }
   }
  }
 });
 const errors=[];page.on("pageerror",e=>errors.push(e.message));
 await page.goto(base+"/facturation-pro.html?plan=impact",{waitUntil:"load"});
 await page.locator("#authStatus").getByText("Compte connecté.",{exact:false}).waitFor();
 assert.equal(await page.locator("#orgPlan").inputValue(),"impact");
 await page.locator("#orgKind").selectOption("association");
 await page.locator("#orgName").fill("Association Essai Facturation");
 await page.locator("#orgSiren").fill("123456789");
 await page.locator("#orgAddress").fill("5 rue Exemple");
 await page.locator("#orgPostal").fill("75002");
 await page.locator("#orgCity").fill("Paris");
 await page.locator("#orgEmail").fill("factures@example.fr");
 await page.locator("#organizationForm button[type=submit]").click();
 await page.locator("#orgMessage").getByText("Dossier enregistré dans ton compte Kitora.",{exact:false}).waitFor();
 assert.match(await page.locator("#invoiceProfile").innerText(),/Association Essai Facturation/);
 await page.locator("#clientName").fill("Entreprise Cliente");
 await page.locator("#clientAddress").fill("20 boulevard Test");
 await page.locator("#clientPost").fill("69001");
 await page.locator("#clientCity").fill("Lyon");
 await page.locator("#clientSiren").fill("987654321");
 await page.locator("#invoice-line-0-description").fill("Atelier numérique");
 await page.locator("#invoice-line-0-qty").fill("2");
 await page.locator("#invoice-line-0-unitCents").fill("120.50");
 assert.match(await page.locator("#invoiceTotals").innerText(),/241,00/);
 assert.match(await page.locator("#invoiceTotals").innerText(),/289,20/);
 const downloadPromise=page.waitForEvent("download");
 await page.locator("#downloadPdf").click();
 const download=await downloadPromise,bytes=await readFile(await download.path()),pdf=bytes.toString("latin1");
 assert.equal(bytes.subarray(0,8).toString(),"%PDF-1.4");
 assert.match(download.suggestedFilename(),/facture-brouillon-.*\.pdf/);
 assert.match(pdf,/Association Essai Facturation/);
 assert.match(pdf,/Entreprise Cliente/);
 assert.match(pdf,/Atelier num.rique/);
 assert.match(pdf,/BROUILLON/);
 assert.match(pdf,/NON ATTRIBU/);
 assert.ok(!pdf.includes("FACTURE FINALE"),"cannot issue a numbered final invoice");
 await page.evaluate(()=>localStorage.setItem("kitora_pro_invoice_draft_v1_old_account",JSON.stringify({clientName:"Legacy client must be purged"})));
 await page.reload({waitUntil:"load"});
 await page.locator("#authStatus").getByText("Compte connecté.",{exact:false}).waitFor();
 assert.equal(await page.locator("#orgName").inputValue(),"Association Essai Facturation","profile rehydrated");
 assert.equal(await page.locator("#clientName").inputValue(),"","client data must NOT persist on reload");
 assert.equal(await page.locator("#invoice-line-0-description").inputValue(),"","invoice lines must NOT persist on reload");
 assert.equal(await page.evaluate(()=>Object.keys(localStorage).filter(k=>k.startsWith("kitora_pro_invoice_draft_v1_")).length),0,"legacy local drafts purged");
 await page.locator("#clientName").fill("Entreprise Cliente");
 await page.locator("#clientAddress").fill("20 boulevard Test");
 await page.locator("#clientPost").fill("69001");
 await page.locator("#clientCity").fill("Lyon");
 await page.locator("#invoice-line-0-description").fill("Atelier numérique");
 await page.locator("#invoice-line-0-qty").fill("2");
 await page.locator("#invoice-line-0-unitCents").fill("120.50");
 await page.locator("#orgVatMode").selectOption("franchise_293b");
 await page.locator("#saveOrg").click();
 await page.locator("#orgMessage").getByText("Dossier enregistré dans ton compte Kitora.",{exact:false}).waitFor();
 assert.equal(await page.locator("#vatRate").isDisabled(),true);
 assert.match(await page.locator("#invoiceTotals").innerText(),/TVA \(0 %\) : 0,00/);
 const exemptDownload=page.waitForEvent("download");
 await page.locator("#downloadPdf").click();const exempt=await exemptDownload;
 assert.match((await readFile(await exempt.path())).toString("latin1"),/293 B du CGI/);
 assert.deepEqual(errors,[],"no browser script errors");
 await page.close();
 for(const width of [320,375,768,1280]){
  const mobile=await browser.newPage({viewport:{width,height:812}});
  await mobile.addInitScript(()=>{window.__KITORA_INVOICE_TEST_CLIENT__={auth:{getUser:async()=>({data:{user:null},error:null})}}});
  await mobile.goto(base+"/facturation-pro.html",{waitUntil:"load"});
  const dims=await mobile.evaluate(()=>({scroll:document.documentElement.scrollWidth,viewport:innerWidth}));
  assert.ok(dims.scroll<=dims.viewport+2,"horizontal overflow "+width+" "+JSON.stringify(dims));
  if(width<=768){await mobile.locator(".kitora-mobile summary").click();assert.ok(await mobile.locator(".kitora-mobile-links").isVisible())}
  await mobile.close();
 }
 console.log("Invoice Chromium: account-owned organization, autofill, totals, PDF bytes, local reload, 293 B TVA, 4 mobile widths passed.");
}finally{await browser.close();await new Promise(done=>server.close(done))}
