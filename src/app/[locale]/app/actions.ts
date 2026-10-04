"use server";
import { createHash,randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getLocale } from "@/lib/i18n";
import { interestSchema,messageSchema,onboardingSchema,projectSchema } from "@/lib/app-schemas";
import { createAdminClientOrThrow } from "@/lib/supabase/server";
import { supabaseConfig } from "@/lib/supabase/config";
import { getViewer } from "@/lib/viewer";

function value(form:FormData,key:string){return String(form.get(key)??"");}
export async function completeOnboarding(form:FormData){
  const parsed=onboardingSchema.safeParse({role:value(form,"role"),fullName:value(form,"fullName"),investorTier:value(form,"investorTier")||undefined,locale:value(form,"locale")});
  if(!parsed.success) return {ok:false,message:parsed.error.issues[0]?.message}; const {client,user,profile}=await getViewer(); if(!client||!user) return {ok:false,message:"Sign in required"};
  if(profile?.role&&profile.role!==parsed.data.role) return {ok:false,message:"Primary role is already set"};
  const {error}=await client.from("profiles").update({full_name:parsed.data.fullName,role:parsed.data.role,investor_tier:parsed.data.role==="investor"?parsed.data.investorTier:null,locale:parsed.data.locale,onboarding_completed_at:new Date().toISOString()}).eq("id",user.id);
  if(error)return{ok:false,message:error.message}; redirect(`/${parsed.data.locale}/app`);
}
export async function createProject(form:FormData){
  const locale=getLocale(value(form,"locale")); const parsed=projectSchema.safeParse({name:value(form,"name"),slug:value(form,"slug"),problem:value(form,"problem"),affectedAudience:value(form,"affectedAudience"),motivation:value(form,"motivation"),sector:value(form,"sector"),stage:value(form,"stage"),teamSize:value(form,"teamSize"),location:value(form,"location"),publicPitch:value(form,"publicPitch")});
  if(!parsed.success) return {ok:false,message:parsed.error.issues[0]?.message}; const {client,user,profile}=await getViewer(); if(!client||!user||profile?.role!=="founder")return{ok:false,message:"Founder account required"};
  const p=parsed.data; const {error}=await client.from("projects").insert({slug:p.slug,name:p.name,problem:p.problem,affected_audience:p.affectedAudience,motivation:p.motivation,sector:p.sector,stage:p.stage,team_size:p.teamSize,location:p.location,public_pitch:p.publicPitch,created_by:user.id,visibility:"draft"});
  if(error)return{ok:false,message:error.message}; revalidatePath(`/${locale}/app/projects`); redirect(`/${locale}/app/projects`);
}
export async function expressInterest(form:FormData){const locale=getLocale(value(form,"locale"));const parsed=interestSchema.safeParse({projectId:value(form,"projectId"),note:value(form,"note")});if(!parsed.success)return;const {client}=await getViewer();if(!client)return;await client.rpc("express_interest",{target_project:parsed.data.projectId,interest_note:parsed.data.note});revalidatePath(`/${locale}/app/discover`);}
export async function decideInterest(form:FormData){const locale=getLocale(value(form,"locale"));const decision=value(form,"decision")==="approved"?"approved":"declined";const {client}=await getViewer();if(!client)return;await client.rpc("decide_interest",{target_interest:value(form,"interestId"),decision});revalidatePath(`/${locale}/app/interests`);}
export async function sendMessage(form:FormData){const locale=getLocale(value(form,"locale"));const parsed=messageSchema.safeParse({threadId:value(form,"threadId"),body:value(form,"body")});if(!parsed.success)return;const {client,user}=await getViewer();if(!client||!user)return;await client.from("messages").insert({thread_id:parsed.data.threadId,sender_id:user.id,body:parsed.data.body});revalidatePath(`/${locale}/app/chat/${parsed.data.threadId}`);}
export async function inviteProjectMember(form:FormData){
  const locale=getLocale(value(form,"locale")); const {user}=await getViewer(); if(!user)return; const admin=createAdminClientOrThrow(); const token=randomBytes(32).toString("base64url"),tokenHash=createHash("sha256").update(token).digest("hex"); const expires=new Date(Date.now()+supabaseConfig.invitationExpiryHours*3600000).toISOString();
  const {error}=await admin.from("project_invitations").insert({project_id:value(form,"projectId"),email:value(form,"email").toLowerCase(),role:value(form,"role")==="viewer"?"viewer":"cofounder",token_hash:tokenHash,invited_by:user.id,expires_at:expires});
  if(!error) revalidatePath(`/${locale}/app/projects`);
}
export async function requestDeletion(form:FormData){const locale=getLocale(value(form,"locale"));const {client,user}=await getViewer();if(!client||!user)return;await client.from("deletion_requests").insert({user_id:user.id,note:value(form,"note")||null});revalidatePath(`/${locale}/app/settings`);}
export async function updateEmailPreference(form:FormData){const locale=getLocale(value(form,"locale"));const {client,user}=await getViewer();if(!client||!user)return;await client.from("profiles").update({email_summaries_enabled:form.get("enabled")==="on"}).eq("id",user.id);revalidatePath(`/${locale}/app/settings`);}
