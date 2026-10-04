"use server";
import { revalidatePath } from "next/cache";
import { createAdminClientOrThrow } from "@/lib/supabase/server";
import { getViewer } from "@/lib/viewer";
import { getLocale } from "@/lib/i18n";
async function admin(){const {profile}=await getViewer();if(profile?.role!=="admin")throw new Error("Forbidden");return createAdminClientOrThrow()}
export async function assignPlan(form:FormData){const locale=getLocale(String(form.get("locale")));const client=await admin();await client.from("entitlements").insert({user_id:String(form.get("userId")),plan_id:String(form.get("planId")),assigned_by:(await getViewer()).profile!.id});revalidatePath(`/${locale}/admin`)}
export async function publishContent(form:FormData){const locale=getLocale(String(form.get("locale")));const client=await admin();const id=String(form.get("id"));await client.from("content_items").update({status:String(form.get("status")) as "published",updated_by:(await getViewer()).profile!.id,updated_at:new Date().toISOString()}).eq("id",id);revalidatePath(`/${locale}/admin`)}
export async function updateContent(form:FormData){const locale=getLocale(String(form.get("locale")));const client=await admin();const id=String(form.get("id"));await client.from("content_items").update({title_en:String(form.get("titleEn")),title_ml:String(form.get("titleMl")),summary_en:String(form.get("summaryEn")),summary_ml:String(form.get("summaryMl")),body_en:String(form.get("bodyEn")),body_ml:String(form.get("bodyMl")),updated_by:(await getViewer()).profile!.id,updated_at:new Date().toISOString()}).eq("id",id);revalidatePath(`/${locale}/admin`)}
