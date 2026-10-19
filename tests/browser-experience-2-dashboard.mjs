import assert from "node:assert/strict";
import {createServer} from "node:http";
import {readFile,stat} from "node:fs/promises";
import {resolve,extname,sep} from "node:path";
import {chromium} from "playwright";
const root=process.cwd();
const server=createServer(async(req,res)=>{
 try{
  const path=decodeURIComponent(new URL(req.url,"http://localhost").pathname),file=resolve(root,"."+path);
  if(!file.startsWith(root+sep)){res.writeHead(403).end();return}
  const actual=(await stat(file)).isDirectory()?resolve(file,"index.html"):file,data=await readFile(actual);
  res.writeHead(200,{"Content-Type":{".html":"text/html",".css":"text/css",".js":"text/javascript"}[extname(actual)]||"application/octet-stream"});res.end(data);
 }catch{res.writeHead(404).end("Not found")}
});
await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
const base="http://127.0.0.1:"+server.address().port;
const browser=await chromium.launch({headless:true});
const mock='export function createClient(){return {auth:{getUser:async()=>({data:{user:{id:"test-user"}},error:null})},from(table){return {select(){return this},eq(){return this},maybeSingle:async()=>({data:table==="kitora_tool_access"?{chosen_plan:"free"}:null,error:null})}}}}';
try{
 for(const width of [320,375,768,1440]){
  const page=await browser.newPage({viewport:{width,height:900}});
  await page.route(/https:\/\/cdn\.jsdelivr\.net\/npm\/@supabase\/supabase-js@2(?:\.57\.0)?\/\+esm/,route=>route.fulfill({status:200,contentType:"text/javascript",body:mock}));
  await page.addInitScript(()=>{
   localStorage.setItem("kitora_projects_v1",JSON.stringify([{name:"Projet de démonstration",tasks:[{done:true},{done:false}]}]));
   localStorage.setItem("kitora_notes_v1",JSON.stringify([{title:"Une note"}]));
  });
  await page.goto(base+"/dashboard.html",{waitUntil:"load"});
  await page.waitForFunction(()=>!document.documentElement.classList.contains("kitora-protected-pending"),{timeout:15000});
  await page.locator("#dashStats .workspace-stat").first().waitFor();
  assert.equal(await page.locator("#dashStats .workspace-stat").count(),6);
  assert.ok((await page.locator("#dashProjects").innerText()).includes("Projet de démonstration"));
  assert.ok(await page.locator(".dash-hero").isVisible());
  const dims=await page.evaluate(()=>({document:document.documentElement.scrollWidth,width:innerWidth,background:getComputedStyle(document.querySelector(".dash-hero")).backgroundImage}));
  assert.ok(dims.document<=dims.width+2,"Dashboard horizontal overflow "+width+" "+JSON.stringify(dims));
  assert.ok(dims.background.includes("gradient"),"Premium hero CSS missing");
  assert.ok(await page.locator('script[data-kitora-protected-src="auto-cloud.js?v=20261018-autocloud1"]').count()===1);
  assert.ok(await page.locator('script[data-kitora-protected-src="workspace-insights.js?v=20261018-ws1"]').count()===1);
  await page.close();
 }
 const reduced=await browser.newPage({reducedMotion:"reduce"});
 await reduced.route(/https:\/\/cdn\.jsdelivr\.net\/npm\/@supabase\/supabase-js@2(?:\.57\.0)?\/\+esm/,route=>route.fulfill({status:200,contentType:"text/javascript",body:mock}));
 await reduced.goto(base+"/dashboard.html",{waitUntil:"domcontentloaded"});
 await reduced.locator(".dash-hero").waitFor();
 assert.equal(await reduced.evaluate(()=>getComputedStyle(document.querySelector("[data-dash-reveal]")).animationName),"none");
 await reduced.close();
 console.log("Experience 2.0 dashboard: four viewport widths, protected data hooks, local stats, cloud access preserved, reduced motion OK.");
}finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
