import Stripe from "npm:stripe@22.0.0";
import {createClient} from "npm:@supabase/supabase-js@2.57.0";
const cors={"Access-Control-Allow-Origin":"https://diegosmp94.github.io","Access-Control-Allow-Headers":"authorization, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS","Content-Type":"application/json"};
const prices:Record<string,string>={plus_monthly:"price_1US0oF0xrx52eQIkdmRbsUqu",plus_yearly:"price_1US0oI0xrx52eQIkipQfK3Pm"};
const out=(x:unknown,n=200)=>new Response(JSON.stringify(x),{status:n,headers:cors});
Deno.serve(async req=>{
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers:cors});
 if(req.method!=="POST")return out({error:"Méthode interdite"},405);
 // SEC-04: independent fail-closed feature flag; changing Stripe prices alone cannot enable LIVE checkout.
 if(Deno.env.get("KITORA_LIVE_CHECKOUT_ENABLED")!=="true")return out({error:"Paiements LIVE indisponibles"},503);
 const key=Deno.env.get("STRIPE_LIVE_SECRET_KEY"),url=Deno.env.get("SUPABASE_URL"),anon=Deno.env.get("SUPABASE_ANON_KEY"),service=Deno.env.get("KITORA_SERVICE_ROLE_KEY")||Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
 if(!key||!url||!anon||!service)return out({error:"Configuration LIVE indisponible"},503);
 const token=req.headers.get("authorization");if(!token?.startsWith("Bearer "))return out({error:"Connexion requise"},401);
 const a=createClient(url,anon,{global:{headers:{Authorization:token}}});
 const {data:{user},error}=await a.auth.getUser();if(error||!user)return out({error:"Session invalide"},401);
 let b:any;try{b=await req.json()}catch{return out({error:"Requête invalide"},400)}
 if(typeof b?.plan!=="string"||!Object.prototype.hasOwnProperty.call(prices,b.plan))return out({error:"Offre indisponible"},400);
 try{
 const db=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:existing,error:e}=await db.from("kitora_live_subscriptions").select("status").eq("user_id",user.id).maybeSingle();
 if(e)return out({error:"Vérification indisponible"},503);
 if(existing&&["active","past_due"].includes(existing.status))return out({error:"Abonnement existant"},409);
 const stripe=new Stripe(key),price=await stripe.prices.retrieve(prices[b.plan]);
 if(!price.active||!price.livemode||price.currency!=="eur"||price.recurring?.interval!==(b.plan==="plus_yearly"?"year":"month"))return out({error:"Tarif LIVE non activé"},503);
 const session=await stripe.checkout.sessions.create({mode:"subscription",line_items:[{price:price.id,quantity:1}],client_reference_id:user.id,customer_email:user.email||undefined,metadata:{supabase_user_id:user.id,plan:b.plan},subscription_data:{metadata:{supabase_user_id:user.id,plan:b.plan}},success_url:"https://diegosmp94.github.io/kitora-site/compte.html?checkout=success",cancel_url:"https://diegosmp94.github.io/kitora-site/offres.html?checkout=cancel"});
 return out({url:session.url});
 }catch(e){console.error("Checkout LIVE",e instanceof Error?e.name:"unknown");return out({error:"Paiement temporairement indisponible"},503)}
});