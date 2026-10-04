export type ActionErrorCode =
  | "INVITATION_REQUIRED" | "INVITE_EXPIRED" | "INVITE_REVOKED" | "INVITE_USED"
  | "PLAN_REQUIRED" | "QUOTA_EXHAUSTED" | "FORBIDDEN" | "UNAUTHENTICATED"
  | "ACCOUNT_SUSPENDED" | "DELETION_PENDING" | "STALE_REVISION"
  | "UPLOAD_REJECTED" | "UPLOADS_DISABLED" | "VALIDATION_ERROR" | "UNAVAILABLE";

export type ActionResult<T=undefined> =
  | {ok:true; data:T; correlationId:string}
  | {ok:false; code:ActionErrorCode; correlationId:string; fieldErrors?:Record<string,string[]>};

export const correlationId=()=>crypto.randomUUID();

export function mapDatabaseError(message:string):ActionErrorCode {
  const known:ActionErrorCode[]=["INVITATION_REQUIRED","INVITE_EXPIRED","INVITE_REVOKED","INVITE_USED","PLAN_REQUIRED","QUOTA_EXHAUSTED","FORBIDDEN","ACCOUNT_SUSPENDED","DELETION_PENDING","STALE_REVISION","UPLOAD_REJECTED"];
  return known.find(code=>message.includes(code)) ?? "UNAVAILABLE";
}
