import { PageHero } from "@/components/page-hero";
import { getAppCopy } from "@/lib/app-copy";
import { getLocale } from "@/lib/i18n";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { signInWithEmail,signInWithGoogle } from "../auth/actions";

export default async function Login({params,searchParams}:{params:Promise<{locale:string}>;searchParams:Promise<Record<string,string|undefined>>}) {
  const locale=getLocale((await params).locale), c=getAppCopy(locale), query=await searchParams;
  return <main id="main"><PageHero eyebrow={c.signIn} title={c.loginTitle} intro={c.loginBody}/><section className="section shell app-narrow">
    {!isSupabaseConfigured&&<p className="app-alert">{c.unavailable}</p>}{query.sent==="1"&&<p className="app-success">{locale==="en"?"Check your email for the secure sign-in link.":"സുരക്ഷിത സൈൻ ഇൻ ലിങ്കിനായി ഇമെയിൽ പരിശോധിക്കുക."}</p>}
    <form action={signInWithGoogle}><input type="hidden" name="locale" value={locale}/><button className="button button--ghost app-wide" disabled={!isSupabaseConfigured}>{c.google}</button></form>
    <div className="app-divider"><span>{locale==="en"?"or":"അല്ലെങ്കിൽ"}</span></div>
    <form action={signInWithEmail} className="app-form"><input type="hidden" name="locale" value={locale}/><label>{c.email}<input name="email" type="email" required autoComplete="email"/></label><button className="button" disabled={!isSupabaseConfigured}>{c.emailAction}</button></form>
  </section></main>;
}
