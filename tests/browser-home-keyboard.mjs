import assert from "node:assert/strict";
import {createServer} from "node:http";
import {readFile,stat} from "node:fs/promises";
import {resolve,extname,sep} from "node:path";
import {chromium} from "playwright";
const root=process.cwd();
const server=createServer(async(req,res)=>{
 try{
  const path=decodeURIComponent(new URL(req.url,"http://localhost").pathname);
  const file=resolve(root,"."+path);
  if(!file.startsWith(root+sep)){res.writeHead(403).end();return}
  const actual=(await stat(file)).isDirectory()?resolve(file,"index.html"):file;
  const bytes=await readFile(actual);
  res.writeHead(200,{"Content-Type":{".html":"text/html",".css":"text/css",".js":"text/javascript"}[extname(actual)]||"application/octet-stream"});res.end(bytes)
 }catch{res.writeHead(404).end("Not found")}
});
await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage();
 const mock='export function createClient(){return {auth:{getSession:async()=>({data:{session:null}}),getUser:async()=>({data:{user:null}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})}}}';
 await page.route(/https:\/\/cdn\.jsdelivr\.net\/npm\/@supabase\/supabase-js@2\/\+esm/,route=>route.fulfill({status:200,contentType:"text/javascript",body:mock}));
 await page.goto("http://127.0.0.1:"+server.address().port+"/index.html",{waitUntil:"load"});
 await page.keyboard.press("Tab");
 assert.equal(await page.evaluate(()=>document.activeElement?.className),"k-skip-link","First keyboard tab must focus skip link");
 await page.keyboard.press("Enter");
 assert.equal(await page.evaluate(()=>document.activeElement?.id),"contenu-principal","Skip link should focus main");
 await page.locator("#authOpenBtn").click();
 await page.locator("#authModal:not([hidden])").waitFor();
 assert.equal(await page.evaluate(()=>document.activeElement?.id),"authEmail","Login dialog should focus email field");
 await page.keyboard.press("Escape");
 assert.ok(await page.locator("#authModal").isHidden(),"Escape should close modal");
 assert.equal(await page.evaluate(()=>document.activeElement?.id),"authOpenBtn","Closing modal should restore focus");
 await page.locator("#authOpenBtn").click();
 await page.locator("#authCloseBtn").focus();
 await page.keyboard.press("Tab");
 assert.equal(await page.evaluate(()=>document.activeElement?.id),"authCloseBtn","Tab from last control should wrap to first");
 await page.keyboard.press("Shift+Tab");
 assert.equal(await page.evaluate(()=>document.activeElement?.id),"authSubmitBtn","Shift+Tab must stay inside dialog");
 assert.ok((await page.locator("#nouveautes").innerText()).includes("compte Kitora Free"));
 assert.ok((await page.locator("#mon-besoin-kitora").innerText()).includes("compte Kitora Free"));
 console.log("Homepage keyboard navigation, modal Escape/focus trap, and account copy: passed.");
 await page.close();
}finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
