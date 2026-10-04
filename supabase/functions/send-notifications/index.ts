import { createClient } from "npm:@supabase/supabase-js@2";

const cors={"Content-Type":"application/json"};
Deno.serve(async request => {
  const token=request.headers.get("Authorization");
  if(token!==`Bearer ${Deno.env.get("NOTIFICATION_FUNCTION_SECRET")}`)return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:cors});
  const url=Deno.env.get("SUPABASE_URL"),key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),resend=Deno.env.get("RESEND_API_KEY"),from=Deno.env.get("RESEND_FROM_EMAIL");
  if(!url||!key||!resend||!from)return new Response(JSON.stringify({error:"Missing server configuration"}),{status:503,headers:cors});
  const client=createClient(url,key,{auth:{persistSession:false}});
  const {data:jobs,error}=await client.from("email_outbox").select("*").eq("status","pending").lte("next_attempt_at",new Date().toISOString()).limit(20);
  if(error)return new Response(JSON.stringify({error:error.message}),{status:500,headers:cors});
  let sent=0;
  for(const job of jobs??[]){
    await client.from("email_outbox").update({status:"processing",attempts:job.attempts+1}).eq("id",job.id).eq("status","pending");
    const subject=String(job.payload?.subject??"Thalir update"),html=String(job.payload?.html??"");
    const response=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:`Bearer ${resend}`,"Content-Type":"application/json","Idempotency-Key":job.idempotency_key},body:JSON.stringify({from,to:job.recipient,subject,html})});
    if(response.ok){sent++;await client.from("email_outbox").update({status:"sent",sent_at:new Date().toISOString(),last_error:null}).eq("id",job.id)}
    else{const detail=(await response.text()).slice(0,1000),attempts=job.attempts+1;await client.from("email_outbox").update({status:attempts>=5?"failed":"pending",last_error:detail,next_attempt_at:new Date(Date.now()+Math.min(2**attempts*60000,86400000)).toISOString()}).eq("id",job.id)}
  }
  return new Response(JSON.stringify({processed:jobs?.length??0,sent}),{headers:cors});
});
