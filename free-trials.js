(()=>{
"use strict";
const KEY="kitora_guest_generations_v1",MAX=3;
const URL="https://yxjxizxzjubhjaxskksh.supabase.co",ANON="sb_publishable_K6y-xwSJdAKhAccH698lgw_cp79fnbW";
let pending=false;
function count(){try{const n=Number(localStorage.getItem(KEY)||0);return Number.isSafeInteger(n)&&n>=0?Math.min(n,MAX):MAX}catch{return MAX}}
function remaining(){return Math.max(0,MAX-count())}
async function authenticated(){
 try{
  const {createClient}=await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm");
  const client=window.kitoraTrialAuthClient||(window.kitoraTrialAuthClient=createClient(URL,ANON,{auth:{persistSession:true,autoRefreshToken:true}}));
  const {data,error}=await client.auth.getUser();
  return !error&&!!data.user;
 }catch{return false}
}
function signupText(){
 const wrap=document.createElement("span");
 wrap.append(document.createTextNode("Tes 3 essais gratuits sans compte sont utilisés. "));
 const a=document.createElement("a");
 a.href="index.html?signup=1";
 a.textContent="Créer mon compte gratuit";
 a.style.fontWeight="700";
 wrap.append(a,document.createTextNode(" pour continuer."));
 return wrap;
}
function showBlocked(status,onBlocked){
 if(status){status.replaceChildren(signupText());}
 if(typeof onBlocked==="function")onBlocked();
}
async function consume(status,onBlocked){
 if(pending)return false;
 pending=true;
 try{
  if(await authenticated())return true;
  if(count()>=MAX){showBlocked(status,onBlocked);return false;}
  try{localStorage.setItem(KEY,String(count()+1));}catch{showBlocked(status,onBlocked);return false;}
  if(status)status.textContent="Essai gratuit utilisé : "+remaining()+" essai(s) restant(s) sans compte.";
  return true;
 }finally{pending=false}
}
window.KitoraFreeTrial={consume,count,remaining,authenticated,MAX};
})();