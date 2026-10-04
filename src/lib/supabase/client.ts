"use client";
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/database.types";
import { supabaseConfig } from "./config";

export function createClient() {
  if (!supabaseConfig.url || !supabaseConfig.publishableKey) throw new Error("Supabase is not configured");
  return createBrowserClient<Database>(supabaseConfig.url, supabaseConfig.publishableKey);
}
