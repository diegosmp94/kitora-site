import assert from "node:assert/strict";
import {createServer} from "node:http";
import {readFile,stat} from "node:fs/promises";
import {resolve,sep,extname} from "node:path";
import {chromium} from "playwright";
const root=process.cwd();
const server=createServer(async(req,res)=>{
 try{const pathname=decodeURIComponent(new URL(req.url,"http://localhost").pathname),full=resolve(root,"."+pathname);
  if(!full.startsWith(root+sep)){res.writeHead(403).end();return}
  const file=(await stat(full)).isDirectory()?resolve(full,"index.html"):full;
  res.writeHead(200,{"Content-Type":{".html":"text/html",".css":"text/css",".js":"text/javascript",".svg":"image/svg+xml"}[extname(file)]||"application/octet-stream"}).end(await readFile(file));
 }catch{res.writeHead(404).end("Not found")}
});
await new Promise(done=>server.listen(0,"127.0.0.1",done));
const base="http://127.0.0.1:"+server.address().port,browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1300,height:860},acceptDownloads:true});
 await page.addInitScript(()=>{
  const key="mock-kitora-cloud-db";
  const uid="aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";
  const get=()=>JSON.parse(localStorage.getItem(key)||'{"profile":null,"invoices":[]}');
  const put=v=>localStorage.setItem(key,JSON.stringify(v));
  const stamp=()=>new Date().toISOString();
  const chain=(table,mode,payload)=>{
   const filters=[];let direction="desc";
   const matches=x=>filters.every(([k,v])=>x[k]===v);
   function execute(single=false,limit=0){
    const state=get();let data=null;
    if(table==="kitora_org_profiles"){
     if(mode==="select")data=state.profile&&matches(state.profile)?[state.profile]:[];
     else if(mode==="upsert"){state.profile={...payload};put(state);data=[state.profile]}
    }else if(table==="kitora_invoice_drafts"){
     if(mode==="select")data=state.invoices.filter(x=>x.user_id===uid&&matches(x)).sort((a,b)=>direction==="asc"?a.updated_at.localeCompare(b.updated_at):b.updated_at.localeCompare(a.updated_at));
     if(mode==="insert"){
      const now=stamp(),record={...payload,id:crypto.randomUUID(),revision:1,total_ttc_cents:payload.total_ht_cents+payload.total_vat_cents,created_at:now,updated_at:now};
      state.invoices.unshift(record);put(state);data=[record];
     }
     if(mode==="update"){
      const ix=state.invoices.findIndex(x=>x.user_id===uid&&matches(x));data=[];
      if(ix>=0){const was=state.invoices[ix],newItem={...was,...payload,revision:was.revision+1,updated_at:stamp()};newItem.total_ttc_cents=newItem.total_ht_cents+newItem.total_vat_cents;state.invoices[ix]=newItem;put(state);data=[newItem]}
     }
     if(mode==="delete"){
      data=state.invoices.filter(x=>x.user_id===uid&&matches(x));state.invoices=state.invoices.filter(x=>!(x.user_id===uid&&matches(x)));put(state);
     }
    }else throw Error("Unexpected Supabase table "+table);
    if(!Array.isArray(data))throw Error("Mock invalid operation");
    return {data:single?data[0]||null:limit?data.slice(0,limit):data,error:null};
   }
   return {select:()=>chainSelect(),eq(k,v){filters.push([k,v]);return this},order(k,opt={}){direction=opt.ascending?"asc":"desc";return this},limit:n=>Promise.resolve(execute(false,n)),maybeSingle:()=>Promise.resolve(execute(true)),single:()=>Promise.resolve(execute(true))};
   function chainSelect(){return this} // replaced below by object mutation
  };
  function query(table,mode,payload){
   const obj=chain(table,mode,payload);
   obj.select=function(){return this};
   return obj;
  }
  window.__KITORA_INVOICE_TEST_CLIENT__={
   auth:{getUser:async()=>({data:{user:{id:uid}},error:null})},
   from:table=>({select:()=>query(table,"select"),upsert:payload=>query(table,"upsert",payload),insert:payload=>query(table,"insert",payload),update:payload=>query(table,"update",payload),delete:()=>query(table,"delete")})
  };
 });
 const pageErrors=[];page.on("pageerror",err=>pageErrors.push(err.message));
 await page.goto(base+"/facturation-pro.html?plan=flow",{waitUntil:"load"});
 await page.locator("#authStatus").getByText("Compte connecté.",{exact:false}).waitFor();
 await page.locator("#cloudDraftStatus").getByText("Brouillons privés chargés.",{exact:false}).waitFor();
 await page.locator("#orgName").fill("Organisation de démonstration");
 await page.locator("#orgSiren").fill("123456789");
 await page.locator("#orgAddress").fill("10 rue Prototype");
 await page.locator("#orgPostal").fill("75001");
 await page.locator("#orgCity").fill("Paris");
 await page.locator("#orgEmail").fill("pro@example.org");
 await page.locator("#saveOrg").click();
 await page.locator("#orgMessage").getByText("Dossier enregistré dans ton compte Kitora.",{exact:false}).waitFor();
 await page.locator("#clientName").fill("Client de l'atelier");
 await page.locator("#clientAddress").fill("4 rue Client");
 await page.locator("#clientPost").fill("69001");
 await page.locator("#clientCity").fill("Lyon");
 await page.locator("#invoice-line-0-description").fill("Conception de projet");
 await page.locator("#invoice-line-0-qty").fill("2");
 await page.locator("#invoice-line-0-unitCents").fill("125.00");
 await page.locator("#saveCloudDraft").click();
 await page.locator("#cloudDraftStatus").getByText("Brouillon sauvegardé", {exact:false}).waitFor();
 assert.equal(await page.locator(".cloud-row").count(),1);
 assert.match(await page.locator(".cloud-row-total").innerText(),/300,00/);
 await page.reload({waitUntil:"load"});
 await page.locator("#cloudDraftStatus").getByText("Brouillons privés chargés.",{exact:false}).waitFor();
 assert.equal(await page.locator(".cloud-row").count(),1);
 page.once("dialog",dialog=>dialog.accept());
 await page.locator(".cloud-row").getByRole("button",{name:"Ouvrir"}).click();
 assert.equal(await page.locator("#clientName").inputValue(),"Client de l'atelier");
 assert.equal(await page.locator("#invoice-line-0-description").inputValue(),"Conception de projet");
 await page.locator(".cloud-row").getByRole("button",{name:"Marquer à vérifier"}).click();
 await page.locator("#cloudDraftStatus").getByText("Dossier marqué", {exact:false}).waitFor();
 assert.match(await page.locator(".cloud-state").innerText(),/À vérifier/);
 await page.locator("#invoice-line-0-description").fill("Conception revue");
 await page.locator("#saveCloudDraft").click();
 await page.locator("#cloudDraftStatus").getByText("Brouillon sauvegardé", {exact:false}).waitFor();
 assert.match(await page.locator(".cloud-state").innerText(),/Brouillon/);
 await page.locator(".cloud-row").getByRole("button",{name:"Dupliquer"}).click();
 await page.locator("#cloudDraftStatus").getByText("Copie créée", {exact:false}).waitFor();
 assert.equal(await page.locator(".cloud-row").count(),2);
 const n=await page.locator(".cloud-row").count();assert.equal(n,2);
 page.once("dialog",dialog=>dialog.accept());
 await page.locator(".cloud-row.is-selected").getByRole("button",{name:"Supprimer"}).click();
 await page.locator("#cloudDraftStatus").getByText("Brouillon supprimé", {exact:false}).waitFor();
 assert.equal(await page.locator(".cloud-row").count(),1);
 assert.deepEqual(pageErrors,[]);
 await page.close();
 for(const width of [320,375,768]){
  const mobile=await browser.newPage({viewport:{width,height:812}});
  await mobile.addInitScript(()=>window.__KITORA_INVOICE_TEST_CLIENT__={auth:{getUser:async()=>({data:{user:null},error:null})}});
  await mobile.goto(base+"/facturation-pro.html",{waitUntil:"load"});
  const size=await mobile.evaluate(()=>({page:document.documentElement.scrollWidth,viewport:innerWidth}));
  assert.ok(size.page<=size.viewport+2,"overflow at "+width+": "+JSON.stringify(size));
  await mobile.close();
 }
 console.log("Kitora cloud drafts Chromium: profile, explicit save, reload, edit, review, version, duplicate, delete, mobile PASS");
}finally{await browser.close();await new Promise(done=>server.close(done))}
