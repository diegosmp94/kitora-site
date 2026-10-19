import assert from "node:assert/strict";
import {createServer} from"node:http";
import{readFile,stat}from"node:fs/promises";
import{resolve,sep,extname}from"node:path";
import{chromium}from"playwright";
const root=process.cwd();
const server=createServer(async(req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url,"http://localhost").pathname),full=resolve(root,"."+pathname);
  if(!full.startsWith(root+sep)){res.writeHead(403).end();return}
  const file=(await stat(full)).isDirectory()?resolve(full,"index.html"):full;
  res.writeHead(200,{"Content-Type":{".html":"text/html",".css":"text/css",".js":"text/javascript",".svg":"image/svg+xml"}[extname(file)]||"application/octet-stream"}).end(await readFile(file));
 }catch{res.writeHead(404).end("Not found")}
});
await new Promise(done=>server.listen(0,"127.0.0.1",done));
const base="http://127.0.0.1:"+server.address().port,browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1270,height:860}});
 await page.route(/https:\/\/cdn\.jsdelivr\.net\/npm\/@supabase\/supabase-js@2\.57\.0\/\+esm/,route=>route.fulfill({contentType:"text/javascript",body:"export function createClient(){return window.__KITORA_SECURITY_TEST_CLIENT__;}"}));
 await page.addInitScript(()=>{
  const state={signedIn:true,level:"aal1",verified:false};
  window.__MFA_STATE__=state;
  window.__KITORA_SECURITY_TEST_CLIENT__={auth:{
   getUser:async()=>({data:{user:state.signedIn?{id:"test-user"}:null},error:null}),
   onAuthStateChange:()=>({data:{subscription:{unsubscribe:()=>{}}}}),
   mfa:{
    getAuthenticatorAssuranceLevel:async()=>({data:{currentLevel:state.level,nextLevel:state.verified?"aal2":"aal1"},error:null}),
    listFactors:async()=>({data:{totp:state.verified?[{id:"test-factor",status:"verified"}]:[]},error:null}),
    enroll:async()=>({data:{id:"test-factor",totp:{secret:"JBSWY3DPEHPK3PXP"}},error:null}),
    challengeAndVerify:async({factorId,code})=>{
     if(factorId!=="test-factor"||code!=="123456")return{data:null,error:{message:"invalid"}};
     state.verified=true;state.level="aal2";return{data:{},error:null};
    }
   }
  }};
 });
 const errors=[];page.on("pageerror",e=>errors.push(e.message));
 await page.goto(base+"/securite-compte.html",{waitUntil:"load"});
 await page.locator("#securityControls").waitFor({state:"visible"});
 assert.match(await page.locator("#aalState").innerText(),/AAL1/);
 await page.getByRole("button",{name:"Commencer la configuration"}).click();
 assert.ok(await page.locator("#enrollSecretBox").isVisible());
 assert.equal(await page.locator("#enrollmentSecret").innerText(),"JBSWY3DPEHPK3PXP");
 await page.locator("#enrollCode").fill("123456");
 await page.getByRole("button",{name:"Confirmer l'activation"}).click();
 await page.getByText("Le deuxième facteur est actif pour cette session.").waitFor();
 assert.match(await page.locator("#aalState").innerText(),/AAL2/);
 assert.equal(await page.locator("#enrollmentSecret").innerText(),"","secret removed from DOM after verification");
 assert.equal(await page.evaluate(()=>Object.keys(localStorage).filter(k=>k.toLowerCase().includes("totp")||k.toLowerCase().includes("secret")).length),0);
 assert.deepEqual(errors,[],"no browser errors");
 await page.close();
 for(const width of [320,375,768]){
  const mobile=await browser.newPage({viewport:{width,height:800}});
  await mobile.route(/https:\/\/cdn\.jsdelivr\.net\/npm\/@supabase\/supabase-js@2\.57\.0\/\+esm/,route=>route.fulfill({contentType:"text/javascript",body:"export function createClient(){return {auth:{getUser:async()=>({data:{user:null},error:null}),onAuthStateChange:()=>{}}};}"}));
  await mobile.goto(base+"/securite-compte.html",{waitUntil:"load"});
  const d=await mobile.evaluate(()=>({scroll:document.documentElement.scrollWidth,viewport:innerWidth}));
  assert.ok(d.scroll<=d.viewport+2,"horizontal overflow at "+width+" "+JSON.stringify(d));
  assert.ok(await mobile.locator("#signedOut").isVisible());
  await mobile.close();
 }
 console.log("Kitora MFA browser checks passed: TOTP enrollment, verification, secret clearing and mobile guest states.");
}finally{await browser.close();await new Promise(ok=>server.close(ok))}
