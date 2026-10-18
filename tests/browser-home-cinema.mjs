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
  res.writeHead(200,{"Content-Type":{".html":"text/html",".css":"text/css",".js":"text/javascript",".svg":"image/svg+xml"}[extname(actual)]||"application/octet-stream"});res.end(data);
 }catch{res.writeHead(404).end("Not found")}
});
await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
const browser=await chromium.launch({headless:true});
try{
 for(const width of [375,768,1440]){
  const page=await browser.newPage({viewport:{width,height:900}});
  const stub='export function createClient(){return {auth:{getSession:async()=>({data:{session:null}}),getUser:async()=>({data:{user:null}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})}}}';
  await page.route(/https:\/\/cdn\.jsdelivr\.net\/npm\/@supabase\/supabase-js@2\/\+esm/,route=>route.fulfill({status:200,contentType:"text/javascript",body:stub}));
  await page.goto("http://127.0.0.1:"+server.address().port+"/index.html",{waitUntil:"load"});
  assert.equal(await page.locator(".k-cinema-chapter").count(),3);
  assert.ok(await page.locator(".k-cinema-stage").isVisible());
  const measure=await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,width:innerWidth}));
  assert.ok(measure.scrollWidth<=measure.width+2,JSON.stringify({width,...measure}));
  await page.locator('[data-k-scene="apprendre"].k-cinema-chapter').scrollIntoViewIfNeeded();
  await page.waitForFunction(()=>document.querySelector("[data-k-cinema-stage]")?.dataset.scene==="apprendre",{timeout:10000});
  assert.equal(await page.locator("#k-cinema-mocktitle").innerText(),"Une notion après l'autre.");
  await page.locator('[data-k-scene="creer"].k-cinema-chapter').scrollIntoViewIfNeeded();
  await page.waitForFunction(()=>document.querySelector("[data-k-cinema-stage]")?.dataset.scene==="creer",{timeout:10000});
  assert.equal(await page.locator("#k-cinema-progress").evaluate(x=>x.style.width),"100%");
  await page.close();
 }
 const page=await browser.newPage({viewport:{width:375,height:812},reducedMotion:"reduce"});
 await page.goto("http://127.0.0.1:"+server.address().port+"/index.html",{waitUntil:"load"});
 const r=await page.evaluate(()=>{
  const chapter=document.querySelector(".k-cinema-chapter");
  return {opacity:getComputedStyle(chapter).opacity,transform:getComputedStyle(chapter).transform}
 });
 assert.equal(r.opacity,"1");
 assert.equal(r.transform,"none");
 console.log("Kitora cinematic: mobile/tablet/desktop, 3 scroll chapters, progress, no overflow, reduced motion OK");
 await page.close();
}finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
