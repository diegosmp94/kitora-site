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
Deno.serve(async req=>{
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers:cors});
 if(req.method!=="GET")return new Response(JSON.stringify({error:"Méthode interdite"}),{status:405,headers:cors});
 if(!(await legalReady()))return response(false);
 const key=Deno.env.get("STRIPE_LIVE_SECRET_KEY");
 if(!key||!(key.startsWith("sk_live_")||key.startsWith("rk_live_")))return response(false);
 try{
  const stripe=new Stripe(key);
  const [price,product]=await Promise.all([stripe.prices.retrieve(priceId),stripe.products.retrieve(productId)]);
  const valid=price.active&&product.active&&price.livemode&&product.livemode&&price.product===productId&&price.currency==="eur"&&price.unit_amount===199&&price.recurring?.interval==="month";
  return response(Boolean(valid));
 }catch{return response(false)}
});
