(()=>{"use strict";
const current=location.pathname.split("/").pop()||"admin.html";
const links=[...document.querySelectorAll(".ka-sidebar a[href]")];
for(const a of links){
 const target=a.getAttribute("href")?.split("#")[0].split("?")[0];
 if(target===current)a.setAttribute("aria-current","page");
 else a.removeAttribute("aria-current");
}
const search=document.querySelector(".ka-sidebar .ka-nav-filter");
if(!search)return;
const status=document.querySelector(".ka-sidebar-empty");
const filter=()=>{
 const q=search.value.trim().toLocaleLowerCase("fr");
 let count=0;
 for(const a of links){
  const match=(!q||a.textContent.toLocaleLowerCase("fr").includes(q));
  a.classList.toggle("ka-hidden-nav-item",!match);
  if(match)count++;
 }
 for(const label of document.querySelectorAll(".ka-sidebar .ka-side-group")){
  const next=[];for(let el=label.nextElementSibling;el&&!el.classList.contains("ka-side-group")&&!el.classList.contains("ka-sidebar-foot");el=el.nextElementSibling)if(el.tagName==="A")next.push(el);
  label.hidden=next.length>0&&!next.some(el=>!el.classList.contains("ka-hidden-nav-item"));
 }
 if(status){status.hidden=count!==0;status.textContent=count===0?"Aucune rubrique correspondante.":""}
};
search.addEventListener("input",filter);
search.addEventListener("keydown",event=>{
 if(event.key==="Escape"){search.value="";filter();search.blur()}
 if(event.key==="Enter"){const first=links.find(a=>!a.classList.contains("ka-hidden-nav-item"));if(first){event.preventDefault();first.click()}}
});
document.addEventListener("keydown",event=>{
 if(event.defaultPrevented||event.altKey||event.shiftKey||event.metaKey)return;
 const target=event.target;
 if(target instanceof HTMLElement&&(target.closest("input,textarea,select,[contenteditable='true']")||target.isContentEditable))return;
 if((event.key==="/"||event.key==="k"&&event.ctrlKey)&&search.offsetParent!==null){event.preventDefault();search.focus();search.select()}
});
})();