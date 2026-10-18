/* Kitora Experience 2.0 / protected dashboard only */
(()=>{
"use strict";
const label=document.getElementById("dashPlanLabel");
if(!label)return;
try{
 const selected=localStorage.getItem("kitora_preferred_workspace_view");
 if(selected==="focus")label.textContent="Ton espace de concentration";
}catch{}
const reduced=window.matchMedia("(prefers-reduced-motion: reduce)");
if(reduced.matches)return;
const hero=document.querySelector(".dash-hero");
if(!hero)return;
let frame=0;
function paint(){
 frame=0;
 if(document.visibilityState==="hidden")return;
 const value=Math.min(1,window.scrollY/720);
 hero.style.setProperty("--dash-scroll",value.toFixed(3));
}
function queue(){if(!frame)frame=requestAnimationFrame(paint)}
window.addEventListener("scroll",queue,{passive:true});
window.addEventListener("resize",queue,{passive:true});
paint();
})();