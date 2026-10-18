import {readFileSync,existsSync} from "node:fs";
const pages=["index.html","boutique.html","boutique-gratuit.html","boutique-plus.html","compte.html","admin.html","admin-products.html","admin-orders.html","admin-requests.html","admin-insights.html","aide.html","a-propos.html","atelier.html","methodes.html","defi-7-jours.html","comparateur.html","plus-lab.html","focus.html","dashboard.html","projects.html","learn.html","agenda.html","templates.html","notes.html","offres.html","synchronisation.html","trouver-mon-outil.html","parcours.html","collection.html","etude-clients.html","decouvrir.html","cas-utilisation.html","test-audience.html","essayer-un-kit.html"];
const scripts=["atelier.js","comparateur.js","defi-7-jours.js","plus-lab.js","focus.js","dashboard.js","projects.js","learn.js","agenda.js","templates.js","notes.js","transfert-local.js","trouver-mon-outil.js","collection-outils.js","etude-clients.js","synchronisation.js","admin-dashboard-page.js","admin-section-page.js","admin-insights-page.js","decouvrir.js","test-audience.js","essayer-un-kit.js"];
let tests=0;
for(const path of [...pages,...scripts]){
 if(!existsSync(path))throw Error("Fichier absent : "+path);
 const text=readFileSync(path,"utf8");
 if(path.endsWith(".html")){
  for(const tag of ["main","section","article","div","footer"]){
   const opens=text.split("<"+tag).length-1,closes=text.split("</"+tag+">").length-1;
   if(opens!==closes)throw Error(path+" : balises "+tag+" déséquilibrées");
  }
  for(const x of text.matchAll(/(?:href|src)="([^"]+)"/g)){
   const link=x[1].split(/[?#]/)[0];
   if(link.startsWith("http")||!link||link.startsWith("#"))continue;
   if(/\.(html|js|css)$/.test(link)&&!existsSync(link))throw Error(path+" : lien manquant "+link);
  }
 }else new Function(text.replace(/^import[^\n]*\n/gm,""));
 tests++;
}
console.log("Kitora : "+tests+" fichiers vérifiés.");
