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
  if(!full.startsWith(root+sep))return res.writeHead(403).end();
  const filename=(await stat(full)).isDirectory()?resolve(full,"index.html"):full;
  const bytes=await readFile(filename);
  res.writeHead(200,{"Content-Type":{".html":"text/html",".css":"text/css",".js":"text/javascript",".svg":"image/svg+xml"}[extname(filename)]||"application/octet-stream"});res.end(bytes);
 }catch{res.writeHead(404).end("Not found")}
});
await new Promise(ok=>server.listen(0,"127.0.0.1",ok));
const base="http://127.0.0.1:"+server.address().port;
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1280,height:900},acceptDownloads:true});
 await page.goto(base+"/solutions.html",{waitUntil:"load"});
 assert.ok(await page.locator('[data-audience-panel="particulier"]').isVisible());
 assert.equal(await page.getByRole("button",{name:/Association/}).getAttribute("aria-pressed"),"false");
 await page.getByRole("button",{name:/Association/}).click();
 assert.ok(await page.locator('[data-audience-panel="association"]').isVisible());
 assert.equal(await page.locator('[data-audience-panel="particulier"]').isVisible(),false);
 assert.equal(new URL(page.url()).searchParams.get("public"),"association");
 await page.reload({waitUntil:"load"});
 assert.ok(await page.locator('[data-audience-panel="association"]').isVisible());
 await page.getByRole("button",{name:/Entreprise/}).click();
 assert.ok(await page.locator('[data-audience-panel="entreprise"]').isVisible());
 assert.equal(new URL(page.url()).searchParams.get("public"),"entreprise");
 await page.locator("#briefName").fill("Mon entreprise de test");
 await page.locator("#briefTeam").selectOption("6 à 20");
 await page.locator("#briefNotes").fill("Organisation des tâches et documents.");
 const promise=page.waitForEvent("download");
 await page.getByRole("button",{name:/Télécharger mon brief TXT/}).click();
 const download=await promise,body=await readFile(await download.path(),"utf8");
 assert.match(download.suggestedFilename(),/kitora-brief-entreprise\.txt/);
 assert.match(body,/Mon entreprise de test/);
 assert.match(body,/6 à 20/);
 assert.match(body,/NON TRANSMIS/);
 assert.match(await page.locator("#briefFeedback").innerText(),/Rien n'a été transmis/);
 await page.close();
 const mobile=await browser.newPage({viewport:{width:375,height:812}});
 await mobile.goto(base+"/solutions.html?public=association",{waitUntil:"load"});
 assert.ok(await mobile.locator('[data-audience-panel="association"]').isVisible());
 const dims=await mobile.evaluate(()=>({outer:innerWidth,scroll:document.documentElement.scrollWidth}));
 assert.ok(dims.scroll<=dims.outer+2,"Unexpected horizontal overflow: "+JSON.stringify(dims));
 await mobile.locator(".kitora-mobile summary").click();
 assert.ok(await mobile.locator(".kitora-mobile-links").isVisible());
 await mobile.close();
 console.log("B2B/B2C browser smoke passed: audience filter, URL sync, TXT download, mobile navigation.");
}finally{await browser.close();await new Promise(ok=>server.close(ok))}
