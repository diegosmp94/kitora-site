/* Kitora home V1.0 — progressive, reduced-motion and keyboard friendly */
(()=>{
  "use strict";
  const root=document.documentElement;
  const reduced=window.matchMedia("(prefers-reduced-motion: reduce)");
  const preview=document.querySelector(".k-hero-stage .preview");
  const tabs=[...document.querySelectorAll("[data-k-preview]")];
  const recommendations={
    organiser:{title:"Mon plan de la semaine",tag:"En cours",tasks:[["Définir 3 priorités","Clarté avant quantité"],["Découper le projet","Une petite étape à la fois"],["Faire le point vendredi","Garder ce qui fonctionne"]],note:"Commence petit. Termine quelque chose."},
    apprendre:{title:"Mon parcours de révision",tag:"À explorer",tasks:[["Choisir les notions","Cibler l'essentiel"],["Préparer une session","15 à 30 minutes pour commencer"],["Vérifier les acquis","Relire et corriger"]],note:"Un petit progrès vaut mieux qu'un plan oublié."},
    creer:{title:"Mon projet créatif",tag:"À construire",tasks:[["Décrire l'idée","Une phrase claire"],["Créer un premier brouillon","Tester sans perfectionnisme"],["Partager et améliorer","Recueillir un retour"]],note:"Teste une première version avant d'ajouter des détails."}
  };
  const title=document.getElementById("k-preview-title");
  const tag=document.getElementById("k-preview-tag");
  const note=document.getElementById("k-preview-note");
  const rows=[...document.querySelectorAll(".k-hero-stage .preview .task")];
  function changePreview(key){
    const data=recommendations[key];
    if(!data||!title||!tag||!note)return;
    title.textContent=data.title;tag.textContent=data.tag;note.textContent=data.note;
    rows.forEach((row,i)=>{
      const strong=row.querySelector("strong"),small=row.querySelector("small");
      if(strong&&small&&data.tasks[i]){strong.textContent=data.tasks[i][0];small.textContent=data.tasks[i][1];}
    });
    tabs.forEach(button=>button.setAttribute("aria-pressed",String(button.dataset.kPreview===key)));
  }
  tabs.forEach(button=>button.addEventListener("click",()=>changePreview(button.dataset.kPreview)));
  const choices=[...document.querySelectorAll("[data-k-need]")];
  const message=document.getElementById("k-recommend-text");
  const link=document.getElementById("k-recommend-link");
  const choiceMap={
    apprendre:{text:"Pour étudier et mémoriser, commence par Learn et les kits de révision. Tu peux découvrir les outils gratuits avec un compte Kitora Free.",url:"learn.html",label:"Explorer Learn"},
    organiser:{text:"Pour planifier tes tâches et tes projets, découvre Projects et Agenda. La formule Kitora Free suffit pour démarrer.",url:"projects.html",label:"Explorer Projects"},
    creer:{text:"Pour transformer une idée en étapes concrètes, essaie le générateur de kit, puis explore les formules si tu as besoin de fonctions avancées.",url:"#generateur",label:"Tester le générateur"}
  };
  function chooseNeed(need){
    const result=choiceMap[need];if(!result||!message||!link)return;
    message.textContent=result.text;link.href=result.url;link.textContent=result.label+" →";
    choices.forEach(button=>button.setAttribute("aria-pressed",String(button.dataset.kNeed===need)));
  }
  choices.forEach(button=>button.addEventListener("click",()=>chooseNeed(button.dataset.kNeed)));
  if(!reduced.matches){
    // Apply reveal styles only when observation support is available, never hide content otherwise.
    if("IntersectionObserver" in window){
      const nodes=[...document.querySelectorAll("[data-k-reveal]")];
      const observer=new IntersectionObserver(entries=>{
        entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add("k-in-view");observer.unobserve(entry.target);}});
      },{rootMargin:"0px 0px 90px 0px",threshold:.06});
      root.classList.add("k-motion-ready");
      nodes.forEach(node=>observer.observe(node));
      requestAnimationFrame(()=>nodes.filter(node=>node.getBoundingClientRect().top<window.innerHeight).forEach(node=>node.classList.add("k-in-view")));
      // Assistive feature changes are respected while viewing.
      reduced.addEventListener?.("change",event=>{if(event.matches){root.classList.remove("k-motion-ready");observer.disconnect();}});
    }
    const stage=document.querySelector(".k-hero-stage");
    if(stage&&window.matchMedia("(hover: hover) and (pointer: fine)").matches){
      let pending=0;
      stage.addEventListener("pointermove",event=>{
        if(pending)return;
        const x=event.clientX,y=event.clientY;
        pending=requestAnimationFrame(()=>{
          const rect=stage.getBoundingClientRect();
          stage.style.setProperty("--pointer-x",((x-rect.left)/rect.width*100).toFixed(1)+"%");
          stage.style.setProperty("--pointer-y",((y-rect.top)/rect.height*100).toFixed(1)+"%");
          pending=0;
        });
      },{passive:true});
      // Avoid transforming the preview on focus or when user prefers reduced motion.
      if(preview){
        stage.addEventListener("pointerleave",()=>{stage.style.setProperty("--pointer-x","78%");stage.style.setProperty("--pointer-y","42%");});
      }
    }
  }
})();
