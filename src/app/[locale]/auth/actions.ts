"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getLocale } from "@/lib/i18n";
import { supabaseConfig } from "@/lib/supabase/config";

export async function signInWithEmail(formData:FormData) {
  const locale=getLocale(String(formData.get("locale"))); const email=String(formData.get("email")??"").trim();
  const client=await createClient(); if(!client || !email) redirect(`/${locale}/login?error=config`);
  const {error}=await client.auth.signInWithOtp({email,options:{emailRedirectTo:`${supabaseConfig.redirectOrigin}/auth/callback?next=/${locale}/app`}});
  redirect(`/${locale}/login?sent=${error?"0":"1"}`);
}
export async function signInWithGoogle(formData:FormData) {
  const locale=getLocale(String(formData.get("locale"))); const client=await createClient(); if(!client) redirect(`/${locale}/login?error=config`);
  const {data,error}=await client.auth.signInWithOAuth({provider:"google",options:{redirectTo:`${supabaseConfig.redirectOrigin}/auth/callback?next=/${locale}/app`}});
  if(error||!data.url) redirect(`/${locale}/login?error=oauth`); redirect(data.url);
}
export async function signOut(formData:FormData) { const locale=getLocale(String(formData.get("locale"))); const client=await createClient(); await client?.auth.signOut(); redirect(`/${locale}`); }
