import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const files=["projects.html","learn.html","agenda.html","notes.html","offres.html","compte.html"];
const home=readFileSync("index.html","utf8");
assert.match(home,/id="notre-exigence"/);
assert.match(home,/premium-home\.css/);
assert.match(home,/Les fonctions payantes restent|Formules payantes en mode test/);
assert.doesNotMatch(home,/(plus de [0-9]+ clients|avis vérifiés|élu meilleur)/i);
for(const path of files){
 const html=readFileSync(path,"utf8");
 assert.match(html,/<body class="kitora-premium"(?:\s+[^>]*)?>/,path+" premium body missing");
 if(path==="compte.html")assert.match(html,/<body class="kitora-premium" data-kitora-auth-state="pending">/, "Account page must fail closed before session lookup");
 assert.match(html,/premium-product\.css\?v=20261018-premium1/,path+" design CSS missing");
 assert.match(html,/class="kp-context"/,path+" helper missing");
 assert.match(html,/Stripe|TEST/,path+" test mode copy missing");
 assert.ok(!/sk_live_|pk_live_/.test(html),path+" contains a live Stripe credential");
}
for(const file of ["projects.html","learn.html","agenda.html","notes.html"]){
 const s=readFileSync(file,"utf8");
 assert.match(s,/tool-access\.js/,file+" must keep auth gate");
 assert.match(s,/data-kitora-protected-src=/,file+" must keep protected JS");
}
const css=readFileSync("premium-product.css","utf8");
assert.match(css,/body\.kitora-premium/);
assert.match(css,/prefers-reduced-motion/);
console.log("Premium continuity checks passed: six pages, product entitlements and honest offer copy.");
