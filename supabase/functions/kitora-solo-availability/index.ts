import Stripe from "npm:stripe@22.0.0";
const origin="https://diegosmp94.github.io";
const base="https://diegosmp94.github.io/kitora-site/";
const cors={"Access-Control-Allow-Origin":origin,"Access-Control-Allow-Methods":"GET, OPTIONS","Access-Control-Allow-Headers":"content-type,apikey","Content-Type":"application/json","Cache-Control":"no-store"};
const priceId="price_1USLrS0xrx52eQIkfvGoRzqK";
const productId="prod_VTISVcsmIXPdIl";
const response=(available:boolean)=>new Response(JSON.stringify({plan:"solo",available,monthly_amount_cents:199,currency:"eur",billing_period:"month"}),{status:200,headers:cors});
async function legalReady(){
 const flags=["KITORA_LIVE_CHECKOUT_ENABLED","KITORA_LIVE_SOLO_ENABLED","KITORA_LEGAL_READY"];
 if(flags.some(flag=>Deno.env.get(flag)!=="true"))return false;
 try{
  const [legal,terms]=await Promise.all(["mentions-legales.html","cgv.html"].map(name=>fetch(base+name,{cache:"no-store",signal:AbortSignal.timeout(4500)})));
  if(!legal.ok||!terms.ok)return false;
  const contents=await Promise.all([legal.text(),terms.text()]);
  if(contents.some(body=>/\[À compléter avant|Version provisoire|Version de travail — à valider|Aucun paiement LIVE n'est ouvert au public/i.test(body)))return false;
  return contents[0].includes("M. Sampaio")&&contents[1].includes("Kitora");
 }catch{return false;}
}
async function merchantComplianceApproved(){
 try{
  const page=await fetch("https://diegosmp94.github.io/kitora-site/kitora-commercial-readiness.json",{cache:"no-store",signal:AbortSignal.timeout(4500)});
  if(!page.ok)return false;
  const data=await page.json();
  const m=data?.merchant,checks=data?.validation||{};
  const required=["legal_identity_verified","representative_authority_verified","merchant_registration_reviewed","business_contact_verified","tax_disclosure_validated","terms_and_total_price_reviewed","consumer_mediator_contracted","online_withdrawal_submission_and_durable_ack_tested","subscription_cancellation_live_tested","real_payment_entitlement_refund_tested","privacy_notices_reviewed"];
  return data?.schema_version===1 && data?.sales_live_authorized===true &&
    typeof m?.legal_form==="string" && m.legal_form.trim().length>1 &&
    typeof m?.legal_name==="string" && m.legal_name.trim().length>2 &&
    typeof m?.registration_siren==="string" && /^[0-9]{9}$/.test(m.registration_siren) &&
    typeof m?.registered_office==="string" && m.registered_office.trim().length>8 &&
    typeof m?.business_email==="string" && m.business_email.includes("@") &&
    typeof m?.business_phone==="string" && m.business_phone.trim().length>5 &&
    typeof m?.vat_regime==="string" && m.vat_regime.trim().length>2 &&
    typeof m?.publication_director==="string" && m.publication_director.trim().length>2 &&
    required.every(key=>checks[key]===true);
 }catch{return false}
}

Deno.serve(async req=>{
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers:cors});
 if(req.method!=="GET")return new Response(JSON.stringify({error:"Méthode interdite"}),{status:405,headers:cors});
 if(!(await legalReady()))return response(false);
 if(!(await merchantComplianceApproved()))return response(false);
 const key=Deno.env.get("STRIPE_LIVE_SECRET_KEY");
 if(!key||!(key.startsWith("sk_live_")||key.startsWith("rk_live_")))return response(false);
 try{
  const stripe=new Stripe(key);
  const [price,product]=await Promise.all([stripe.prices.retrieve(priceId),stripe.products.retrieve(productId)]);
  const valid=price.active&&product.active&&price.livemode&&product.livemode&&price.product===productId&&price.currency==="eur"&&price.unit_amount===199&&price.recurring?.interval==="month";
  return response(Boolean(valid));
 }catch{return response(false)}
});
