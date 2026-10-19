import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
import{spawnSync}from"node:child_process";
const read=p=>readFileSync(p,"utf8");
for(const p of ["securite-compte.html","securite-compte.js","securite-compte.css"])assert.ok(existsSync(p),"missing "+p);
const html=read("securite-compte.html"),code=read("securite-compte.js");
for(const id of ["securityStatus","signedOut","securityControls","aalState","factorState","beginEnrollment","enrollmentSecret","enrollCode","enrollForm","challengePanel","challengeForm","challengeCode","refreshSecurity"])assert.ok(html.includes('id="'+id+'"'),"missing "+id);
for(const term of ["getAuthenticatorAssuranceLevel","listFactors","challengeAndVerify","factorType:\"totp\"","client.auth.getUser","session"]){assert.ok(code.includes(term),"missing "+term)}
assert.ok(!code.includes("localStorage.setItem")&&!code.includes("sessionStorage.setItem"),"TOTP secret must not be saved locally");
assert.ok(!code.includes("console.log")&&!code.includes("innerHTML"),"do not log secret or inject HTML");
assert.ok(!html.includes('type="hidden" name="secret"'));
assert.ok(html.includes("opt")&&html.includes("serveur"),"MFA not required prematurely");
assert.ok(read("compte.html").includes('href="securite-compte.html"'));
assert.ok(read("admin.html").includes('href="securite-compte.html"'));
const result=spawnSync(process.execPath,["--check","securite-compte.js"],{encoding:"utf8"});
assert.equal(result.status,0,result.stderr);
const anon=read("tests/anonymous-database-access.mjs");
for(const table of ["kitora_org_profiles","kitora_invoice_drafts","kitora_live_subscriptions","kitora_admins","kitora_user_documents"])assert.ok(anon.includes(table),"anonymous test must cover "+table);
console.log("MFA and privacy checks pass: optional TOTP and no local storage of authentication secrets.");
