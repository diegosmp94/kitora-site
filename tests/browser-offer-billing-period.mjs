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
  const target=(await stat(file)).isDirectory()?resolve(file,"index.html"):file;
  const data=await readFile(target);
  res.writeHead(200,{"Content-Type":{".html":"text/html",".css":"text/css",".js":"text/javascript"}[extname(target)]||"application/octet-stream"});res.end(data)
 }catch{res.writeHead(404).end("Not Found")}
});
await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
const browser=await chromium.launch({headless:true});
try{
 for(const width of [375,768,1440]){
  const page=await browser.newPage({viewport:{width,height:900}});
  const base="http://127.0.0.1:"+server.address().port;
  await page.goto(base+"/offres.html",{waitUntil:"load"});
  const plus=page.locator('[data-offer-plan="plus"]'),solo=page.locator('[data-offer-plan="solo"]');
  assert.ok((await plus.locator(".offer-price").innerText()).includes("5,99"));
  assert.ok((await plus.locator("[data-billing-checkout]").getAttribute("href")).includes("plus_monthly"));
  await page.getByRole("button",{name:"Annuel"}).click();
  assert.ok((await plus.locator(".offer-price").innerText()).includes("59,90"));
  assert.ok((await plus.locator("[data-billing-detail]").innerText()).includes("11,98"));
  assert.ok((await plus.locator("[data-billing-checkout]").getAttribute("href")).includes("plus_yearly"));
  assert.equal(await solo.locator("[data-billing-checkout]").getAttribute("aria-disabled"),"true");
  assert.ok((await solo.locator(".offer-price").innerText()).includes("Indisponible"));
  assert.equal(await page.getByRole("button",{name:"Annuel"}).getAttribute("aria-pressed"),"true");
  const dimensions=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,width:innerWidth}));
  assert.ok(dimensions.scroll<=dimensions.width+2,JSON.stringify({width,dimensions}));
  await page.reload({waitUntil:"load"});
  assert.equal(await page.getByRole("button",{name:"Annuel"}).getAttribute("aria-pressed"),"true");
  await page.getByRole("button",{name:"Mensuel"}).click();
  assert.ok((await plus.locator(".offer-price").innerText()).includes("5,99"));
  assert.ok((await solo.locator(".offer-price").innerText()).includes("1,99"));
  assert.equal(await solo.locator("[data-billing-checkout]").getAttribute("aria-disabled"),"false");
  await page.close();
 }
 console.log("Kitora billing: annual Plus 59.90, saving 11.98, unavailable plans disabled, correct checkout and mobile responsiveness.");
}finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
