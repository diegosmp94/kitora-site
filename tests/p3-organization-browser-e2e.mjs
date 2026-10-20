import assert from "node:assert/strict";
import {createServer} from "node:http";
import {readFile} from "node:fs/promises";
import {resolve,sep,extname} from "node:path";
import {chromium} from "playwright";
const root=process.cwd();
const server=createServer(async(req,res)=>{try{const path=resolve(root,"."+new URL(req.url,"http://localhost").pathname);if(!path.startsWith(root+sep))return res.writeHead(403).end();res.writeHead(200,{"Content-Type":{".html":"text/html",".js":"text/javascript",".css":"text/css"}[extname(path)]||"text/plain"}).end(await readFile(path))}catch{res.writeHead(404).end()}});
await new Promise(done=>server.listen(0,"127.0.0.1",done));
const browser=await chromium.launch({headless:true});
const origin="http://127.0.0.1:"+server.address().port;
try{
 for(const scenario of ["guest","owner","insert-denied"]){
  const page=await browser.newPage();
  const errors=[];page.on("pageerror",e=>errors.push(e.message));
  const sdk=`const guest=${scenario==="guest"};const deny=${scenario==="insert-denied"};window.__orgCalls={select:0,insert:0};export const createClient=()=>({auth:{getUser:async()=>({data:{user:guest?null:{id:"owner-1"}},error:null}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})},from:()=>({select:()=>({eq:()=>({order:async()=>{window.__orgCalls.select++;return{data:[{id:"org-1",name:"Organisation test",kind:"association",billing_email:null}],error:null}}})}),insert:async data=>{window.__orgCalls.insert++;window.__orgCalls.last=data;return{error:deny?{message:"RLS denied"}:null}}})});`;
  await page.route(/https:\/\/cdn\.jsdelivr\.net\/npm\/\@supabase\/supabase-js\@2\.57\.0\/\+esm/,route=>route.fulfill({contentType:"text/javascript",body:sdk}));
  await page.goto(origin+"/organisation-pro.html",{waitUntil:"load"});
  await page.waitForFunction(()=>document.querySelector("#status").textContent!=="Vérification de la connexion…");
  assert.equal(await page.locator("#workspace").isVisible(),scenario!=="guest",scenario);
  if(scenario==="guest"){assert.equal(await page.evaluate(()=>window.__orgCalls.insert),0);assert.match(await page.locator("#status").innerText(),/Connecte-toi/)}
  else{
   assert.match(await page.locator("#org-list").innerText(),/Organisation test/);
   await page.locator("#org-name").fill("Nouvelle association");
   await page.locator("#org-kind").selectOption("association");
   await page.locator("#org-email").fill("contact@example.com");
   await page.locator("#save").click();
   await page.waitForFunction(()=>document.querySelector("#save").disabled===false);
   assert.equal(await page.evaluate(()=>window.__orgCalls.insert),1);
   assert.equal(await page.evaluate(()=>window.__orgCalls.last.owner_id),"owner-1");
   assert.match(await page.locator("#status").innerText(),scenario==="owner"?/enregistrée/:/RLS denied/);
  }
  assert.deepEqual(errors,[],scenario+" browser errors");
  await page.close();
 }
 console.log("P3 organization browser: guest blocked, owner insert, denied insert PASS");
}finally{await browser.close();await new Promise(done=>server.close(done))}
