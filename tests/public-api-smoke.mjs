import assert from "node:assert/strict";
const base="https://yxjxizxzjubhjaxskksh.supabase.co/functions/v1/";
const endpoints=[
 ["create-checkout",{}],
 ["generate-plus",{}],
 ["kitora-ai-worker",{}],
 ["kitora-health",{}],
 ["stripe-webhook",{}]
];
for(const[name,body]of endpoints){
 const ctrl=new AbortController();
 const timeout=setTimeout(()=>ctrl.abort(),15000);
 try{
  const response=await fetch(base+name,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body),signal:ctrl.signal});
  assert.ok([400,401,403].includes(response.status),name+" returned unexpected status "+response.status+" without credentials");
  console.log(name+": protected (HTTP "+response.status+")");
 }finally{clearTimeout(timeout)}
}
console.log("Public API security smoke: all unauthenticated requests rejected. No payment or AI call.");
