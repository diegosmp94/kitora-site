(()=>{"use strict";
const KEY="kitora_focus_completed_v1",clock=document.getElementById("focusClock"),status=document.getElementById("focusStatus"),start=document.getElementById("focusStart");
let minutes=25,remaining=minutes*60,deadline=0,timer=null,paused=false,mode="focus";
let completed=0;try{const x=Number(localStorage.getItem(KEY));if(Number.isInteger(x)&&x>=0&&x<100000)completed=x}catch{}
document.getElementById("focusTotal").textContent=String(completed);
function render(){const n=Math.max(0,Math.ceil(remaining));clock.textContent=String(Math.floor(n/60)).padStart(2,"0")+":"+String(n%60).padStart(2,"0");document.title=clock.textContent+" · Kitora Focus";start.textContent=timer?"Pause":paused?"Reprendre":"Démarrer";document.getElementById("focusModeLabel").textContent=mode==="break"?"MODE / PAUSE":"MODE / CONCENTRATION"}
function stop(){if(timer!==null){clearInterval(timer);timer=null}}
function tick(){remaining=Math.max(0,(deadline-Date.now())/1000);render();if(remaining<=0){stop();paused=false;if(mode==="focus"){completed++;document.getElementById("focusTotal").textContent=String(completed);try{localStorage.setItem(KEY,String(completed))}catch{}status.textContent="Séance terminée ! Tu peux prendre une pause."}else status.textContent="Pause terminée. Reprends uniquement quand tu en as envie.";render()}}
function begin(){if(remaining<=0)remaining=(mode==="break"?5:minutes)*60;deadline=Date.now()+remaining*1000;timer=setInterval(tick,250);paused=false;status.textContent=mode==="break"?"Ta pause est en cours.":"Séance en cours. Reste sur une tâche à la fois.";render()}
start.addEventListener("click",()=>{if(timer!==null){remaining=Math.max(0,(deadline-Date.now())/1000);stop();paused=true;status.textContent="Minuteur en pause.";render()}else begin()});
document.getElementById("focusReset").addEventListener("click",()=>{stop();paused=false;remaining=(mode==="break"?5:minutes)*60;status.textContent="Minuteur réinitialisé.";render()});
document.getElementById("focusBreak").addEventListener("click",()=>{stop();mode=mode==="break"?"focus":"break";paused=false;remaining=(mode==="break"?5:minutes)*60;document.getElementById("focusBreak").textContent=mode==="break"?"Retour concentration":"Pause 5 min";status.textContent=mode==="break"?"Prends le temps de souffler.":"Prêt pour une séance de concentration ?";render()});
document.querySelectorAll("[data-focus-minutes]").forEach(button=>button.addEventListener("click",()=>{stop();mode="focus";paused=false;minutes=Number(button.dataset.focusMinutes);remaining=minutes*60;document.getElementById("focusBreak").textContent="Pause 5 min";document.querySelectorAll("[data-focus-minutes]").forEach(b=>b.setAttribute("aria-pressed",String(b===button)));status.textContent="Durée modifiée, prêt à démarrer.";render()}));
document.addEventListener("visibilitychange",()=>{if(timer!==null)tick()});
render();
})();