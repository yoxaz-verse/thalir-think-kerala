import "server-only";
import { createClient } from "./supabase/server";

export async function getViewer() {
  const client=await createClient(); if(!client) return {client:null,user:null,profile:null};
  const {data:{user}}=await client.auth.getUser(); if(!user) return {client,user:null,profile:null};
  const {data:profile}=await client.from("profiles").select("*").eq("id",user.id).maybeSingle();
  return {client,user,profile};
}

export async function requireActiveViewer() {
  const viewer=await getViewer();
  if(!viewer.client||!viewer.user||!viewer.profile) throw new Error("UNAUTHENTICATED");
  const status=(viewer.profile as {account_status?:string}).account_status;
  if(status==="suspended") throw new Error("ACCOUNT_SUSPENDED");
  if(status==="deletion_pending"||status==="deleted") throw new Error("DELETION_PENDING");
  return viewer;
}
