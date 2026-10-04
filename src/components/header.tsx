"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Logo } from "./logo";
import { otherLocale, type getDictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

export function Header({ locale, dict }: { locale: Locale; dict: ReturnType<typeof getDictionary> }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const alternate = pathname.replace(/^\/(en|ml)/, `/${otherLocale(locale)}`);
  const links = [["about", dict.nav.about], ["ecosystem", dict.nav.ecosystem], ["opportunities", dict.nav.opportunities], ["events", dict.nav.events], ["stories", dict.nav.stories]];
  return <header className="site-header"><div className="shell header-inner"><Logo locale={locale}/><button className="menu-button" aria-expanded={open} aria-controls="site-nav" onClick={() => setOpen(!open)}><span/><span/><span/><b>{open ? "Close" : "Menu"}</b></button><nav id="site-nav" className={open ? "nav open" : "nav"} aria-label="Main navigation">{links.map(([href,label]) => <Link key={href} href={`/${locale}/${href}`} onClick={() => setOpen(false)}>{label}</Link>)}<Link className="language" href={alternate} hrefLang={otherLocale(locale)}>{locale === "en" ? "മലയാളം" : "English"}</Link><Link className="button button--small" href={`/${locale}/join`}>{dict.nav.join}</Link></nav></div></header>;
}
