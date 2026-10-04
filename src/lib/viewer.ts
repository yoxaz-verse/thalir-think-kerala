import "server-only";
import { createClient } from "./supabase/server";

export async function getViewer() {
  const client=await createClient(); if(!client) return {client:null,user:null,profile:null};
  const {data:{user}}=await client.auth.getUser(); if(!user) return {client,user:null,profile:null};
  const {data:profile}=await client.from("profiles").select("*").eq("id",user.id).maybeSingle();
  return {client,user,profile};
}
