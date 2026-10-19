/* Standalone A4 PDF builder using PDF 1.4 + WinAnsi Helvetica, no external network or upload. 
   Intentionally creates NON-ISSUED drafts, never legally numbered invoices. */
const special={"€":128,"‚":130,"ƒ":131,"„":132,"…":133,"†":134,"‡":135,"ˆ":136,"‰":137,"Š":138,"‹":139,"Œ":140,"Ž":142,"‘":145,"’":146,"“":147,"”":148,"•":149,"–":150,"—":151,"˜":152,"™":153,"š":154,"›":155,"œ":156,"ž":158,"Ÿ":159};
function ansi(input){let result="";for(const char of String(input??"")){const n=char.codePointAt(0);result+=String.fromCharCode((n>=32&&n<=126)||(n>=160&&n<=255)?n:special[char]??63)}return result}
function esc(s){return ansi(s).replace(/\\/g,"\\\\").replace(/\(/g,"\\(").replace(/\)/g,"\\)")}
function wrap(str,max=83){const lines=[];for(const part of String(str??"").replace(/\r/g,"").split("\n")){let line="";for(const word of part.split(/\s+/)){if(!word)continue;for(let start=0;start<word.length;start+=max){const piece=word.slice(start,start+max);if(line&&line.length+piece.length+1>max){lines.push(line);line=""}line+=(line?" ":"")+piece}}lines.push(line)}return lines}
function cents(n){const amount=Number(n);if(!Number.isFinite(amount)||amount<0||amount>1e11)throw Error("Montant invalide");return Math.round(amount)}
const euro=n=>new Intl.NumberFormat("fr-FR",{style:"currency",currency:"EUR"}).format(n/100);
const date=s=>/^\d{4}-\d{2}-\d{2}$/.test(s||"")?s.split("-").reverse().join("/"):"Non précisée";
export function computeInvoice(lines,vatRate,vatMode){
 const rate=vatMode==="standard"?Number(vatRate):0;
 if(![0,5.5,10,20].includes(rate))throw Error("Taux TVA non pris en charge");
 if(!Array.isArray(lines)||!lines.length||lines.length>40)throw Error("Le brouillon doit avoir entre 1 et 40 lignes.");
 let ht=0,tva=0;
 const items=lines.map(item=>{
  const label=String(item.description??"").trim();if(!label||label.length>210)throw Error("La description d'une prestation est invalide.");
  const qty=Number(item.qty),unit=cents(item.unitCents);if(!Number.isInteger(qty)||qty<1||qty>10000)throw Error("Quantité invalide");
  const subtotal=qty*unit;const tax=Math.round(subtotal*rate/100);ht+=subtotal;tva+=tax;
  if(ht>1e11)throw Error("Montant total trop élevé");
  return{description:label,qty,unitCents:unit,subtotal,tax};
 });
 return{items,ht,tva,ttc:ht+tva,rate};
}
function pdfBytes(objects){
 let body="%PDF-1.4\n%\xE2\xE3\xCF\xD3\n",offsets=[0];
 objects.forEach((object,i)=>{offsets.push(body.length);body+=(i+1)+" 0 obj\n"+object+"\nendobj\n"});
 const start=body.length;body+="xref\n0 "+(objects.length+1)+"\n0000000000 65535 f \n";
 for(let i=1;i<offsets.length;i++)body+=String(offsets[i]).padStart(10,"0")+" 00000 n \n";
 body+="trailer\n<< /Size "+(objects.length+1)+" /Root 1 0 R >>\nstartxref\n"+start+"\n%%EOF";
 const bytes=new Uint8Array(body.length);for(let i=0;i<body.length;i++)bytes[i]=body.charCodeAt(i)&255;
 return bytes;
}
export function createInvoicePdf(profile,invoice){
 const totals=computeInvoice(invoice.lines,invoice.vatRate,profile.vat_mode);
 const pages=[];let current=[],y=778;
 function command(code){current.push(code)}
 function text(txt,x=44,size=10,bold=false,rgb=".10 .21 .32"){command("BT "+rgb+" rg /"+(bold?"F2":"F1")+" "+size+" Tf 1 0 0 1 "+x+" "+y+" Tm ("+esc(txt)+") Tj ET")}
 function lineSeparator(){command(".82 .87 .91 RG 0.7 w 44 "+(y+4)+" m 550 "+(y+4)+" l S");y-=8}
 function start(first=false){
  current=[];pages.push(current);y=778;
  command("0.06 0.17 0.30 rg 0 791 595 51 re f");
  command("0.85 0.66 0.39 rg 0 788 595 3 re f");
  text("KITORA PRO  /  DOCUMENT PRÉPARATOIRE",44,11,true,"1 .90 .76");
  y=770;text(first?"FACTURE — BROUILLON NON ÉMISE":"FACTURE — SUITE (BROUILLON)",44,14,true);y-=33;
 }
 function ensure(lines=1){if(y-lines*15<82)start(false)}
 function paragraph(content,{bold=false,size=10,x=44,max=88,indent=0}={}){
  for(const row of wrap(content,max)){ensure();text(row,x+indent,size,bold);y-=14}
 }
 function heading(title){ensure(3);y-=6;text(title.toUpperCase(),44,11,true,".08 .29 .50");y-=18;lineSeparator()}
 start(true);
 paragraph("DOCUMENT BROUILLON : sans numéro officiel, non signé et non transmis. Vérifier les obligations avant toute émission.",{size:9,max:99});
 y-=8;heading("Émetteur");
 for(const item of [
  profile.legal_name,
  profile.kind==="association"?"Association":profile.legal_form?profile.legal_form:"Entreprise / indépendant",
  profile.address,
  [profile.postal_code,profile.city].filter(Boolean).join(" ")+" - "+(profile.country||"France"),
  profile.siren?"SIREN : "+profile.siren:"SIREN : À COMPLÉTER",
  profile.siret?"SIRET : "+profile.siret:"",
  profile.rcs?"Registre / RCS : "+profile.rcs:"",
  profile.share_capital?"Capital social : "+profile.share_capital:"",
  profile.vat_number?"TVA intracommunautaire : "+profile.vat_number:"",
  profile.email?"E-mail : "+profile.email:"",
  profile.phone?"Téléphone : "+profile.phone:""
 ])if(item)paragraph(item,{max:86});
 y-=4;heading("Client / destinataire");
 for(const item of [
  invoice.clientName,
  invoice.clientSiren?"SIREN du client : "+invoice.clientSiren:"",
  invoice.clientAddress,
  [invoice.clientPost,invoice.clientCity,invoice.clientCountry||"France"].filter(Boolean).join(" "),
  invoice.clientVat?"TVA du client : "+invoice.clientVat:""
 ])if(item)paragraph(item,{max:86});
 y-=4;heading("Références du brouillon");
 paragraph("Numéro de facture : NON ATTRIBUÉ (brouillon)",{bold:true});
 paragraph("Date de document : "+date(invoice.date)+"    Prestation : "+date(invoice.serviceDate));
 paragraph("Échéance de paiement proposée : "+date(invoice.dueDate));
 if(invoice.orderNumber)paragraph("Commande / référence : "+invoice.orderNumber);
 paragraph("Nature de l'opération : prestation de services");
 y-=2;heading("Prestations (euros)");
 paragraph("DÉSIGNATION | QTÉ | PU HT | TOTAL HT",{bold:true,size:9});
 for(const item of totals.items){
  ensure(4);
  const name=wrap(item.description,66);
  for(const row of name)paragraph(row,{size:9,max:67});
  paragraph("Quantité : "+item.qty+"   ·   PU HT : "+euro(item.unitCents)+"   ·   Total HT : "+euro(item.subtotal),{size:9});
  y-=5;lineSeparator();
 }
 ensure(5);y-=10;text("Total HT : "+euro(totals.ht),310,11,true);y-=20;
 text("TVA ("+totals.rate+" %) : "+euro(totals.tva),310,11);y-=20;
 text("TOTAL TTC : "+euro(totals.ttc),310,14,true,".09 .30 .51");y-=26;
 heading("Conditions et mentions");
 paragraph("Règlement : "+(invoice.paymentNote||profile.payment_terms||"Selon conditions convenues"),{max:91});
 paragraph("Escompte pour paiement anticipé : néant.");
 paragraph("Pénalités de retard : "+(profile.late_penalties||"À définir dans les conditions contractuelles"),{max:91});
 paragraph("Indemnité forfaitaire de 40 EUR pour frais de recouvrement en cas de retard de paiement entre professionnels, si applicable.",{size:9,max:95});
 if(profile.vat_mode==="franchise_293b")paragraph("TVA non applicable, article 293 B du CGI.",{bold:true});
 if(profile.vat_mode==="autre_exoneration")paragraph("Exonération TVA (à confirmer) : "+(profile.vat_exemption_note||"référence légale manquante"),{bold:true});
 if(invoice.notes){heading("Notes complémentaires");paragraph(invoice.notes,{max:90})}
 const objects=["","", "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>","<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>"];
 const pageRef=[], streamRef=[];
 for(let i=0;i<pages.length;i++){pageRef.push(5+i*2);streamRef.push(6+i*2)}
 objects[0]="<< /Type /Catalog /Pages 2 0 R >>";
 objects[1]="<< /Type /Pages /Kids ["+pageRef.map(n=>n+" 0 R").join(" ")+"] /Count "+pages.length+" >>";
 for(let i=0;i<pages.length;i++){
  const cmds=pages[i];
  cmds.push("BT .44 .51 .58 rg /F1 8 Tf 1 0 0 1 44 39 Tm ("+esc("BROUILLON NON ÉMIS — page "+(i+1)+"/"+pages.length+" — Kitora Pro")+") Tj ET");
  const stream=cmds.join("\n")+"\n";
  objects.push("<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents "+streamRef[i]+" 0 R >>");
  objects.push("<< /Length "+stream.length+" >>\nstream\n"+stream+"endstream");
 }
 return new Blob([pdfBytes(objects)],{type:"application/pdf"});
}
