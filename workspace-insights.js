import {createClient} from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
const db=createClient("https://yxjxizxzjubhjaxskksh.supabase.co","sb_publishable_K6y-xwSJdAKhAccH698lgw_cp79fnbW");
function read(key){try{const data=JSON.parse(localStorage.getItem(key)||"[]");return Array.isArray(data)?data:[]}catch{return []}}
function metric(label,value){const item=document.createElement("div");item.className="workspace-stat";const strong=document.createElement("strong");strong.textContent=String(value);const span=document.createElement("span");span.textContent=label;item.append(strong,span);return item}
async function init(){
 try{
 const {data:{user},error}=await db.auth.getUser();if(error||!user)return;
 const {data:sub,error:err}=await db.from("subscriptions").select("plan,status").eq("user_id",user.id).maybeSingle();
 if(err||sub?.status!=="active"||!["workspace","ultimate"].includes(sub.plan))return;
 const section=document.createElement("section");section.className="section";const wrap=document.createElement("div");wrap.className="wrap";
 const title=document.createElement("h2");title.textContent="Pilotage avancé Workspace";
 const help=document.createElement("p");help.textContent="Indicateurs calculés à partir des données de cet appareil. Ils ne représentent pas une analyse cloud.";
 const grid=document.createElement("div");grid.style.cssText="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px";
 const projects=read("kitora_projects_v1"),tasks=projects.flatMap(p=>Array.isArray(p.tasks)?p.tasks:[]);
 const learn=read("kitora_learn_cards_v1"),agenda=read("kitora_agenda_v1"),notes=read("kitora_notes_v1");
 const total=tasks.length,done=tasks.filter(x=>x.done).length;
 for(const[label,value]of [["Projets",projects.length],["Tâches terminées",done+" / "+total],["Avancement des tâches",total?Math.round(done/total*100)+" %":"—"],["Fiches de révision",learn.length],["Événements Agenda",agenda.length],["Notes",notes.length]])grid.append(metric(label,value));
 wrap.append(title,help,grid);section.append(wrap);document.querySelector("main")?.append(section);
 }catch(e){console.warn("Workspace insights unavailable",e)}
}
init();