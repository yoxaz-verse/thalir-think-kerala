import { createClient } from "npm:@supabase/supabase-js@2";

type QueueJob={message_id:number;read_count:number;payload:{deletion_request_id?:string;user_id?:string;correlation_id?:string}};
const headers={"Content-Type":"application/json"};

Deno.serve(async request=>{
  if(request.headers.get("Authorization")!==`Bearer ${Deno.env.get("WORKER_FUNCTION_SECRET")}`)
    return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers});
  const url=Deno.env.get("SUPABASE_URL"),key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if(!url||!key)return new Response(JSON.stringify({error:"Missing worker configuration"}),{status:503,headers});
  const client=createClient(url,key,{auth:{persistSession:false}});
  const {data,error}=await client.rpc("claim_background_jobs",{queue_name:"account_deletions",visibility_timeout:120,batch_size:10});
  if(error)return new Response(JSON.stringify({error:error.message}),{status:500,headers});
  let completed=0,retried=0,skipped=0;
  for(const job of (data??[]) as QueueJob[]){
    const requestId=job.payload.deletion_request_id,userId=job.payload.user_id;
    if(!requestId||!userId){await client.rpc("complete_background_job",{queue_name:"account_deletions",message_id:job.message_id});continue}
    const {data:item}=await client.from("deletion_requests").select("*").eq("id",requestId).maybeSingle();
    if(!item||item.status!=="requested"||item.phase==="cancelled"||item.legal_hold_at){await client.rpc("complete_background_job",{queue_name:"account_deletions",message_id:job.message_id});skipped++;continue}
    if(new Date(item.purge_after).valueOf()>Date.now()){await client.rpc("retry_background_job",{queue_name:"account_deletions",message_id:job.message_id,payload:job.payload,delay_seconds:Math.max(60,Math.ceil((new Date(item.purge_after).valueOf()-Date.now())/1000))});retried++;continue}
    try{
      await client.from("deletion_requests").update({phase:"exporting",export_manifest:{version:1,generated_at:new Date().toISOString(),retained_shared_records:["messages","projects","audit_log"]}}).eq("id",requestId);
      const [{data:assets},{data:profile}]=await Promise.all([client.from("file_assets").select("id,bucket_id,object_path").eq("owner_id",userId).is("deleted_at",null),client.from("profiles").select("avatar_path").eq("id",userId).maybeSingle()]);
      for(const asset of assets??[]){await client.storage.from(asset.bucket_id).remove([asset.object_path]);await client.from("file_assets").update({status:"deleted",deleted_at:new Date().toISOString()}).eq("id",asset.id)}
      if(profile?.avatar_path)await client.storage.from("avatars").remove([profile.avatar_path]);
      const replacement=`deleted+${userId}@invalid.local`;
      const authResult=await client.auth.admin.updateUserById(userId,{email:replacement,ban_duration:"876000h",user_metadata:{deleted:true}});if(authResult.error)throw authResult.error;
      const result=await client.rpc("complete_account_deletion",{target_request:requestId});if(result.error)throw result.error;
      await client.rpc("complete_background_job",{queue_name:"account_deletions",message_id:job.message_id});completed++;
    }catch(cause){
      const detail=(cause instanceof Error?cause.message:String(cause)).slice(0,500);
      await client.from("deletion_requests").update({phase:job.read_count>=8?"failed":"purging",failure_reason:detail}).eq("id",requestId);
      if(job.read_count>=8)await client.rpc("complete_background_job",{queue_name:"account_deletions",message_id:job.message_id});
      else{await client.rpc("retry_background_job",{queue_name:"account_deletions",message_id:job.message_id,payload:job.payload,delay_seconds:Math.min(2**job.read_count*60,86400)});retried++}
    }
  }
  return new Response(JSON.stringify({claimed:data?.length??0,completed,retried,skipped}),{headers});
});
