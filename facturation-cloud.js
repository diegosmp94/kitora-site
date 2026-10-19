/**
 * Kitora Pro — user-owned cloud draft library.
 * An optional save, never an invoice issuance, payment, or tax transmission.
 * Uses authenticated Supabase queries and optimistic revision checks.
 */
export function initInvoiceCloudDrafts({db,user,getInvoice,setInvoice,getProfile,validateInvoice}){
 const $=id=>document.getElementById(id);
 const list=$("cloudDraftList"),status=$("cloudDraftStatus"),count=$("cloudDraftCount");
 const saveButton=$("saveCloudDraft"),refreshButton=$("refreshCloudDrafts"),newButton=$("newCloudDraft");
 const columns="id,user_id,kind,status,client_name,document,total_ht_cents,total_vat_cents,total_ttc_cents,revision,created_at,updated_at";
 let current=null,records=[],busy=false;
 const text=(value,cls)=>{const el=document.createElement("span");el.textContent=String(value);if(cls)el.className=cls;return el};
 const btn=(label,callback,cls="outline")=>{const b=document.createElement("button");b.type="button";b.className="btn "+cls;b.textContent=label;b.addEventListener("click",callback);return b};
 const euro=n=>new Intl.NumberFormat("fr-FR",{style:"currency",currency:"EUR"}).format(n/100);
 const setStatus=msg=>{status.textContent=msg};
 const snapshot=()=>JSON.parse(JSON.stringify(getInvoice()));
 const changed=()=>current&&JSON.stringify(snapshot())!==JSON.stringify(current.document);
 const check=(row)=>{
  if(!row||row.user_id!==user.id)throw Error("Brouillon introuvable ou non autorisé.");
  return row;
 };
 async function run(fn){
  if(busy)return;busy=true;saveButton.disabled=true;refreshButton.disabled=true;newButton.disabled=true;
  try{await fn()}catch(e){setStatus("Opération impossible : "+(e.message||"réessaie plus tard"))}
  finally{busy=false;saveButton.disabled=false;refreshButton.disabled=false;newButton.disabled=false}
 }
 function render(){
  count.textContent=records.length+" brouillon"+(records.length>1?"s":"")+" affiché"+(records.length>1?"s":"")+" (50 plus récents maximum).";
  list.replaceChildren();
  if(!records.length){const p=document.createElement("p");p.textContent="Aucun brouillon dans le cloud. Utilise « Enregistrer le brouillon dans le cloud » pour conserver ton travail.";list.append(p);return}
  for(const item of records){
   const row=document.createElement("article");row.className="cloud-row";
   if(current?.id===item.id)row.classList.add("is-selected");
   const top=document.createElement("div");top.className="cloud-row-heading";
   const label=document.createElement("div");label.className="cloud-title";
   const title=document.createElement("strong");
   title.textContent=item.client_name||"Client à renseigner";
   const reference=document.createElement("small");
   reference.textContent="Brouillon réf. "+item.id.slice(0,8).toUpperCase()+" · "+new Date(item.updated_at).toLocaleDateString("fr-FR");
   label.append(title,reference);
   const marker=text(item.status==="review"?"À vérifier":"Brouillon","cloud-state");
   top.append(label,marker);row.append(top);
   const sum=document.createElement("p");sum.className="cloud-row-total";
   sum.textContent="Total indicatif TTC : "+euro(item.total_ttc_cents||0);
   row.append(sum);
   const actions=document.createElement("div");actions.className="cloud-row-actions";
   actions.append(btn("Ouvrir",()=>run(async()=>{
    if(changed()&&!confirm("Des modifications locales ne sont pas enregistrées dans le cloud. Remplacer le brouillon ouvert ?"))return;
    const {data,error}=await db.from("kitora_invoice_drafts").select(columns).eq("id",item.id).eq("user_id",user.id).maybeSingle();
    if(error)throw error;check(data);current=data;setInvoice(data.document);
    setStatus("Brouillon "+item.id.slice(0,8).toUpperCase()+" ouvert. Il n'est pas émis. Tu peux le modifier ou télécharger son PDF.");render();
    $("facture").scrollIntoView({block:"start"});
   })));
   actions.append(btn("Dupliquer",()=>run(async()=>{
    const payload={
     user_id:user.id,kind:"invoice",status:"draft",client_name:item.client_name,
     document:item.document,total_ht_cents:item.total_ht_cents,total_vat_cents:item.total_vat_cents
    };
    const {data,error}=await db.from("kitora_invoice_drafts").insert(payload).select(columns).single();
    if(error)throw error;check(data);current=data;setInvoice(data.document);await refresh();
    setStatus("Copie créée comme nouveau brouillon, sans numéro de facture.");
   })));
   actions.append(btn(item.status==="review"?"Repasser en brouillon":"Marquer à vérifier",()=>run(async()=>{
    if(current?.id===item.id&&changed())throw Error("Enregistre d'abord tes modifications locales avant de modifier le statut.");
    if(item.status==="draft"){
     if(!getProfile())throw Error("Enregistre ton dossier professionnel avant la mise en vérification.");
     if(current?.id!==item.id){
      const {data,error}=await db.from("kitora_invoice_drafts").select(columns).eq("id",item.id).eq("user_id",user.id).maybeSingle();
      if(error)throw error;check(data);
      if(changed()&&!confirm("Remplacer tes modifications locales pour vérifier ce brouillon ?"))return;
      current=data;setInvoice(data.document);
     }
     validateInvoice();
    }
    const next=item.status==="review"?"draft":"review";
    const {data,error}=await db.from("kitora_invoice_drafts").update({status:next}).eq("id",item.id).eq("user_id",user.id).eq("revision",item.revision).select(columns).maybeSingle();
    if(error)throw error;if(!data)throw Error("Brouillon modifié ailleurs. Actualise l'historique.");
    check(data);if(current?.id===item.id)current=data;await refresh();
    setStatus(next==="review"?"Dossier marqué « À vérifier » : ce n'est pas une facture émise.":"Dossier repassé en brouillon.");
   })));
   actions.append(btn("Supprimer",()=>run(async()=>{
    if(!confirm("Supprimer définitivement ce brouillon du cloud ? Cette action ne peut pas être annulée."))return;
    const {data,error}=await db.from("kitora_invoice_drafts").delete().eq("id",item.id).eq("user_id",user.id).eq("revision",item.revision).select("id").maybeSingle();
    if(error)throw error;if(!data)throw Error("Brouillon déjà modifié ou supprimé. Actualise la liste.");
    if(current?.id===item.id)current=null;await refresh();setStatus("Brouillon supprimé du cloud.");
   })));
   row.append(actions);list.append(row);
  }
 }
 async function refresh(){
  const {data,error}=await db.from("kitora_invoice_drafts").select(columns).eq("user_id",user.id).order("updated_at",{ascending:false}).limit(50);
  if(error)throw error;records=(data||[]).map(check);
  const updated=current?records.find(r=>r.id===current.id):null;
  if(updated&&!changed()&&updated.revision===current.revision)current=updated;
  render();
 }
 function totalsOf(doc){
  // Only valid amounts are summarized. Partial drafts are allowed with 0/0 until completed.
  let ht=0,vat=0;
  const rate=getProfile()?.vat_mode==="standard"?Number(doc.vatRate):0;
  if(![0,5.5,10,20].includes(rate))return{ht:0,vat:0};
  for(const item of doc.lines||[]){
   if(!item.description?.trim())return{ht:0,vat:0};
   const qty=Number(item.qty),unit=Number(item.unitCents);
   if(!Number.isInteger(qty)||qty<1||qty>10000||!Number.isInteger(unit)||unit<0||unit>1e11)return{ht:0,vat:0};
   const subtotal=qty*unit;ht+=subtotal;vat+=Math.round(subtotal*rate/100);
   if(ht>1e11)return{ht:0,vat:0};
  }
  return{ht,vat};
 }
 saveButton.addEventListener("click",()=>run(async()=>{
  if(!getProfile())throw Error("Commence par enregistrer le dossier de ta structure.");
  const document=snapshot(),{ht,vat}=totalsOf(document);
  const payload={user_id:user.id,client_name:(document.clientName||"Client à renseigner").trim().slice(0,180)||"Client à renseigner",document,total_ht_cents:ht,total_vat_cents:vat};
  if(current){
   const {data,error}=await db.from("kitora_invoice_drafts").update(payload).eq("id",current.id).eq("user_id",user.id).eq("revision",current.revision).select(columns).maybeSingle();
   if(error)throw error;if(!data)throw Error("Ce brouillon a changé ailleurs. Actualise la liste et vérifie les informations avant de réessayer.");
   check(data);current=data;
  }else{
   const {data,error}=await db.from("kitora_invoice_drafts").insert({...payload,kind:"invoice",status:"draft"}).select(columns).single();
   if(error)throw error;current=check(data);
  }
  await refresh();setStatus("Brouillon sauvegardé dans ton compte Kitora. Aucun numéro de facture ni transmission n'a été créé.");
 }));
 refreshButton.addEventListener("click",()=>run(async()=>{await refresh();setStatus("Historique actualisé. Les données affichées sont privées à ton compte.")}));
 newButton.addEventListener("click",()=>run(async()=>{
  if(changed()&&!confirm("Tes modifications locales ne sont pas enregistrées dans le cloud. Ouvrir un nouveau brouillon ?"))return;
  current=null;setInvoice(null);render();setStatus("Nouveau brouillon local prêt. Rien n'a été enregistré dans le cloud.");$("facture").scrollIntoView({block:"start"});
 }));
 $("invoiceForm").addEventListener("input",()=>{if(current&&changed())setStatus("Modifications locales : utilise « Enregistrer le brouillon dans le cloud » pour les synchroniser.")});
 saveButton.disabled=false;refreshButton.disabled=false;newButton.disabled=false;
 return refresh().then(()=>setStatus("Brouillons privés chargés. Enregistrement cloud uniquement sur demande.")).catch(error=>setStatus("Historique temporairement indisponible : "+error.message));
}
