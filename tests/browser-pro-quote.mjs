import assert from "node:assert/strict";
import {createServer} from "node:http";
import {readFile,stat} from "node:fs/promises";
import {resolve,sep,extname} from "node:path";
import {chromium} from "playwright";
const root=process.cwd();
const server=createServer(async(req,res)=>{
 try{
  const path=resolve(root,"."+decodeURIComponent(new URL(req.url,"http://localhost").pathname));
  if(!path.startsWith(root+sep)){res.writeHead(403).end();return;}
  const filename=(await stat(path)).isDirectory()?resolve(path,"index.html"):path;
  res.writeHead(200,{"Content-Type":{".html":"text/html",".css":"text/css",".js":"text/javascript",".mjs":"text/javascript",".svg":"image/svg+xml"}[extname(filename)]||"application/octet-stream"}).end(await readFile(filename));
 }catch{res.writeHead(404).end("Not found");}
});
await new Promise(done=>server.listen(0,"127.0.0.1",done));
const browser=await chromium.launch({headless:true});
const url="http://127.0.0.1:"+server.address().port+"/devis-pro.html";
try{
 const ctx=await browser.newContext({acceptDownloads:true,viewport:{width:1280,height:800}});
 const page=await ctx.newPage();
 await page.route(/https:\/\/cdn\.jsdelivr\.net\/npm\/\@supabase\/supabase-js\@2\.57\.0\/\+esm/,r=>r.fulfill({contentType:"text/javascript",body:"export const createClient=()=>({auth:{getUser:async()=>({data:{user:null},error:null})}})"}));
 page.on("dialog",d=>d.accept());
 await page.goto(url,{waitUntil:"load"});
 await page.locator("#issuerName").fill("Entreprise Test");
 await page.locator("#issuerAddress").fill("1 rue de Paris, 75001 Paris");
 await page.locator("#clientName").fill("Client Test");
 await page.locator("#clientAddress").fill("2 rue de Lyon, 69001 Lyon");
 await page.locator('[data-quote-field="description"]').fill("Prestation conseil");
 await page.locator('[data-quote-field="qty"]').fill("2");
 await page.locator('[data-quote-field="price"]').fill("125.50");
 await page.locator("#quoteRefresh").click();
 assert.equal(await page.locator("#quotePrint").isEnabled(),true,"validated document should print");
 assert.ok((await page.locator(".quote-paper-totals").innerText()).includes("301,20"),"calculated VAT total");
 await page.evaluate(()=>{window.__printed=false;window.print=()=>{window.__printed=true;}});
 await page.locator("#quotePrint").click();
 assert.equal(await page.evaluate(()=>window.__printed),true,"print workflow must execute");
 await page.locator("#quoteAdd").click();
 assert.equal(await page.locator(".quote-line").count(),2,"can add second line");
 assert.equal(await page.locator("#quotePrint").isDisabled(),true,"any edit invalidates preview");
 await page.locator(".quote-line").last().locator("button").click();
 assert.equal(await page.locator(".quote-line").count(),1,"can remove second line");
 const [download]=await Promise.all([page.waitForEvent("download"),page.locator("#quoteExport").click()]);
 assert.equal(download.suggestedFilename(),"kitora-devis-brouillon.json");
 const downloaded=JSON.parse(await (await import("node:fs/promises")).readFile(await download.path(),"utf8"));
 assert.equal(downloaded.format,"kitora.quote.draft.v1");
 assert.equal(downloaded.fields.issuerName,"Entreprise Test");
 await page.locator("#quoteReset").click();
 assert.equal(await page.locator("#issuerName").inputValue(),"","reset clears draft");
 await page.locator("#quoteImportInput").setInputFiles({name:"draft.json",mimeType:"application/json",buffer:Buffer.from(JSON.stringify(downloaded))});
 await page.waitForFunction(()=>document.getElementById("issuerName").value==="Entreprise Test",{timeout:7000});
 assert.equal(await page.locator("#issuerName").inputValue(),"Entreprise Test","can import draft");
 assert.equal(await page.locator("#quotePrint").isDisabled(),true,"restored draft must be revalidated");
 await page.locator("#quoteImportInput").setInputFiles({name:"bad.json",mimeType:"application/json",buffer:Buffer.from('{"format":"bad"}')});
 assert.equal(await page.locator("#issuerName").inputValue(),"Entreprise Test","invalid import must not replace current values");
 await page.locator("#issuerName").fill("<img src=x onerror=alert(1)>");
 await page.locator("#quoteRefresh").click();
 assert.equal(await page.locator(".quote-paper-parties img").count(),0,"preview must not inject HTML");
 assert.ok((await page.locator(".quote-paper-parties").innerText()).includes("<img"),"escaped text should remain visible");
 await page.close();await ctx.close();
 for(const width of [320,375,768,1280]){
  const p=await browser.newPage({viewport:{width,height:812}});
  await p.route(/https:\/\/cdn\.jsdelivr\.net\/npm\/\@supabase\/supabase-js\@2\.57\.0\/\+esm/,r=>r.fulfill({contentType:"text/javascript",body:"export const createClient=()=>({auth:{getUser:async()=>({data:{user:null},error:null})}})"}));
  await p.goto(url,{waitUntil:"load"});
  const dims=await p.locator(".quote-main").evaluate(el=>({scroll:el.scrollWidth,width:el.clientWidth}));
  assert.ok(dims.scroll<=dims.width+3,"quote overflows at "+width+": "+JSON.stringify(dims));
  assert.ok(await p.locator("#quoteRefresh").isVisible(),"editor usable at "+width);
  await p.close();
 }
 console.log("Kitora Pro Quote Studio browser: calculations, VAT, draft export/import, XSS, print, responsive PASS.");
}finally{await browser.close();await new Promise(done=>server.close(done));}
