import {NextResponse} from "next/server";
import {z} from "zod";
import {correlationId} from "@/lib/action-result";
import {hasTrustedMutationOrigin} from "@/lib/request-security";
import {createAdminClientOrThrow} from "@/lib/supabase/server";
import {requireActiveViewer} from "@/lib/viewer";

const schema=z.object({sessionId:z.string().uuid(),checksumSha256:z.string().regex(/^[a-f0-9]{64}$/)});
export async function POST(request:Request){
  const cid=correlationId();
  if(!hasTrustedMutationOrigin(request))return NextResponse.json({ok:false,code:"FORBIDDEN",correlationId:cid},{status:403});
  let viewer;try{viewer=await requireActiveViewer()}catch{return NextResponse.json({ok:false,code:"UNAUTHENTICATED",correlationId:cid},{status:401})}
  const parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return NextResponse.json({ok:false,code:"UPLOAD_REJECTED",correlationId:cid},{status:400});
  const admin=createAdminClientOrThrow(),{data:s}=await admin.from("upload_sessions").select("*").eq("id",parsed.data.sessionId).eq("user_id",viewer.user.id).eq("status","requested").gt("expires_at",new Date().toISOString()).maybeSingle();
  if(!s)return NextResponse.json({ok:false,code:"UPLOAD_REJECTED",correlationId:cid},{status:400});
  const folder=s.object_path.split("/")[0],listed=await admin.storage.from("quarantine").list(folder,{search:s.object_path.split("/").at(-1)}),object=listed.data?.find(o=>`${viewer.user.id}/${o.name}`===s.object_path);
  if(!object||Number(object.metadata?.size)!==s.byte_size){await admin.from("upload_sessions").update({status:"rejected"}).eq("id",s.id);return NextResponse.json({ok:false,code:"UPLOAD_REJECTED",correlationId:cid},{status:400})}
  await admin.from("upload_sessions").update({status:"uploaded",checksum_sha256:parsed.data.checksumSha256,completed_at:new Date().toISOString()}).eq("id",s.id);
  await admin.from("domain_events").insert({event_type:"file.uploaded",aggregate_type:"upload_session",aggregate_id:s.id,actor_id:viewer.user.id,correlation_id:cid,payload:{version:1}});
  return NextResponse.json({ok:true,data:{status:"uploaded"},correlationId:cid},{headers:{"Cache-Control":"private, no-store"}});
}
