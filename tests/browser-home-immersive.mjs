import assert from "node:assert/strict";
import {createServer} from "node:http";
import {readFile,stat} from "node:fs/promises";
import {readFileSync} from "node:fs";
import {resolve,extname,sep} from "node:path";
import {chromium} from "playwright";
const root=process.cwd();
const files={"/":"/index.html"};
const server=createServer(async(req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url,"http://localhost").pathname);
  const file=resolve(root,"."+(files[pathname]||pathname));
  if(!file.startsWith(root+sep)){res.writeHead(403).end();return}
  const path=(await stat(file)).isDirectory()?resolve(file,"index.html"):file;
  const bytes=await readFile(path);
  res.writeHead(200,{"Content-Type":{".html":"text/html",".css":"text/css",".js":"text/javascript",".svg":"image/svg+xml",".png":"image/png"}[extname(path)]||"application/octet-stream"});
  res.end(bytes);
 }catch{res.writeHead(404).end("Not found")}
});
await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
const base="http://127.0.0.1:"+server.address().port;
const browser=await chromium.launch({headless:true});
const axeSource=readFileSync("node_modules/axe-core/axe.min.js","utf8");
const supabaseStub='export function createClient(){return {auth:{getSession:async()=>({data:{session:null}}),getUser:async()=>({data:{user:null}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})}}}';
async function visit(width,height,reducedMotion="no-preference"){
 const page=await browser.newPage({viewport:{width,height},reducedMotion});
 await page.route(/https:\/\/cdn\.jsdelivr\.net\/npm\/@supabase\/supabase-js@2\/\+esm/,route=>route.fulfill({status:200,contentType:"text/javascript",body:supabaseStub}));
 await page.goto(base+"/index.html",{waitUntil:"load",timeout:25000});
 await page.locator(".k-hero-stage .preview").waitFor({state:"visible"});
 await page.evaluate(()=>document.fonts.ready);
 return page;
}
try{
 const desktop=await visit(1440,900);
 const dom=await desktop.evaluate(()=>{
  const stage=document.querySelector(".k-hero-stage");
  const bg=getComputedStyle(stage).backgroundImage;
  const hero=stage.getBoundingClientRect();
  return {bg,heroHeight:hero.height,sections:document.querySelectorAll("#kits,#plus,#generateur,#formules-kitora,#k-orientation").length,homeStyleLoaded:!![...document.styleSheets].find(x=>x.href?.includes("home-v1-motion.css"))};
 });
 assert.equal(dom.sections,5,"Essential commerce and generator anchors must survive");
 assert.ok(dom.bg.includes("gradient"),"Dark hero background missing");
 assert.ok(dom.homeStyleLoaded,"Home stylesheet not loaded");
 assert.ok(dom.heroHeight>=500&&dom.heroHeight<1150,"Hero layout too tall or too short");
 await desktop.getByRole("button",{name:"Apprendre",exact:true}).click();
 await desktop.locator("#k-preview-title").getByText("Mon parcours de révision").waitFor();
 assert.equal(await desktop.getByRole("button",{name:"Apprendre",exact:true}).getAttribute("aria-pressed"),"true");
 await desktop.getByRole("button",{name:/Je veux créer/}).click();
 assert.ok((await desktop.locator("#k-recommend-link").getAttribute("href"))==="#generateur");
 assert.ok((await desktop.locator("#k-recommend-text").innerText()).includes("générateur"));
 await desktop.getByRole("link",{name:/Tester le générateur/}).click();
 assert.equal(new URL(desktop.url()).hash,"#generateur");
 await desktop.goto(base+"/index.html",{waitUntil:"load"});
 await desktop.addScriptTag({content:axeSource});
 const accessible=await desktop.evaluate(async()=>await axe.run(document.querySelector(".k-hero-stage"),{runOnly:{type:"tag",values:["wcag2a","wcag2aa","wcag21a","wcag21aa"]}}));
 assert.equal(accessible.violations.length,0,"Hero WCAG A/AA issues: "+accessible.violations.map(x=>x.id+":"+x.nodes.map(n=>n.target.join(",")).join(",")).join("; "));
 const orientation=await desktop.evaluate(async()=>await axe.run(document.querySelector(".k-orientation"),{runOnly:{type:"tag",values:["wcag2a","wcag2aa","wcag21a","wcag21aa"]}}));
 if(orientation.violations.length){const diagnostic=await desktop.evaluate(()=>{const targets=["#k-orientation .sectionhead .eyebrow","#k-recommend-link"];return targets.map(selector=>{const el=document.querySelector(selector);if(!el)return {selector,absent:true};const st=getComputedStyle(el);let parent=el.parentElement;const ancestors=[];while(parent&&ancestors.length<7){const p=getComputedStyle(parent);ancestors.push({tag:parent.tagName,id:parent.id,className:typeof parent.className==="string"?parent.className.slice(0,100):"",opacity:p.opacity,filter:p.filter,color:p.color,background:p.backgroundColor});parent=parent.parentElement}return {selector,color:st.color,background:st.backgroundColor,opacity:st.opacity,fontSize:st.fontSize,filter:st.filter,blend:st.mixBlendMode,ancestors}})});console.log("ORIENTATION_CONTRAST_DIAGNOSTIC",JSON.stringify({elements:diagnostic,violations:orientation.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,fail:n.failureSummary,checks:n.any.map(a=>({message:a.message,data:a.data}))}))}))}))}
assert.equal(orientation.violations.length,0,"Orientation WCAG A/AA issues: "+orientation.violations.map(x=>x.id+":"+x.nodes.map(n=>n.target.join(",")).join(",")).join("; "));
 for(const w of [320,375,390,768]){
  const page=await visit(w,812);
  const measures=await page.evaluate(()=>({width:document.documentElement.scrollWidth,viewport:innerWidth,hero:getComputedStyle(document.querySelector(".k-hero-stage")).display,overflow:getComputedStyle(document.body).overflowX}));
  assert.ok(measures.width<=measures.viewport+2,"Horizontal overflow at "+w+": "+JSON.stringify(measures));
  assert.ok(await page.locator("#k-hero-title").isVisible(),"Hero hidden at "+w);
  await page.close();
 }
 const reduced=await visit(375,812,"reduce");
 assert.equal(await reduced.evaluate(()=>getComputedStyle(document.querySelector(".k-ambient")).animationName),"none","Motion setting not respected");
 await reduced.close();
 const performance=await desktop.evaluate(()=>{
  const n=performance.getEntriesByType("navigation")[0];
  return {domLoaded:Math.round(n?.domContentLoadedEventEnd||0),resources:performance.getEntriesByType("resource").length};
 });
 assert.ok(performance.resources<70,"Too many requests for a lightweight home");
 console.log("Kitora hybrid home: desktop, four mobile widths, interactive previews, WCAG A/AA, reduced motion and lightweight assets OK.",JSON.stringify(performance));
 await desktop.close();
}finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
