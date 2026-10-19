import {quoteTotals,quoteMoney} from "./devis-calcul.mjs";
const PROJECT="https://yxjxizxzjubhjaxskksh.supabase.co";
const PUBLISHABLE_KEY="sb_publishable_K6y-xwSJdAKhAccH698lgw_cp79fnbW";
const $=id=>document.getElementById(id);
const status=$("quoteStatus"),organizationStatus=$("orgStatus"),preview=$("quotePreview");
const form=$("quoteForm"),printButton=$("quotePrint"),rows=$("quoteRows");
const dateValue=offset=>{const d=new Date();d.setDate(d.getDate()+offset);return [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-")};
const trim=(text,max)=>String(text??"").trim().slice(0,max);
function el(tag,text,cls){
 const node=document.createElement(tag);if(cls)node.className=cls;
 if(text!==undefined&&text!==null)node.textContent=String(text);
 return node;
}
function labelledInput(labelText,type,value,id,attributes={}){
 const container=el("div",null,"field"),label=el("label",labelText);
 label.htmlFor=id;const input=el("input");input.type=type;input.id=id;input.value=String(value??"");
 for(const [key,value]of Object.entries(attributes))input.setAttribute(key,String(value));
 container.append(label,input);return {container,input};
}
function addLine(description="",qty=1,unitCents=0){
 if(rows.children.length>=40){status.textContent="Le devis est limité à 40 prestations.";return}
 const number=rows.children.length+1,group=el("fieldset",null,"quote-line");
 const legend=el("legend","Prestation "+number),grid=el("div",null,"quote-line-fields");
 const name=labelledInput("Désignation","text",description,"quote-line-name-"+number,{maxlength:210,required:""});
 const amount=labelledInput("Quantité","number",qty,"quote-line-qty-"+number,{min:1,max:10000,step:1,required:""});
 const price=labelledInput("Prix unitaire HT (€)","number",(unitCents/100).toFixed(2),"quote-line-price-"+number,{min:0,max:10000000,step:".01",required:""});
 name.input.dataset.quoteField="description";amount.input.dataset.quoteField="qty";price.input.dataset.quoteField="price";
 const remove=el("button","Retirer","btn outline");remove.type="button";
 remove.setAttribute("aria-label","Supprimer la prestation "+number);
 remove.addEventListener("click",()=>{
  if(rows.children.length===1){status.textContent="Conserve au moins une prestation.";return}
  group.remove();reindex();invalidate();
 });
 grid.append(name.container,amount.container,price.container,remove);
 group.append(legend,grid);rows.append(group);invalidate();
}
function reindex(){
 Array.from(rows.children).forEach((group,i)=>{
  group.querySelector("legend").textContent="Prestation "+(i+1);
  const button=group.querySelector("button");button.setAttribute("aria-label","Supprimer la prestation "+(i+1));
 });
}
function readLines(){
 return [...rows.querySelectorAll(".quote-line")].map(group=>{
  const description=trim(group.querySelector('[data-quote-field="description"]').value,210);
  const qty=Number(group.querySelector('[data-quote-field="qty"]').value);
  const raw=group.querySelector('[data-quote-field="price"]').value;
  const value=Number(raw);
  return {description,qty,unitCents:raw!==""&&Number.isFinite(value)?Math.round(value*100):NaN};
 });
}
function getTotals(){
 return quoteTotals(readLines(),$("quoteVatRate").value,$("quoteVatMode").value);
}
function invalidate(){
 printButton.disabled=true;
 status.textContent="Modifications non prévisualisées. Actualise l'aperçu avant impression.";
 try{
  const t=getTotals();
  $("quoteTotal").textContent="Total HT : "+quoteMoney(t.ht)+"  ·  TVA ("+t.rate+" %) : "+quoteMoney(t.tva)+"  ·  Total TTC : "+quoteMoney(t.ttc);
 }catch{ $("quoteTotal").textContent="Complète les prestations pour afficher les totaux."; }
}
function oneLine(id,max=400){return trim($(id).value,max)}
function validate(){
 if(!form.reportValidity())throw new Error("Complète les champs obligatoires du devis.");
 const d=oneLine("quoteDate"),limit=oneLine("quoteExpires");
 if(d>limit)throw new Error("La validité du devis ne peut pas précéder sa date.");
 if($("issuerSiren").value&&!/^\d{9}$/.test($("issuerSiren").value.trim()))throw new Error("Le SIREN doit contenir 9 chiffres.");
 return getTotals();
}
function paragraph(parent,label,value){
 if(!value)return;
 const p=el("p");if(label){p.append(el("strong",label+" : "),document.createTextNode(value));}else p.textContent=value;
 parent.append(p);
}
function renderPaper(totals){
 const paper=el("div",null,"quote-paper-content"),top=el("div",null,"quote-paper-top");
 const brand=el("div");brand.append(el("strong","kitora.","quote-paper-brand"),el("span","PRO / DEVIS STUDIO"));
 const meta=el("div",null,"quote-paper-meta");
 meta.append(el("strong","DEVIS — BROUILLON NON SIGNÉ"),el("span",oneLine("quoteReference")||"Référence non attribuée"));
 top.append(brand,meta);paper.append(top);
 const parties=el("div",null,"quote-paper-parties");
 const issuer=el("section"),client=el("section");
 issuer.append(el("h3","Émetteur"),el("strong",oneLine("issuerName")));
 paragraph(issuer,"Adresse",oneLine("issuerAddress"));
 paragraph(issuer,"SIREN",oneLine("issuerSiren"));
 paragraph(issuer,"TVA",oneLine("issuerVat"));
 paragraph(issuer,"E-mail",oneLine("issuerEmail"));
 client.append(el("h3","Client / destinataire"),el("strong",oneLine("clientName")));
 paragraph(client,"Adresse",oneLine("clientAddress"));
 parties.append(issuer,client);paper.append(parties);
 const dates=el("div",null,"quote-paper-dates");
 paragraph(dates,"Date du devis",new Date(oneLine("quoteDate")+"T12:00:00").toLocaleDateString("fr-FR"));
 paragraph(dates,"Valable jusqu'au",new Date(oneLine("quoteExpires")+"T12:00:00").toLocaleDateString("fr-FR"));
 paper.append(dates);
 const table=el("table",null,"quote-document-table"),caption=el("caption","Prestations — montants en euros");
 const thead=el("thead"),head=el("tr");
 for(const th of ["Description","Qté","PU HT","Total HT"])head.append(el("th",th));
 thead.append(head);
 const tbody=el("tbody");
 for(const item of totals.items){
  const tr=el("tr");
  for(const value of [item.description,String(item.qty),quoteMoney(item.unitCents),quoteMoney(item.subtotal)])tr.append(el("td",value));
  tbody.append(tr);
 }
 table.append(caption,thead,tbody);paper.append(table);
 const total=el("div",null,"quote-paper-totals");
 for(const [label,amount] of [["Total HT",totals.ht],["TVA ("+totals.rate+" %)",totals.tva],["Total TTC",totals.ttc]]){
  const line=el("div");line.append(el("span",label),el("strong",quoteMoney(amount)));total.append(line);
 }
 paper.append(total);
 const terms=el("section",null,"quote-paper-terms");
 terms.append(el("h3","Conditions proposées"));
 const mode=$("quoteVatMode").value;
 if(mode==="franchise_293b")terms.append(el("p","TVA non applicable, article 293 B du CGI."));
 if(mode==="autre_exoneration")terms.append(el("p","Exonération de TVA à vérifier avant utilisation commerciale."));
 const notes=oneLine("quoteNotes",3000);if(notes)terms.append(el("p",notes));
 terms.append(el("p","Ce document est un projet de devis non signé, sans preuve d'acceptation. Vérifier les mentions, les conditions et la TVA avant transmission."));
 paper.append(terms);
 paper.append(el("div","DOCUMENT PRÉPARATOIRE · NON SIGNÉ · KITORA PRO","quote-paper-foot"));
 preview.replaceChildren(paper);
}
function resetForm(){
 form.reset();$("quoteDate").value=dateValue(0);$("quoteExpires").value=dateValue(30);
 rows.replaceChildren();addLine();preview.replaceChildren(el("div","Ton devis prendra forme ici après validation du formulaire.","quote-placeholder"));
 updateVatMode();status.textContent="Tous les champs ont été réinitialisés.";
}
function updateVatMode(){
 const select=$("quoteVatRate"),standard=$("quoteVatMode").value==="standard";
 select.disabled=!standard;if(!standard)select.value="0";else if(select.value==="0")select.value="20";
 invalidate();
}
$("quoteAdd").addEventListener("click",()=>addLine());
$("quoteVatMode").addEventListener("change",updateVatMode);
form.addEventListener("input",invalidate);
form.addEventListener("change",invalidate);
form.addEventListener("submit",event=>{
 event.preventDefault();
 try{
  const totals=validate();renderPaper(totals);
  printButton.disabled=false;
  status.textContent="Aperçu prêt. Tu peux imprimer ou enregistrer le document en PDF depuis ton navigateur.";
  preview.scrollIntoView({behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"start"});
 }catch(error){printButton.disabled=true;status.textContent=error.message||"Vérifie le devis."; }
});
printButton.addEventListener("click",()=>{
 try{const totals=validate();renderPaper(totals);window.print();}
 catch(error){printButton.disabled=true;status.textContent=error.message||"Impossible d'imprimer.";}
});
$("quoteReset").addEventListener("click",()=>{
 if(confirm("Effacer le devis actuellement saisi ? Rien n'est enregistré sur le serveur."))resetForm();
});
async function loadOrganization(){
 try{
  const {createClient}=await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.57.0/+esm");
  const client=window.__KITORA_QUOTE_TEST_CLIENT__||createClient(PROJECT,PUBLISHABLE_KEY);
  const {data:{user},error}=await client.auth.getUser();
  if(error)throw error;
  if(!user){organizationStatus.textContent="Mode invité : saisie manuelle de l'émetteur. Connecte-toi pour reprendre les informations de ton organisation.";return;}
  const {data,error:loadError}=await client.from("kitora_org_profiles").select("legal_name,address,postal_code,city,country,email,siren,vat_number,vat_mode").eq("user_id",user.id).maybeSingle();
  if(loadError)throw loadError;
  if(!data){organizationStatus.textContent="Compte connecté. Aucun dossier entreprise enregistré : remplis-le depuis Facturation Pro ou continue manuellement.";return;}
  $("issuerName").value=data.legal_name||"";
  $("issuerAddress").value=[data.address,[data.postal_code,data.city].filter(Boolean).join(" "),data.country].filter(Boolean).join("\n");
  $("issuerEmail").value=data.email||"";
  $("issuerSiren").value=data.siren||"";
  $("issuerVat").value=data.vat_number||"";
  if(["standard","franchise_293b","autre_exoneration"].includes(data.vat_mode))$("quoteVatMode").value=data.vat_mode;
  updateVatMode();
  organizationStatus.textContent="Dossier Kitora Pro prérempli pour ce devis. Aucune donnée client envoyée ni sauvegardée automatiquement.";
 }catch{
  organizationStatus.textContent="Dossier indisponible : l'éditeur fonctionne en saisie manuelle, sans enregistrement.";
 }
}
resetForm();loadOrganization();
