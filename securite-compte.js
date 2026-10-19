import {createClient} from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.57.0/+esm";
const client=window.__KITORA_SECURITY_TEST_CLIENT__||createClient("https://yxjxizxzjubhjaxskksh.supabase.co","sb_publishable_K6y-xwSJdAKhAccH698lgw_cp79fnbW");
const $=id=>document.getElementById(id);
let user=null,factorId=null,secret=null,busy=false;
const code=value=>/^[0-9]{6}$/.test(value.trim());
function setMessage(id,text){$(id).textContent=text}
function clearEnrollment(){
 factorId=null;secret=null;$("enrollmentSecret").textContent="";$("enrollCode").value="";
 $("enrollSecretBox").hidden=true;
}
async function refresh(){
 const status=$("securityStatus");
 try{
  const session=await client.auth.getUser();
  if(session.error)throw session.error;
  user=session.data?.user||null;
  $("signedOut").hidden=!!user;$("securityControls").hidden=!user;
  if(!user){clearEnrollment();setMessage("securityStatus","Aucune session Kitora active.");return}
  const [assurance,factors]=await Promise.all([
   client.auth.mfa.getAuthenticatorAssuranceLevel(),
   client.auth.mfa.listFactors()
  ]);
  if(assurance.error)throw assurance.error;
  if(factors.error)throw factors.error;
  const current=assurance.data?.currentLevel||"aal1";
  const verified=(factors.data?.totp||[]).filter(f=>f.status==="verified");
  const enrolled=verified.length>0;
  $("aalState").textContent=current==="aal2"?"AAL2 — double authentification confirmée":"AAL1 — authentification classique";
  $("factorState").textContent=enrolled?verified.length+" facteur TOTP vérifié"+(verified.length>1?"s":""):"Aucun facteur TOTP confirmé";
  $("enrollPanel").hidden=enrolled;
  $("challengePanel").hidden=!enrolled||current==="aal2";
  $("secureSessionMessage").hidden=current!=="aal2";
  if(enrolled&&current!=="aal2")factorId=verified[0].id;
  setMessage("securityStatus",enrolled?
    (current==="aal2"?"Le deuxième facteur est actif pour cette session.":"Deuxième facteur détecté. Vérifie un code pour renforcer ta session.") :
    "Tu peux activer une application d'authentification depuis cet écran.");
 }catch(e){
  setMessage("securityStatus","Impossible de vérifier ta protection : "+(e?.message||"réessaie plus tard"));
 }
}
function withBusy(fn){return async event=>{event?.preventDefault();if(busy)return;busy=true;
 for(const id of ["beginEnrollment","refreshSecurity"])$(id).disabled=true;
 try{await fn(event)}catch(e){setMessage("securityStatus","Une opération de sécurité a échoué : "+(e?.message||"réessaie plus tard"))}
 finally{busy=false;for(const id of ["beginEnrollment","refreshSecurity"])$(id).disabled=false}
}}
$("beginEnrollment").addEventListener("click",withBusy(async()=>{
 if(!user)throw Error("Connecte-toi avant d'activer la double authentification.");
 if(factorId&&secret){$("enrollSecretBox").hidden=false;return}
 const res=await client.auth.mfa.enroll({factorType:"totp",friendlyName:"Kitora"});
 if(res.error)throw res.error;
 if(!res.data?.id||!res.data?.totp?.secret)throw Error("Réponse d'enrôlement incomplète.");
 factorId=res.data.id;secret=res.data.totp.secret;
 $("enrollmentSecret").textContent=secret;
 $("enrollSecretBox").hidden=false;
 setMessage("enrollMessage","Saisis le code généré par ton application pour terminer la configuration.");
}));
$("copySecret").addEventListener("click",withBusy(async()=>{
 if(!secret)return;
 try{await navigator.clipboard.writeText(secret);setMessage("enrollMessage","Secret copié. Il reste temporairement visible sur cet écran.");}
 catch{setMessage("enrollMessage","Copie manuellement le secret affiché sur la page.");}
}));
$("enrollForm").addEventListener("submit",withBusy(async()=>{
 const value=$("enrollCode").value.trim();
 if(!code(value)||!factorId){setMessage("enrollMessage","Un code à six chiffres et une configuration en cours sont nécessaires.");return}
 const result=await client.auth.mfa.challengeAndVerify({factorId,code:value});
 $("enrollCode").value="";
 if(result.error){setMessage("enrollMessage","Code non vérifié. Contrôle l'heure de ton appareil et réessaie.");return}
 clearEnrollment();setMessage("securityStatus","Deuxième facteur activé. Les autres sessions peuvent nécessiter une nouvelle connexion.");
 await refresh();
}));
$("challengeForm").addEventListener("submit",withBusy(async()=>{
 const value=$("challengeCode").value.trim();
 $("challengeCode").value="";
 if(!code(value)||!factorId){setMessage("challengeMessage","Saisis un code à six chiffres valide.");return}
 const result=await client.auth.mfa.challengeAndVerify({factorId,code:value});
 if(result.error){setMessage("challengeMessage","Code invalide ou expiré. Réessaie.");return}
 setMessage("challengeMessage","Session renforcée.");
 await refresh();
}));
$("refreshSecurity").addEventListener("click",withBusy(refresh));
client.auth.onAuthStateChange?.((_event,session)=>{if(!session){user=null;clearEnrollment();$("securityControls").hidden=true;$("signedOut").hidden=false}});
refresh();
