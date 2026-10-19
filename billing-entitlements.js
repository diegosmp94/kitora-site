// Verified billing rows only. Existing LIVE billing takes precedence over TEST.
export const packPlans=Object.freeze({solo:["solo"],workspace:["workspace"],plus:["plus_monthly","plus_yearly"],ultimate:["ultimate"]});
export async function getKitoraSubscription(db,userId){
 if(typeof userId!=="string"||!userId)return {subscription:null,error:new Error("Utilisateur absent")};
 try{
  const [live,test]=await Promise.all([
   db.from("kitora_live_subscriptions").select("plan,status").eq("user_id",userId).maybeSingle(),
   db.from("subscriptions").select("plan,status").eq("user_id",userId).maybeSingle()
  ]);
  if(live.error||test.error)return {subscription:null,error:new Error("Vérification d’abonnement indisponible")};
  return {subscription:live.data?{...live.data,billing_mode:"live"}:test.data?{...test.data,billing_mode:"test"}:null,error:null};
 }catch{return {subscription:null,error:new Error("Vérification d’abonnement indisponible")};}
}
export function isKitoraPlanActive(subscription,plan){
 return !!subscription&&subscription.status==="active"&&!!packPlans[plan]?.includes(subscription.plan);
}
