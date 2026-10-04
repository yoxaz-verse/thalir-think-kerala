import { createClient } from "npm:@supabase/supabase-js@2";

type QueueJob={message_id:number;read_count:number;payload:{upload_session_id?:string;correlation_id?:string}};
const jsonHeaders={"Content-Type":"application/json"};

Deno.serve(async request=>{
  if(request.headers.get("Authorization")!==`Bearer ${Deno.env.get("WORKER_FUNCTION_SECRET")}`)
    return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:jsonHeaders});
  const url=Deno.env.get("SUPABASE_URL"),key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),opswat=Deno.env.get("OPSWAT_API_KEY"),base=Deno.env.get("OPSWAT_BASE_URL")??"https://api.metadefender.com/v4";
  if(!url||!key||!opswat)return new Response(JSON.stringify({error:"Missing worker configuration"}),{status:503,headers:jsonHeaders});
  const client=createClient(url,key,{auth:{persistSession:false}});
  const {data,error}=await client.rpc("claim_background_jobs",{queue_name:"file_scans",visibility_timeout:120,batch_size:5});
  if(error)return new Response(JSON.stringify({error:error.message}),{status:500,headers:jsonHeaders});
  let completed=0,retried=0,rejected=0;
  for(const job of (data??[]) as QueueJob[]){
    const sessionId=job.payload.upload_session_id;
    if(!sessionId){await client.rpc("complete_background_job",{queue_name:"file_scans",message_id:job.message_id});continue}
    const {data:session}=await client.from("upload_sessions").select("*").eq("id",sessionId).maybeSingle();
    if(!session||["clean","rejected","deleted","expired"].includes(session.status)){await client.rpc("complete_background_job",{queue_name:"file_scans",message_id:job.message_id});continue}
    try{
      const {data:last}=await client.from("file_scan_attempts").select("*").eq("upload_session_id",session.id).order("attempt",{ascending:false}).limit(1).maybeSingle();
      let providerId=last?.provider_job_id??null;
      if(!providerId){
        const object=await client.storage.from("quarantine").download(session.object_path);if(object.error)throw object.error;
        const bytes=await object.data.arrayBuffer(),digest=Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",bytes))).map(value=>value.toString(16).padStart(2,"0")).join("");
        if(digest!==session.checksum_sha256)throw new Error("CHECKSUM_MISMATCH");
        const submitted=await fetch(`${base}/file`,{method:"POST",headers:{apikey:opswat,"Content-Type":session.declared_mime,"filename":encodeURIComponent(session.original_name)},body:bytes});
        if(!submitted.ok)throw new Error(`OPSWAT_UPLOAD_${submitted.status}`);
        const body=await submitted.json() as {data_id?:string};if(!body.data_id)throw new Error("OPSWAT_JOB_MISSING");providerId=body.data_id;
        await client.from("upload_sessions").update({status:"scanning"}).eq("id",session.id);
        await client.from("file_scan_attempts").insert({upload_session_id:session.id,attempt:(last?.attempt??0)+1,provider_job_id:providerId,outcome:"submitted"});
      }
      const result=await fetch(`${base}/file/${providerId}`,{headers:{apikey:opswat}});if(!result.ok)throw new Error(`OPSWAT_STATUS_${result.status}`);
      const report=await result.json() as {file_info?:{file_type_mime?:string};scan_results?:{progress_percentage?:number;scan_all_result_a?:string}};
      if((report.scan_results?.progress_percentage??0)<100){await client.rpc("retry_background_job",{queue_name:"file_scans",message_id:job.message_id,payload:job.payload,delay_seconds:30});retried++;continue}
      const detectedMime=report.file_info?.file_type_mime,clean=report.scan_results?.scan_all_result_a==="No Threat Detected"&&detectedMime===session.declared_mime;
      if(!clean||!detectedMime){
        await client.from("upload_sessions").update({status:"rejected"}).eq("id",session.id);await client.storage.from("quarantine").remove([session.object_path]);
        await client.from("file_scan_attempts").insert({upload_session_id:session.id,attempt:(last?.attempt??0)+2,provider_job_id:providerId,outcome:"rejected"});
        await client.rpc("complete_background_job",{queue_name:"file_scans",message_id:job.message_id});rejected++;continue;
      }
      const source=await client.storage.from("quarantine").download(session.object_path);if(source.error)throw source.error;
      const bucket=session.purpose==="avatar"?"avatars":session.purpose==="project"?"project-assets":"chat-attachments";
      const scope=session.purpose==="avatar"?session.user_id:session.purpose==="project"?session.project_id:session.thread_id;
      const destination=`${scope}/${crypto.randomUUID()}-${session.original_name}`;
      const uploaded=await client.storage.from(bucket).upload(destination,source.data,{contentType:detectedMime,upsert:false});if(uploaded.error)throw uploaded.error;
      const finalized=await client.rpc("complete_scanned_attachment",{target_session:session.id,detected_type:detectedMime,provider_job:providerId,result:"clean",destination_bucket:bucket,destination_path:destination});if(finalized.error){await client.storage.from(bucket).remove([destination]);throw finalized.error}
      await client.storage.from("quarantine").remove([session.object_path]);
      await client.from("file_scan_attempts").insert({upload_session_id:session.id,attempt:(last?.attempt??0)+2,provider_job_id:providerId,outcome:"clean"});
      await client.rpc("complete_background_job",{queue_name:"file_scans",message_id:job.message_id});completed++;
    }catch(cause){
      const detail=cause instanceof Error?cause.message:String(cause);
      const {count}=await client.from("file_scan_attempts").select("id",{count:"exact",head:true}).eq("upload_session_id",session.id),attempt=(count??0)+1;
      if(attempt>=8){await client.from("upload_sessions").update({status:"failed"}).eq("id",session.id);await client.rpc("complete_background_job",{queue_name:"file_scans",message_id:job.message_id});}
      else{await client.rpc("retry_background_job",{queue_name:"file_scans",message_id:job.message_id,payload:job.payload,delay_seconds:Math.min(2**attempt*30,3600)});retried++}
      await client.from("file_scan_attempts").insert({upload_session_id:session.id,attempt,provider_job_id:null,outcome:"error",error_class:detail.slice(0,180)});
    }
  }
  return new Response(JSON.stringify({claimed:data?.length??0,completed,retried,rejected}),{headers:jsonHeaders});
});
