import assert from "node:assert/strict";
import {createServer} from "node:http";
import {readFile,stat} from "node:fs/promises";
import {resolve,extname,sep} from "node:path";
import {chromium} from "playwright";
const root=process.cwd(),server=createServer(async(req,res)=>{
 try{
  const name=decodeURIComponent(new URL(req.url,"http://localhost").pathname);
  const file=resolve(root,"."+name);
  if(!file.startsWith(root+sep)){res.writeHead(403).end();return}
  const target=(await stat(file)).isDirectory()?resolve(file,"index.html"):file;
  const bytes=await readFile(target);
  res.writeHead(200,{"Content-Type":{".html":"text/html",".css":"text/css",".js":"text/javascript"}[extname(target)]||"application/octet-stream"});res.end(bytes)
 }catch{res.writeHead(404).end()}
});
await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
const base="http://127.0.0.1:"+server.address().port;
const browser=await chromium.launch({headless:true});
const mock='export function createClient(){return {auth:{getUser:async()=>({data:{user:{id:"demo"}}})},from(table){return{select(){return this},eq(){return this},maybeSingle:async()=>({data:table==="kitora_tool_access"?{chosen_plan:"free"}:null,error:null})}}}}';
try{
 for(const width of [375,768,1440]){
  const page=await browser.newPage({viewport:{width,height:900}});
  await page.route(/https:\/\/cdn\.jsdelivr\.net\/npm\/@supabase\/supabase-js@2\/\+esm/,route=>route.fulfill({status:200,contentType:"text/javascript",body:mock}));
  for(const route of ["projects.html","learn.html","agenda.html","notes.html","offres.html","compte.html"]){
   await page.goto(base+"/"+route,{waitUntil:"domcontentloaded"});
   await page.locator(".kp-context").waitFor();
   const result=await page.evaluate(()=>({
    viewport:innerWidth,document:document.documentElement.scrollWidth,
    style:getComputedStyle(document.body).backgroundImage,
    title:document.querySelector("h1")?.textContent,
    link:document.querySelector(".kp-context a")?.getAttribute("href")
   }));
   assert.ok(result.document<=result.viewport+2,route+" overflows at "+width+": "+JSON.stringify(result));
   assert.ok(result.style.includes("gradient"),route+" premium design not loaded");
   assert.ok(result.title&&result.link,route+" content missing");
  }
  await page.close();
 }
 const home=await browser.newPage({viewport:{width:390,height:844},reducedMotion:"reduce"});
 await home.route(/https:\/\/cdn\.jsdelivr\.net\/npm\/@supabase\/supabase-js@2\/\+esm/,route=>route.fulfill({status:200,contentType:"text/javascript",body:mock}));
 await home.goto(base+"/index.html",{waitUntil:"load"});
 await home.locator("#notre-exigence").waitFor({state:"attached"});
 assert.ok(await home.locator("#notre-exigence h2").isVisible());
 const state=await home.evaluate(()=>({document:document.documentElement.scrollWidth,width:innerWidth}));
 assert.ok(state.document<=state.width+2,"Home manifesto causes overflow");
 await home.close();
 console.log("Premium UI: 6 pages x 3 widths, background polish, links, mobile manifesto and reduced-motion passed.");
}finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
