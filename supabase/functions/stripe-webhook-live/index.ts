// Hardened LIVE Stripe webhook. LIVE checkout remains disabled unless separately activated.
import Stripe from "npm:stripe@22.0.0";
import {createClient} from "npm:@supabase/supabase-js@2.57.0";
const plans:{[name:string]:string}={
  solo:"price_1USLrS0xrx52eQIkfvGoRzqK",
  plus_monthly:"price_1US0oF0xrx52eQIkdmRbsUqu",
  plus_yearly:"price_1US0oI0xrx52eQIkipQfK3Pm"
};
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const handled=new Set([
 "checkout.session.completed",
 "customer.subscription.created",
 "customer.subscription.updated",
 "customer.subscription.deleted",
 "invoice.paid","invoice.payment_failed"
]);
Deno.serve(async(request:Request)=>{
 if(request.method!=="POST")return new Response("Method not allowed",{status:405});
 const secret=Deno.env.get("STRIPE_LIVE_SECRET_KEY");
 const webhookSecret=Deno.env.get("STRIPE_LIVE_WEBHOOK_SECRET");
 const supabaseUrl=Deno.env.get("SUPABASE_URL");
 const service=Deno.env.get("KITORA_SERVICE_ROLE_KEY")||Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
 if(!secret||!webhookSecret||!supabaseUrl||!service||!(secret.startsWith("sk_live_")||secret.startsWith("rk_live_")))
   return new Response("Webhook unavailable",{status:503});
 const signature=request.headers.get("stripe-signature");
 if(!signature)return new Response("Missing signature",{status:400});
 const length=Number(request.headers.get("content-length")||0);
 if(length>1024*1024)return new Response("Payload too large",{status:413});
 const raw=await request.text();
 if(raw.length>1024*1024)return new Response("Payload too large",{status:413});
 const stripe=new Stripe(secret);
 let event:Stripe.Event;
 try{
  event=await stripe.webhooks.constructEventAsync(
   raw,signature,webhookSecret,undefined,Stripe.createSubtleCryptoProvider()
  );
 }catch{return new Response("Invalid signature",{status:400})}
 if(!event.livemode)return new Response("Test event rejected",{status:400});
 if(!handled.has(event.type))return Response.json({received:true,ignored:true});
 let subscriptionId:string|null=null;
 if(event.type==="checkout.session.completed"){
  const session=event.data.object as Stripe.Checkout.Session;
  subscriptionId=typeof session.subscription==="string"?session.subscription:session.subscription?.id||null;
 }else if(event.type.startsWith("customer.subscription.")){
  subscriptionId=(event.data.object as Stripe.Subscription).id;
 }else{
  const invoice=event.data.object as Record<string,unknown>;
  const parent=invoice.parent as {subscription_details?:{subscription?:string|{id?:string}}}|undefined;
  const subscription=invoice.subscription||parent?.subscription_details?.subscription;
  subscriptionId=typeof subscription==="string"?subscription:(subscription as {id?:string}|undefined)?.id||null;
 }
 if(!subscriptionId)return Response.json({received:true,no_subscription:true});
 try{
  // Always fetch *current* LIVE state, even for delayed or out-of-order webhooks.
  const sub=await stripe.subscriptions.retrieve(subscriptionId);
  if(!sub.livemode)throw Error("Not a LIVE subscription");
  const userId=sub.metadata.supabase_user_id;
  const plan=sub.metadata.plan;
  if(!uuid.test(userId)||!Object.hasOwn(plans,plan))
   throw Error("Invalid subscription owner or plan");
  if(sub.items.data.length!==1||sub.items.data[0]?.price?.id!==plans[plan])
   throw Error("Subscription price is not the expected LIVE price");
  const customer=typeof sub.customer==="string"?sub.customer:sub.customer.id;
  if(!/^cus_[A-Za-z0-9]+$/.test(customer))throw Error("Invalid Stripe customer");
  const state=sub.status==="active"||sub.status==="trialing"?"active":
    sub.status==="past_due"?"past_due":sub.status==="canceled"?"canceled":"inactive";
  const currentPeriodEnd=(sub as Stripe.Subscription&{current_period_end?:number}).current_period_end;
  const db=createClient(supabaseUrl,service,{auth:{persistSession:false,autoRefreshToken:false}});
  // One Postgres transaction claims the event and updates the subscription.
  // An exception rolls back BOTH operations so Stripe can retry safely.
  const {data,result,error}=await db.rpc("kitora_commit_live_stripe_event_safe",{
   p_event_id:event.id,p_event_type:event.type,p_user_id:userId,
   p_plan:plan,p_status:state,p_customer_id:customer,
   p_subscription_id:sub.id,p_period_end:currentPeriodEnd?
    new Date(currentPeriodEnd*1000).toISOString():null
  }) as {data:string|null;result?:unknown;error:{message:string}|null};
  if(error)throw Error("Subscription persistence unavailable");
  if(data!=="applied"&&data!=="duplicate"&&data!=="ignored_conflicting_subscription")
   throw Error("Unexpected webhook persistence result");
  return Response.json({received:true,duplicate:data==="duplicate",ignored:data==="ignored_conflicting_subscription"});
 }catch(e){
  // Do not expose sensitive customer, subscription or Stripe API details.
  console.error("LIVE webhook update failed",event.type,e instanceof Error?e.name:"unknown");
  return new Response("Processing failed; retry",{status:500});
 }
});
