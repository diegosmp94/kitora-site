
import Stripe from "npm:stripe@^22";
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("KITORA_SERVICE_ROLE_KEY");

const stripe = stripeKey ? new Stripe(stripeKey) : null;
const cryptoProvider = Stripe.createSubtleCryptoProvider();

async function saveSubscription(data: {
  user_id: string;
  plan: string;
  status: string;
  payment_customer_id: string | null;
  payment_subscription_id: string;
  current_period_end: string | null;
}) {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Configuration Supabase manquante");
  }

  // Single database transaction: an old canceled subscription cannot overwrite a newer active one.
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/kitora_save_subscription_safe`, {
    method:"POST",
    headers:{apikey:serviceRoleKey,Authorization:`Bearer ${serviceRoleKey}`,"Content-Type":"application/json"},
    body:JSON.stringify({p_user_id:data.user_id,p_plan:data.plan,p_status:data.status,p_customer_id:data.payment_customer_id,p_subscription_id:data.payment_subscription_id,p_period_end:data.current_period_end})
  });
  if(!response.ok) throw new Error("Abonnement impossible à rapprocher dans Supabase");
  const saved = await response.json();
  if(saved===false) console.warn("Ignored stale subscription event",data.payment_subscription_id);
}


async function recordOrder(session: Stripe.Checkout.Session, subscription: Stripe.Subscription, userId: string, plan: string) {
  // Kitora beta: only test-mode Stripe sessions can enter the order history.
  if (session.livemode || subscription.livemode || !supabaseUrl || !serviceRoleKey) return;
  const amount = session.amount_total;
  if (typeof amount !== "number" || amount < 0) return;
  const response = await fetch(`${supabaseUrl}/rest/v1/orders`, {
    method: "POST",
    headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}`, "Content-Type": "application/json", Prefer: "resolution=ignore-duplicates,return=minimal" },
    body: JSON.stringify({user_id:userId, product_name:({"plus_monthly":"Kitora Plus — mensuel","plus_yearly":"Kitora Plus — annuel","solo":"Kitora Solo","workspace":"Kitora Workspace","ultimate":"Kitora Ultimate"} as Record<string,string>)[plan]||"Kitora",amount_cents:amount,currency:(session.currency||"eur").toUpperCase(),status:session.payment_status==="paid"?"test":"pending",payment_reference:session.id})
  });
  if(!response.ok) { const detail=await response.text(); console.error("Erreur commande Stripe",response.status,detail); throw new Error("Impossible d'enregistrer la commande de test"); }
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  if (!stripe || !webhookSecret) {
    return new Response("Webhook configuration missing", { status: 500 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return new Response("Missing signature", { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = await stripe.webhooks.constructEventAsync(
      await req.text(),
      signature,
      webhookSecret,
      undefined,
      cryptoProvider,
    );
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  // Fail closed: this beta webhook must never process live Stripe events.
  if (event.livemode) return new Response("Live events disabled during beta", { status: 409 });

  if (!supabaseUrl || !serviceRoleKey) return new Response("Storage unavailable", { status: 503 });
  // An event is reserved before applying subscription changes; duplicate deliveries cannot race.
  const base = supabaseUrl + "/rest/v1/kitora_stripe_webhook_events";
  const apiHeaders = { apikey: serviceRoleKey, Authorization: "Bearer " + serviceRoleKey, "Content-Type": "application/json" };
  const reservation = await fetch(base, {method:"POST",headers:{...apiHeaders,Prefer:"return=minimal"},body:JSON.stringify({event_id:event.id,event_type:event.type})});
  if (reservation.status === 409) {
    const prior = await fetch(base + "?event_id=eq." + encodeURIComponent(event.id) + "&select=processed_at,created_at", {headers:apiHeaders});
    if (!prior.ok) return new Response("Deduplication lookup failed", {status:503});
    const rows = await prior.json();
    if(rows[0]?.processed_at) return Response.json({received:true,duplicate:true});
    // An interrupted worker may leave a reservation unfinished; release only stale claims.
    if(rows[0]?.created_at && Date.now()-Date.parse(rows[0].created_at)>600000){
      await fetch(base+"?event_id=eq."+encodeURIComponent(event.id)+"&processed_at=is.null&created_at=lt."+encodeURIComponent(new Date(Date.now()-600000).toISOString()),{method:"DELETE",headers:apiHeaders});
    }
    return new Response("Event processing in progress; retry later", {status:503});
  }
  if (!reservation.ok) return new Response("Could not reserve event", {status:503});
  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      if (session.mode === "subscription" && session.subscription) {
        const subscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription.id;

        const subscription =
          await stripe.subscriptions.retrieve(subscriptionId);

        const userId =
          subscription.metadata.supabase_user_id ||
          session.metadata?.supabase_user_id ||
          session.client_reference_id;

        const plan =
          subscription.metadata.plan || session.metadata?.plan;

        if (
          userId &&
          ["plus_monthly","plus_yearly","solo","workspace","ultimate"].includes(plan)
        ) {
          const status =
            subscription.status === "active" ||
            subscription.status === "trialing"
              ? "active"
              : subscription.status === "past_due"
                ? "past_due"
                : subscription.status === "canceled"
                  ? "canceled"
                  : "inactive";

          await saveSubscription({
            user_id: userId,
            plan,
            status,
            payment_customer_id:
              typeof subscription.customer === "string"
                ? subscription.customer
                : subscription.customer.id,
            payment_subscription_id: subscription.id,
            current_period_end: subscription.current_period_end
              ? new Date(
                  subscription.current_period_end * 1000,
                ).toISOString()
              : null,
          });
          await recordOrder(session, subscription, userId, plan);
        }
      }
    }

    if (event.type === "invoice.paid" || event.type === "invoice.payment_failed") {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionRef = (invoice as any).subscription || (invoice as any).parent?.subscription_details?.subscription;
      const subscriptionId = typeof subscriptionRef === "string" ? subscriptionRef : subscriptionRef?.id;
      if (subscriptionId) {
        const latest = await stripe.subscriptions.retrieve(subscriptionId);
        const userId = latest.metadata.supabase_user_id;
        const plan = latest.metadata.plan;
        if (userId && ["plus_monthly","plus_yearly","solo","workspace","ultimate"].includes(plan)) {
          await saveSubscription({
            user_id:userId, plan,
            status:latest.status === "active" || latest.status === "trialing" ? "active" : latest.status === "past_due" ? "past_due" : latest.status === "canceled" ? "canceled" : "inactive",
            payment_customer_id:typeof latest.customer === "string" ? latest.customer : latest.customer.id,
            payment_subscription_id:latest.id,
            current_period_end:latest.current_period_end ? new Date(latest.current_period_end * 1000).toISOString() : null
          });
        }
      }
    }

    if (
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      const eventSubscription = event.data.object as Stripe.Subscription;
      // Reconcile from Stripe's current state, not a possibly stale delivery.
      const subscription = event.type === "customer.subscription.deleted"
        ? eventSubscription
        : await stripe.subscriptions.retrieve(eventSubscription.id);
      const userId = subscription.metadata.supabase_user_id;
      const plan = subscription.metadata.plan;

      if (
        userId &&
        ["plus_monthly","plus_yearly","solo","workspace","ultimate"].includes(plan)
      ) {
        const status =
          event.type === "customer.subscription.deleted" ||
          subscription.status === "canceled"
            ? "canceled"
            : subscription.status === "active" ||
                subscription.status === "trialing"
              ? "active"
              : subscription.status === "past_due"
                ? "past_due"
                : "inactive";

        await saveSubscription({
          user_id: userId,
          plan,
          status,
          payment_customer_id:
            typeof subscription.customer === "string"
              ? subscription.customer
              : subscription.customer.id,
          payment_subscription_id: subscription.id,
          current_period_end: subscription.current_period_end
            ? new Date(
                subscription.current_period_end * 1000,
              ).toISOString()
            : null,
        });
      }
    }

    const confirmed = await fetch(base+"?event_id=eq."+encodeURIComponent(event.id),{method:"PATCH",headers:{...apiHeaders,Prefer:"return=minimal"},body:JSON.stringify({processed_at:new Date().toISOString()})});
    if(!confirmed.ok) throw new Error("Could not confirm processed event");
    return Response.json({ received: true });
  } catch {
    console.error("Erreur de traitement du webhook", event.type);
    // Clear a failed reservation so Stripe can safely retry it.
    try {
      await fetch(base+"?event_id=eq."+encodeURIComponent(event.id)+"&processed_at=is.null",{method:"DELETE",headers:apiHeaders});
    } catch { console.error("Webhook reservation cleanup failed", event.type); }
    return new Response("Webhook processing failed", { status: 500 });
  }
});
