import { PageHero } from "@/components/page-hero";
import { getAppCopy } from "@/lib/app-copy";
import { getLocale } from "@/lib/i18n";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { signInWithEmail,signInWithGoogle } from "../auth/actions";

export default async function Login({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const locale = getLocale((await params).locale);
  const c = getAppCopy(locale);
  const query = await searchParams;

  return (
    <main id="main">
      <PageHero eyebrow={c.signIn} title={c.loginTitle} intro={c.loginBody} />
      <section className="section shell app-narrow">
        <p className="app-alert">{locale==="en"?"Thalir is currently invite-only. Use the exact email address invited by an administrator.":"തളിർ ഇപ്പോൾ ക്ഷണിതാക്കൾക്ക് മാത്രം. അഡ്മിൻ ക്ഷണിച്ച അതേ ഇമെയിൽ വിലാസം ഉപയോഗിക്കുക."}</p>
        {!isSupabaseConfigured && <p className="app-alert">{c.unavailable}</p>}
        {query.sent === "1" && (
          <p className="app-success">
            {locale === "en"
              ? "Check your email for the secure sign-in link."
              : "സുരക്ഷിത സൈൻ ഇൻ ലിങ്കിനായി ഇമെയിൽ പരിശോധിക്കുക."}
          </p>
        )}
        <form action={signInWithEmail} className="app-form">
          <input type="hidden" name="locale" value={locale} />
          <label>
            {c.email}
            <input name="email" type="email" required autoComplete="email" />
          </label>
          <button className="button" disabled={!isSupabaseConfigured}>
            {c.emailAction}
          </button>
        </form>
        <form action={signInWithGoogle}><input type="hidden" name="locale" value={locale}/><button className="button button--ghost" disabled={!isSupabaseConfigured}>{locale==="en"?"Continue with invited Google account":"ക്ഷണിച്ച Google അക്കൗണ്ട് ഉപയോഗിക്കുക"}</button></form>
      </section>
    </main>
  );
}
