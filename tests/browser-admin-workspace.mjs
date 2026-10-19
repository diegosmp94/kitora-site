import assert from "node:assert/strict";
import{createServer}from"node:http";
import{readFile,stat}from"node:fs/promises";
import{resolve,sep,extname}from"node:path";
import{chromium}from"playwright";
const root=process.cwd();
const server=createServer(async(req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url,"http://localhost").pathname);
  const path=resolve(root,"."+pathname);
  if(!path.startsWith(root+sep)){res.writeHead(403).end();return}
  const filename=(await stat(path)).isDirectory()?resolve(path,"index.html"):path;
  res.writeHead(200,{"Content-Type":{".html":"text/html",".css":"text/css",".js":"text/javascript",".svg":"image/svg+xml"}[extname(filename)]||"application/octet-stream"}).end(await readFile(filename));
 }catch{res.writeHead(404).end("Not found")}
});
await new Promise(done=>server.listen(0,"127.0.0.1",done));
const base="http://127.0.0.1:"+server.address().port;
const browser=await chromium.launch({headless:true});
const paths=["admin.html","admin-products.html","admin-orders.html","admin-requests.html","admin-users.html","admin-insights.html","admin-health.html"];
const mock=String.raw`export const createClient=()=>({auth:{
 getUser:async()=>({data:{user:null},error:null}),
 getSession:async()=>({data:{session:null},error:null})
},from:()=>({select:()=>({eq:()=>({maybeSingle:async()=>({data:null,error:null})})})})});`;
try{
 for(const path of paths){
  const page=await browser.newPage({viewport:{width:1280,height:850}});
  await page.route(/https:\/\/cdn\.jsdelivr\.net\/npm\/\@supabase\/supabase-js\@2(?:\.57\.0)?\/\+esm/,r=>r.fulfill({contentType:"text/javascript",body:mock}));
  await page.goto(base+"/"+path,{waitUntil:"load"});
  assert.ok(await page.locator("body").evaluate(el=>el.classList.contains("ka-app")),path+" CSS scope");
  assert.ok(await page.locator("main h1").isVisible(),path+" page title");
  if(path==="admin.html"){
   assert.ok(await page.locator("#adminPages").isHidden(),"guest may not see privileged quick actions");
   await page.locator("#adminPages").evaluate(el=>el.hidden=false); // visual shell test; not an auth simulation
   assert.equal(await page.locator(".ka-shortcut").count(),6,"six admin sections");
  }else{
   const protectedPanel=page.locator(path==="admin-health.html"?"#healthProtected":"#adminProtected");
   assert.ok(await protectedPanel.isHidden(),"guest may not see admin page before authorization");
   await protectedPanel.evaluate(el=>el.hidden=false); // exercise pure UI without privileged requests
   const sidebar=page.locator(".ka-sidebar");
   assert.ok(await sidebar.isVisible());
   assert.equal(await sidebar.locator('a[href$=".html"]').count(),7,"all seven admin destinations");
   assert.equal(await sidebar.locator('a[aria-current="page"]').count(),1,"active section");
   await page.locator(".ka-nav-filter").fill("commandes");
   assert.ok(await sidebar.locator('a[href="admin-orders.html"]').isVisible(),"filter keeps matching section");
   assert.ok(await sidebar.locator('a[href="admin-products.html"]').isHidden(),"filter hides unrelated sections");
   await page.locator(".ka-nav-filter").fill("");
   assert.ok(await sidebar.locator('a[href="admin-products.html"]').isVisible(),"clearing restores menu");
   await page.locator(".ka-nav-filter").evaluate(el=>el.blur());
   await page.keyboard.press("/");
   assert.equal(await page.evaluate(()=>document.activeElement?.id),"adminNavSearch","keyboard slash focuses search");
  }
  await page.close();
 }
 for(const width of [320,375,768,1280]){
  for(const path of ["admin.html","admin-products.html","admin-users.html","admin-health.html"]){
   const page=await browser.newPage({viewport:{width,height:812}});
   await page.route(/https:\/\/cdn\.jsdelivr\.net\/npm\/\@supabase\/supabase-js\@2(?:\.57\.0)?\/\+esm/,r=>r.fulfill({contentType:"text/javascript",body:mock}));
   await page.goto(base+"/"+path,{waitUntil:"load"});
   if(path==="admin.html")await page.locator("#adminPages").evaluate(el=>el.hidden=false);
   else await page.locator(path==="admin-health.html"?"#healthProtected":"#adminProtected").evaluate(el=>el.hidden=false);
   const size=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,viewport:innerWidth}));
   assert.ok(size.scroll<=size.viewport+2,path+" overflows at "+width+": "+JSON.stringify(size));
   assert.ok(await page.locator("main h1").isVisible());
   await page.close();
  }
 }
 console.log("Kitora admin browser tests: 7 consistent sections, guest gates, keyboard search, 4 responsive sizes PASS.");
}finally{await browser.close();await new Promise(done=>server.close(done))}
