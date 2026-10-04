import type {Metadata} from "next";
import {notFound} from "next/navigation";
import {AdminMfa} from "@/components/admin-mfa";
import {getLocale} from "@/lib/i18n";
import {supabaseConfig} from "@/lib/supabase/config";
import {getViewer} from "@/lib/viewer";
export const metadata:Metadata={title:"Administration",robots:{index:false,follow:false}};
export default async function AdminLayout({children,params}:{children:React.ReactNode;params:Promise<{locale:string}>}){const locale=getLocale((await params).locale);const {client,profile}=await getViewer();if(!client||profile?.role!=="admin"||profile.account_status!=="active")notFound();if(supabaseConfig.adminMfaRequired){const {data}=await client.auth.mfa.getAuthenticatorAssuranceLevel();if(data?.currentLevel!=="aal2")return <main id="main" className="section shell"><AdminMfa locale={locale}/></main>}return children}
