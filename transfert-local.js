(()=>{"use strict";
const modules=[
 ["projects","kitora_projects_v1","array"],["agenda","kitora_agenda_v1","array"],
 ["learn","kitora_learn_cards_v1","array"],["notes","kitora_notes_v1","array"],
 ["challenge","kitora_challenge_7_v1","array"],["focus","kitora_focus_completed_v1","number"]
];
const status=document.getElementById("syncLocalStatus");
const accepted=(type,v)=>type==="array"?Array.isArray(v):Number.isInteger(v)&&v>=0;
document.getElementById("syncLocalExport").addEventListener("click",()=>{
 const data={format:"kitora-workspace-backup",version:1,created_at:new Date().toISOString(),modules:{}};
 try{
  for(const[name,key,type]of modules){const raw=localStorage.getItem(key);if(raw===null)continue;const v=JSON.parse(raw);if(accepted(type,v))data.modules[name]=v}
  if(!Object.keys(data.modules).length){status.textContent="Aucune donnée locale valide à exporter.";return}
  const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json;charset=utf-8"});
  const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="kitora-sauvegarde-"+new Date().toISOString().slice(0,10)+".json";document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
  status.textContent="Sauvegarde locale téléchargée. Conserve ce fichier dans un endroit privé.";
 }catch(e){status.textContent="Export impossible : "+e.message}
});
document.getElementById("syncLocalImport").addEventListener("change",async e=>{
 const file=e.currentTarget.files?.[0];e.currentTarget.value="";if(!file)return;
 if(file.size>1200000){status.textContent="Fichier trop volumineux (maximum 1,2 Mo).";return}
 try{
  const parsed=JSON.parse(await file.text());
  if(parsed?.format!=="kitora-workspace-backup"||parsed.version!==1||!parsed.modules||typeof parsed.modules!=="object"||Array.isArray(parsed.modules))throw Error("Le fichier n'est pas une sauvegarde Kitora compatible.");
  const data=[];
  for(const[name,key,type]of modules){
   if(!Object.prototype.hasOwnProperty.call(parsed.modules,name))continue;
   const value=parsed.modules[name];if(!accepted(type,value))throw Error("Données invalides pour "+name+".");
   const serialized=JSON.stringify(value);if(serialized.length>400000)throw Error("Module trop volumineux : "+name+".");
   data.push([name,key,serialized]);
  }
  if(!data.length)throw Error("Le fichier ne contient aucun module reconnu.");
  if(!confirm("Restaurer "+data.length+" module(s) depuis ce fichier ? Les données actuelles de ces modules seront remplacées sur cet appareil."))return;
  const before=data.map(([name,key])=>[key,localStorage.getItem(key)]);
  try{for(const[,key,value]of data)localStorage.setItem(key,value)}
  catch(err){for(const[key,value]of before)try{if(value===null)localStorage.removeItem(key);else localStorage.setItem(key,value)}catch{}throw err}
  status.textContent=data.length+" module(s) restauré(s). Rouvre les outils pour consulter les données importées.";
 }catch(err){status.textContent="Import impossible : "+err.message}
});
})();