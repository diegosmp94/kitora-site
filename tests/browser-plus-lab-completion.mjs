import assert from "node:assert/strict";
import {createServer} from "node:http";
import {readFile,stat} from "node:fs/promises";
import {resolve,extname,sep} from "node:path";
import {chromium} from "playwright";
const root=process.cwd();
const server=createServer(async(req,res)=>{
 try{
  const path=decodeURIComponent(new URL(req.url,"http://localhost").pathname);
  const file=resolve(root,"."+path);
  if(!file.startsWith(root+sep)){res.writeHead(403).end();return}
  const actual=(await stat(file)).isDirectory()?resolve(file,"index.html"):file;
  const data=await readFile(actual);
  res.writeHead(200,{"Content-Type":{".html":"text/html",".js":"text/javascript",".css":"text/css"}[extname(actual)]||"application/octet-stream"});
  res.end(data);
 }catch{res.writeHead(404).end()}
});
await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
const base="http://127.0.0.1:"+server.address().port;
const browser=await chromium.launch({headless:true});
const scenarios=[
 {name:"anonymous",user:false,test:null,live:null,allowed:false},
 {name:"Free user",user:true,test:null,live:null,allowed:false},
 {name:"Plus TEST active",user:true,test:{plan:"plus_monthly",status:"active"},live:null,allowed:true},
 {name:"Ultimate TEST active",user:true,test:{plan:"ultimate",status:"active"},live:null,allowed:true},
 {name:"Canceled LIVE overrides active TEST",user:true,test:{plan:"plus_monthly",status:"active"},live:{plan:"solo",status:"canceled"},allowed:false}
];
try{
 for(const fixture of scenarios){
  const context=await browser.newContext({viewport:{width:390,height:844},acceptDownloads:true});
  const page=await context.newPage();
  let called=0;
  const mock=`export function createClient(){
   const user=${JSON.stringify(fixture.user?{id:"test-plus-user"}:null)};
   const test=${JSON.stringify(fixture.test)},live=${JSON.stringify(fixture.live)};
   return {
    auth:{getUser:async()=>({data:{user},error:null}),getSession:async()=>({data:{session:user?{access_token:"mock-client-jwt"}:null},error:null}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})},
    from(table){return {
     select(){return this},eq(){return this},
     maybeSingle:async()=>({data:table==="subscriptions"?test:table==="kitora_live_subscriptions"?live:table==="subscriber_requests"?{id:"test-request",ai_result:null,ai_generated_at:null}:null,error:null}),
     insert(){return {select(){return {single:async()=>({data:{id:"00000000-0000-4000-8000-000000000001"},error:null})}}}}
    }}
   }
  }`;
  await page.route(/https:\/\/cdn\.jsdelivr\.net\/npm\/@supabase\/supabase-js@2\.57\.0\/\+esm/,route=>route.fulfill({status:200,contentType:"application/javascript",body:mock}));
  await page.route("https://yxjxizxzjubhjaxskksh.supabase.co/functions/v1/generate-plus",async route=>{
   called++;
   assert.equal(route.request().headers().authorization,"Bearer mock-client-jwt");
   const payload=JSON.parse(route.request().postData()||"{}");
   assert.equal(payload.request_id,"00000000-0000-4000-8000-000000000001");
   await route.fulfill({status:200,headers:{"access-control-allow-origin":"*"},contentType:"application/json",
    body:JSON.stringify({ready:false,configured:false,message:"Moteur IA désactivé. Aucune tâche ajoutée."})});
  });
  let statusRequests=0;
  await page.route("https://yxjxizxzjubhjaxskksh.supabase.co/functions/v1/kitora-plus-status",async route=>{
   statusRequests++;
   assert.equal(route.request().method(),"GET");
   assert.equal(route.request().headers().authorization,"Bearer mock-client-jwt");
   const eligible=fixture.allowed;
   await route.fulfill({status:200,contentType:"application/json",headers:{"access-control-allow-origin":"*"},
    body:JSON.stringify({eligible,quota_limit:eligible?10:0,quota_used:eligible?2:0,
     history:[{id:"hist-123",title:"<img src=x onerror=alert(1)>",format:"pdf",created_at:"2026-10-20T09:30:00Z",job_status:"queued",has_result:false}],
     has_more:false})});
  });
  await page.goto(base+"/plus-lab.html",{waitUntil:"domcontentloaded"});
  await page.waitForFunction(()=>!document.getElementById("labEligibility").textContent.includes("Vérification"));
  assert.equal(await page.locator("#labForm").isVisible(),fixture.allowed,fixture.name+": access mismatch");
  if(fixture.user){
   await page.waitForFunction(()=>document.querySelector("#labHistoryMessage")?.textContent?.includes("dossier(s) chargé(s)"));
   assert.equal(await page.locator("#labHistoryList img").count(),0,"Untrusted titles must render as plain text");
   assert.equal(await page.locator("#labHistoryList .lab-history-card").count(),1,"Own requests should appear");
   assert.ok(statusRequests>0,"Authenticated status endpoint must be used");
  }else {
   assert.equal(statusRequests,0,"Anonymous users may not query Plus history");
   assert.equal(await page.locator("#labHistoryRefresh").isDisabled(),true);
  }
  if(fixture.allowed){
   await page.locator("#labTopic").fill("Apprendre l'espagnol niveau débutant");
   await page.locator("#labFormat").selectOption("pdf");
   assert.equal(await page.locator("#labExportBriefTxt").isEnabled(),true);
   assert.equal(await page.locator("#labExportBriefPdf").isEnabled(),true);
   const fileDownload=page.waitForEvent("download");
   await page.locator("#labExportBriefTxt").click();
   const file=await fileDownload;
   assert.match(file.suggestedFilename(),/kitora-plus-brief.*\.txt$/);
   await page.locator("#labSubmit").click();
   await page.waitForFunction(()=>document.querySelector("#labGenerationStatus")?.textContent.includes("Moteur IA non activé"));
   assert.equal(called,1,fixture.name+": generation endpoint should be reached exactly once");
   await page.locator("#labHistoryList .lab-history-card button").first().click();
   assert.match(await page.locator("#labGenerationStatus").textContent(),/file/);
   const beforeStatusRefresh=called;
   await page.locator("#labRefreshGeneration").click();
   await page.waitForFunction(()=>document.querySelector("#labGenerationStatus")?.textContent?.includes("file"));
   assert.equal(called,beforeStatusRefresh,"Refreshing status must never re-trigger a billable generation");
   assert.equal(await page.locator("#labGenerationPanel").isVisible(),true);
   await page.waitForFunction(()=>!document.querySelector("#labRefreshGeneration").disabled);
   assert.equal(await page.locator("#labRefreshGeneration").isEnabled(),true);
  }else {
   assert.equal(called,0,fixture.name+": no AI endpoint for non subscriber");
   assert.equal(await page.locator("#labExportBriefPdf").isDisabled(),true);
   assert.equal(await page.locator("#labExportBriefTxt").isDisabled(),true);
  }
  const size=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,width:innerWidth}));
  assert.ok(size.scroll<=size.width+2,fixture.name+": mobile horizontal overflow "+JSON.stringify(size));
  await context.close();
  console.log("Kitora Plus Lab:",fixture.name,"PASS");
 }
}finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
