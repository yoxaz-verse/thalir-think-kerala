import Link from "next/link";
import { AppNav } from "@/components/app-nav";
import { getAppCopy } from "@/lib/app-copy";
import { getLocale } from "@/lib/i18n";
import { getViewer } from "@/lib/viewer";
import type { Metadata } from "next";
import { cancelDeletion } from "./actions";

export const metadata:Metadata={title:"Workspace",robots:{index:false,follow:false}};

export default async function AppLayout({children,params}:{children:React.ReactNode;params:Promise<{locale:string}>}){const locale=getLocale((await params).locale),c=getAppCopy(locale);const {user,profile}=await getViewer();if(!user)return <main id="main" className="section shell app-narrow"><p className="eyebrow">{c.app}</p><h1 className="app-title">{c.loginTitle}</h1><p>{c.loginBody}</p><Link className="button" href={`/${locale}/login`}>{c.signIn}</Link></main>;if(profile?.account_status==="suspended"||profile?.account_status==="deleted")return <main id="main" className="section shell app-narrow"><p className="eyebrow">{c.app}</p><h1>{locale==="en"?"Account unavailable":"അക്കൗണ്ട് ലഭ്യമല്ല"}</h1><p>{locale==="en"?"This account cannot access the pilot. Contact the Thalir administrator and include the correlation ID shown with any error.":"ഈ അക്കൗണ്ടിന് പൈലറ്റ് ആക്സസ് ലഭ്യമല്ല. തളിർ അഡ്മിനെ ബന്ധപ്പെടുക."}</p></main>;if(profile?.account_status==="deletion_pending")return <main id="main" className="section shell app-narrow"><h1>{locale==="en"?"Deletion recovery period":"ഇല്ലാതാക്കൽ വീണ്ടെടുക്കൽ കാലയളവ്"}</h1><p>{locale==="en"?"New activity is disabled. You may cancel the request during the 30-day recovery window.":"പുതിയ പ്രവർത്തനം പ്രവർത്തനരഹിതമാണ്. 30 ദിവസത്തെ വീണ്ടെടുക്കൽ കാലയളവിൽ അഭ്യർത്ഥന റദ്ദാക്കാം."}</p><form action={cancelDeletion}><input type="hidden" name="locale" value={locale}/><button className="button">{locale==="en"?"Cancel deletion request":"ഇല്ലാതാക്കൽ റദ്ദാക്കുക"}</button></form></main>;return <main id="main" className="app-shell shell"><AppNav locale={locale} role={profile?.role??null}/><div className="app-main">{children}</div></main>}
