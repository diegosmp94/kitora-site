/* Billing periods reflect real, configured TEST-only backend offers. */
(()=>{
"use strict";
const control=document.querySelector(".billing-control");
if(!control)return;
const buttons=[...control.querySelectorAll("[data-billing-period]")];
const cards=[...document.querySelectorAll("[data-offer-plan]")];
const feedback=document.getElementById("billing-feedback");
const params=new URLSearchParams(location.search);
let period=params.get("periode")==="annuel"?"yearly":"monthly";
const euro=n=>new Intl.NumberFormat("fr-FR",{style:"currency",currency:"EUR"}).format(n);
function render(){
 buttons.forEach(button=>{const active=button.dataset.billingPeriod===period;button.setAttribute("aria-pressed",String(active));});
 cards.forEach(card=>{
  const plan=card.dataset.offerPlan;
  const price=card.querySelector(".offer-price");
  const detail=card.querySelector("[data-billing-detail]");
  const checkout=card.querySelector("[data-billing-checkout]");
  if(!price)return;
  if(plan==="free"){price.textContent="0 €";return}
  const monthly=price.dataset.priceMonthly;
  const yearly=price.dataset.priceYearly;
  const available=period==="monthly"||yearly!=="Indisponible";
  price.textContent=period==="monthly"?monthly:yearly;
  card.dataset.billingUnavailable=String(!available);
  if(detail){
   detail.removeAttribute("data-savings");
   if(period==="yearly"&&plan==="plus"){
    const monthlyTotal=599*12,annual=5990,saved=monthlyTotal-annual;
    detail.textContent="Soit "+euro(annual/12)+" / mois en équivalent. Économie : "+euro(saved)+" sur 12 mois.";
    detail.setAttribute("data-savings","");
   }else if(period==="yearly"&&!available){
    detail.textContent="La facturation annuelle de cette formule n'est pas encore proposée.";
   }else{
    detail.textContent="Paiement mensuel renouvelé chaque mois, uniquement en démonstration Stripe TEST.";
   }
  }
  if(checkout){
   if(plan==="plus"){
    checkout.href="panier.html?plan="+(period==="yearly"?"plus_yearly":"plus_monthly");
    checkout.textContent="Essayer Plus "+(period==="yearly"?"annuel":"mensuel")+" (Stripe TEST) →";
   }else checkout.href=available?"panier.html?plan="+plan:"offres.html?periode=annuel";
   checkout.setAttribute("aria-disabled",String(!available));
   checkout.tabIndex=available?0:-1;
   checkout.textContent=available?"Essayer avec Stripe TEST →":"Annuel à venir";
  }
 });
 if(feedback)feedback.textContent=period==="yearly"?"Plus est disponible à 59,90 € / an en mode TEST. Les autres offres payantes n'ont pas encore de formule annuelle.":"Les formules payantes mensuelles sont disponibles uniquement pour des essais Stripe TEST.";
}
buttons.forEach(button=>button.addEventListener("click",()=>{
 period=button.dataset.billingPeriod;
 const u=new URL(location.href);
 if(period==="yearly")u.searchParams.set("periode","annuel");else u.searchParams.delete("periode");
 history.replaceState(null,"",u.pathname+u.search+u.hash);
 render();
}));
document.addEventListener("click",event=>{
 const link=event.target.closest?.('[data-billing-checkout][aria-disabled="true"]');
 if(link){event.preventDefault();}
});
render();
})();