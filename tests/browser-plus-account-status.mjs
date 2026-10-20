import assert from "node:assert/strict";
import {createServer} from "node:http";
import {readFile} from "node:fs/promises";
import {chromium} from "playwright";
const fixture='<!doctype html><html lang="fr"><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>'
+ '<div id="plusAccountMessage" role="status"></div><button id="plusAccountRefresh" disabled>Actualiser</button>'
+ '<div id="plusAccountQuota"></div><div id="plusAccountPending"></div><div id="plusAccountReady"></div>'
+ '<section id="plusAccountHistory" aria-live="polite"></section><script type="module" src="/plus-account-status.js"></script></body></html>';
const server=createServer(async(req,res)=>{
 if(req.url==="/plus-account-status.js"){res.writeHead(200,{"Content-Type":"text/javascript"});res.end(await readFile("plus-account-status.js"));return}
 if(req.url==="/account-fixture"){res.writeHead(200,{"Content-Type":"text/html"});res.end(fixture);return}
 res.writeHead(404).end();
});
await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
const origin="http://127.0.0.1:"+server.address().port;
const browser=await chromium.launch({headless:true});
try{
 for(const scenario of [
  {name:"anonymous",authenticated:false,eligible:false},
  {name:"Free historical account",authenticated:true,eligible:false},
  {name:"Plus subscriber",authenticated:true,eligible:true}
 ]){
  const page=await browser.newPage({viewport:{width:390,height:844}});
  let requests=0,unauthorized=0;
  const module="let user="+JSON.stringify(scenario.authenticated?{id:"sample-user"}:null)+";"
   + 'let notify=()=>{};window.__setAuth=(signed)=>{user=signed?{id:"sample-user"}:null;notify("SIGNED_OUT",null)};'
   + 'export function createClient(){return {auth:{getUser:async()=>({data:{user},error:null}),'
   + 'getSession:async()=>({data:{session:user?{access_token:"mock-status-token"}:null},error:null}),'
   + 'onAuthStateChange:cb=>{notify=cb;return {data:{subscription:{unsubscribe(){}}}}}}}}';
  await page.route(/https:\/\/cdn\.jsdelivr\.net\/npm\/@supabase\/supabase-js@2\.57\.0\/\+esm/,route=>route.fulfill({status:200,contentType:"text/javascript",body:module}));
  await page.route("https://yxjxizxzjubhjaxskksh.supabase.co/functions/v1/kitora-plus-status",async route=>{
   requests++;
   if(route.request().method()!=="GET"||route.request().headers().authorization!=="Bearer mock-status-token")unauthorized++;
   await route.fulfill({status:200,headers:{"access-control-allow-origin":"*"},contentType:"application/json",
    body:JSON.stringify({eligible:scenario.eligible,quota_limit:scenario.eligible?10:0,quota_used:scenario.eligible?2:0,
      history:[
       {title:"<img src=x onerror=alert(1)>",job_status:"queued",has_result:false},
       {title:"Document prêt",job_status:"completed",has_result:true}
      ]})});
  });
  await page.goto(origin+"/account-fixture");
  await page.waitForFunction(()=>!document.querySelector("#plusAccountMessage").textContent.includes("Vérification"));
  if(!scenario.authenticated){
   assert.equal(requests,0,"Unauthenticated visitors must not query status");
   assert.equal(await page.locator("#plusAccountRefresh").isDisabled(),true);
   assert.equal(await page.locator("#plusAccountHistory article").count(),0);
  }else{
   await page.waitForFunction(()=>document.querySelector("#plusAccountHistory").children.length===2);
   assert.equal(requests,1,"Account history should load once");
   assert.equal(unauthorized,0,"Account status request must include JWT");
   assert.equal(await page.locator("#plusAccountHistory img").count(),0,"Untrusted titles must not execute HTML");
   assert.equal(await page.locator("#plusAccountPending").textContent(),"1");
   assert.equal(await page.locator("#plusAccountReady").textContent(),"1");
   assert.equal(await page.locator("#plusAccountQuota").textContent(),scenario.eligible?"2 / 10":"—");
   await page.locator("#plusAccountRefresh").click();
   await page.waitForFunction(()=>document.querySelector("#plusAccountRefresh").disabled===false);
   assert.ok(requests>=2,"Manual refresh should call read-only endpoint");
   await page.evaluate(()=>window.__setAuth(false));
   await page.waitForFunction(()=>document.querySelector("#plusAccountMessage").textContent.includes("Connecte-toi"));
   assert.equal(await page.locator("#plusAccountHistory article").count(),0,"History must be erased after signout");
   assert.equal(await page.locator("#plusAccountRefresh").isDisabled(),true);
  }
  const widths=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,window:innerWidth}));
  assert.ok(widths.scroll<=widths.window+2,"Status layout should be mobile-friendly");
  console.log("Plus account status: "+scenario.name+" PASS");
  await page.close();
 }
}finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
