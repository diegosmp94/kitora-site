
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY")!;
const SITE_URL = "https://diegosmp94.github.io/kitora-site";

const OFFERS: Record<string, { name: string; amount: number; interval: string }> = {
  plus_monthly: { name: "Kitora Plus mensuel", amount: 599, interval: "month" },
  plus_yearly: { name: "Kitora Plus annuel", amount: 5990, interval: "year" },
  solo: {name:"Kitora Solo",amount:199,interval:"month"},
  workspace: {name:"Kitora Workspace",amount:399,interval:"month"},
  ultimate: {name:"Kitora Ultimate",amount:899,interval:"month"},
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://diegosmp94.github.io",
  "Access-Control-Allow-Headers":
    "authorization, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return Response.json(
      { error: "Méthode non autorisée" },
      { status: 405, headers: corsHeaders },
    );
  }

  try {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !STRIPE_SECRET_KEY || !STRIPE_SECRET_KEY.startsWith("sk_test_")) {
      throw new Error("Configuration serveur incomplète");
    }

    const authorization = req.headers.get("Authorization");
    if (!authorization?.startsWith("Bearer ")) {
      return Response.json(
        { error: "Connexion requise" },
        { status: 401, headers: corsHeaders },
      );
    }

    // Vérifie le jeton auprès de Supabase Auth.
    const authResponse = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: authorization,
      },
    });

    if (!authResponse.ok) {
      return Response.json(
        { error: "Session invalide, reconnecte-toi" },
        { status: 401, headers: corsHeaders },
      );
    }

    const user = await authResponse.json();

    // Avoid creating a second paid subscription for an already active subscriber.
    const service = Deno.env.get("KITORA_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if(!service) return Response.json({error:"Vérification des abonnements indisponible"},{status:503,headers:corsHeaders});
    const existingResponse=await fetch(`${SUPABASE_URL}/rest/v1/subscriptions?user_id=eq.${encodeURIComponent(user.id)}&select=status,payment_subscription_id&limit=1`,{
      headers:{apikey:service,Authorization:`Bearer ${service}`}
    });
    if(!existingResponse.ok)return Response.json({error:"Impossible de vérifier tes abonnements"},{status:503,headers:corsHeaders});
    const existing=await existingResponse.json();
    if(existing.some((entry:{status:string,payment_subscription_id:string|null})=>["active","past_due"].includes(entry.status)&&entry.payment_subscription_id)){
      return Response.json({error:"Tu possèdes déjà un abonnement Stripe en cours. Gère ton offre dans ton espace plutôt que de souscrire deux fois."},{status:409,headers:corsHeaders});
    }
        let body;try{body=await req.json()}catch{return Response.json({error:"Requête JSON invalide"},{status:400,headers:corsHeaders})}
    const plan = body?.plan;
    // The server determines all prices and does not trust cart totals.
    if (body?.items && (!Array.isArray(body.items) || body.items.length !== 1 || body.items[0]?.id !== plan || body.items[0]?.quantity !== 1)) {
      return Response.json({ error: "Panier invalide" }, { status: 400, headers: corsHeaders });
    }

    if (typeof plan !== "string" || !Object.prototype.hasOwnProperty.call(OFFERS, plan)) {
      return Response.json(
        { error: "Offre inconnue" },
        { status: 400, headers: corsHeaders },
      );
    }

    const form = new URLSearchParams();
    form.set("mode", "subscription");
    form.set("managed_payments[enabled]", "false");
    const offer = OFFERS[plan];
    form.set("line_items[0][price_data][currency]", "eur");
    form.set("line_items[0][price_data][unit_amount]", String(offer.amount));
    form.set("line_items[0][price_data][product_data][name]", offer.name);
    form.set("line_items[0][price_data][recurring][interval]", offer.interval);
    form.set("line_items[0][quantity]", "1");
    form.set("client_reference_id", user.id);
    form.set("metadata[supabase_user_id]", user.id);
    form.set("metadata[plan]", plan);
    form.set("subscription_data[metadata][supabase_user_id]", user.id);
    form.set("subscription_data[metadata][plan]", plan);
    form.set("success_url", `${SITE_URL}/compte.html?checkout=success`);
    form.set("cancel_url", `${SITE_URL}/panier.html?checkout=cancel`);

    if (user.email) {
      form.set("customer_email", user.email);
    }

    const stripeResponse = await fetch(
      "https://api.stripe.com/v1/checkout/sessions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: form,
      },
    );

    const session = await stripeResponse.json();

    if (!stripeResponse.ok) {
      console.error("Erreur Stripe Checkout", session.error?.type, session.error?.code, session.error?.param, session.error?.message);
      return Response.json(
        { error: "Stripe refuse cette offre : " + (session.error?.message || session.error?.code || "Configuration Stripe invalide.") },
        { status: 502, headers: corsHeaders },
      );
    }

    return Response.json(
      { url: session.url },
      { headers: corsHeaders },
    );
  } catch (error) {
    console.error("Erreur create-checkout", error);
    return Response.json(
      { error: "Erreur serveur" },
      { status: 500, headers: corsHeaders },
    );
  }
});
