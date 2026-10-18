import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.0";

const origin = "https://diegosmp94.github.io";
const headers = {
  "Access-Control-Allow-Origin": origin,
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
};
const respond = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers });
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (request.method !== "POST") return respond({ error: "Méthode interdite" }, 405);
  if (request.headers.get("origin") && request.headers.get("origin") !== origin)
    return respond({ error: "Origine interdite" }, 403);
  const length = Number(request.headers.get("content-length") || 0);
  if (length > 4096) return respond({ error: "Requête trop volumineuse" }, 413);
  const url = Deno.env.get("SUPABASE_URL");
  const anon = Deno.env.get("SUPABASE_ANON_KEY");
  const service = Deno.env.get("KITORA_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anon || !service) return respond({ error: "Service indisponible" }, 503);
  const bearer = request.headers.get("authorization") || "";
  if (!/^Bearer \S+$/.test(bearer)) return respond({ error: "Authentification requise" }, 401);
  const auth = createClient(url, anon, { global: { headers: { Authorization: bearer } }, auth: { persistSession: false, autoRefreshToken: false } });
  const { data: { user }, error: authError } = await auth.auth.getUser();
  if (authError || !user) return respond({ error: "Session invalide" }, 401);
  const server = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: role, error: roleError } = await server.from("kitora_admins")
    .select("user_id").eq("user_id", user.id).maybeSingle();
  if (roleError) return respond({ error: "Vérification indisponible" }, 503);
  if (!role) return respond({ error: "Accès refusé" }, 403);
  let body: Record<string, unknown>;
  try {
    const raw = await request.text();
    if (raw.length > 4096) return respond({ error: "Requête trop volumineuse" }, 413);
    body = JSON.parse(raw);
    if (!body || typeof body !== "object" || Array.isArray(body)) throw Error();
  } catch { return respond({ error: "JSON invalide" }, 400); }
  const action = body.action;
  if (action !== "list" && action !== "audit" && action !== "reset_password") return respond({ error: "Action non autorisée" }, 400);
  const page = body.page === undefined ? 1 : Number(body.page);
  if (!Number.isSafeInteger(page) || page < 1 || page > 1000) return respond({ error: "Page invalide" }, 400);
  try {
    if (action === "reset_password") {
      const target = body.user_id;
      if (typeof target !== "string" || !uuid.test(target)) return respond({ error: "Identifiant invalide" }, 400);
      const { data: targetData, error: targetError } = await server.auth.admin.getUserById(target);
      if (targetError || !targetData.user?.email) return respond({ error: "Compte introuvable" }, 404);
      const { error: resetError } = await server.auth.resetPasswordForEmail(targetData.user.email, { redirectTo: "https://diegosmp94.github.io/kitora-site/compte.html" });
      const { error: auditError } = await server.from("kitora_admin_audit").insert({
        actor_id: user.id, target_user_id: target, action: "users.password_reset_email",
        outcome: resetError ? "error" : "success", details: {}
      });
      if (auditError) return respond({ error: "Journalisation indisponible" }, 503);
      if (resetError) return respond({ error: "Envoi impossible" }, 503);
      return respond({ sent: true });
    }
    if (action === "audit") {
      const { data, error } = await server.from("kitora_admin_audit")
        .select("id,actor_id,target_user_id,action,outcome,created_at")
        .order("created_at", { ascending: false }).range((page - 1) * 50, page * 50 - 1);
      if (error) throw error;
      return respond({ page, items: data || [] });
    }
    const { data, error } = await server.auth.admin.listUsers({ page, perPage: 50 });
    if (error) throw error;
    const users = data.users || [];
    const ids = users.map((u) => u.id).filter((id) => uuid.test(id));
    if (!ids.length) return respond({ page, items: [], next_page: null });
    const [profiles, subs, admins] = await Promise.all([
      server.from("profiles").select("id,display_name,created_at").in("id", ids),
      server.from("subscriptions").select("user_id,plan,status,current_period_end").in("user_id", ids),
      server.from("kitora_admins").select("user_id").in("user_id", ids),
    ]);
    if (profiles.error || subs.error || admins.error) throw Error("Unable to load account details");
    const byId = new Map((profiles.data || []).map((v) => [v.id, v]));
    const bySub = new Map((subs.data || []).map((v) => [v.user_id, v]));
    const adminIds = new Set((admins.data || []).map((v) => v.user_id));
    const items = users.map((u) => ({
      id: u.id, email: u.email || null, created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at || null,
      email_confirmed_at: u.email_confirmed_at || null,
      banned_until: u.banned_until || null,
      display_name: byId.get(u.id)?.display_name || "",
      subscription: bySub.get(u.id) || null,
      is_admin: adminIds.has(u.id),
    }));
    // Do not log emails or raw personal details in audit records.
    const auditResult = await server.from("kitora_admin_audit").insert({
      actor_id: user.id, action: "users.list", outcome: "success", details: { page, count: items.length },
    });
    if (auditResult.error) return respond({ error: "Journalisation indisponible" }, 503);
    return respond({ page, items, next_page: data.nextPage || null });
  } catch (error) {
    console.error("Admin users request failed", error instanceof Error ? error.name : "unknown");
    return respond({ error: "Impossible de traiter la demande" }, 500);
  }
});
