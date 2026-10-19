const base="https://yxjxizxzjubhjaxskksh.supabase.co/functions/v1/";
const publishable="sb_publishable_K6y-xwSJdAKhAccH698lgw_cp79fnbW";
const checkbox=document.getElementById("soloAcceptTerms"),button=document.getElementById("soloLiveCheckout"),status=document.getElementById("soloLiveStatus");
let ready=false;
function update(){button.disabled=!ready||!checkbox.checked;}
checkbox.addEventListener("change",update);
async function checkAvailability(){
 try{
  const response=await fetch(base+"kitora-solo-availability",{method:"GET",headers:{apikey:publishable},cache:"no-store"});
  const result=await response.json();
  ready=response.ok&&result.available===true&&result.plan==="solo"&&result.monthly_amount_cents===199;
  checkbox.disabled=!ready;
  status.textContent=ready?"Abonnement Solo disponible — paiement réel sécurisé.":"L'achat réel n'est pas encore ouvert. L'essai gratuit de prélèvement reste disponible via Stripe TEST.";
 }catch{status.textContent="Impossible de confirmer la disponibilité du paiement réel. Utilise Stripe TEST pour essayer Solo.";ready=false;checkbox.disabled=true;}
 update();
}
await checkAvailability();
button.addEventListener("click",async()=>{
 if(!ready||!checkbox.checked)return;
 button.disabled=true;
 status.textContent="Vérification du compte Kitora…";
 try{
  const {createClient}=await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.57.0/+esm");
  const client=createClient("https://yxjxizxzjubhjaxskksh.supabase.co",publishable);
  const {data:{session},error}=await client.auth.getSession();
  if(error||!session?.access_token){status.textContent="Connecte-toi à Kitora avant la souscription.";return;}
  const response=await fetch(base+"create-checkout-live",{method:"POST",headers:{"Content-Type":"application/json",apikey:publishable,Authorization:"Bearer "+session.access_token},body:JSON.stringify({plan:"solo",acceptedTerms:true})});
  const answer=await response.json();
  if(!response.ok||!/^https:\/\/checkout\.stripe\.com\//.test(answer.url||""))throw Error(answer.error||"Paiement indisponible");
  location.assign(answer.url);
 }catch(error){status.textContent=error instanceof Error?error.message:"Impossible d'ouvrir le paiement sécurisé";}
 finally{update();}
});
