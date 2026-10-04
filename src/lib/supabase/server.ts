import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "@/lib/database.types";
import { isSupabaseConfigured, supabaseConfig } from "./config";

export async function createClient() {
  if (!isSupabaseConfigured) return null;
  const cookieStore = await cookies();
  return createServerClient<Database>(supabaseConfig.url, supabaseConfig.publishableKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(values) { try { values.forEach(({name,value,options}) => cookieStore.set(name,value,options)); } catch {} },
    },
  });
}

export function createAdminClientOrThrow() {
  if (!supabaseConfig.url || !supabaseConfig.secretKey) throw new Error("Supabase server credentials are not configured");
  return createAdminClient<Database>(supabaseConfig.url, supabaseConfig.secretKey, { auth: { persistSession: false, autoRefreshToken: false } });
}
