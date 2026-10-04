import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { getDictionary, getLocale } from "@/lib/i18n";
import { locales } from "@/lib/types";
import { DraftBanner } from "@/components/draft-banner";
import type { Metadata } from "next";
import { JsonLd } from "@/components/json-ld";
import { organizationJsonLd } from "@/lib/metadata";

export function generateStaticParams() { return locales.map(locale => ({ locale })); }
export async function generateMetadata({params}:{params:Promise<{locale:string}>}):Promise<Metadata>{const locale=getLocale((await params).locale);return {alternates:{canonical:`/${locale}`,languages:{en:"/en",ml:"/ml"}},openGraph:{locale:locale==="ml"?"ml_IN":"en_IN",alternateLocale:locale==="ml"?["en_IN"]:["ml_IN"]}}}
export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{locale:string}> }) { const {locale: raw}=await params; const locale=getLocale(raw); const dict=getDictionary(locale); return <div lang={locale} className={locale === "ml" ? "malayalam" : ""}><JsonLd data={organizationJsonLd()}/><a className="skip-link" href="#main">{dict.skip}</a><DraftBanner locale={locale}/><Header locale={locale} dict={dict}/>{children}<Footer locale={locale} dict={dict}/></div>; }
