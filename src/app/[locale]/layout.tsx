import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { getDictionary, getLocale } from "@/lib/i18n";
import { locales } from "@/lib/types";

export function generateStaticParams() { return locales.map(locale => ({ locale })); }
export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{locale:string}> }) { const {locale: raw}=await params; const locale=getLocale(raw); const dict=getDictionary(locale); return <div lang={locale} className={locale === "ml" ? "malayalam" : ""}><a className="skip-link" href="#main">{dict.skip}</a><Header locale={locale} dict={dict}/>{children}<Footer locale={locale} dict={dict}/></div>; }
