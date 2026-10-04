import Link from "next/link";
import { AppNav } from "@/components/app-nav";
import { getAppCopy } from "@/lib/app-copy";
import { getLocale } from "@/lib/i18n";
import { getViewer } from "@/lib/viewer";

export default async function AppLayout({children,params}:{children:React.ReactNode;params:Promise<{locale:string}>}){const locale=getLocale((await params).locale),c=getAppCopy(locale);const {user,profile}=await getViewer();if(!user)return <main id="main" className="section shell app-narrow"><p className="eyebrow">{c.app}</p><h1 className="app-title">{c.loginTitle}</h1><p>{c.loginBody}</p><Link className="button" href={`/${locale}/login`}>{c.signIn}</Link></main>;return <main id="main" className="app-shell shell"><AppNav locale={locale} role={profile?.role??null}/><div className="app-main">{children}</div></main>}
