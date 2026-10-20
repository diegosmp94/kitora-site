import assert from "node:assert/strict";
import {createServer} from "node:http";
import {readFile} from "node:fs/promises";
import {resolve,sep,extname} from "node:path";
import {chromium} from "playwright";
const root=process.cwd();
const server=createServer(async(req,res)=>{try{const path=resolve(root,"."+new URL(req.url,"http://localhost").pathname);if(!path.startsWith(root+sep))return res.writeHead(403).end();const data=await readFile(path);res.writeHead(200,{"Content-Type":{".html":"text/html",".js":"text/javascript",".css":"text/css"}[extname(path)]||"text/plain"}).end(data)}catch{res.writeHead(404).end()}});
await new Promise(done=>server.listen(0,"127.0.0.1",done));
const origin="http://127.0.0.1:"+server.address().port;
const browser=await chromium.launch({headless:true});
const mock=(user,role)=>`export const createClient=()=>({auth:{getUser:async()=>({data:{user:${user?"{id:'admin-1'}":"null"}},error:null}),getSession:async()=>({data:{session:{access_token:"mock-token"}},error:null}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})},from:()=>({select:()=>({eq:()=>({maybeSingle:async()=>({data:${role?"{user_id:'admin-1'}":"null"},error:null})})})})});`;
let calls=0;
try{
 for(const scenario of [{name:"guest",user:false,role:false,allowed:false},{name:"non-admin",user:true,role:false,allowed:false},{name:"admin",user:true,role:true,allowed:true},{name:"server-forbidden",user:true,role:true,allowed:false,status:403},{name:"malformed-metrics",user:true,role:true,allowed:false,invalid:true}]){
  const page=await browser.newPage();
  const errors=[];page.on("pageerror",e=>errors.push(e.message));
  await page.route(/https:\/\/cdn\.jsdelivr\.net\/npm\/\@supabase\/supabase-js\@2\.57\.0\/\+esm/,route=>route.fulfill({contentType:"text/javascript",body:mock(scenario.user,scenario.role)}));
  await page.route("https://yxjxizxzjubhjaxskksh.supabase.co/functions/v1/admin-dashboard",route=>{calls++;return route.fulfill({status:scenario.status||200,contentType:"application/json",body:JSON.stringify(scenario.invalid?{orders:-1,test_revenue_cents:599,active_subscriptions:1,library_grants:3}:{orders:2,test_revenue_cents:599,active_subscriptions:1,library_grants:3})})});
  await page.goto(origin+"/admin-analytics.html",{waitUntil:"load"});
  await page.waitForFunction(()=>!document.querySelector("#refresh").disabled);
  assert.equal(await page.locator("#metrics").isVisible(),scenario.allowed,scenario.name+" access gate");
  if(scenario.status===403)assert.match(await page.locator("#status").innerText(),/indisponibles/i);if(scenario.invalid)assert.match(await page.locator("#status").innerText(),/invalide/i);if(scenario.allowed){assert.match(await page.locator("#revenue").innerText(),/5,99/);assert.equal(await page.locator("#orders").innerText(),"2");assert.match(await page.locator("#status").innerText(),/TEST/)}
  assert.deepEqual(errors,[],scenario.name+" JS errors");
  await page.close();
 }
 assert.equal(calls,3,"only authenticated admin sessions can request server metrics");
 console.log("P3 admin analytics Chromium: guest/non-admin denied, admin metrics visible, 403 and malformed metrics fail closed, TEST labeling PASS");
}finally{await browser.close();await new Promise(done=>server.close(done))}
