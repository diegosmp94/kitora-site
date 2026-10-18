import {createServer} from "node:http";
import {readFile,stat} from "node:fs/promises";
import {resolve,extname,sep} from "node:path";
import {chromium} from "playwright";
import assert from "node:assert/strict";
const root=process.cwd();
const server=createServer(async(req,res)=>{
 try{
  const path=decodeURIComponent(new URL(req.url,"http://localhost").pathname);
  const file=resolve(root,"."+path);
  if(!file.startsWith(root+sep)){res.writeHead(403).end();return}
  const actual=(await stat(file)).isDirectory()?resolve(file,"index.html"):file;
  const data=await readFile(actual);
  res.writeHead(200,{"Content-Type":{".html":"text/html",".js":"text/javascript",".css":"text/css"}[extname(actual)]||"application/octet-stream"});res.end(data);
 }catch{res.writeHead(404).end("Not found")}
});
await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
const base="http://127.0.0.1:"+server.address().port;
const browser=await chromium.launch({headless:true});
const fixtures=[
 {name:"anonymous",user:false,selection:"free",plan:null,expected:"choisir-offre.html"},
 {name:"signed in but no chosen plan",user:true,selection:null,plan:null,expected:"choisir-offre.html"},
 {name:"fake Ultimate selection without subscription",user:true,selection:"ultimate",plan:null,expected:"choisir-offre.html"},
 {name:"active Ultimate subscriber",user:true,selection:"ultimate",plan:"ultimate",expected:"loaded"},
 {name:"Free subscriber",user:true,selection:"free",plan:null,expected:"loaded"}
];
try{
 for(const scenario of fixtures){
  const ctx=await browser.newContext();
  const page=await ctx.newPage();
  const mocked=`export function createClient(){const user=${JSON.stringify(scenario.user?{id:"test-user"}:null)}; const selected=${JSON.stringify(scenario.selection)}; const plan=${JSON.stringify(scenario.plan)};return {auth:{getUser:async()=>({data:{user},error:null}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})},from(table){return{select(){return this},eq(){return this},maybeSingle:async()=>({data:table==="kitora_tool_access"?(selected?{chosen_plan:selected}:null):table==="subscriptions"?(plan?{status:"active",plan}:null):null,error:null})}}}}}`;
  await page.route(/https:\/\/cdn\.jsdelivr\.net\/npm\/@supabase\/supabase-js@2\/\+esm/,route=>route.fulfill({status:200,contentType:"application/javascript",body:mocked}));
  await page.goto(base+"/projects.html",{waitUntil:"domcontentloaded"});
  if(scenario.expected==="loaded"){
   await page.waitForFunction(()=>!document.documentElement.classList.contains("kitora-protected-pending"),{timeout:15000});
   assert.ok(page.url().includes("projects.html"),scenario.name+" should stay on projects");
  }else await page.waitForURL(/choisir-offre\.html\?next=projects\.html/,{timeout:15000});
  console.log("Plan gate:",scenario.name,scenario.expected);
  await ctx.close();
 }
}finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
