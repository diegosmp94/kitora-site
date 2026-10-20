import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { chromium } from "playwright";
const port=Number(process.env.PORT||8765);
const server=spawn("python3",["-m","http.server",String(port),"--bind","127.0.0.1"],{stdio:"ignore"});
const origin="http://127.0.0.1:"+port;
const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function ready(){for(let i=0;i<40;i++){try{const r=await fetch(origin+"/kitora3-studio.html");if(r.ok)return}catch{}await wait(250)}throw Error("Preview server unavailable")}
let browser;
try{
 await ready();browser=await chromium.launch({headless:true});
 const page=await browser.newPage();
 const errors=[];page.on("pageerror",e=>errors.push(e.message));
 await page.goto(origin+"/kitora3-studio.html",{waitUntil:"domcontentloaded"});
 for(const id of ["app","new","newBrief","newPlan","importAI","exportMarkdown","save","remove"])assert.equal(await page.locator("#"+id).count(),1,"Missing "+id);
 assert.equal(await page.locator("#app").isHidden(),true,"Unauthenticated Studio must be hidden");
 await page.goto(origin+"/admin.html",{waitUntil:"domcontentloaded"});
 assert.equal(await page.locator("#adminPages").isHidden(),true,"Unauthenticated admin navigation must be hidden");
 await page.goto(origin+"/admin-users.html",{waitUntil:"domcontentloaded"});
 assert.equal(await page.locator("#adminProtected").isHidden(),true,"Unauthenticated user administration must be hidden");
 await page.goto(origin+"/admin-health.html",{waitUntil:"domcontentloaded"});
 assert.equal(await page.locator("#healthProtected").isHidden(),true,"Unauthenticated health metrics must be hidden");
 assert.equal(errors.length,0,"Browser errors: "+errors.join("; "));
 console.log("P2 Chromium guest UI E2E passed: Studio, admin, users, health.");
 console.log("Authenticated Supabase, AI and admin E2E require dedicated test accounts and test backend; not covered.");
}finally{await browser?.close();server.kill("SIGTERM")}
