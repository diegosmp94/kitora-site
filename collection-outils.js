(()=>{"use strict";
const search=document.getElementById("toolSearch"),category=document.getElementById("toolCategory"),root=document.getElementById("toolsResults"),status=document.getElementById("toolsStatus");
const catalog=Array.isArray(window.KITORA_PRODUCTS)?window.KITORA_PRODUCTS:[];
const norm=s=>String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
function draw(){const q=norm(search.value.trim()),cat=category.value;const results=catalog.filter(p=>(!cat||p.category===cat)&&(!q||norm([p.name,p.description,...(p.features||[])].join(" ")).includes(q)));
 root.replaceChildren();status.textContent=results.length+" produit"+(results.length===1?"":"s")+" correspondant"+(results.length===1?"":"s")+".";
 for(const p of results){const card=document.createElement("article");card.className="tools-card";const tag=document.createElement("span");tag.className="tools-badge";tag.textContent=p.status==="free"?"Gratuit · Disponible":"En préparation · Non achetable";const h=document.createElement("h2");h.textContent=p.name;const intro=document.createElement("p");intro.textContent=p.description;const b=document.createElement("a");b.className="btn";b.href="produit.html?id="+encodeURIComponent(p.id);b.textContent="Voir la fiche produit →";card.append(tag,h,intro,b);root.append(card)}
 if(!results.length){const p=document.createElement("p");p.textContent="Aucun outil trouvé. Essaie d'autres mots ou découvre le guide personnalisé.";root.append(p)}
}
search.addEventListener("input",draw);category.addEventListener("change",draw);draw();
})();