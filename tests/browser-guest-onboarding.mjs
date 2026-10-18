import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { chromium } from "playwright";
import assert from "node:assert/strict";
const root=process.cwd();
const server=createServer(async(req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url,"http://localhost").pathname);
  const file=resolve(root,"."+pathname);
  if(!file.startsWith(root+sep)){res.writeHead(403).end();return}
  const actual=(await stat(file)).isDirectory()?resolve(file,"index.html"):file;
  const bytes=await readFile(actual);
  const ext=extname(actual);
  res.writeHead(200,{"Content-Type":({".html":"text/html",".js":"text/javascript",".css":"text/css",".svg":"image/svg+xml",".png":"image/png"})[ext]||"application/octet-stream"});
  res.end(bytes);
 }catch{res.writeHead(404).end("Not found")}
});
await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
const port=server.address().port;
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage();
 // Simulate the visitor without a Supabase account, not a fake paid subscription.
 await page.route("https://cdn.jsdelivr.net/npm/@supabase/supabase-js*",route=>route.abort());
 await page.goto("http://127.0.0.1:"+port+"/essayer-un-kit.html",{waitUntil:"domcontentloaded"});
 await page.locator("#demoTitle").fill("Réviser des notions");
 await page.locator("#demoGoal").fill("Créer un programme de révisions");
 for(let n=1;n<=3;n++){
  await page.locator('#demoForm button[type="submit"]').click();
  await page.waitForFunction(count=>Number(localStorage.getItem("kitora_guest_generations_v1"))===count,n);
  assert.equal(await page.evaluate(()=>Number(localStorage.getItem("kitora_guest_generations_v1"))),n);
 }
 await page.locator('#demoForm button[type="submit"]').click();
 await page.locator("#demoStatus a").waitFor({state:"visible",timeout:15000});
 const link=await page.locator("#demoStatus a").getAttribute("href");
 assert.ok(link?.includes("signup=1"),"Fourth trial must direct to signup");
 await page.locator("#demoStatus a").click();
 await page.waitForURL(/index\.html/, {timeout:15000});
 await page.locator("#authModal:not([hidden])").waitFor({state:"visible",timeout:15000});
 console.log("Guest browser smoke passed: 3 trials, fourth blocked, registration modal opened.");
}finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
