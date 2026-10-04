import {supabaseConfig} from "./supabase/config";
export function hasTrustedMutationOrigin(request:Request){const origin=request.headers.get("origin");if(!origin)return false;try{return new URL(origin).origin===new URL(supabaseConfig.redirectOrigin).origin}catch{return false}}
