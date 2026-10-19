import {createClient} from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import {getKitoraSubscription} from "./billing-entitlements.js";
const db=createClient("https://yxjxizxzjubhjaxskksh.supabase.co","sb_publishable_K6y-xwSJdAKhAccH698lgw_cp79fnbW");
const maps={
 "projects.html":{key:"kitora_projects_v1",title:"Projets",fields:["name","goal","due","tasks"]},
 "notes.html":{key:"kitora_notes_v1",title:"Notes",fields:["title","content","updated"]},
 "agenda.html":{key:"kitora_agenda_v1",title:"Agenda",fields:["date","time","title","details"]},
 "learn.html":{key:"kitora_learn_cards_v1",title:"Révisions",fields:["subject","question","answer","known"]}
};
const current=location.pathname.split("/").pop(),config=maps[current];
function csvCell(value){let s=typeof value==="object"?JSON.stringify(value):String(value??"");if(/^\s*[=+@\-]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"'}
function data(){const value=JSON.parse(localStorage.getItem(config.key)||"[]");if(!Array.isArray(value))throw Error("Format local invalide");return value.filter(x=>x&&typeof x==="object").slice(0,1000)}
function makeCsv(items){const fields=config.fields;return "\uFEFF"+[fields.map(csvCell).join(";"),...items.map(item=>fields.map(field=>csvCell(item[field])).join(";"))].join("\r\n")}
function makeMd(items){return "# Kitora — "+config.title+"\n\nExport créé le "+new Date().toLocaleDateString("fr-FR")+"\n\n"+items.map((item,i)=>"## "+(i+1)+". "+String(item.name||item.title||item.question||item.date||"Élément").replace(/[\r\n#]/g," ")+"\n\n"+config.fields.map(key=>"**"+key+"** : "+(typeof item[key]==="object"?JSON.stringify(item[key],null,2):String(item[key]??""))).join("\n\n")).join("\n\n---\n\n")}
function download(content,extension,type){const blob=new Blob([content],{type}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="kitora-"+current.replace(".html","")+"-"+new Date().toISOString().slice(0,10)+"."+extension;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000)}
async function init(){
 if(!config)return;
 try{
  const {data:{user},error}=await db.auth.getUser();if(error||!user)return;
  const {subscription,error:subError}=await getKitoraSubscription(db,user.id);
  if(subError||subscription?.status!=="active"||!["solo","workspace","plus_monthly","plus_yearly","ultimate"].includes(subscription.plan))return;
  const panel=document.createElement("section");panel.className="section";panel.innerHTML='<div class="wrap"><div class="panel"><span class="kicker">KITORA / EXPORTS AVANCÉS</span><h2>Exporter mes données</h2><p>Disponible avec Solo, Workspace, Plus ou Ultimate. Les fichiers sont créés localement dans ton navigateur.</p><div class="actions"><button class="btn" type="button" data-export="csv">Exporter CSV</button><button class="btn secondary" type="button" data-export="md">Exporter Markdown</button></div><p role="status" class="fine"></p></div></div>';
  const status=panel.querySelector('[role="status"]');
  panel.querySelectorAll("[data-export]").forEach(button=>button.addEventListener("click",()=>{try{const items=data();if(!items.length)throw Error("Aucune donnée à exporter.");const csv=button.dataset.export==="csv";download(csv?makeCsv(items):makeMd(items),csv?"csv":"md",csv?"text/csv;charset=utf-8":"text/markdown;charset=utf-8");status.textContent=items.length+" éléments exportés."}catch(e){status.textContent=e.message||"Export impossible."}}));
  document.querySelector("main")?.append(panel);
 }catch(e){console.warn("Exports avancés indisponibles",e)}
}
init();