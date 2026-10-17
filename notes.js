(()=>{"use strict";
const KEY="kitora_notes_v1",$=id=>document.getElementById(id);
const list=$("notesList"),count=$("notesCount"),status=$("notesStatus"),title=$("notesTitle"),content=$("notesContent");
let notes=[],current=null;
try{const v=JSON.parse(localStorage.getItem(KEY)||"[]");if(Array.isArray(v))notes=v.filter(x=>x&&typeof x.id==="string"&&typeof x.title==="string"&&typeof x.content==="string").slice(0,100)}catch{}
const freshId=()=>Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,10);
function persist(){try{localStorage.setItem(KEY,JSON.stringify(notes));return true}catch{status.textContent="Sauvegarde impossible : stockage local indisponible ou plein. Exporte ta note.";return false}}
function render(){const term=$("notesSearch").value.trim().toLocaleLowerCase("fr");const matching=notes.filter(n=>(n.title+" "+n.content).toLocaleLowerCase("fr").includes(term)).sort((a,b)=>b.updated-a.updated);list.replaceChildren();count.textContent=notes.length+" note"+(notes.length===1?"":"s")+" enregistrée"+(notes.length===1?"":"s")+".";
 for(const note of matching){const b=document.createElement("button");b.type="button";b.className="notes-item";b.setAttribute("aria-current",String(note.id===current));const strong=document.createElement("strong");strong.textContent=note.title||"Sans titre";const sub=document.createElement("small");sub.textContent=new Date(note.updated||Date.now()).toLocaleDateString("fr-FR")+" · "+note.content.slice(0,74);b.append(strong,sub);b.addEventListener("click",()=>select(note.id));list.append(b)}
 if(!matching.length){const p=document.createElement("p");p.className="note-hint";p.textContent=term?"Aucune note ne correspond à cette recherche.":"Aucune note enregistrée pour le moment.";list.append(p)}
 $("notesDelete").disabled=$("notesExport").disabled=!current;
}
function select(id){const note=notes.find(n=>n.id===id);if(!note)return;current=id;title.value=note.title;content.value=note.content;status.textContent="Note ouverte. Pense à enregistrer tes modifications.";render()}
function blank(){current=null;title.value="";content.value="";status.textContent="Nouvelle note prête.";render();title.focus()}
$("notesNew").addEventListener("click",blank);
$("notesSearch").addEventListener("input",render);
$("notesForm").addEventListener("submit",e=>{e.preventDefault();if(!$("notesForm").reportValidity())return;const t=title.value.trim(),c=content.value.trim();if(!t||!c){status.textContent="Complète le titre et le contenu.";return}const previous=notes.slice(),next={id:current||freshId(),title:t.slice(0,100),content:c.slice(0,12000),updated:Date.now()};notes=notes.filter(n=>n.id!==next.id);notes.unshift(next);notes=notes.slice(0,100);if(!persist()){notes=previous;return}current=next.id;status.textContent="Note enregistrée sur cet appareil.";render()});
$("notesDelete").addEventListener("click",()=>{if(!current||!confirm("Supprimer définitivement cette note de cet appareil ?"))return;const previous=notes.slice();notes=notes.filter(n=>n.id!==current);if(!persist()){notes=previous;return}blank();status.textContent="Note supprimée."});
$("notesExport").addEventListener("click",()=>{const note=notes.find(n=>n.id===current);if(!note)return;const blob=new Blob(["\uFEFF",note.title+"\n\n"+note.content],{type:"text/plain;charset=utf-8"});const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="kitora-note-"+note.id.replace(/[^a-z0-9-]/gi,"").slice(0,24)+".txt";document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);status.textContent="Export de la note lancé."});
render();
})();