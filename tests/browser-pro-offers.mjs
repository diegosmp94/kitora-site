import assert from "node:assert/strict";
import {createServer} from "node:http";
import {readFile,stat} from "node:fs/promises";
import {resolve,sep,extname} from "node:path";
import {chromium} from "playwright";
const root=process.cwd();
const server=createServer(async(req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url,"http://localhost").pathname);
  const full=resolve(root,"."+pathname);
  if(!full.startsWith(root+sep)){res.writeHead(403).end();return}
  const name=(await stat(full)).isDirectory()?resolve(full,"index.html"):full;
  const bytes=await readFile(name);
  const type={".html":"text/html",".css":"text/css",".js":"text/javascript",".svg":"image/svg+xml"}[extname(name)]||"application/octet-stream";
  res.writeHead(200,{"Content-Type":type});res.end(bytes);
 }catch{res.writeHead(404).end("Not found")}
});
await new Promise(done=>server.listen(0,"127.0.0.1",done));
const base="http://127.0.0.1:"+server.address().port;
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:900}});
 await page.goto(base+"/offres-pro.html",{waitUntil:"load"});
 const cards=page.locator("[data-pro-plan]");assert.equal(await cards.count(),5);
 assert.match(await page.locator('[data-pro-plan="impact"] [data-price-display]').innerText(),/12,90/);
 assert.equal(await page.getByRole("button",{name:"Mensuel"}).getAttribute("aria-pressed"),"true");
 await page.getByRole("button",{name:/Annuel/}).click();
 assert.equal(await page.getByRole("button",{name:/Annuel/}).getAttribute("aria-pressed"),"true");
 assert.equal(new URL(page.url()).searchParams.get("periode"),"annuel");
 for(const [plan,price]of [["impact","129,00"],["launch","249,00"],["flow","499,00"],["creative","799,00"],["horizon","1 499,00"]]){
   const shown=await page.locator('[data-pro-plan="'+plan+'"] [data-price-display]').innerText();
   assert.ok(shown.replace(/\s+/g," ").includes(price.replace(/\s+/g," ")),plan+": "+shown);
 }
 assert.match(await page.locator('[data-pro-plan="flow"] [data-plan-equivalent]').innerText(),/économie indicative/);
 await page.reload({waitUntil:"load"});
 assert.equal(await page.getByRole("button",{name:/Annuel/}).getAttribute("aria-pressed"),"true","billing period survives reload");
 await page.getByRole("button",{name:"Mensuel"}).click();
 assert.equal(new URL(page.url()).searchParams.has("periode"),false);
 assert.ok(!(await page.locator('a[href*="panier.html"],a[href*="checkout.stripe.com"]').count()),"no checkout for B2B planned plans");
 await page.close();
 for(const width of [320,375,768,1280]){
  const mobile=await browser.newPage({viewport:{width,height:860}});
  await mobile.goto(base+"/offres-pro.html",{waitUntil:"load"});
  const dims=await mobile.evaluate(()=>({scroll:document.documentElement.scrollWidth,viewport:innerWidth}));
  assert.ok(dims.scroll<=dims.viewport+2,width+" horizontal page overflow "+JSON.stringify(dims));
  assert.ok(await mobile.getByRole("heading",{name:/Ensemble/}).isVisible());
  if(width<=768){
   await mobile.locator(".kitora-mobile summary").click();
   assert.ok(await mobile.locator(".kitora-mobile-links").isVisible(),"mobile menu");
  }
  await mobile.close();
 }
 console.log("Kitora Pro browser smoke passed: five plans, periods, URL persistence, no payment and 4 viewport sizes.");
}finally{await browser.close();await new Promise(done=>server.close(done))}
