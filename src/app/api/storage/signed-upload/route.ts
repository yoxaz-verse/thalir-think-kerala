import {NextResponse} from "next/server";

/** Direct usable uploads were removed for the production pilot. */
export async function POST(){
  return NextResponse.json({ok:false,code:"UPLOADS_DISABLED",message:"Use /api/storage/upload-session; all files require quarantine scanning."},{status:410,headers:{"Cache-Control":"no-store"}});
}
