import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import {chromium} from "playwright";
const port=8766,origin="http://127.0.0.1:"+port;
const server=spawn("python3",["-m","http.server",String(port),"--bind","127.0.0.1"],{stdio:"ignore"});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const mock=`const user={id:"e2e-user",email:"test@example.invalid"};
let docs=[],requests=[{id:"ai1",user_id:"e2e-user",title:"Exemple IA",created_at:new Date().toISOString(),ai_result:{summary:"Résultat IA de test"}}];
const now=()=>new Date().toISOString();const response=(data,error=null)=>({data,error});
function query(table){let filters=[],operation="select",payload=null;
const q={select(){return q},eq(k,v){filters.push(d=>d[k]===v);return q},not(k,op,v){filters.push(d=>d[k]!=null);return q},order(){return q},limit(){return q},insert(v){operation="insert";payload=v;return q},update(v){operation="update";payload=v;return q},delete(){operation="delete";return q},single(){return Promise.resolve(run(true))},maybeSingle(){return Promise.resolve(run(true))},then(resolve,reject){return Promise.resolve(run(false)).then(resolve,reject)}};
function run(single){const store=table==="subscriber_requests"?requests:docs;let items=store.filter(d=>filters.every(f=>f(d)));
if(operation==="insert"){const d={id:"doc"+(docs.length+1),created_at:now(),updated_at:now(),is_favorite:false,...payload};docs.push(d);items=[d]}
if(operation==="update"){items.forEach(d=>Object.assign(d,payload))}
if(operation==="delete"){items.forEach(d=>{const i=store.indexOf(d);if(i>=0)store.splice(i,1)})}
return response(single?(items[0]||null):items.map(d=>({...d})))}return q}
export function createClient(){return {auth:{getUser:async()=>({data:{user},error:null}),getSession:async()=>({data:{session:{access_token:"e2e-token"}}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})},from:query}};
`;
let browser;
try{
 for(let i=0;i<40;i++){try{if((await fetch(origin+"/kitora3-studio.html")).ok)break}catch{}await sleep(250)}
 browser=await chromium.launch({headless:true});const page=await browser.newPage({acceptDownloads:true});
 await page.route(url=>url.hostname==="cdn.jsdelivr.net" && url.pathname.includes("supabase-js"),route=>route.fulfill({status:200,contentType:"text/javascript",body:mock}));
 const errors=[];page.on("pageerror",e=>errors.push(e.message));
 await page.goto(origin+"/kitora3-studio.html",{waitUntil:"domcontentloaded"});
 await page.locator("#app").waitFor({state:"visible"});
 await page.locator("#newBrief").click();await page.locator("#title").waitFor({state:"visible"});
 assert.match(await page.locator("#title").inputValue(),/Brief projet/);
 await page.locator("#title").fill("Brief E2E");await page.locator("#content").fill("Contenu de test");await page.locator("#save").click();
 await page.getByText("Document sauvegardé dans ton compte.").waitFor();
 await page.locator("#fav").click();await page.getByText("Favori mis à jour.").waitFor();
 await page.locator("#filter").selectOption("fav");assert.equal(await page.locator("#list button").count(),1);
 await page.locator("#filter").selectOption("all");await page.locator("#duplicate").click();await page.getByText("Copie enregistrée.").waitFor();
 assert.equal(await page.locator("#list button").count(),2);
 await page.locator("#importAI").click();await page.locator("#importList button").first().click();await page.getByText(/Création IA importée et sauvegardée/).waitFor();
 assert.match(await page.locator("#content").inputValue(),/Résultat IA de test/);
 page.once("dialog",d=>d.accept());await page.locator("#remove").click();await page.getByText("Document supprimé.").waitFor();
 assert.equal(await page.locator("#list button").count(),2);
 assert.deepEqual(errors,[]);console.log("P2 authenticated Studio mocked E2E passed: create, edit, save, favorite, filter, duplicate, import saved AI, delete.");
 console.log("Mocked backend only. Live Supabase credentials, real AI generation and privileged admin flows NOT covered.");
}finally{await browser?.close();server.kill("SIGTERM")}
