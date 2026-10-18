/* Kitora cinema V2 — lightweight scroll storytelling, progressive enhancement */
(()=>{
"use strict";
const stage=document.querySelector("[data-k-cinema-stage]");
const chapters=[...document.querySelectorAll("[data-k-scene]")].filter(x=>x.classList.contains("k-cinema-chapter"));
if(!stage||chapters.length!==3)return;
const reduced=window.matchMedia("(prefers-reduced-motion: reduce)");
const fields={
 eyebrow:document.getElementById("k-cinema-mockeyebrow"),
 title:document.getElementById("k-cinema-mocktitle"),
 metric:document.getElementById("k-cinema-metric"),
 note:document.getElementById("k-cinema-metric-note"),
 tile1:document.getElementById("k-cinema-tile1"),
 tile1Note:document.getElementById("k-cinema-tile1-note"),
 tile2:document.getElementById("k-cinema-tile2"),
 tile2Note:document.getElementById("k-cinema-tile2-note"),
 foot:document.getElementById("k-cinema-footlabel"),
 meter:document.getElementById("k-cinema-meter"),
 progress:document.getElementById("k-cinema-progress")
};
const scenes={
 organiser:{eyebrow:"PROJETS / MA SEMAINE",title:"Chaque étape compte.",metric:"75",note:"Trois priorités sur quatre",tile1:"Organiser",tile1Note:"Une étape à la fois",tile2:"Avancer",tile2Note:"Sans se disperser",foot:"Un aperçu de ce que tu peux créer.",value:75},
 apprendre:{eyebrow:"LEARN / RÉVISIONS",title:"Une notion après l'autre.",metric:"60",note:"Trois fiches sur cinq",tile1:"Réviser",tile1Note:"Des notions claires",tile2:"Comprendre",tile2Note:"Tester ses acquis",foot:"Un exemple fictif de session Learn.",value:60},
 creer:{eyebrow:"ATELIER / TON IDÉE",title:"Le premier pas prend forme.",metric:"90",note:"Ton premier plan avance",tile1:"Imaginer",tile1Note:"Une intention claire",tile2:"Construire",tile2Note:"Des actions concrètes",foot:"Une démonstration, pas une création IA.",value:90}
};
let active="organiser",frame=0;
function select(key){
 const item=scenes[key];if(!item||key===active)return;
 active=key;stage.dataset.scene=key;
 fields.eyebrow.textContent=item.eyebrow;
 fields.title.textContent=item.title;
 fields.metric.textContent=item.metric;
 const suffix=document.createElement("span");suffix.textContent="%";fields.metric.append(suffix);
 fields.note.textContent=item.note;
 fields.tile1.textContent=item.tile1;
 fields.tile1Note.textContent=item.tile1Note;
 fields.tile2.textContent=item.tile2;
 fields.tile2Note.textContent=item.tile2Note;
 fields.foot.textContent=item.foot;
 fields.meter.style.width=item.value+"%";
 const index=chapters.findIndex(x=>x.dataset.kScene===key);
 fields.progress.style.width=((index+1)/chapters.length*100)+"%";
 stage.querySelector(".k-cinema-progress")?.setAttribute("aria-label","Étape de la présentation : "+(index+1)+" sur "+chapters.length);
 chapters.forEach(chapter=>chapter.classList.toggle("k-cinema-chapter-active",chapter.dataset.kScene===key));
}
function update(){
 frame=0;
 if(reduced.matches)return;
 const center=window.innerHeight*.52;
 const selected=chapters.reduce((best,node)=>{
  const rect=node.getBoundingClientRect();
  const distance=Math.abs((rect.top+rect.bottom)/2-center);
  return distance<best.distance?{node,distance}:best;
 },{node:chapters[0],distance:Infinity}).node;
 select(selected.dataset.kScene);
 if(window.matchMedia("(min-width: 901px)").matches){
  const rect=stage.getBoundingClientRect(),fraction=Math.max(-1,Math.min(1,(rect.top+rect.height/2-center)/center));
  stage.style.setProperty("--k-scene-rotate",(-6+fraction*2).toFixed(2)+"deg");
  stage.style.setProperty("--k-scene-y",(fraction*8).toFixed(1)+"px");
  stage.style.setProperty("--k-float-a",(fraction*-13).toFixed(1)+"px");
  stage.style.setProperty("--k-float-b",(fraction*13).toFixed(1)+"px");
 }
}
function queue(){if(!frame)frame=requestAnimationFrame(update)}
function enable(){if(reduced.matches){stage.style.removeProperty("--k-scene-rotate");stage.style.removeProperty("--k-scene-y");return}queue()}
window.addEventListener("scroll",queue,{passive:true});
window.addEventListener("resize",queue,{passive:true});
reduced.addEventListener?.("change",enable);
const observer="IntersectionObserver" in window?new IntersectionObserver(queue,{rootMargin:"0px"}):null;
if(observer)chapters.forEach(node=>observer.observe(node));
queue();
})();