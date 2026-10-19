import Stripe from "npm:stripe@22.0.0";
import {createClient} from "npm:@supabase/supabase-js@2.57.0";
const cors={"Access-Control-Allow-Origin":"https://diegosmp94.github.io","Access-Control-Allow-Headers":"authorization, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS","Content-Type":"application/json"};
const prices:Record<string,string>={solo:"price_1USLrS0xrx52eQIkfvGoRzqK"};
const out=(x:unknown,n=200)=>new Response(JSON.stringify(x),{status:n,headers:cors});
async function verifiedPublishedLegal(){
 try{
  const base="https://diegosmp94.github.io/kitora-site/";
  const results=await Promise.all(["mentions-legales.html","cgv.html"].map(name=>fetch(base+name,{cache:"no-store",signal:AbortSignal.timeout(4500)})));
  if(results.some(r=>!r.ok))return false;
  const docs=await Promise.all(results.map(r=>r.text()));
  if(docs.some(s=>/\[À compléter avant|Version provisoire|Version de travail — à valider|Aucun paiement LIVE n'est ouvert au public/i.test(s)))return false;
  return docs[0].includes("M. Sampaio")&&docs[1].includes("Kitora");
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
 if(req.method!=="POST")return out({error:"Méthode interdite"},405);
 // SEC-04: independent fail-closed feature flag; changing Stripe prices alone cannot enable LIVE checkout.
 if(Deno.env.get("KITORA_LIVE_CHECKOUT_ENABLED")!=="true"||Deno.env.get("KITORA_LIVE_SOLO_ENABLED")!=="true"||Deno.env.get("KITORA_LEGAL_READY")!=="true")return out({error:"Paiements LIVE indisponibles"},503);
 if(!(await verifiedPublishedLegal()))return out({error:"Informations légales de vente à finaliser"},503);
 if(!(await merchantComplianceApproved()))return out({error:"Vérification de l’identité du vendeur et des formalités à finaliser"},503);
 const key=Deno.env.get("STRIPE_LIVE_SECRET_KEY"),url=Deno.env.get("SUPABASE_URL"),anon=Deno.env.get("SUPABASE_ANON_KEY"),service=Deno.env.get("KITORA_SERVICE_ROLE_KEY")||Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
 if(!key||!url||!anon||!service)return out({error:"Configuration LIVE indisponible"},503);
 const token=req.headers.get("authorization");if(!token?.startsWith("Bearer "))return out({error:"Connexion requise"},401);
 const a=createClient(url,anon,{global:{headers:{Authorization:token}}});
 const {data:{user},error}=await a.auth.getUser();if(error||!user)return out({error:"Session invalide"},401);
 let b:any;try{b=await req.json()}catch{return out({error:"Requête invalide"},400)}
 if(typeof b?.plan!=="string"||!Object.prototype.hasOwnProperty.call(prices,b.plan))return out({error:"Offre indisponible"},400);
 if(b.acceptedTerms!==true)return out({error:"Acceptation des informations contractuelles requise"},400);
 try{
 const db=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:existing,error:e}=await db.from("kitora_live_subscriptions").select("status").eq("user_id",user.id).maybeSingle();
 if(e)return out({error:"Vérification indisponible"},503);
 if(existing&&["active","past_due"].includes(existing.status))return out({error:"Abonnement existant"},409);
 const stripe=new Stripe(key),price=await stripe.prices.retrieve(prices[b.plan]);
 const product=await stripe.products.retrieve("prod_VTISVcsmIXPdIl");
 if(!product.active||!product.livemode||price.product!=="prod_VTISVcsmIXPdIl")return out({error:"Produit LIVE indisponible"},503);
 if(!price.active||!price.livemode||price.currency!=="eur"||price.unit_amount!==199||price.recurring?.interval!=="month"||price.id!==prices.solo)return out({error:"Tarif LIVE non activé"},503);
 const session=await stripe.checkout.sessions.create({mode:"subscription",line_items:[{price:price.id,quantity:1}],client_reference_id:user.id,customer_email:user.email||undefined,metadata:{supabase_user_id:user.id,plan:b.plan},subscription_data:{metadata:{supabase_user_id:user.id,plan:b.plan}},success_url:"https://diegosmp94.github.io/kitora-site/compte.html?checkout=success",cancel_url:"https://diegosmp94.github.io/kitora-site/offres.html?checkout=cancel"});
 return out({url:session.url});
 }catch(e){console.error("Checkout LIVE",e instanceof Error?e.name:"unknown");return out({error:"Paiement temporairement indisponible"},503)}
});