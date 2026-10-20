import{createClient}from"https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.57.0/+esm";
const db=createClient("https://yxjxizxzjubhjaxskksh.supabase.co","sb_publishable_K6y-xwSJdAKhAccH698lgw_cp79fnbW");
const $=id=>document.getElementById(id);let user=null,docs=[],selected=null,dirty=false,busy=false;
const editable=["title","content","save","fav","duplicate","export","exportMarkdown","remove"];
const message=t=>{$("saveMessage").textContent=t};const status=t=>{$("status").textContent=t};
function escapePlain(s){return String(s??"")}
function count(){const total=docs.length,fav=docs.filter(d=>d.is_favorite).length,recent=docs.filter(d=>Date.now()-new Date(d.updated_at).getTime()<604800000).length;$("allCount").textContent=total;$("favCount").textContent=fav;$("recentCount").textContent=recent}
function words(){const n=$("content").value.trim().split(/\s+/).filter(Boolean).length;$("wordCount").textContent=n+" mot"+(n>1?"s":"")}
function controls(enable){for(const id of editable)$(id).disabled=!enable}
function render(){count();const q=$("search").value.trim().toLocaleLowerCase(),onlyFav=$("filter").value==="fav";let match=docs.filter(d=>(!onlyFav||d.is_favorite)&&(!q||((d.title||"")+" "+(d.content||"")).toLocaleLowerCase().includes(q)));const list=$("list");list.replaceChildren();if(!match.length){const p=document.createElement("p");p.className="hint";p.textContent=docs.length?"Aucun document ne correspond aux filtres.":"Aucun document pour le moment. Crée ton premier document !";list.append(p)}for(const d of match){const b=document.createElement("button");b.type="button";b.className="doc"+(selected?.id===d.id?" active":"");const name=document.createElement("strong"),meta=document.createElement("small");name.textContent=(d.is_favorite?"★ ":"")+d.title;meta.textContent=new Date(d.updated_at).toLocaleDateString("fr-FR");b.append(name,meta);b.addEventListener("click",()=>open(d));list.append(b)}}
function open(doc){if(dirty&&!confirm("Tu as des modifications non sauvegardées. Les abandonner ?"))return;selected=doc;dirty=false;$("title").value=doc?.title||"";$("content").value=doc?.content||"";controls(!!doc);$("fav").textContent=doc?.is_favorite?"★ Retirer des favoris":"☆ Favori";words();message(doc?"Document prêt.":"Crée ou sélectionne un document.");render()}
async function refresh(){const{data,error}=await db.from("kitora_user_documents").select("id,user_id,title,content,is_favorite,created_at,updated_at").eq("user_id",user.id).order("updated_at",{ascending:false}).limit(200);if(error)throw error;docs=data||[];selected=selected?docs.find(d=>d.id===selected.id)||null:null;render()}
async function action(run){if(busy)return;busy=true;try{await run()}catch(e){message("Erreur : "+(e.message||"opération impossible"))}finally{busy=false}}
async function start(){const{data:{user:u},error}=await db.auth.getUser();if(error||!u){status("Connecte-toi depuis l'accueil pour accéder à ton atelier. ");const a=document.createElement("a");a.href="index.html#connexion";a.textContent="Se connecter →";$("status").append(a);return}user=u;$("app").hidden=false;status("Connecté : "+(u.email||"ton compte"));try{await refresh();message("Sélectionne un document ou crée ton premier document.")}catch(e){status("La bibliothèque est indisponible : "+e.message)}}

function formatSavedAi(result){
 const lines=[];if(!result||typeof result!=="object")return "";
 if(typeof result.summary==="string")lines.push(result.summary);
 for(const section of Array.isArray(result.sections)?result.sections:[]){
  if(section.heading)lines.push("\n## "+section.heading);
  if(section.analysis)lines.push(String(section.analysis));
  for(const task of Array.isArray(section.actions)?section.actions:[])lines.push("• "+task);
 }
 for(const week of Array.isArray(result.weekly_plan)?result.weekly_plan:[]){
  lines.push("\nÉtape "+week.week+" : "+(week.objective||""));
  for(const task of Array.isArray(week.tasks)?week.tasks:[])lines.push("• "+task);
 }
 if(Array.isArray(result.questions)&&result.questions.length)lines.push("\nQuestions :\n"+result.questions.join("\n"));
 if(Array.isArray(result.success_metrics)&&result.success_metrics.length)lines.push("\nIndicateurs :\n"+result.success_metrics.join("\n"));
 return lines.join("\n").trim().slice(0,100000);
}
$("closeImport").addEventListener("click",()=>$("importDialog").close());
$("importAI").addEventListener("click",async()=>{
 if(!user){message("Connecte-toi pour accéder à tes résultats IA.");return}
 const dlg=$("importDialog"),list=$("importList");list.textContent="Recherche de tes créations IA enregistrées…";dlg.showModal();
 try{
  const {data,error}=await db.from("subscriber_requests").select("id,title,ai_result,created_at").eq("user_id",user.id).not("ai_result","is",null).order("created_at",{ascending:false}).limit(40);
  if(error)throw error;list.replaceChildren();
  if(!data?.length){list.textContent="Aucune création IA enregistrée sur ton compte pour le moment.";return}
  for(const request of data){
   const resultText=formatSavedAi(request.ai_result);if(!resultText)continue;
   const b=document.createElement("button");b.type="button";b.className="doc";
   const title=document.createElement("strong"),meta=document.createElement("small");
   title.textContent=request.title;meta.textContent=new Date(request.created_at).toLocaleDateString("fr-FR")+" · Importer une copie éditable";
   b.append(title,meta);
   b.addEventListener("click",()=>action(async()=>{
    if(dirty&&!confirm("Abandonner tes modifications non sauvegardées ?"))return;
    const {data:doc,error:saveError}=await db.from("kitora_user_documents").insert({user_id:user.id,title:("IA · "+request.title).slice(0,180),content:resultText,source_request_id:request.id}).select("id,user_id,title,content,is_favorite,created_at,updated_at").single();
    if(saveError)throw saveError;docs.unshift(doc);dirty=false;open(doc);dlg.close();message("Création IA importée et sauvegardée : tu peux maintenant la modifier.");
   }));
   list.append(b);
  }
  if(!list.childElementCount)list.textContent="Aucune création IA exploitable.";
 }catch(err){list.textContent="Chargement indisponible : "+(err.message||"réessaie plus tard")}
});

$("new").addEventListener("click",()=>action(async()=>{if(dirty&&!confirm("Abandonner tes modifications non sauvegardées ?"))return;const{data,error}=await db.from("kitora_user_documents").insert({user_id:user.id,title:"Sans titre",content:""}).select("id,user_id,title,content,is_favorite,created_at,updated_at").single();if(error)throw error;docs.unshift(data);dirty=false;open(data);message("Document créé. Tu peux commencer à écrire.")}));
$("form").addEventListener("submit",e=>{e.preventDefault();action(async()=>{if(!selected)return;const title=$("title").value.trim();if(!title)throw Error("Ajoute un titre.");const{data,error}=await db.from("kitora_user_documents").update({title,content:$("content").value,updated_at:new Date().toISOString()}).eq("id",selected.id).eq("user_id",user.id).select("id,user_id,title,content,is_favorite,created_at,updated_at").single();if(error)throw error;selected=data;dirty=false;await refresh();message("Document sauvegardé dans ton compte.");render()})});
for(const id of ["title","content"])$(id).addEventListener("input",()=>{dirty=true;words();message("Modifications non sauvegardées.")});
$("fav").addEventListener("click",()=>action(async()=>{if(!selected)return;const{error}=await db.from("kitora_user_documents").update({is_favorite:!selected.is_favorite,updated_at:new Date().toISOString()}).eq("id",selected.id).eq("user_id",user.id);if(error)throw error;selected.is_favorite=!selected.is_favorite;await refresh();$("fav").textContent=selected.is_favorite?"★ Retirer des favoris":"☆ Favori";render();message(dirty?"Favori mis à jour. N’oublie pas de sauvegarder tes modifications.":"Favori mis à jour.")}));
$("duplicate").addEventListener("click",()=>action(async()=>{if(!selected)return;if(dirty){message("Sauvegarde tes changements avant de dupliquer.");return}const{data,error}=await db.from("kitora_user_documents").insert({user_id:user.id,title:(selected.title+" (copie)").slice(0,180),content:selected.content}).select("id,user_id,title,content,is_favorite,created_at,updated_at").single();if(error)throw error;docs.unshift(data);open(data);message("Copie enregistrée.")}));
$("export").addEventListener("click",()=>{if(!selected)return;const blob=new Blob([$("title").value+"\n\n"+$("content").value],{type:"text/plain;charset=utf-8"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=($("title").value||"kitora-document").replace(/[^\w\-À-ÿ ]/g,"").slice(0,60)+".txt";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)});
$("exportMarkdown").addEventListener("click",()=>{if(!selected)return;const title=$("title").value.trim()||"Document Kitora";const content=$("content").value;const markdown="# "+title.replace(/\r?\n/g," ")+"\n\n"+content+"\n";const blob=new Blob([markdown],{type:"text/markdown;charset=utf-8"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=title.replace(/[^\w\-À-ÿ ]/g,"").trim().slice(0,60)||"kitora-document";a.download+=".md";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);message(dirty?"Markdown exporté avec tes modifications locales non sauvegardées.":"Markdown exporté.");});
$("remove").addEventListener("click",()=>action(async()=>{if(!selected||!confirm("Supprimer définitivement ce document ?"))return;const{error}=await db.from("kitora_user_documents").delete().eq("id",selected.id).eq("user_id",user.id);if(error)throw error;selected=null;dirty=false;await refresh();open(null);message("Document supprimé.")}));
$("search").addEventListener("input",render);$("filter").addEventListener("change",render);
window.addEventListener("beforeunload",e=>{if(dirty){e.preventDefault();e.returnValue=""}});start();
