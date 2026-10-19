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
  const file=(await stat(full)).isDirectory()?resolve(full,"index.html"):full;
  const content=await readFile(file);
  res.writeHead(200,{"Content-Type":{".html":"text/html",".css":"text/css",".js":"text/javascript",".svg":"image/svg+xml"}[extname(file)]||"application/octet-stream"});res.end(content);
 }catch{res.writeHead(404).end("Not found")}
});
await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
const base="http://127.0.0.1:"+server.address().port;
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1350,height:900},acceptDownloads:true});
 const errors=[];page.on("pageerror",e=>errors.push(e.message));
 await page.goto(base+"/outils-pro.html#projet",{waitUntil:"load"});
 assert.equal(await page.locator(".tool-tab").count(),5);
 assert.ok(await page.locator("#panel-projet").isVisible());
 await page.locator("#projectName").fill("Portes ouvertes");
 await page.locator("#projectGoal").fill("Accueillir les partenaires");
 await page.locator("#taskName").fill("Réserver la salle");
 await page.locator("#taskOwner").fill("Accueil");
 await page.locator("#taskForm button[type=submit]").click();
 assert.equal(await page.locator("#taskList .entry").count(),1);
 await page.locator("#taskList input[type=checkbox]").check();
 assert.match(await page.locator("#projectStats").innerText(),/100 %/);
 const projectDownload=page.waitForEvent("download");
 await page.locator('[data-export="projet"]').click();
 const projectFile=await projectDownload,projectTxt=await readFile(await projectFile.path(),"utf8");
 assert.match(projectTxt,/Portes ouvertes/);assert.match(projectTxt,/Réserver la salle/);
 await page.locator("#tab-reunion").click();
 assert.ok(await page.locator("#panel-reunion").isVisible());
 await page.locator("#meetingTitle").fill("Réunion association");
 await page.locator("#meetingDecisions").fill("Valider le budget");
 const minutesDownload=page.waitForEvent("download");
 await page.locator('[data-export="reunion"]').click();
 const minutes=await minutesDownload;assert.match(await readFile(await minutes.path(),"utf8"),/Valider le budget/);
 await page.locator("#tab-budget").click();
 await page.locator("#budgetItem").fill("=FORMULA(1)");
 await page.locator("#budgetPlanned").fill("120.50");
 await page.locator("#budgetActual").fill("140");
 await page.locator("#budgetForm button[type=submit]").click();
 assert.equal(await page.locator("#budgetList .entry").count(),1);
 assert.match(await page.locator("#budgetTotals").innerText(),/19,50/);
 const budgetDownload=page.waitForEvent("download");
 await page.locator('[data-export="budget"]').click();
 const budget=await budgetDownload, budgetCsv=await readFile(await budget.path(),"utf8");
 assert.match(budgetCsv,/'=FORMULA\(1\)/,"CSV formula neutralization");
 assert.match(budgetCsv,/120\.50/);
 await page.locator("#tab-brief").click();
 await page.locator("#briefProject").fill("Campagne rentrée");
 await page.locator("#briefProblem").fill("Clarifier les messages");
 const briefDownload=page.waitForEvent("download");
 await page.locator('[data-export="brief"]').click();
 const brief=await briefDownload;assert.match(await readFile(await brief.path(),"utf8"),/Clarifier les messages/);
 await page.locator("#tab-calendrier").click();
 await page.locator("#contentTitle").fill("Publication rentrée");
 await page.locator("#contentDate").fill("2026-11-01");
 await page.locator("#contentChannel").selectOption("LinkedIn");
 await page.locator("#contentForm button[type=submit]").click();
 assert.equal(await page.locator("#contentList .entry").count(),1);
 await page.getByRole("button",{name:"Marquer publié"}).click();
 assert.match(await page.locator("#contentStats").innerText(),/1 publiée/);
 const calendarDownload=page.waitForEvent("download");
 await page.locator('[data-export="calendrier"]').click();
 const calendar=await calendarDownload;
 assert.match(await readFile(await calendar.path(),"utf8"),/Publication rentrée/);
 await page.reload({waitUntil:"load"});
 assert.ok(await page.locator("#panel-calendrier").isVisible(),"deep link retains selected tool");
 assert.equal(await page.locator("#contentList .entry").count(),1,"calendar persisted");
 await page.locator("#tab-budget").click();
 assert.equal(await page.locator("#budgetList .entry").count(),1,"budget persisted");
 await page.locator("#tab-projet").click();
 assert.equal(await page.locator("#projectName").inputValue(),"Portes ouvertes","project metadata persisted");
 assert.match(await page.locator("#projectStats").innerText(),/100 %/);
 page.once("dialog",dialog=>dialog.accept());
 await page.locator('[data-clear="projet"]').click();
 assert.equal(await page.locator("#taskList .entry").count(),0,"confirmed deletion clears tasks");
 assert.equal(await page.locator("#projectName").inputValue(),"","confirmed deletion clears metadata");
 assert.deepEqual(errors,[],"client script errors");
 await page.close();
 for(const width of [320,375,768,1280]){
  const mobile=await browser.newPage({viewport:{width,height:812}});
  await mobile.goto(base+"/outils-pro.html#budget",{waitUntil:"load"});
  assert.ok(await mobile.locator("#panel-budget").isVisible(),"hash route "+width);
  const dims=await mobile.evaluate(()=>({width:document.documentElement.scrollWidth,viewport:innerWidth}));
  assert.ok(dims.width<=dims.viewport+2,"horizontal overflow "+width+" "+JSON.stringify(dims));
  if(width<=768){await mobile.locator(".kitora-mobile summary").click();assert.ok(await mobile.locator(".kitora-mobile-links").isVisible())}
  await mobile.close();
 }
 console.log("Kitora Pro 5 tools Chromium: forms, tasks, exports, CSV injection guard, saved drafts, clear and responsive PASS");
}finally{await browser.close();await new Promise(ok=>server.close(ok))}
