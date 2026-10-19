import assert from "node:assert/strict";
import {createServer} from "node:http";
import {readFile,stat} from "node:fs/promises";
import {resolve,extname,sep} from "node:path";
import {chromium} from "playwright";
const root=process.cwd();
const server=createServer(async(req,res)=>{
 try{
  const target=resolve(root,"."+new URL(req.url,"http://localhost").pathname);
  if(!target.startsWith(root+sep)){res.writeHead(403).end();return}
  const file=(await stat(target)).isDirectory()?resolve(target,"index.html"):target;
  const body=await readFile(file);
  res.writeHead(200,{"Content-Type":{".html":"text/html",".js":"text/javascript",".css":"text/css",".svg":"image/svg+xml"}[extname(file)]||"application/octet-stream"});
  res.end(body);
 }catch{res.writeHead(404).end();}
});
await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:375,height:850}});
 let available=false;
 await page.route("https://yxjxizxzjubhjaxskksh.supabase.co/functions/v1/kitora-solo-availability",async route=>{
  await route.fulfill({status:200,contentType:"application/json",headers:{"access-control-allow-origin":"*"},body:JSON.stringify({plan:"solo",available,monthly_amount_cents:199,currency:"eur",billing_period:"month"})});
 });
 const url="http://127.0.0.1:"+server.address().port+"/solo-live.html";
 await page.goto(url);
 await page.waitForFunction(()=>document.querySelector("#soloLiveStatus")?.textContent?.includes("n'est pas encore ouvert"));
 assert.equal(await page.locator("#soloLiveCheckout").isDisabled(),true,"Unavailable LIVE sale must not expose payment button");
 assert.equal(await page.locator("#soloAcceptTerms").isDisabled(),true,"No consent collection when unavailable");
 available=true;
 await page.reload();
 await page.waitForFunction(()=>document.querySelector("#soloLiveStatus")?.textContent?.includes("disponible — paiement réel"));
 assert.equal(await page.locator("#soloLiveCheckout").isDisabled(),true,"Live checkout must require user consent");
 await page.locator("#soloAcceptTerms").check();
 assert.equal(await page.locator("#soloLiveCheckout").isDisabled(),false,"Launch and consent are both required");
 const dimensions=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,width:innerWidth}));
 assert.ok(dimensions.scroll<=dimensions.width+2,JSON.stringify(dimensions));
 await page.close();
 console.log("Kitora Solo LIVE UI: denied state, consent-gated ready state, no unsolicited checkout, mobile PASS.");
}finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
