import assert from "node:assert/strict";
import {createServer} from "node:http";
import {readFile,stat} from "node:fs/promises";
import {resolve,sep,extname} from "node:path";
import {chromium} from "playwright";

const root=process.cwd();
const server=createServer(async(req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url,"http://localhost").pathname);
  const file=resolve(root,"."+pathname);
  if(!file.startsWith(root+sep)){res.writeHead(403).end();return;}
  const actual=(await stat(file)).isDirectory()?resolve(file,"index.html"):file;
  const ext=extname(actual);
  res.writeHead(200,{"Content-Type":({".html":"text/html",".js":"text/javascript",".css":"text/css",".svg":"image/svg+xml"})[ext]||"application/octet-stream"});
  res.end(await readFile(actual));
 }catch{res.writeHead(404).end("Not found");}
});
await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage();
 await page.route(/https:\/\/cdn\.jsdelivr\.net\/npm\/@supabase\/supabase-js@2/,route=>
  route.fulfill({contentType:"text/javascript",body:"export function createClient(){return window.__ACCOUNT_TEST_CLIENT__;}"}));
 await page.route("**/subscriber-requests.js*",route=>route.fulfill({contentType:"text/javascript",body:""}));
 await page.addInitScript(()=>{
  const state={user:null,signup:null,login:null};
  window.__ACCOUNT_TEST_STATE__=state;
  const chain=()=>({select(){return this},eq(){return this},order(){return this},
   async limit(){return{data:[],error:null}},async maybeSingle(){return{data:null,error:null}},
   then(resolve){return Promise.resolve({data:[],error:null}).then(resolve);}});
  window.__ACCOUNT_TEST_CLIENT__={
   from:()=>chain(),
   auth:{
    getUser:async()=>({data:{user:state.user},error:null}),
    onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),
    signUp:async options=>{
     state.signup=options;
     return {data:{user:{id:"new-account"},session:null},error:null};
    },
    signInWithPassword:async options=>{
     state.login=options;
     if(options.password==="wrongpass")return{data:null,error:{message:"Invalid login credentials"}};
     state.user={id:"test-account",email:options.email};
     return {data:{user:state.user,session:{access_token:"local-test"}},error:null};
    },
    signOut:async()=>{state.user=null;return {error:null}},
    resetPasswordForEmail:async()=>({error:null})
   }
  };
 });
 const pageErrors=[];page.on("pageerror",error=>pageErrors.push(error.message));
 await page.goto("http://127.0.0.1:"+server.address().port+"/compte.html",{waitUntil:"load"});
 await page.locator("#accountAuthSection").waitFor({state:"visible"});
 assert.equal(await page.locator("#accountAuthSubmit").innerText(),"Se connecter");
 assert.equal(await page.locator("#signupLink").isVisible(),true);
 await page.locator("#signupLink").click();
 await page.locator("#accountAuthName").fill("Utilisateur démo");
 await page.locator("#accountAuthEmail").fill("nouveau@example.test");
 await page.locator("#accountAuthPassword").fill("safeDemoPass123!");
 await page.locator("#accountAuthSubmit").click();
 await page.getByText("Vérifie ta boîte e-mail", {exact:false}).waitFor();
 const signup=await page.evaluate(()=>window.__ACCOUNT_TEST_STATE__.signup);
 assert.equal(signup.email,"nouveau@example.test");
 assert.equal(signup.options.data.display_name,"Utilisateur démo");
 assert.equal(new URL(signup.options.emailRedirectTo).pathname,"/compte.html");
 assert.equal(await page.locator("#accountAuthSection").isVisible(),true);
 await page.locator("#accountAuthLoginTab").click();
 await page.locator("#accountAuthPassword").fill("wrongpass");
 await page.locator("#accountAuthSubmit").click();
 await page.getByText("E-mail ou mot de passe incorrect.").waitFor();
 await page.locator("#accountAuthPassword").fill("safeDemoPass123!");
 await page.locator("#accountAuthSubmit").click();
 await page.locator("#accountAuthSection").waitFor({state:"hidden"});
 assert.equal(await page.locator("#logoutBtn").isVisible(),true);
 assert.equal(await page.locator("#signupLink").isVisible(),false);
 await page.locator("#logoutBtn").click();
 await page.locator("#accountAuthSection").waitFor({state:"visible"});
 assert.equal(await page.locator("#signupLink").isVisible(),true);
 assert.deepEqual(pageErrors,[]);
 console.log("Kitora account auth UI: signup, email confirmation state, login failure/success and logout passed.");
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
