import {randomUUID} from "node:crypto";
import {NextResponse} from "next/server";
import {z} from "zod";
import {correlationId} from "@/lib/action-result";
import {supabaseConfig} from "@/lib/supabase/config";
import {createAdminClientOrThrow} from "@/lib/supabase/server";
import {requireActiveViewer} from "@/lib/viewer";
import {hasTrustedMutationOrigin} from "@/lib/request-security";

const schema=z.object({purpose:z.enum(["chat","project","avatar"]),threadId:z.string().uuid().optional(),projectId:z.string().uuid().optional(),fileName:z.string().min(1).max(180).regex(/^[^/\\\0]+$/),contentType:z.enum(["application/pdf","image/jpeg","image/png","image/webp"]),size:z.number().int().positive().max(20_971_520)});

export async function POST(request:Request){
  const cid=correlationId();
  if(!hasTrustedMutationOrigin(request))return NextResponse.json({ok:false,code:"FORBIDDEN",correlationId:cid},{status:403});
  if(!supabaseConfig.attachmentsEnabled)return NextResponse.json({ok:false,code:"UPLOADS_DISABLED",correlationId:cid},{status:503});
  let viewer;try{viewer=await requireActiveViewer()}catch{return NextResponse.json({ok:false,code:"UNAUTHENTICATED",correlationId:cid},{status:401})}
  const parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success||parsed.data.size>supabaseConfig.maxUploadBytes)return NextResponse.json({ok:false,code:"UPLOAD_REJECTED",correlationId:cid},{status:400});
  const input=parsed.data;
  if(input.purpose==="chat"){const {data}=await viewer.client.from("chat_participants").select("user_id").eq("thread_id",input.threadId!).eq("user_id",viewer.user.id).maybeSingle();if(!data)return NextResponse.json({ok:false,code:"FORBIDDEN",correlationId:cid},{status:403})}
  if(input.purpose==="project"){const {data}=await viewer.client.from("project_members").select("role").eq("project_id",input.projectId!).eq("user_id",viewer.user.id).in("role",["owner","cofounder"]).maybeSingle();if(!data)return NextResponse.json({ok:false,code:"FORBIDDEN",correlationId:cid},{status:403})}
  const admin=createAdminClientOrThrow(),safe=input.fileName.normalize("NFKC").replace(/[^a-zA-Z0-9._-]/g,"-").slice(0,120),path=`${viewer.user.id}/${randomUUID()}-${safe}`,expiresAt=new Date(Date.now()+15*60_000).toISOString();
  const {data:session,error}=await admin.from("upload_sessions").insert({user_id:viewer.user.id,project_id:input.projectId??null,thread_id:input.threadId??null,purpose:input.purpose,object_path:path,original_name:safe,declared_mime:input.contentType,byte_size:input.size,status:"requested",expires_at:expiresAt,correlation_id:cid}).select("id").single();
  if(error||!session)return NextResponse.json({ok:false,code:"UNAVAILABLE",correlationId:cid},{status:503});
  const signed=await admin.storage.from("quarantine").createSignedUploadUrl(path);if(signed.error)return NextResponse.json({ok:false,code:"UNAVAILABLE",correlationId:cid},{status:503});
  return NextResponse.json({ok:true,data:{sessionId:session.id,path,token:signed.data.token,expiresAt,maxBytes:supabaseConfig.maxUploadBytes},correlationId:cid},{headers:{"Cache-Control":"private, no-store"}});
}
