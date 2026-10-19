// Kitora Pro — pure quote arithmetic. All monetary amounts use integer cents.
export const quoteMoney = cents => new Intl.NumberFormat("fr-FR", {style:"currency",currency:"EUR"}).format(cents/100);
export function quoteTotals(lines, vatRate, vatMode="standard") {
  if (!Array.isArray(lines) || lines.length<1 || lines.length>40) throw new Error("Entre 1 et 40 prestations sont nécessaires.");
  if (!["standard","franchise_293b","autre_exoneration"].includes(vatMode)) throw new Error("Régime de TVA non reconnu.");
  const rate=vatMode==="standard"?Number(vatRate):0;
  if (![0,5.5,10,20].includes(rate)) throw new Error("Taux de TVA non pris en charge.");
  let ht=0,tva=0;
  const items=lines.map(line=>{
    const description=String(line.description??"").trim();
    const qty=Number(line.qty),unitCents=Number(line.unitCents);
    if (!description || description.length>210) throw new Error("Désignation invalide.");
    if (!Number.isSafeInteger(qty) || qty<1 || qty>10000) throw new Error("Quantité invalide.");
    if (!Number.isSafeInteger(unitCents) || unitCents<0 || unitCents>1000000000) throw new Error("Prix HT invalide.");
    const subtotal=qty*unitCents;
    if (!Number.isSafeInteger(subtotal) || subtotal>100000000000) throw new Error("Montant de ligne trop élevé.");
    const tax=Math.round(subtotal*rate/100);
    ht+=subtotal;tva+=tax;
    if (ht>100000000000) throw new Error("Montant total trop élevé.");
    return {description,qty,unitCents,subtotal,tax};
  });
  return {items,ht,tva,ttc:ht+tva,rate};
}
