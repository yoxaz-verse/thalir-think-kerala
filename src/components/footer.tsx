import Link from "next/link";
import { Logo } from "./logo";
import { siteConfig } from "@/lib/site-config";
import type { Locale } from "@/lib/types";
import type { getDictionary } from "@/lib/i18n";

export function Footer({ locale, dict }: { locale: Locale; dict: ReturnType<typeof getDictionary> }) {
  return <footer className="footer"><div className="shell"><div className="footer-top"><div><Logo locale={locale} light/><p className="footer-line">{dict.footer.line}</p></div><div className="footer-links"><div><strong>{locale === "en" ? "Explore" : "കണ്ടെത്തുക"}</strong><Link href={`/${locale}/about`}>{dict.nav.about}</Link><Link href={`/${locale}/ecosystem`}>{dict.nav.ecosystem}</Link><Link href={`/${locale}/brand`}>{dict.nav.brand}</Link></div><div><strong>{locale === "en" ? "Connect" : "ബന്ധപ്പെടുക"}</strong><Link href={`/${locale}/join`}>{dict.nav.join}</Link><Link href={`/${locale}/contact`}>{locale === "en" ? "Contact" : "ബന്ധപ്പെടുക"}</Link><a href={siteConfig.parentUrl} target="_blank" rel="noreferrer">Think Kerala ↗</a></div></div></div><div className="footer-bottom"><span>© {new Date().getFullYear()} {dict.footer.rights}</span><span className="legal-links"><Link href={`/${locale}/privacy`}>{locale === "en" ? "Privacy" : "സ്വകാര്യത"}</Link><Link href={`/${locale}/terms`}>{locale === "en" ? "Terms" : "നിബന്ധനകൾ"}</Link><span>{dict.footer.note}</span></span></div></div></footer>;
}
