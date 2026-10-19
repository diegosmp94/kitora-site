import{createInvoicePdf,computeInvoice}from"./facture-pdf.js";
import{initInvoiceCloudDrafts}from"./facturation-cloud.js";
const PROJECT="https://yxjxizxzjubhjaxskksh.supabase.co";
const KEY="sb_publishable_K6y-xwSJdAKhAccH698lgw_cp79fnbW";
const $=id=>document.getElementById(id);
let db=null,user=null,profile=null,invoice=null;
const fields={
 orgKind:"kind",orgPlan:"plan_interest",orgName:"legal_name",orgTrade:"trade_name",
 orgSiren:"siren",orgSiret:"siret",orgForm:"legal_form",orgCapital:"share_capital",
 orgRcs:"rcs",orgVat:"vat_number",orgVatMode:"vat_mode",orgVatNote:"vat_exemption_note",
 orgAddress:"address",orgPostal:"postal_code",orgCity:"city",orgCountry:"country",
 orgEmail:"email",orgPhone:"phone",orgTerms:"payment_terms",orgLate:"late_penalties"
};
const invoiceFields={clientName:"clientName",clientSiren:"clientSiren",clientAddress:"clientAddress",
 clientPost:"clientPost",clientCity:"clientCity",clientCountry:"clientCountry",clientVat:"clientVat",
 orderNumber:"orderNumber",invoiceDate:"date",serviceDate:"serviceDate",paymentDue:"dueDate",
 vatRate:"vatRate",paymentNote:"paymentNote",invoiceNotes:"notes"};
const supportedPlans=new Set(["impact","launch","flow","creative","horizon"]);
const today=()=>new Date().toISOString().slice(0,10);
const inMonth=()=>{const d=new Date();d.setDate(d.getDate()+30);return d.toISOString().slice(0,10)};
const emptyInvoice=()=>({clientName:"",clientSiren:"",clientAddress:"",clientPost:"",clientCity:"",clientCountry:"France",clientVat:"",orderNumber:"",date:today(),serviceDate:today(),dueDate:inMonth(),vatRate:"20",paymentNote:"",notes:"",lines:[{description:"",qty:1,unitCents:0}]});
const euro=n=>new Intl.NumberFormat("fr-FR",{style:"currency",currency:"EUR"}).format(n/100);
const safe=(value,max=300)=>String(value??"").trim().slice(0,max);
const storage=()=>user?"kitora_pro_invoice_draft_v1_"+user.id:null;
const set=(id,value)=>$(id).textContent=value;
function showProfile(){
 if(!profile){set("invoiceProfile","Aucune structure enregistrée. Complète d’abord ton dossier professionnel.");return}
 set("invoiceProfile",(profile.legal_name||"Structure sans nom")+" · "+(profile.kind==="association"?"Association":"Entreprise")+"\n"+[profile.address,profile.postal_code,profile.city].filter(Boolean).join(" ")+"\nSIREN : "+(profile.siren||"À renseigner")+" · TVA : "+(profile.vat_mode==="standard"?"régime standard":profile.vat_mode==="franchise_293b"?"franchise, art. 293 B":"autre exonération"));
 const select=$("vatRate");select.disabled=profile.vat_mode!=="standard";if(select.disabled){select.value="0";invoice.vatRate="0"}else if(!["0","5.5","10","20"].includes(String(invoice.vatRate)))select.value=invoice.vatRate="20";else select.value=String(invoice.vatRate);
 renderTotal();
}
function fillOrg(v){
 for(const [id,col]of Object.entries(fields))if(v[col]!==undefined&&v[col]!==null)$(id).value=v[col];
}
function readOrg(){
 const result={user_id:user.id};
 for(const [id,col]of Object.entries(fields))result[col]=safe($(id).value,id==="orgAddress"?300:250);
 result.siren=result.siren.replace(/\s/g,"");result.siret=result.siret.replace(/\s/g,"");
 if(result.siren&&!/^\d{9}$/.test(result.siren))throw Error("Le SIREN doit contenir exactement 9 chiffres.");
 if(result.siret&&!/^\d{14}$/.test(result.siret))throw Error("Le SIRET doit contenir exactement 14 chiffres.");
 if(result.siret&&result.siren&&result.siret.slice(0,9)!==result.siren)throw Error("Le SIRET ne correspond pas au SIREN.");
 if(!supportedPlans.has(result.plan_interest))throw Error("Formule non reconnue.");
 return result;
}
async function loadOrg(){
 if(!user)return;
 const {data,error}=await db.from("kitora_org_profiles").select("*").eq("user_id",user.id).maybeSingle();
 if(error)throw error;
 profile=data||null;
 if(profile){fillOrg(profile);set("orgMessage","Dossier de l’organisation chargé depuis ton compte.");}
 else{
  const requested=new URLSearchParams(location.search).get("plan");
  if(supportedPlans.has(requested))$("orgPlan").value=requested;
  set("orgMessage","Aucun dossier enregistré. Remplis les informations de ta structure, puis enregistre-les.");
 }
 showProfile();
}
$("organizationForm").addEventListener("submit",async event=>{
 event.preventDefault();if(!user||!db){set("orgMessage","Connecte-toi avant d’enregistrer ton dossier.");return}
 const button=$("saveOrg");button.disabled=true;
 try{
  if(!$("organizationForm").reportValidity())return;
  const payload=readOrg();
  const {data,error}=await db.from("kitora_org_profiles").upsert(payload,{onConflict:"user_id"}).select("*").single();
  if(error)throw error;
  profile=data;showProfile();set("orgMessage","Dossier enregistré dans ton compte Kitora. Les futures factures brouillon reprendront automatiquement tes informations.");
 }catch(e){set("orgMessage","Enregistrement impossible : "+(e.message||"réessaie plus tard"))}
 finally{button.disabled=false}
});
$("reloadOrg").addEventListener("click",async()=>{try{await loadOrg()}catch(e){set("orgMessage","Rechargement impossible : "+e.message)}});
function readDraft(){
 invoice=emptyInvoice();
 if(!user)return;
 try{
  const item=JSON.parse(localStorage.getItem(storage())||"null");
  if(!item||typeof item!=="object"||Array.isArray(item))return;
  for(const field of Object.values(invoiceFields))if(field in item&&typeof item[field]==="string")invoice[field]=safe(item[field],1000);
  if(Array.isArray(item.lines))invoice.lines=item.lines.slice(0,40).filter(x=>x&&typeof x==="object").map(x=>({
    description:safe(x.description,210),
    qty:Number.isInteger(Number(x.qty))?Math.min(10000,Math.max(1,Number(x.qty))):1,
    unitCents:Number.isInteger(Number(x.unitCents))?Math.min(1e11,Math.max(0,Number(x.unitCents))):0
  }));
  if(!invoice.lines.length)invoice.lines=emptyInvoice().lines;
 }catch{set("invoiceMessage","Ancien brouillon illisible. Un nouveau brouillon a été créé.")}
}
function persist(){
 if(!storage())return;
 try{localStorage.setItem(storage(),JSON.stringify(invoice))}catch{set("invoiceMessage","Enregistrement local indisponible. Télécharge le PDF avant de quitter.")}
}
function fillInvoice(){for(const [id,col]of Object.entries(invoiceFields))$(id).value=invoice[col]??"";drawRows();renderTotal()}
for(const [id,col]of Object.entries(invoiceFields))$(id).addEventListener("input",()=>{
 if(!invoice)return;
 invoice[col]=$(id).value;persist();if(id==="vatRate")renderTotal();
});
function inputField(label,type,value,opt={}){
 const wrapper=document.createElement("div");wrapper.className="field";
 const name=document.createElement("label"),input=document.createElement("input");name.textContent=label;
 input.type=type;input.required=!!opt.required;input.value=String(value);input.maxLength=opt.maxlength||210;
 if(opt.min!==undefined)input.min=String(opt.min);if(opt.max!==undefined)input.max=String(opt.max);if(opt.step!==undefined)input.step=String(opt.step);
 wrapper.append(name,input);return{wrapper,input,name};
}
function drawRows(){
 const container=$("invoiceLines");container.replaceChildren();
 invoice.lines.forEach((line,i)=>{
  const row=document.createElement("div");row.className="invoice-line";row.dataset.row=String(i);
  const d=inputField("Désignation de la prestation", "text",line.description,{required:true,maxlength:210});
  const q=inputField("Quantité","number",line.qty,{required:true,min:1,max:10000,step:1});
  const u=inputField("Prix unitaire HT (€)","number",(line.unitCents/100).toFixed(2),{required:true,min:0,max:100000000,step:.01});
  for(const [field,obj] of [["description",d],["qty",q],["unitCents",u]]){
   obj.input.id="invoice-line-"+i+"-"+field;obj.name.htmlFor=obj.input.id;
   obj.input.addEventListener("input",()=>{
    if(field==="description")line.description=safe(obj.input.value,210);
    else if(field==="qty")line.qty=Number(obj.input.value);
    else{let number=Number(obj.input.value);line.unitCents=Number.isFinite(number)?Math.round(number*100):-1}
    persist();renderTotal();
   });
   row.append(obj.wrapper);
  }
  const button=document.createElement("button");button.type="button";button.className="btn outline";
  button.textContent="Retirer";button.setAttribute("aria-label","Retirer la ligne "+(i+1));
  button.addEventListener("click",()=>{
   if(invoice.lines.length<=1){set("invoiceMessage","Conserve au moins une ligne pour ton brouillon.");return}
   invoice.lines.splice(i,1);persist();drawRows();renderTotal()
  });row.append(button);container.append(row);
 });
}
$("addLine").addEventListener("click",()=>{
 if(!invoice)return;
 if(invoice.lines.length>=40){set("invoiceMessage","Maximum 40 lignes dans un brouillon.");return}
 invoice.lines.push({description:"",qty:1,unitCents:0});persist();drawRows();renderTotal();
});
function renderTotal(){
 if(!invoice)return;
 try{
  const result=computeInvoice(invoice.lines,String(invoice.vatRate),profile?.vat_mode||"standard");
  set("invoiceTotals","Total HT : "+euro(result.ht)+"  ·  TVA ("+result.rate+" %) : "+euro(result.tva)+"  ·  TOTAL TTC : "+euro(result.ttc));
 }catch{set("invoiceTotals","Vérifie les quantités et les prix des prestations.")}
}
function validateInvoice(){
 if(!user||!profile)throw Error("Enregistre d’abord ton dossier entreprise / association dans ton compte.");
 for(const col of ["legal_name","address","postal_code","city","country","email"])if(!profile[col]?.trim())throw Error("Le dossier de l’émetteur est incomplet : "+col);
 if(!/^\d{9}$/.test(profile.siren||""))throw Error("Complète ton SIREN dans le dossier de l’émetteur avant de générer un PDF.");
 if(profile.vat_mode==="autre_exoneration"&&!profile.vat_exemption_note?.trim())throw Error("Renseigne la référence légale d’exonération de TVA.");
 if(!$("invoiceForm").reportValidity())throw Error("Vérifie les champs obligatoires de la facture.");
 if(invoice.clientSiren&&!/^\d{9}$/.test(invoice.clientSiren))throw Error("Le SIREN du client doit comporter 9 chiffres.");
 if(!invoice.date||!invoice.serviceDate||!invoice.dueDate)throw Error("Complète les dates du brouillon.");
 if(invoice.dueDate<invoice.date)throw Error("L’échéance ne peut pas précéder la date du document.");
 computeInvoice(invoice.lines,String(invoice.vatRate),profile.vat_mode);
}
$("invoiceForm").addEventListener("submit",event=>{
 event.preventDefault();
 try{
  validateInvoice();
  const pdf=createInvoicePdf(profile,invoice);
  const url=URL.createObjectURL(pdf),link=document.createElement("a");link.href=url;link.download="kitora-pro-facture-brouillon-"+invoice.date+".pdf";
  document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);
  set("invoiceMessage","PDF brouillon téléchargé. Il ne s’agit pas d’une facture émise, numérotée ou télétransmise.");
 }catch(e){set("invoiceMessage",e.message||"Impossible de créer le PDF.")}
});
function replaceLocalInvoice(document){
 invoice=document?JSON.parse(JSON.stringify(document)):emptyInvoice();
 persist();fillInvoice();showProfile();
 set("invoiceMessage",document?"Brouillon privé chargé : tu peux continuer ou télécharger le PDF.":"Nouveau brouillon local prêt.");
}
$("resetInvoice").addEventListener("click",()=>{
 const button=$("newCloudDraft");
 if(button&&!button.disabled){button.click();return}
 if(!confirm("Effacer le brouillon local du compte connecté ? Cette action ne peut pas être annulée."))return;
 replaceLocalInvoice(null);
});
async function start(){
 set("authStatus","Vérification de la session...");
 try{
  if(window.__KITORA_INVOICE_TEST_CLIENT__)db=window.__KITORA_INVOICE_TEST_CLIENT__;
  else{
   const {createClient}=await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm");
   db=createClient(PROJECT,KEY);
  }
  const {data:{user:connected},error}=await db.auth.getUser();
  if(error)throw error;
  if(!connected){
   set("authStatus","Connecte-toi à Kitora pour enregistrer ton dossier professionnel et créer des brouillons PDF.");
   const a=document.createElement("a");a.href="compte.html";a.textContent="Ouvrir mon espace Kitora ↗";$("authStatus").append(" ",a);
   $("saveOrg").disabled=true;$("downloadPdf").disabled=true;$("addLine").disabled=true;$("invoiceMessage").textContent="Connexion requise.";return;
  }
  user=connected;$("saveOrg").disabled=false;
  set("authStatus","Compte connecté. Ton dossier organisation reste privé et lié uniquement à ton identifiant Kitora.");
  readDraft();fillInvoice();await loadOrg();
  await initInvoiceCloudDrafts({
   db,user,
   getInvoice:()=>invoice,
   setInvoice:replaceLocalInvoice,
   getProfile:()=>profile,
   validateInvoice
  });
 }catch(e){
  set("authStatus","Connexion Supabase ou chargement indisponible : "+(e.message||"réessaie plus tard"));
  $("saveOrg").disabled=true;$("downloadPdf").disabled=true;
 }
}
start();
